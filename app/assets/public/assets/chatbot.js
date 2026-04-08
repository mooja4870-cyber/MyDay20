/* MyDay 2.0 Chatbot - Gemini + Knowledge Base */
(function () {
  "use strict";

  /* ── Knowledge Base (embedded) ── */
  const KNOWLEDGE = `# MyDay 2.0 앱 완전 가이드

## 앱 소개
MyDay 2.0은 사진을 선택하면 AI(Gemini)가 감성적인 블로그 글을 자동으로 작성하고, 네이버 블로그에 원클릭으로 포스팅해주는 앱입니다.
슬로건: "내 하루를 빛나게"

## 초기 설정 (온보딩)
- 앱을 처음 실행하면 초기 설정 화면이 나옵니다.
- 입력 항목: 네이버 아이디, 네이버 비밀번호, 네이버 블로그 아이디, Gemini API 키
- 네이버 블로그 아이디: blog.naver.com/xxxxx 에서 xxxxx 부분입니다.
- 최초 1회만 입력하면 다음 실행부터는 바로 메인 화면으로 이동합니다.
- 나중에 설정 아이콘에서 '계정 및 API 관리'로 언제든 변경 가능합니다.
- '온보딩 다시 보기'로 초기 설정 화면을 다시 볼 수도 있습니다.

## Gemini API 키 발급 방법
1. https://aistudio.google.com 에 접속하여 Google 계정으로 로그인합니다.
2. 왼쪽 메뉴에서 'Get API key'를 선택합니다.
3. 'Create API key' 버튼을 눌러 새로운 키를 발급합니다.
4. 생성된 키를 복사합니다. 키는 'AIza...'로 시작합니다.
5. 복사한 키를 앱의 'Gemini API 키' 입력란에 붙여넣고 저장합니다.
- 주의: API 키는 외부에 노출되지 않도록 주의해야 합니다.
- 무료로 발급 가능하며, 일일 사용량 제한이 있을 수 있습니다.

## 포스팅 과정 (4단계)

### STEP 1: 사진 추가
- 최소 1장, 최대 10장까지 사진을 선택할 수 있습니다.
- 사진을 선택한 후 반드시 '확인' 버튼을 눌러야 합니다.
- 이미지 파일만 선택 가능합니다.

### STEP 2: 장소 선택 (복수선택 가능)
- 선택 가능한 장소: 카페, 공원, 영화관, 쇼핑몰, 전시회장, 일식가, 중식가, 한식가
- '기타 (직접 입력)'으로 자유롭게 입력할 수 있습니다.

### STEP 3: 이유 선택 (복수선택 가능)
- 선택 가능한 이유: 데이트, 미팅, 산책, 카페 투어, 공부, 쇼핑, 운동, 여행

### STEP 4: 사진 속 인물 입력 (선택사항)
- 사진에 나온 사람이 누구인지 자유롭게 입력합니다.
- 예: 친구와 나, 가족들, 남자친구 등
- 사람이 없으면 비워두어도 됩니다.

## AI 글 생성
- 4단계를 완료하면 AI가 자동으로 블로그 글을 작성합니다.
- '포스팅 글 새로 생성하기' 버튼으로 다른 스타일의 글을 받을 수 있습니다.
- AI는 계절, 절기, 공휴일을 자동으로 반영합니다.
- 생성된 글을 직접 수정할 수도 있습니다.

## 네이버 블로그 자동 포스팅
- '네이버 블로그 자동 포스팅 실행' 버튼을 누르면 자동 업로드됩니다.
- 포스팅 완료 시 확인 메시지가 나타납니다.
- 실패 시 재시도할 수 있습니다.
- '다른 사진으로 또 포스팅하기'로 새로운 포스팅을 시작할 수 있습니다.

## 설정 관리
- 설정 아이콘에서 '계정 및 API 관리'로 진입합니다.
- 네이버 아이디, 비밀번호, 블로그 아이디, Gemini API 키를 변경할 수 있습니다.

## 네트워크
- AI 글 생성과 블로그 포스팅에는 인터넷 연결이 필수입니다.
- 사진 선택, 장소/이유 고르기는 오프라인에서도 가능합니다.

## Gemini API 사용량
- 일일 사용량 제한이 있을 수 있습니다.
- 사용량 초과 시 일정 시간 후 자동으로 재시도 가능합니다.

## 안전 정책
- 안전 정책에 의해 차단될 경우 표현을 완화해서 다시 시도해주세요.

## 오늘의 철학
- 매일 철학자 명언 이미지가 표시됩니다.`;

  const SYSTEM_PROMPT = `당신은 MyDay 2.0 앱의 친절한 도우미 챗봇 "마이"입니다.

## 성격
- 항상 반말이 아닌 존댓말을 사용합니다.
- 친절하고 상냥하며 밝은 톤으로 대화합니다.
- 이모지를 적절히 사용합니다.
- 답변은 간결하되 충분한 정보를 제공합니다 (3~5문장 이내).
- 사용자가 불편해하지 않도록 공감하며 답변합니다.

## 규칙
- 아래 [앱 가이드] 문서에 있는 정보만을 기반으로 답변합니다.
- 가이드에 없는 내용은 "아직 제가 잘 모르는 부분이에요. 설정 화면이나 공식 안내를 확인해 주세요~"라고 답합니다.
- 앱과 무관한 질문(날씨, 뉴스 등)에는 "저는 MyDay 2.0 앱 사용을 도와드리는 도우미예요! 앱에 대해 궁금한 게 있으시면 물어봐 주세요~ 😊"라고 답합니다.

[앱 가이드]
${KNOWLEDGE}`;

  /* ── Config ── */
  const STORAGE_KEY = "MYDAY20_SETUP_V1";
  const CHATBOT_STATE_KEY = "MYDAY20_CHATBOT_STATE";
  const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
  const QUICK_QUESTIONS = [
    "이 앱 어떻게 쓰는 거예요?",
    "API 키는 어디서 받나요?",
    "사진은 몇 장까지?",
    "포스팅 실패하면요?",
  ];
  const WELCOME_MSG = "안녕하세요! 저는 MyDay 도우미 '마이'예요 😊\n앱 사용 중 궁금한 점이 있으시면 편하게 물어봐 주세요~";
  const NUDGE_MSG = "혹시 앱 사용하시면서 궁금한 점 있으신가요? 😊\n뭐든 편하게 물어봐 주세요~";
  const NUDGE_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

  /* ── Helpers ── */
  function getApiKey() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const key = parsed.geminiApiKey || "";
      return key.trim() || null;
    } catch { return null; }
  }

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(CHATBOT_STATE_KEY)) || {};
    } catch { return {}; }
  }
  function saveState(s) {
    localStorage.setItem(CHATBOT_STATE_KEY, JSON.stringify(s));
  }

  /* ── Gemini API Call ── */
  async function askGemini(apiKey, history) {
    const contents = history.map(m => ({
      role: m.role === "bot" ? "model" : "user",
      parts: [{ text: m.text }],
    }));

    const body = {
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 512,
      },
    };

    const res = await fetch(GEMINI_API_URL + "?key=" + encodeURIComponent(apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      if (res.status === 429) return "지금 요청이 좀 많아서 잠시 후에 다시 물어봐 주세요~ 😅";
      throw new Error(err);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text || "죄송해요, 답변을 만들지 못했어요. 다시 한번 물어봐 주세요~ 🙏";
  }

  /* ── Build DOM ── */
  function createChatbot() {
    // FAB
    const fab = document.createElement("button");
    fab.className = "myday-chatbot-fab";
    fab.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"/><path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/></svg>';
    const badge = document.createElement("div");
    badge.className = "myday-chatbot-badge";
    badge.style.display = "none";
    fab.appendChild(badge);

    // Window
    const win = document.createElement("div");
    win.className = "myday-chatbot-window";

    // Header
    const header = document.createElement("div");
    header.className = "myday-chatbot-header";
    header.innerHTML = `
      <div>
        <div class="myday-chatbot-header-title">마이 도우미</div>
        <div class="myday-chatbot-header-sub">MyDay 2.0 사용 가이드</div>
      </div>`;
    const closeBtn = document.createElement("button");
    closeBtn.className = "myday-chatbot-close";
    closeBtn.textContent = "✕";
    header.appendChild(closeBtn);

    // Messages
    const messages = document.createElement("div");
    messages.className = "myday-chatbot-messages";

    // Quick questions
    const quick = document.createElement("div");
    quick.className = "myday-chatbot-quick";
    QUICK_QUESTIONS.forEach(q => {
      const btn = document.createElement("button");
      btn.textContent = q;
      btn.addEventListener("click", () => handleSend(q));
      quick.appendChild(btn);
    });

    // Input
    const inputArea = document.createElement("div");
    inputArea.className = "myday-chatbot-input";
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "궁금한 점을 물어보세요...";
    input.enterKeyHint = "send";
    const sendBtn = document.createElement("button");
    sendBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>';

    inputArea.appendChild(input);
    inputArea.appendChild(sendBtn);

    win.appendChild(header);
    win.appendChild(messages);
    win.appendChild(quick);
    win.appendChild(inputArea);

    document.body.appendChild(fab);
    document.body.appendChild(win);

    /* ── State ── */
    let isOpen = false;
    let chatHistory = []; // { role: "user"|"bot", text }
    let sending = false;

    function toggleOpen() {
      isOpen = !isOpen;
      win.classList.toggle("open", isOpen);
      badge.style.display = "none";
      if (isOpen) {
        input.focus();
        scrollBottom();
      }
    }

    function scrollBottom() {
      requestAnimationFrame(() => {
        messages.scrollTop = messages.scrollHeight;
      });
    }

    function addMessage(role, text) {
      const div = document.createElement("div");
      div.className = "myday-chatbot-msg " + role;
      div.textContent = text;
      messages.appendChild(div);
      chatHistory.push({ role, text });
      scrollBottom();
    }

    function showTyping() {
      const el = document.createElement("div");
      el.className = "myday-chatbot-typing";
      el.id = "myday-typing";
      el.innerHTML = "<span></span><span></span><span></span>";
      messages.appendChild(el);
      scrollBottom();
    }
    function hideTyping() {
      const el = document.getElementById("myday-typing");
      if (el) el.remove();
    }

    async function handleSend(text) {
      const msg = (text || input.value).trim();
      if (!msg || sending) return;
      input.value = "";
      sending = true;
      sendBtn.disabled = true;

      addMessage("user", msg);
      showTyping();

      const apiKey = getApiKey();
      if (!apiKey) {
        hideTyping();
        addMessage("bot", "아직 Gemini API 키가 설정되지 않았어요! 😅\n설정 화면에서 API 키를 먼저 입력해 주시면 제가 도움을 드릴 수 있어요~");
        sending = false;
        sendBtn.disabled = false;
        return;
      }

      try {
        const reply = await askGemini(apiKey, chatHistory);
        hideTyping();
        addMessage("bot", reply);
      } catch (e) {
        hideTyping();
        addMessage("bot", "앗, 답변을 가져오는 중에 문제가 생겼어요 😢\n잠시 후 다시 시도해 주세요~");
      }

      sending = false;
      sendBtn.disabled = false;
      input.focus();
    }

    /* ── Events ── */
    fab.addEventListener("click", toggleOpen);
    closeBtn.addEventListener("click", toggleOpen);
    sendBtn.addEventListener("click", () => handleSend());
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.isComposing) handleSend();
    });

    /* ── Welcome message ── */
    addMessage("bot", WELCOME_MSG);

    /* ── Nudge timer (periodic reminder) ── */
    const state = loadState();
    let lastNudge = state.lastNudge || 0;

    function checkNudge() {
      if (isOpen || sending) return;
      const now = Date.now();
      if (now - lastNudge >= NUDGE_INTERVAL_MS) {
        badge.style.display = "block";
        // Add nudge message only if not already the last bot message
        const lastMsg = chatHistory[chatHistory.length - 1];
        if (!lastMsg || lastMsg.text !== NUDGE_MSG) {
          addMessage("bot", NUDGE_MSG);
        }
        lastNudge = now;
        saveState({ lastNudge });
      }
    }
    setInterval(checkNudge, 60 * 1000); // check every minute
  }

  /* ── Init ── */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createChatbot);
  } else {
    createChatbot();
  }
})();
