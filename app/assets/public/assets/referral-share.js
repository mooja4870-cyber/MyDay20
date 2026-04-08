/* MyDay 2.0 — Referral + Share Card System */
(function () {
  "use strict";

  /* ══════════════════════════════════════════
     Config & Constants
     ══════════════════════════════════════════ */
  const REFERRAL_KEY = "MYDAY20_REFERRAL_V1";
  const SETUP_KEY = "MYDAY20_SETUP_V1";
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

  /* ══════════════════════════════════════════
     Publish State Observer
     — Watches DOM for success text to capture
       blog URL and timing info
     ══════════════════════════════════════════ */
  let publishStartTime = 0;
  let lastPublishData = null;

  function startPublishObserver() {
    const observer = new MutationObserver(() => {
      /* Detect "자동 포스팅 실행" to start timer */
      const allText = document.body.innerText || "";
      if (allText.includes("네이버 블로그 자동 포스팅을 준비하고 있습니다") && !publishStartTime) {
        publishStartTime = Date.now();
      }
      /* Detect success */
      if (allText.includes("포스팅이 완료되었어요")) {
        const elapsed = publishStartTime ? Math.round((Date.now() - publishStartTime) / 1000) : 0;
        const blogId = getBlogId();
        const blogUrl = blogId ? `https://blog.naver.com/${blogId}` : "";

        /* Try to find image count from DOM */
        const imgEls = document.querySelectorAll('img[src^="data:image"]');
        const imgCount = imgEls.length;

        /* Try to find title — look for large text elements */
        let title = "MyDay 포스팅";
        const h1s = document.querySelectorAll("h1, h2, [class*='title']");
        for (const el of h1s) {
          const t = (el.textContent || "").trim();
          if (t.length > 4 && t.length < 80 && !t.includes("MyDay") && !t.includes("포스팅이 완료")) {
            title = t;
            break;
          }
        }

        /* Get first image for card */
        let heroImgSrc = "";
        if (imgEls.length > 0) {
          heroImgSrc = imgEls[0].src;
        }

        lastPublishData = { title, blogUrl, elapsed, imgCount, heroImgSrc };
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
      const file = new File([blob], "myday-share-card.png", { type: "image/png" });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "MyDay 2.0",
          text: `MyDay로 30초 만에 블로그 글 완성! 🎉\n초대코드: ${refCode}`,
          files: [file],
        });
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

  function copyCode(code) {
    try {
      navigator.clipboard.writeText(code);
      return true;
    } catch { return false; }
  }

  /* ══════════════════════════════════════════
     Build UI
     ══════════════════════════════════════════ */
  function createUI() {
    const ref = getOrCreateCode();

    /* ── Bottom Navigation Bar ── */
    const nav = document.createElement("div");
    nav.className = "myday-bottom-nav";

    const shareBtn = createNavItem(
      '<svg viewBox="0 0 24 24" fill="#c94d7c"><path d="M16 5l-1.42 1.42-1.59-1.59V16h-2V4.83l-1.59 1.59L8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z"/></svg>',
      "공유·초대"
    );

    /* Placeholder slots for future menus */
    const slot2 = createNavItem(
      '<svg viewBox="0 0 24 24" fill="#ddb5c5"><circle cx="12" cy="12" r="3"/></svg>',
      "준비중"
    );
    const slot3 = createNavItem(
      '<svg viewBox="0 0 24 24" fill="#ddb5c5"><circle cx="12" cy="12" r="3"/></svg>',
      "준비중"
    );

    nav.appendChild(shareBtn);
    nav.appendChild(slot2);
    nav.appendChild(slot3);

    /* ── Share Modal ── */
    const overlay = document.createElement("div");
    overlay.className = "myday-share-overlay";

    const modal = document.createElement("div");
    modal.className = "myday-share-modal";

    /* Header */
    const header = document.createElement("div");
    header.className = "myday-share-modal-header";
    header.innerHTML = '<h2>공유 · 초대</h2>';
    const closeBtn = document.createElement("button");
    closeBtn.className = "myday-share-modal-close";
    closeBtn.textContent = "✕";
    header.appendChild(closeBtn);

    /* Body */
    const body = document.createElement("div");
    body.className = "myday-share-modal-body";

    /* Card preview */
    const previewWrap = document.createElement("div");
    previewWrap.className = "myday-share-card-preview";
    const cardCanvas = document.createElement("canvas");
    previewWrap.appendChild(cardCanvas);

    /* Referral box */
    const refBox = document.createElement("div");
    refBox.className = "myday-referral-box";
    refBox.innerHTML = `
      <div class="label">내 초대코드</div>
      <div class="myday-referral-code">
        <span id="myday-ref-code">${ref.code}</span>
        <button class="myday-referral-copy" id="myday-copy-btn">복사</button>
      </div>`;

    /* Stats */
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

    /* Milestone */
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
        <span class="${inviteCount >= 3 ? 'reached' : ''}">3명 → 프리미엄 7일</span>
        <span class="${inviteCount >= 5 ? 'reached' : ''}">5명 → 스타일팩</span>
        <span class="${inviteCount >= 10 ? 'reached' : ''}">10명 → PRO 배지</span>
      </div>`;

    /* Action buttons */
    const actions = document.createElement("div");
    actions.className = "myday-share-actions";

    const sharePrimary = document.createElement("button");
    sharePrimary.className = "myday-share-btn primary";
    sharePrimary.innerHTML = "📤 공유카드 보내기";

    const downloadBtn = document.createElement("button");
    downloadBtn.className = "myday-share-btn secondary";
    downloadBtn.innerHTML = "💾 이미지 저장";

    actions.appendChild(sharePrimary);
    actions.appendChild(downloadBtn);

    body.appendChild(previewWrap);
    body.appendChild(refBox);
    body.appendChild(stats);
    body.appendChild(milestone);
    body.appendChild(actions);

    modal.appendChild(header);
    modal.appendChild(body);
    overlay.appendChild(modal);

    document.body.appendChild(nav);
    document.body.appendChild(overlay);
    document.body.classList.add("myday-has-bottom-nav");

    /* ── Events ── */
    let modalOpen = false;

    function toggleModal() {
      modalOpen = !modalOpen;
      overlay.classList.toggle("open", modalOpen);
      if (modalOpen) renderCard();
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

    shareBtn.addEventListener("click", toggleModal);
    closeBtn.addEventListener("click", toggleModal);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) toggleModal();
    });

    sharePrimary.addEventListener("click", async () => {
      const shared = await shareViaWebAPI(cardCanvas, ref.code);
      if (!shared) downloadCard(cardCanvas);
    });

    downloadBtn.addEventListener("click", () => downloadCard(cardCanvas));

    document.getElementById("myday-copy-btn").addEventListener("click", () => {
      const ok = copyCode(ref.code);
      const btn = document.getElementById("myday-copy-btn");
      if (ok) {
        btn.textContent = "복사됨!";
        setTimeout(() => { btn.textContent = "복사"; }, 1500);
      }
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
