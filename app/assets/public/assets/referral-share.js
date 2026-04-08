/* MyDay 2.0 — Referral + Share Card System */
(function () {
  "use strict";

  /* ══════════════════════════════════════════
     Config & Constants
     ══════════════════════════════════════════ */
  const REFERRAL_KEY = "MYDAY20_REFERRAL_V1";
  const SETUP_KEY = "MYDAY20_SETUP_V1";
  const HISTORY_KEY = "MYDAY20_POST_HISTORY_V1";
  const HISTORY_LIMIT = 20;
  const CARD_W = 1080;
  const CARD_H = 1350;
  const WATERMARK_ALPHA = 0.3;

  /* ══════════════════════════════════════════
     Referral Code Management
     ══════════════════════════════════════════ */
  function loadReferral() {
    try { return JSON.parse(localStorage.getItem(REFERRAL_KEY)) || {}; }
    catch { return {}; }
  }
  function saveReferral(data) {
    localStorage.setItem(REFERRAL_KEY, JSON.stringify(data));
  }
  function getOrCreateCode() {
    let ref = loadReferral();
    if (ref.code) return ref;
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let c = "MYDAY-";
    for (let i = 0; i < 4; i++) c += chars[Math.floor(Math.random() * chars.length)];
    ref = {
      code: c,
      createdAt: new Date().toISOString(),
      inviteCount: 0,
      rewardCredits: 0,
    };
    saveReferral(ref);
    return ref;
  }
  function getBlogId() {
    try {
      const s = JSON.parse(localStorage.getItem(SETUP_KEY)) || {};
      return (s.naverBlogId || "").trim();
    } catch { return ""; }
  }
  function loadHistory() {
    try {
      const raw = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
      return Array.isArray(raw) ? raw : [];
    } catch { return []; }
  }
  function saveHistory(items) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
  }
  function pushHistory(item) {
    const prev = loadHistory();
    const dedupeKey = `${item.title}|${item.blogUrl}|${item.createdAt}`;
    if (prev.some((x) => `${x.title}|${x.blogUrl}|${x.createdAt}` === dedupeKey)) return;
    const next = [item, ...prev].slice(0, HISTORY_LIMIT);
    saveHistory(next);
  }
  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (ch) => (
      ch === "&" ? "&amp;"
      : ch === "<" ? "&lt;"
      : ch === ">" ? "&gt;"
      : ch === '"' ? "&quot;"
      : "&#39;"
    ));
  }
  function formatDateTime(iso) {
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return "";
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return `${y}.${m}.${day} ${hh}:${mm}`;
    } catch { return ""; }
  }
  function findBlogUrlFromDom(blogId) {
    const anchors = document.querySelectorAll('a[href*="blog.naver.com"]');
    for (const a of anchors) {
      const href = (a.getAttribute("href") || "").trim();
      if (/^https?:\/\/blog\.naver\.com\/\S+/i.test(href)) return href;
    }
    const bodyText = document.body.innerText || "";
    const m = bodyText.match(/https?:\/\/blog\.naver\.com\/\S+/i);
    if (m && m[0]) return m[0].replace(/[),.;]+$/, "");
    return blogId ? `https://blog.naver.com/${blogId}` : "";
  }
  function findPostTitleFromDom() {
    const h1s = document.querySelectorAll("h1, h2, [class*='title']");
    for (const el of h1s) {
      const t = (el.textContent || "").trim();
      if (t.length > 4 && t.length < 80 && !t.includes("MyDay") && !t.includes("포스팅이 완료")) {
        return t;
      }
    }
    return "MyDay 포스팅";
  }

  /* ══════════════════════════════════════════
     RAG FAQ (Intent Dataset + Retriever)
     - 20 facts x 5 angles = 100 intents
     - each intent has 5 questions + 5 answers
     ══════════════════════════════════════════ */
  const RAG_FACTS = [
    { categoryId: "onboarding", categoryLabel: "온보딩/계정", factId: "first_setup", ask: "초기 설정 입력 항목", answer: "앱 첫 실행 시 네이버 아이디, 네이버 비밀번호, 블로그 아이디, Gemini API 키를 입력하고 저장하면 됩니다.", keywords: ["초기설정", "온보딩", "입력", "계정"] },
    { categoryId: "onboarding", categoryLabel: "온보딩/계정", factId: "reopen_onboarding", ask: "온보딩 다시 보기", answer: "설정 화면에서 온보딩 다시 보기 또는 초기 설정 다시 하기를 선택하면 처음 단계부터 다시 진행할 수 있습니다.", keywords: ["온보딩", "다시", "초기설정"] },
    { categoryId: "api", categoryLabel: "API 키", factId: "api_issue", ask: "Gemini API 키 발급", answer: "Google AI Studio(aistudio.google.com) 로그인 후 Get API key 또는 Create API key 메뉴에서 발급할 수 있습니다.", keywords: ["Gemini", "API", "키", "발급"] },
    { categoryId: "api", categoryLabel: "API 키", factId: "api_limit", ask: "Gemini API 사용량 제한", answer: "Gemini API는 일일 사용량 제한이 있을 수 있어서 초과 시 잠시 기다린 뒤 다시 시도해야 합니다.", keywords: ["사용량", "제한", "초과", "재시도"] },
    { categoryId: "photo", categoryLabel: "사진 업로드", factId: "photo_count", ask: "사진 업로드 개수 제한", answer: "사진은 최소 1장, 최대 10장까지 선택할 수 있습니다.", keywords: ["사진", "이미지", "최소", "최대", "10장"] },
    { categoryId: "photo", categoryLabel: "사진 업로드", factId: "photo_type", ask: "업로드 가능한 파일 형식", answer: "이미지 파일만 업로드할 수 있으며 사진 선택 후에는 확인 버튼을 눌러야 다음 단계로 진행됩니다.", keywords: ["이미지", "파일", "형식", "확인버튼"] },
    { categoryId: "place", categoryLabel: "장소 선택", factId: "place_multi", ask: "장소 복수 선택", answer: "장소는 복수 선택이 가능하며 상황에 맞는 분위기 반영에 사용됩니다.", keywords: ["장소", "복수선택", "분위기"] },
    { categoryId: "place", categoryLabel: "장소 선택", factId: "place_other", ask: "기타 장소 직접 입력", answer: "목록에 없는 장소는 기타 직접 입력으로 자유롭게 추가할 수 있습니다.", keywords: ["기타", "직접입력", "장소"] },
    { categoryId: "reason", categoryLabel: "이유 선택", factId: "reason_multi", ask: "이유 복수 선택", answer: "이유도 복수 선택이 가능하며 데이트, 산책, 공부 같은 목적을 함께 고를 수 있습니다.", keywords: ["이유", "복수선택", "목적"] },
    { categoryId: "reason", categoryLabel: "이유 선택", factId: "reason_effect", ask: "이유 선택이 글에 미치는 영향", answer: "선택한 이유는 AI 글의 분위기와 표현 방향을 정할 때 반영됩니다.", keywords: ["분위기", "표현", "AI", "반영"] },
    { categoryId: "person", categoryLabel: "인물 입력", factId: "person_optional", ask: "사진 속 인물 입력 필수 여부", answer: "사진 속 인물 입력은 선택 사항이라 사람이 없는 사진이면 비워도 됩니다.", keywords: ["인물", "선택사항", "비워도"] },
    { categoryId: "person", categoryLabel: "인물 입력", factId: "person_example", ask: "인물 입력 예시", answer: "친구와 나, 가족들, 남자친구처럼 사진에 나온 사람을 자유롭게 적으면 됩니다.", keywords: ["예시", "친구", "가족", "자유입력"] },
    { categoryId: "ai", categoryLabel: "AI 글 생성", factId: "ai_auto", ask: "AI 글 자동 생성 시작 시점", answer: "사진, 장소, 이유, 인물 단계 입력을 마치면 AI가 블로그 글 생성을 진행합니다.", keywords: ["AI", "자동생성", "4단계"] },
    { categoryId: "ai", categoryLabel: "AI 글 생성", factId: "ai_regen_edit", ask: "글 재생성 및 본문 수정", answer: "포스팅 글 새로 생성하기로 다른 스타일을 받을 수 있고 포스팅 본문 화면에서 직접 수정도 가능합니다.", keywords: ["재생성", "스타일", "본문수정"] },
    { categoryId: "posting", categoryLabel: "블로그 포스팅", factId: "post_run", ask: "네이버 블로그 자동 포스팅 실행", answer: "자동 포스팅 실행 버튼을 누르면 AI가 만든 글과 사진을 네이버 블로그로 업로드합니다.", keywords: ["자동포스팅", "실행", "업로드"] },
    { categoryId: "posting", categoryLabel: "블로그 포스팅", factId: "post_result", ask: "포스팅 성공/실패 대응", answer: "성공 시 완료 안내 메시지가 뜨고 실패하면 다시 포스팅으로 빠르게 재시도할 수 있습니다.", keywords: ["성공", "실패", "재시도"] },
    { categoryId: "error", categoryLabel: "오류 대응", factId: "safe_policy", ask: "안전 정책 차단 메시지", answer: "입력 내용이 안전 정책에 차단되면 표현을 완화해서 다시 시도하면 됩니다.", keywords: ["안전정책", "차단", "표현완화"] },
    { categoryId: "error", categoryLabel: "오류 대응", factId: "network_issue", ask: "네트워크 관련 오류", answer: "AI 생성과 자동 포스팅은 인터넷 연결이 필수라 연결 상태를 확인한 뒤 재시도해야 합니다.", keywords: ["네트워크", "인터넷", "오류", "재시도"] },
    { categoryId: "settings", categoryLabel: "설정 관리", factId: "settings_manage", ask: "계정 및 API 설정 변경", answer: "설정 화면의 계정 및 API 관리에서 네이버 계정, 블로그 아이디, Gemini API 키를 수정할 수 있습니다.", keywords: ["설정", "계정", "API", "변경"] },
    { categoryId: "settings", categoryLabel: "설정 관리", factId: "settings_reset", ask: "초기 설정 다시 하기", answer: "초기 설정 다시 하기를 실행하면 온보딩 흐름으로 돌아가 입력값을 새로 저장할 수 있습니다.", keywords: ["초기설정", "리셋", "온보딩"] },
  ];

  const RAG_ANGLES = [
    {
      key: "guide",
      questionTemplates: [
        "{ASK} 알려주세요.",
        "{ASK} 방법이 궁금해요.",
        "{ASK} 어떻게 진행해요?",
        "{CATEGORY}에서 {ASK} 기준이 뭐예요?",
        "{ASK} 핵심만 짧게 알려주세요.",
      ],
      answerPhrases: ["안내 기준으로는", "기본 흐름은", "핵심만 요약하면", "가장 먼저 보면 좋은 건", "실행 기준은"],
    },
    {
      key: "condition",
      questionTemplates: [
        "{ASK} 조건이 있나요?",
        "{ASK} 제한이 있나요?",
        "{ASK} 필수 항목이 뭔가요?",
        "{ASK} 할 때 꼭 필요한 게 있어요?",
        "{ASK} 전제 조건 알려주세요.",
      ],
      answerPhrases: ["조건을 기준으로 보면", "제한 관점에서 보면", "필수 조건은", "실무 기준으로는", "안정적으로 하려면"],
    },
    {
      key: "retry",
      questionTemplates: [
        "{ASK} 안 되면 어떻게 해요?",
        "{ASK} 실패했을 때 재시도 방법은?",
        "{ASK} 오류가 나면 어떻게 복구해요?",
        "{ASK} 문제 생겼을 때 순서 알려주세요.",
        "{ASK} 막히면 어디부터 확인해요?",
      ],
      answerPhrases: ["문제 상황에서는", "재시도 기준으로는", "복구 순서로는", "오류 대응 기준은", "막혔을 때는"],
    },
    {
      key: "quick",
      questionTemplates: [
        "{ASK} 빠르게 알려줘요.",
        "{ASK} 한 줄로 설명해줘요.",
        "{ASK} 바로 실행할 수 있게 알려주세요.",
        "{ASK} 지금 당장 뭐 하면 돼요?",
        "{ASK} 초보 기준으로 알려주세요.",
      ],
      answerPhrases: ["짧게 말하면", "한 줄 요약은", "바로 실행 기준은", "초보자 기준으로는", "지금 바로 하려면"],
    },
    {
      key: "confirm",
      questionTemplates: [
        "{ASK} 맞게 이해했는지 확인하고 싶어요.",
        "{ASK} 이 순서가 맞나요?",
        "{ASK} 체크 포인트가 뭐예요?",
        "{ASK} 놓치기 쉬운 부분이 있을까요?",
        "{ASK} 마지막 확인사항 알려주세요.",
      ],
      answerPhrases: ["확인 포인트는", "체크 기준으로는", "놓치기 쉬운 점까지 포함하면", "최종 확인은", "마무리 기준으로는"],
    },
  ];

  function normalizeText(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[\u200b-\u200d\ufeff]/g, "")
      .replace(/[^0-9a-z가-힣\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  function tokenizeText(text) {
    const norm = normalizeText(text);
    if (!norm) return [];
    return norm.split(" ").filter((t) => t.length > 0);
  }
  function makeBigrams(text) {
    const compact = normalizeText(text).replace(/\s+/g, "");
    const grams = new Set();
    for (let i = 0; i < compact.length - 1; i += 1) {
      grams.add(compact.slice(i, i + 2));
    }
    return grams;
  }
  function uniqueList(items) {
    return Array.from(new Set(items.filter(Boolean)));
  }
  function hashText(text) {
    let h = 0;
    for (let i = 0; i < text.length; i += 1) {
      h = ((h << 5) - h) + text.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  }
  function buildRagFaqDataset() {
    const rows = [];
    for (const fact of RAG_FACTS) {
      for (const angle of RAG_ANGLES) {
        const questions = angle.questionTemplates.map((tpl) => (
          tpl
            .split("{ASK}").join(fact.ask)
            .split("{CATEGORY}").join(fact.categoryLabel)
        ));
        const answers = angle.answerPhrases.map((prefix) => `${prefix} ${fact.answer}`);
        rows.push({
          intent: `${fact.categoryId}_${fact.factId}_${angle.key}`,
          categoryId: fact.categoryId,
          categoryLabel: fact.categoryLabel,
          ask: fact.ask,
          keywords: uniqueList([...(fact.keywords || []), fact.categoryLabel, fact.ask, angle.key]),
          questions,
          answers,
        });
      }
    }
    return rows;
  }
  const RAG_FAQ_DATASET = buildRagFaqDataset();
  const RAG_SEARCH_INDEX = RAG_FAQ_DATASET.map((intent) => {
    const questionNorms = intent.questions.map((q) => normalizeText(q));
    const allNorm = normalizeText([intent.ask, ...intent.questions, ...intent.keywords].join(" "));
    const keywords = uniqueList(intent.keywords.map((k) => normalizeText(k)));
    return {
      intent,
      questionNorms,
      allNorm,
      keywordSet: new Set(keywords),
      bigrams: makeBigrams(allNorm),
    };
  });
  const RAG_META = {
    intentCount: RAG_FAQ_DATASET.length,
    questionCount: RAG_FAQ_DATASET.length * 5,
    answerCount: RAG_FAQ_DATASET.length * 5,
  };

  function isOutOfScopeQuery(query) {
    const norm = normalizeText(query);
    if (!norm) return false;
    const outWords = ["날씨", "주식", "환율", "정치", "뉴스", "축구", "야구", "로또", "영화추천", "게임공략"];
    return outWords.some((w) => norm.includes(w));
  }
  function findBestRagIntent(query) {
    const qNorm = normalizeText(query);
    if (!qNorm) return null;
    const qTokens = tokenizeText(qNorm).filter((t) => t.length >= 2);
    const qBigrams = makeBigrams(qNorm);
    let best = null;
    let second = null;

    for (const row of RAG_SEARCH_INDEX) {
      let score = 0;
      if (row.questionNorms.includes(qNorm)) score += 120;
      if (row.allNorm.includes(qNorm)) score += 40;

      for (const tk of qTokens) {
        if (row.keywordSet.has(tk)) score += 14;
        else if (row.allNorm.includes(tk)) score += 4;
      }

      let gramHit = 0;
      for (const g of qBigrams) {
        if (row.bigrams.has(g)) gramHit += 1;
      }
      score += gramHit * 0.9;

      if (!best || score > best.score) {
        second = best;
        best = { row, score };
      } else if (!second || score > second.score) {
        second = { row, score };
      }
    }

    if (!best || best.score < 9) return null;
    if (second && second.score > 0 && best.score < second.score * 1.08) {
      return best.row.intent;
    }
    return best.row.intent;
  }
  function pickRagAnswer(intent, query) {
    const idx = hashText(`${query}|${intent.intent}`) % intent.answers.length;
    return intent.answers[idx];
  }
  function createRagFallback(query) {
    if (isOutOfScopeQuery(query)) {
      return "저는 MyDay 2.0 앱 사용 도우미예요. 앱 사용 관련 질문을 주시면 정확하게 안내해 드릴게요.";
    }
    return "아직 제가 잘 모르는 부분이에요. 설정 화면이나 공식 안내를 확인해 주세요~";
  }

  /* ══════════════════════════════════════════
     Publish State Observer
     — Watches DOM for success text to capture
       blog URL and timing info
     ══════════════════════════════════════════ */
  let publishStartTime = 0;
  let lastPublishData = null;
  let successLatched = false;

  function startPublishObserver() {
    const observer = new MutationObserver(() => {
      /* Detect "자동 포스팅 실행" to start timer */
      const allText = document.body.innerText || "";
      if (allText.includes("네이버 블로그 자동 포스팅을 준비하고 있습니다") && !publishStartTime) {
        publishStartTime = Date.now();
        successLatched = false;
      }
      if (!allText.includes("포스팅이 완료되었어요")) {
        successLatched = false;
        return;
      }
      /* Detect success (capture once per success lifecycle) */
      if (!successLatched) {
        successLatched = true;
        const elapsed = publishStartTime ? Math.round((Date.now() - publishStartTime) / 1000) : 0;
        const blogId = getBlogId();
        const blogUrl = findBlogUrlFromDom(blogId);

        /* Try to find image count from DOM */
        const imgEls = document.querySelectorAll('img[src^="data:image"]');
        const imgCount = imgEls.length;
        const title = findPostTitleFromDom();

        /* Get first image for card */
        let heroImgSrc = "";
        if (imgEls.length > 0) {
          heroImgSrc = imgEls[0].src;
        }

        const createdAt = new Date().toISOString();
        lastPublishData = { title, blogUrl, elapsed, imgCount, heroImgSrc, createdAt };
        pushHistory({
          title,
          blogUrl,
          elapsed,
          imgCount,
          createdAt,
        });
        publishStartTime = 0;
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  /* ══════════════════════════════════════════
     Share Card Canvas Generator
     ══════════════════════════════════════════ */
  function generateShareCard(canvas, data, refCode) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = CARD_W;
    canvas.height = CARD_H;

    const { title, blogUrl, elapsed, imgCount, heroImgSrc } = data || {};

    /* Background gradient */
    const grad = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
    grad.addColorStop(0, "#fff4fa");
    grad.addColorStop(0.4, "#ffe9f4");
    grad.addColorStop(1, "#ffffff");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CARD_W, CARD_H);

    const cx = CARD_W / 2;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    /* ── Top section ── */
    ctx.fillStyle = "#8f325c";
    ctx.font = '900 64px "Noto Sans KR", sans-serif';
    ctx.fillText("MyDay", cx, 80);

    ctx.fillStyle = "#b45680";
    ctx.font = '600 28px "Noto Sans KR", sans-serif';
    ctx.fillText("내 하루를 빛나게", cx, 126);

    /* ── Hero area (photo placeholder) ── */
    const heroY = 170;
    const heroH = 540;
    ctx.fillStyle = "#ffe0ed";
    ctx.beginPath();
    roundRect(ctx, 60, heroY, CARD_W - 120, heroH, 24);
    ctx.fill();

    /* Photo icon placeholder */
    ctx.fillStyle = "#ffb5d0";
    ctx.font = '400 80px sans-serif';
    ctx.fillText("📸", cx, heroY + heroH / 2 - 20);
    ctx.fillStyle = "#c06090";
    ctx.font = '700 30px "Noto Sans KR", sans-serif';
    ctx.fillText(`사진 ${imgCount || "?"}장으로 블로그 글 완성!`, cx, heroY + heroH / 2 + 50);

    /* ── Title ── */
    const titleY = heroY + heroH + 50;
    ctx.fillStyle = "#5f3a4e";
    ctx.font = '800 40px "Noto Sans KR", sans-serif';
    const titleLines = wrapText(ctx, title || "MyDay 포스팅", CARD_W - 160);
    titleLines.slice(0, 2).forEach((line, i) => {
      ctx.fillText(line, cx, titleY + i * 50);
    });

    /* ── Stats row ── */
    const statsY = titleY + titleLines.length * 50 + 30;
    ctx.font = '600 26px "Noto Sans KR", sans-serif';
    ctx.fillStyle = "#a06080";
    if (elapsed) {
      ctx.fillText(`⏱️ 소요시간: ${elapsed}초`, cx, statsY);
    }
    if (blogUrl) {
      ctx.fillStyle = "#4a90d9";
      ctx.font = '600 24px "Noto Sans KR", sans-serif';
      ctx.fillText(`🔗 ${blogUrl}`, cx, statsY + 38);
    }

    /* ── Divider ── */
    const divY = statsY + 80;
    ctx.strokeStyle = "#ffd0e0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, divY);
    ctx.lineTo(CARD_W - 100, divY);
    ctx.stroke();

    /* ── Referral CTA ── */
    const ctaY = divY + 45;
    ctx.fillStyle = "#c94d7c";
    ctx.font = '800 32px "Noto Sans KR", sans-serif';
    ctx.fillText("MyDay로 나도 30초 블로그 →", cx, ctaY);

    /* ── Referral Code Box ── */
    const codeY = ctaY + 50;
    ctx.fillStyle = "#fff0f5";
    ctx.beginPath();
    roundRect(ctx, CARD_W / 2 - 180, codeY - 24, 360, 56, 14);
    ctx.fill();
    ctx.strokeStyle = "#ffa5c5";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    roundRect(ctx, CARD_W / 2 - 180, codeY - 24, 360, 56, 14);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#c94d7c";
    ctx.font = '900 34px "Noto Sans KR", sans-serif';
    ctx.fillText(refCode || "MYDAY-XXXX", cx, codeY + 4);

    /* ── Watermark ── */
    ctx.globalAlpha = WATERMARK_ALPHA;
    ctx.fillStyle = "#cf4f84";
    ctx.font = '900 36px "Noto Sans KR", sans-serif';
    ctx.textAlign = "right";
    ctx.fillText("MyDay 2.0", CARD_W - 40, CARD_H - 30);
    ctx.globalAlpha = 1;
    ctx.textAlign = "center";
  }

  /* If hero image is available, draw it onto the card */
  function drawHeroImage(canvas, imgSrc) {
    return new Promise((resolve) => {
      if (!imgSrc) { resolve(); return; }
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(); return; }
        const heroY = 170, heroH = 540, heroX = 60, heroW = CARD_W - 120;

        ctx.save();
        ctx.beginPath();
        roundRect(ctx, heroX, heroY, heroW, heroH, 24);
        ctx.clip();

        /* Center-crop */
        const scale = Math.max(heroW / img.width, heroH / img.height);
        const sw = heroW / scale, sh = heroH / scale;
        const sx = (img.width - sw) / 2, sy = (img.height - sh) / 2;
        ctx.drawImage(img, sx, sy, sw, sh, heroX, heroY, heroW, heroH);
        ctx.restore();

        /* Overlay text on photo */
        const imgCount = lastPublishData ? lastPublishData.imgCount : "?";
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.beginPath();
        roundRect(ctx, heroX, heroY + heroH - 70, heroW, 70, 0);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = '700 28px "Noto Sans KR", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText(`📸 사진 ${imgCount}장으로 블로그 글 완성!`, CARD_W / 2, heroY + heroH - 30);

        resolve();
      };
      img.onerror = () => resolve();
      img.src = imgSrc;
    });
  }

  /* ══════════════════════════════════════════
     Helper: wrap text, round rect
     ══════════════════════════════════════════ */
  function wrapText(ctx, text, maxW) {
    const words = Array.from(text);
    const lines = [];
    let line = "";
    for (const ch of words) {
      const test = line + ch;
      if (line && ctx.measureText(test).width > maxW) {
        lines.push(line);
        line = ch;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines.length ? lines : [""];
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  /* ══════════════════════════════════════════
     Share Functions
     ══════════════════════════════════════════ */
  async function shareViaWebAPI(canvas, refCode) {
    try {
      const blob = await new Promise(r => canvas.toBlob(r, "image/png"));
      if (!blob) throw new Error("blob failed");
      if (navigator.share) {
        const payload = {
          title: "MyDay 2.0",
          text: `MyDay로 30초 만에 블로그 글 완성! 🎉\n초대코드: ${refCode}`,
        };
        if (typeof File !== "undefined") {
          const file = new File([blob], "myday-share-card.png", { type: "image/png" });
          if (!navigator.canShare || navigator.canShare({ files: [file] })) {
            await navigator.share({ ...payload, files: [file] });
            return true;
          }
        }
        await navigator.share(payload);
        return true;
      }
    } catch (e) {
      if (e.name === "AbortError") return true; /* user cancelled */
    }
    return false;
  }

  function downloadCard(canvas) {
    try {
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = "myday-share-" + Date.now() + ".png";
      a.click();
      return true;
    } catch { return false; }
  }

  async function copyCode(code) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(code);
        return true;
      }
    } catch {}
    try {
      const ta = document.createElement("textarea");
      ta.value = code;
      ta.setAttribute("readonly", "readonly");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      ta.style.pointerEvents = "none";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      if (!ok) return false;
      return true;
    } catch { return false; }
  }

  /* ══════════════════════════════════════════
     Build UI
     ══════════════════════════════════════════ */
  function createUI() {
    if (document.getElementById("myday-bottom-nav-root")) return;
    const ref = getOrCreateCode();
    const root = document.createElement("div");
    root.id = "myday-bottom-nav-root";

    /* ── Bottom Navigation Bar ── */
    const nav = document.createElement("div");
    nav.className = "myday-bottom-nav";

    const shareBtn = createNavItem(
      '<svg viewBox="0 0 24 24" fill="#c94d7c"><path d="M16 5l-1.42 1.42-1.59-1.59V16h-2V4.83l-1.59 1.59L8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z"/></svg>',
      "공유·초대"
    );
    const historyBtn = createNavItem(
      '<svg viewBox="0 0 24 24" fill="#c94d7c"><path d="M13 3a9 9 0 1 0 8.95 10h-2.02A7 7 0 1 1 13 5V1l5 4-5 4V6z"/><path d="M12 8h2v5h-2zm0 6h2v2h-2z"/></svg>',
      "포스팅기록"
    );
    const helpBtn = createNavItem(
      '<svg viewBox="0 0 24 24" fill="#c94d7c"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm.1 15.8a1.2 1.2 0 1 1 1.2-1.2 1.2 1.2 0 0 1-1.2 1.2zm2.2-7.4-.9.6a2 2 0 0 0-1 1.7V13h-2v-.9a3.7 3.7 0 0 1 1.8-3.2l1.1-.7a1.7 1.7 0 1 0-2.7-1.4H8.6a3.7 3.7 0 1 1 7.4 0 3.5 3.5 0 0 1-1.7 3z"/></svg>',
      "빠른도움"
    );
    nav.appendChild(shareBtn);
    nav.appendChild(historyBtn);
    nav.appendChild(helpBtn);

    /* ── Share Modal ── */
    const overlay = document.createElement("div");
    overlay.className = "myday-share-overlay";
    const modal = document.createElement("div");
    modal.className = "myday-share-modal";
    const header = document.createElement("div");
    header.className = "myday-share-modal-header";
    header.innerHTML = '<h2>공유 · 초대</h2>';
    const closeBtn = document.createElement("button");
    closeBtn.className = "myday-share-modal-close";
    closeBtn.textContent = "✕";
    header.appendChild(closeBtn);
    const body = document.createElement("div");
    body.className = "myday-share-modal-body";
    const previewWrap = document.createElement("div");
    previewWrap.className = "myday-share-card-preview";
    const cardCanvas = document.createElement("canvas");
    previewWrap.appendChild(cardCanvas);
    const refBox = document.createElement("div");
    refBox.className = "myday-referral-box";
    refBox.innerHTML = `
      <div class="label">내 초대코드</div>
      <div class="myday-referral-code">
        <span id="myday-ref-code">${ref.code}</span>
        <button class="myday-referral-copy" id="myday-copy-btn">복사</button>
      </div>`;
    const stats = document.createElement("div");
    stats.className = "myday-referral-stats";
    stats.innerHTML = `
      <div class="myday-referral-stat">
        <div class="num" id="myday-invite-count">${ref.inviteCount || 0}</div>
        <div class="desc">초대한 친구</div>
      </div>
      <div class="myday-referral-stat">
        <div class="num" id="myday-credit-count">${ref.rewardCredits || 0}</div>
        <div class="desc">적립 크레딧</div>
      </div>`;
    const milestone = document.createElement("div");
    milestone.className = "myday-milestone";
    const inviteCount = ref.inviteCount || 0;
    const pct = Math.min(inviteCount / 10 * 100, 100);
    milestone.innerHTML = `
      <div class="title">🏆 초대 마일스톤</div>
      <div class="myday-milestone-bar">
        <div class="myday-milestone-bar-fill" style="width:${pct}%"></div>
      </div>
      <div class="myday-milestone-labels">
        <span class="${inviteCount >= 3 ? "reached" : ""}">3명 → 프리미엄 7일</span>
        <span class="${inviteCount >= 5 ? "reached" : ""}">5명 → 스타일팩</span>
        <span class="${inviteCount >= 10 ? "reached" : ""}">10명 → PRO 배지</span>
      </div>`;
    const actions = document.createElement("div");
    actions.className = "myday-share-actions";
    const sharePrimary = document.createElement("button");
    sharePrimary.className = "myday-share-btn primary";
    sharePrimary.innerHTML = "📤 공유카드 보내기";
    const downloadBtn = document.createElement("button");
    downloadBtn.className = "myday-share-btn secondary";
    downloadBtn.innerHTML = "💾 이미지 저장";
    const shareHint = document.createElement("div");
    shareHint.className = "myday-share-hint";
    shareHint.textContent = "포스팅 완료 후 열면 최신 결과가 자동 반영됩니다.";
    actions.appendChild(sharePrimary);
    actions.appendChild(downloadBtn);
    body.appendChild(previewWrap);
    body.appendChild(refBox);
    body.appendChild(stats);
    body.appendChild(milestone);
    body.appendChild(actions);
    body.appendChild(shareHint);
    modal.appendChild(header);
    modal.appendChild(body);
    overlay.appendChild(modal);

    /* ── History Modal ── */
    const historyOverlay = document.createElement("div");
    historyOverlay.className = "myday-share-overlay";
    const historyModal = document.createElement("div");
    historyModal.className = "myday-share-modal";
    const historyHeader = document.createElement("div");
    historyHeader.className = "myday-share-modal-header";
    historyHeader.innerHTML = "<h2>포스팅 기록</h2>";
    const historyCloseBtn = document.createElement("button");
    historyCloseBtn.className = "myday-share-modal-close";
    historyCloseBtn.textContent = "✕";
    historyHeader.appendChild(historyCloseBtn);
    const historyBody = document.createElement("div");
    historyBody.className = "myday-share-modal-body";
    const historyList = document.createElement("div");
    historyList.className = "myday-history-list";
    const historyActions = document.createElement("div");
    historyActions.className = "myday-share-actions";
    const clearHistoryBtn = document.createElement("button");
    clearHistoryBtn.className = "myday-share-btn secondary";
    clearHistoryBtn.textContent = "기록 비우기";
    historyActions.appendChild(clearHistoryBtn);
    historyBody.appendChild(historyList);
    historyBody.appendChild(historyActions);
    historyModal.appendChild(historyHeader);
    historyModal.appendChild(historyBody);
    historyOverlay.appendChild(historyModal);

    /* ── Quick Help Modal ── */
    const helpOverlay = document.createElement("div");
    helpOverlay.className = "myday-share-overlay";
    const helpModal = document.createElement("div");
    helpModal.className = "myday-share-modal";
    const helpHeader = document.createElement("div");
    helpHeader.className = "myday-share-modal-header";
    helpHeader.innerHTML = "<h2>빠른 도움</h2>";
    const helpCloseBtn = document.createElement("button");
    helpCloseBtn.className = "myday-share-modal-close";
    helpCloseBtn.textContent = "✕";
    helpHeader.appendChild(helpCloseBtn);
    const helpBody = document.createElement("div");
    helpBody.className = "myday-share-modal-body";

    const ragIntro = document.createElement("div");
    ragIntro.className = "myday-rag-intro";
    ragIntro.innerHTML = `
      <div class="myday-rag-badge">RAG FAQ · ${RAG_META.intentCount} Intent · ${RAG_META.questionCount}Q</div>
      <div class="myday-share-hint">질문 표현이 달라도 자동으로 가장 가까운 의도를 찾아 답해요.</div>`;

    const ragQuick = document.createElement("div");
    ragQuick.className = "myday-rag-quick";
    const ragQuickQuestions = [
      "Gemini API 키는 어디서 발급해요?",
      "사진은 몇 장까지 올릴 수 있어요?",
      "포스팅 실패하면 어떻게 해요?",
      "온보딩 다시 보는 방법 알려줘요",
    ];
    const ragQuickButtons = ragQuickQuestions.map((q) => {
      const btn = document.createElement("button");
      btn.className = "myday-rag-quick-btn";
      btn.textContent = q;
      ragQuick.appendChild(btn);
      return { btn, q };
    });

    const ragChat = document.createElement("div");
    ragChat.className = "myday-rag-chat";

    const ragInputWrap = document.createElement("div");
    ragInputWrap.className = "myday-rag-input";
    const ragInput = document.createElement("input");
    ragInput.type = "text";
    ragInput.placeholder = "앱 사용 질문을 입력해 주세요";
    ragInput.maxLength = 220;
    ragInput.enterKeyHint = "send";
    const ragSendBtn = document.createElement("button");
    ragSendBtn.textContent = "전송";
    ragInputWrap.appendChild(ragInput);
    ragInputWrap.appendChild(ragSendBtn);

    const helpActions = document.createElement("div");
    helpActions.className = "myday-share-actions";
    const openBlogBtn = document.createElement("button");
    openBlogBtn.className = "myday-share-btn secondary";
    openBlogBtn.textContent = "🔗 내 블로그 열기";
    const copyReferralBtn = document.createElement("button");
    copyReferralBtn.className = "myday-share-btn secondary";
    copyReferralBtn.textContent = "📋 초대코드 복사";

    helpActions.appendChild(openBlogBtn);
    helpActions.appendChild(copyReferralBtn);
    const helpHint = document.createElement("div");
    helpHint.className = "myday-share-hint";
    helpHint.textContent = "앱과 무관한 질문은 답변하지 않아요.";
    helpActions.appendChild(helpHint);

    helpBody.appendChild(ragIntro);
    helpBody.appendChild(ragQuick);
    helpBody.appendChild(ragChat);
    helpBody.appendChild(ragInputWrap);
    helpBody.appendChild(helpActions);
    helpModal.appendChild(helpHeader);
    helpModal.appendChild(helpBody);
    helpOverlay.appendChild(helpModal);

    root.appendChild(nav);
    root.appendChild(overlay);
    root.appendChild(historyOverlay);
    root.appendChild(helpOverlay);
    document.body.appendChild(root);
    document.body.classList.add("myday-has-bottom-nav");

    /* ── Events ── */
    let openPane = "";
    function setActiveNav(activeBtn) {
      [shareBtn, historyBtn, helpBtn].forEach((btn) => {
        btn.classList.toggle("active", btn === activeBtn);
      });
    }
    function closeAll() {
      overlay.classList.remove("open");
      historyOverlay.classList.remove("open");
      helpOverlay.classList.remove("open");
      openPane = "";
      setActiveNav(null);
    }
    function togglePane(pane) {
      if (openPane === pane) {
        closeAll();
        return;
      }
      closeAll();
      openPane = pane;
      if (pane === "share") {
        overlay.classList.add("open");
        setActiveNav(shareBtn);
        renderCard();
      } else if (pane === "history") {
        historyOverlay.classList.add("open");
        setActiveNav(historyBtn);
        renderHistory();
      } else if (pane === "help") {
        helpOverlay.classList.add("open");
        setActiveNav(helpBtn);
        ensureRagWelcome();
        setTimeout(() => { ragInput.focus(); }, 50);
      }
    }
    function renderCard() {
      const data = lastPublishData || {
        title: "MyDay 포스팅",
        blogUrl: getBlogId() ? `https://blog.naver.com/${getBlogId()}` : "",
        elapsed: 0,
        imgCount: 0,
        heroImgSrc: "",
      };
      generateShareCard(cardCanvas, data, ref.code);
      if (data.heroImgSrc) {
        drawHeroImage(cardCanvas, data.heroImgSrc);
      }
    }
    function renderHistory() {
      const items = loadHistory();
      if (!items.length) {
        historyList.innerHTML = '<div class="myday-history-empty">아직 완료된 포스팅 기록이 없어요.</div>';
        return;
      }
      historyList.innerHTML = items.map((item, idx) => {
        const title = escapeHtml(item.title || "MyDay 포스팅");
        const url = String(item.blogUrl || "").trim();
        const encodedUrl = encodeURIComponent(url);
        const time = escapeHtml(formatDateTime(item.createdAt));
        const meta = `사진 ${item.imgCount || 0}장 · ${item.elapsed || 0}초`;
        return `
          <div class="myday-history-item">
            <div class="myday-history-index">${idx + 1}</div>
            <div class="myday-history-content">
              <div class="myday-history-title">${title}</div>
              <div class="myday-history-meta">${escapeHtml(meta)}</div>
              ${time ? `<div class="myday-history-time">${time}</div>` : ""}
            </div>
            ${url ? `<button class="myday-history-open" data-url="${encodedUrl}">열기</button>` : ""}
          </div>`;
      }).join("");
      const openBtns = historyList.querySelectorAll(".myday-history-open");
      for (const b of openBtns) {
        b.addEventListener("click", () => {
          const encodedUrl = b.getAttribute("data-url") || "";
          const blogUrl = decodeURIComponent(encodedUrl);
          if (!blogUrl) return;
          window.open(blogUrl, "_blank", "noopener,noreferrer");
        });
      }
    }
    function scrollRagToBottom() {
      requestAnimationFrame(() => {
        ragChat.scrollTop = ragChat.scrollHeight;
      });
    }
    function addRagMessage(role, text, meta) {
      const row = document.createElement("div");
      row.className = `myday-rag-row ${role}`;

      const bubble = document.createElement("div");
      bubble.className = "myday-rag-bubble";
      bubble.textContent = text;
      row.appendChild(bubble);

      if (meta && role === "bot") {
        const metaEl = document.createElement("div");
        metaEl.className = "myday-rag-meta";
        metaEl.textContent = meta;
        row.appendChild(metaEl);
      }
      ragChat.appendChild(row);
      scrollRagToBottom();
    }
    function ensureRagWelcome() {
      if (ragChat.childElementCount > 0) return;
      addRagMessage(
        "bot",
        "안녕하세요. 빠른도움 RAG 챗봇입니다. 앱 사용 질문을 입력하면 가장 가까운 의도로 답변해 드릴게요.",
        `intent:${RAG_META.intentCount} · qa:${RAG_META.questionCount}`
      );
    }
    function askRag(query) {
      const q = String(query || "").trim();
      if (!q) return;
      addRagMessage("user", q);

      const intent = findBestRagIntent(q);
      if (!intent) {
        addRagMessage("bot", createRagFallback(q), "fallback");
        return;
      }
      const answer = pickRagAnswer(intent, q);
      addRagMessage("bot", answer, `${intent.categoryLabel} · ${intent.intent}`);
    }
    function submitRagQuery() {
      const q = ragInput.value.trim();
      if (!q) return;
      ragInput.value = "";
      askRag(q);
    }

    shareBtn.addEventListener("click", () => togglePane("share"));
    historyBtn.addEventListener("click", () => togglePane("history"));
    helpBtn.addEventListener("click", () => togglePane("help"));
    closeBtn.addEventListener("click", closeAll);
    historyCloseBtn.addEventListener("click", closeAll);
    helpCloseBtn.addEventListener("click", closeAll);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeAll();
    });
    historyOverlay.addEventListener("click", (e) => {
      if (e.target === historyOverlay) closeAll();
    });
    helpOverlay.addEventListener("click", (e) => {
      if (e.target === helpOverlay) closeAll();
    });

    sharePrimary.addEventListener("click", async () => {
      const shared = await shareViaWebAPI(cardCanvas, ref.code);
      if (!shared) downloadCard(cardCanvas);
    });
    downloadBtn.addEventListener("click", () => downloadCard(cardCanvas));
    document.getElementById("myday-copy-btn").addEventListener("click", async () => {
      const ok = await copyCode(ref.code);
      const btn = document.getElementById("myday-copy-btn");
      if (ok) {
        btn.textContent = "복사됨!";
        setTimeout(() => { btn.textContent = "복사"; }, 1500);
      } else {
        btn.textContent = "실패";
        setTimeout(() => { btn.textContent = "복사"; }, 1200);
      }
    });
    clearHistoryBtn.addEventListener("click", () => {
      saveHistory([]);
      renderHistory();
    });
    ragSendBtn.addEventListener("click", submitRagQuery);
    ragInput.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      submitRagQuery();
    });
    for (const item of ragQuickButtons) {
      item.btn.addEventListener("click", () => askRag(item.q));
    }
    openBlogBtn.addEventListener("click", () => {
      const blogId = getBlogId();
      if (!blogId) {
        alert("블로그 아이디가 아직 설정되지 않았어요.");
        return;
      }
      window.open(`https://blog.naver.com/${encodeURIComponent(blogId)}`, "_blank", "noopener,noreferrer");
    });
    copyReferralBtn.addEventListener("click", async () => {
      const ok = await copyCode(ref.code);
      copyReferralBtn.textContent = ok ? "✅ 복사됨!" : "❗ 복사 실패";
      setTimeout(() => { copyReferralBtn.textContent = "📋 초대코드 복사"; }, 1300);
    });
  }

  function createNavItem(svgHtml, label) {
    const btn = document.createElement("button");
    btn.className = "myday-bottom-nav-item";
    btn.innerHTML = `${svgHtml}<span>${label}</span>`;
    return btn;
  }

  /* ══════════════════════════════════════════
     Init
     ══════════════════════════════════════════ */
  function init() {
    createUI();
    startPublishObserver();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
