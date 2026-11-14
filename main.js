(function () {
  "use strict";

  const app = document.querySelector("#app");
  const views = new Map(
    Array.from(document.querySelectorAll("[data-view]")).map((view) => [view.dataset.view, view]),
  );
  const bootText = document.querySelector("#bootText");
  const titleBlock = document.querySelector("#titleBlock");
  const startButton = document.querySelector("#startButton");
  const questionText = document.querySelector("#questionText");
  const identityForm = document.querySelector("#identityForm");
  const nameInput = document.querySelector("#nameInput");
  const confirmButton = document.querySelector("#confirmButton");
  const statusText = document.querySelector("#statusText");
  const successText = document.querySelector("#successText");
  const appViewShell = document.querySelector("#appViewShell");
  const muteButton = document.querySelector("#muteButton");
  const rebootButton = document.querySelector("#rebootButton");

  const BOOT_LINES = [
    "SYSTEM BOOT...",
    "MEMORY CHECK  64KB OK",
    "LOADING PIXEL OCEAN...",
    "SHIP FINANCE QUEST READY",
  ];
  const QUESTION = "당신은 누구입니까?";
  const SUCCESS_TEMPLATE = "신원 확인 완료. 환영합니다, {name} 님!";
  const TYPE_DELAY = 38;
  const ROUTES = {
    menu: "#/menu",
    stages: "#/stages",
    stage0: "#/stage/0",
  };
  const STORAGE_KEYS = {
    lastPath: "hsb-manual-last-path",
    visitedStage: (stageId) => `hsb-manual-visited-stage-${stageId}`,
    visitedNpc: (npcId) => `hsb-manual-visited-npc-${npcId}`,
  };
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const state = {
    activeView: "boot",
    startReady: false,
    muted: false,
    audioContext: null,
    typedToken: 0,
    processing: false,
    unlocked: false,
    manual: null,
    route: "",
    routeHistory: [],
  };

  function showView(name) {
    state.activeView = name;
    views.forEach((view, viewName) => {
      view.classList.toggle("view-active", viewName === name);
    });
  }

  function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, reducedMotion ? Math.min(ms, 80) : ms));
  }

  async function typeText(element, text, delay = TYPE_DELAY) {
    const token = ++state.typedToken;
    element.classList.remove("typing-done");
    element.textContent = "";

    for (const char of text) {
      if (token !== state.typedToken) return;
      element.textContent += char;
      await wait(delay);
    }

    element.classList.add("typing-done");
  }

  async function bootSequence() {
    state.startReady = false;
    state.unlocked = false;
    state.manual = null;
    state.route = "";
    state.routeHistory = [];
    app.classList.remove("boot-complete", "glitching", "powering-off");
    rebootButton.classList.remove("is-visible");
    titleBlock.classList.add("is-hidden");
    startButton.disabled = true;
    showView("boot");

    await typeText(bootText, BOOT_LINES.join("\n"), reducedMotion ? 1 : 32);
    app.classList.add("boot-complete");
    await wait(260);
    titleBlock.classList.remove("is-hidden");
    playBootChime();
    await wait(260);
    state.startReady = true;
    startButton.disabled = false;
    startButton.focus({ preventScroll: true });
  }

  async function openIdentityScreen() {
    if (!state.startReady || state.activeView !== "boot") return;
    playSelect();
    showView("identity");
    statusText.textContent = "";
    nameInput.value = "";
    nameInput.disabled = true;
    confirmButton.disabled = true;
    await typeText(questionText, QUESTION, reducedMotion ? 1 : 45);
    nameInput.disabled = false;
    confirmButton.disabled = false;
    nameInput.focus({ preventScroll: true });
  }

  function normalizeName(value) {
    return String(value || "").replace(/\s+/g, "");
  }

  async function verifyIdentity(event) {
    event.preventDefault();
    if (state.processing) return;

    const normalizedName = normalizeName(nameInput.value);
    if (!normalizedName) {
      statusText.textContent = "이름을 입력해 주세요.";
      playErrorBeep();
      return;
    }

    state.processing = true;
    nameInput.disabled = true;
    confirmButton.disabled = true;
    statusText.textContent = "암호화된 매뉴얼 키 확인 중...";

    try {
      const manual = await decryptManual(normalizedName);
      await handleSuccess(normalizedName, manual);
    } catch (error) {
      console.warn("Identity check failed:", error);
      await handleDenied();
    } finally {
      state.processing = false;
    }
  }

  async function decryptManual(name) {
    const encrypted = window.ENCRYPTED_MANUAL;
    const subtle = window.crypto && window.crypto.subtle;

    if (!encrypted || !subtle) {
      throw new Error("Encrypted content or Web Crypto API is unavailable.");
    }

    const passwordBytes = new TextEncoder().encode(name);
    const iterations = encrypted.kdf.iterations;

    for (const recipient of encrypted.recipients) {
      try {
        const wrappingKey = await deriveWrappingKey(passwordBytes, recipient.salt, iterations);
        const rawDataKey = await subtle.decrypt(
          { name: "AES-GCM", iv: b64ToBytes(recipient.iv) },
          wrappingKey,
          b64ToBytes(recipient.wrappedKey),
        );
        const dataKey = await subtle.importKey("raw", rawDataKey, "AES-GCM", false, ["decrypt"]);
        const plaintext = await subtle.decrypt(
          { name: "AES-GCM", iv: b64ToBytes(encrypted.payload.iv) },
          dataKey,
          b64ToBytes(encrypted.payload.ciphertext),
        );

        return JSON.parse(new TextDecoder().decode(plaintext));
      } catch (error) {
        // A wrong name should fail every wrapped data key without revealing which one matched.
      }
    }

    throw new Error("No wrapped key could be opened.");
  }

  async function deriveWrappingKey(passwordBytes, salt, iterations) {
    const baseKey = await window.crypto.subtle.importKey("raw", passwordBytes, "PBKDF2", false, ["deriveKey"]);
    return window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        hash: "SHA-256",
        salt: b64ToBytes(salt),
        iterations,
      },
      baseKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"],
    );
  }

  function b64ToBytes(value) {
    const binary = window.atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }

  async function handleSuccess(name, manual) {
    playLevelUp();
    successText.textContent = SUCCESS_TEMPLATE.replace("{name}", name);
    state.manual = normalizeManual(manual);
    state.unlocked = true;
    showView("success");
    await wait(1450);
    openManualApp();
  }

  function normalizeManual(manual) {
    return {
      appTitle: manual.appTitle || "할 수 있다!! 선박금융!!",
      menu: manual.menu || {},
      stages: Array.isArray(manual.stages) ? manual.stages : [],
    };
  }

  function openManualApp() {
    showView("manual");
    const savedPath = safeGet(STORAGE_KEYS.lastPath);
    const currentHash = window.location.hash;
    const initialRoute = getValidRoute(currentHash) || getValidRoute(savedPath) || ROUTES.menu;
    navigate(initialRoute, { replace: true, silent: true });
  }

  function navigate(route, options = {}) {
    const validRoute = getValidRoute(route) || ROUTES.menu;
    if (!options.replace && state.route && state.route !== validRoute) {
      state.routeHistory.push(state.route);
    }

    if (window.location.hash === validRoute) {
      renderRoute(validRoute);
      return;
    }

    if (options.replace) {
      window.location.replace(validRoute);
    } else {
      window.location.hash = validRoute;
    }

    if (options.silent) {
      renderRoute(validRoute);
    }
  }

  function getValidRoute(route) {
    if (!state.manual || !route) return null;
    const normalized = route.startsWith("#/") ? route : `#/${String(route).replace(/^#?\/?/, "")}`;
    const stage = getStage0();
    if (!stage) return normalized === ROUTES.menu || normalized === ROUTES.stages ? normalized : null;

    if (normalized === ROUTES.menu || normalized === ROUTES.stages || normalized === ROUTES.stage0) {
      return normalized;
    }

    const companyMatch = normalized.match(/^#\/stage\/0\/company\/([^/]+)$/);
    if (companyMatch && getCompany(companyMatch[1])) {
      return normalized;
    }

    const npcMatch = normalized.match(/^#\/stage\/0\/company\/([^/]+)\/npc\/([^/]+)$/);
    if (npcMatch) {
      const company = getCompany(npcMatch[1]);
      if (company && getNpc(company, npcMatch[2])) return normalized;
    }

    return null;
  }

  function renderRoute(route) {
    if (!state.unlocked || !state.manual) return;
    const validRoute = getValidRoute(route) || ROUTES.menu;
    state.route = validRoute;
    safeSet(STORAGE_KEYS.lastPath, validRoute);

    appViewShell.replaceChildren();
    if (validRoute === ROUTES.menu) renderMenu();
    else if (validRoute === ROUTES.stages) renderStageSelect();
    else if (validRoute === ROUTES.stage0) renderStage0();
    else if (validRoute.includes("/npc/")) renderNpcRoute(validRoute);
    else renderCompanyRoute(validRoute);

    showView("manual");
    focusFirstRouteControl();
  }

  function renderMenu() {
    const savedPath = getValidRoute(safeGet(STORAGE_KEYS.lastPath));
    const card = createPanel("main-menu-card");
    card.append(
      createKicker("MAIN MENU"),
      createTitle(state.manual.appTitle),
      createParagraph(state.manual.menu.subtitle || "레트로 선박금융 업무 매뉴얼"),
    );

    const actions = el("div", "menu-actions");
    actions.append(
      createActionButton(state.manual.menu.stageSelectLabel || "스테이지 선택", () => navigate(ROUTES.stages)),
      createActionButton(state.manual.menu.startLabel || "튜토리얼 마을로 출항", () => navigate(ROUTES.stage0)),
    );

    if (savedPath && savedPath !== ROUTES.menu) {
      actions.append(createActionButton("마지막 위치에서 계속", () => navigate(savedPath), "ghost-button"));
    }

    card.append(actions, createHint("Esc: 메뉴에서는 대기 / 방향키: 버튼 이동 / Enter: 선택"));
    appViewShell.append(card);
  }

  function renderStageSelect() {
    const wrapper = createRouteLayout("스테이지 선택", ROUTES.menu);
    const grid = el("div", "stage-grid");
    for (const stage of state.manual.stages) {
      const visited = safeGet(STORAGE_KEYS.visitedStage(stage.id)) === "1";
      const button = createActionButton("", () => navigate(stage.id === "stage-0" ? ROUTES.stage0 : ROUTES.stages), "stage-card");
      button.disabled = stage.id !== "stage-0";
      button.innerHTML = "";
      button.append(
        createKicker(stage.number || stage.id),
        el("strong", "stage-card-title", stage.title || ""),
        createParagraph(stage.subtitle || ""),
        el("span", visited ? "visit-badge visited" : "visit-badge", visited ? "VISITED" : "READY"),
      );
      grid.append(button);
    }
    wrapper.append(grid);
    appViewShell.append(wrapper);
  }

  function renderStage0() {
    const stage = getStage0();
    safeSet(STORAGE_KEYS.visitedStage(stage.id), "1");

    const wrapper = createRouteLayout(`${stage.number} ${stage.title}`, ROUTES.stages);
    const intro = el("section", "village-intro");
    intro.append(createKicker("TUTORIAL VILLAGE"), createTitle(stage.subtitle || stage.title));
    for (const paragraph of stage.intro.paragraphs || []) {
      intro.append(createParagraph(paragraph));
    }

    const companyGrid = el("section", "company-grid");
    companyGrid.append(el("h3", "section-title", stage.playerIntroHeading || "플레이어 소개"));
    for (const company of stage.companies || []) {
      const button = createActionButton("", () => navigate(companyRoute(company.id)), "company-tile");
      button.innerHTML = "";
      button.append(
        el("span", "company-icon", company.badge || "▣"),
        el("strong", "company-name", company.name),
        el("span", "company-role", company.role || ""),
      );
      companyGrid.append(button);
    }

    wrapper.append(intro, companyGrid, createHint(stage.gameHint || ""));
    appViewShell.append(wrapper);
  }

  function renderCompanyRoute(route) {
    const companyId = route.match(/^#\/stage\/0\/company\/([^/]+)$/)[1];
    renderCompany(companyId);
  }

  function renderCompany(companyId) {
    const company = getCompany(companyId);
    const stage = getStage0();
    const wrapper = createRouteLayout(company.name, ROUTES.stage0);
    const split = el("div", "village-split");

    const notes = el("section", "notice-board");
    notes.append(createKicker(company.role || stage.title), el("h3", "section-title", company.heading || "업무 시 유의사항"));
    for (const paragraph of company.notes || []) {
      notes.append(createParagraph(paragraph));
    }

    const npcs = el("section", "npc-board");
    npcs.append(el("h3", "section-title", "NPC 카드"));
    for (const npc of company.npcs || []) {
      const card = createActionButton("", () => navigate(npcRoute(company.id, npc.id)), "npc-card");
      card.innerHTML = "";
      const visited = safeGet(STORAGE_KEYS.visitedNpc(npc.id)) === "1";
      const avatar = el("div", "npc-avatar");
      avatar.innerHTML = createPixelAvatar(npc.seed || npc.id, npc.color || "#81ff74");
      card.append(
        avatar,
        el("strong", "npc-name", npc.name),
        el("span", "npc-meta", npc.group || npc.subtitle || ""),
        el("span", visited ? "visit-badge visited" : "visit-badge", visited ? "VISITED" : "NEW"),
      );
      npcs.append(card);
    }

    split.append(notes, npcs);
    wrapper.append(split);
    appViewShell.append(wrapper);
  }

  function renderNpcRoute(route) {
    const match = route.match(/^#\/stage\/0\/company\/([^/]+)\/npc\/([^/]+)$/);
    const company = getCompany(match[1]);
    const npc = getNpc(company, match[2]);
    safeSet(STORAGE_KEYS.visitedNpc(npc.id), "1");

    const wrapper = createRouteLayout("NPC 도감", companyRoute(company.id));
    const dex = el("article", "npc-dex");
    const avatar = el("div", "npc-avatar large-avatar");
    avatar.innerHTML = createPixelAvatar(npc.seed || npc.id, npc.color || "#81ff74");

    const copy = el("div", "npc-dex-copy");
    copy.append(
      createKicker(company.name),
      createTitle(npc.name),
      createParagraph(npc.group || npc.subtitle || ""),
    );
    for (const paragraph of npc.description || []) {
      copy.append(createParagraph(paragraph));
    }

    dex.append(avatar, copy);
    wrapper.append(dex);
    appViewShell.append(wrapper);
  }

  function createRouteLayout(title, backRoute) {
    const wrapper = createPanel("route-panel");
    const nav = el("div", "route-nav");
    nav.append(createActionButton("[◀ 뒤로]", () => goBack(backRoute), "back-button"));
    nav.append(createActionButton("MAIN MENU", () => navigate(ROUTES.menu), "ghost-button"));
    wrapper.append(nav, createTitle(title));
    return wrapper;
  }

  function goBack(fallbackRoute) {
    playSelect();
    if (state.routeHistory.length > 0) {
      state.routeHistory.pop();
      window.history.back();
      return;
    }
    navigate(fallbackRoute || getParentRoute(state.route), { replace: true });
  }

  function getParentRoute(route) {
    if (!route || route === ROUTES.menu) return ROUTES.menu;
    if (route === ROUTES.stages) return ROUTES.menu;
    if (route === ROUTES.stage0) return ROUTES.stages;
    if (route.includes("/npc/")) return route.replace(/\/npc\/[^/]+$/, "");
    if (route.includes("/company/")) return ROUTES.stage0;
    return ROUTES.menu;
  }

  function getStage0() {
    return state.manual.stages.find((stage) => stage.id === "stage-0");
  }

  function getCompany(companyId) {
    const stage = getStage0();
    return stage && stage.companies.find((company) => company.id === companyId);
  }

  function getNpc(company, npcId) {
    return company.npcs.find((npc) => npc.id === npcId);
  }

  function companyRoute(companyId) {
    return `${ROUTES.stage0}/company/${companyId}`;
  }

  function npcRoute(companyId, npcId) {
    return `${companyRoute(companyId)}/npc/${npcId}`;
  }

  function createPanel(extraClass) {
    return el("article", `manual-card app-card ${extraClass || ""}`.trim());
  }

  function createKicker(text) {
    return el("p", "manual-kicker", text);
  }

  function createTitle(text) {
    return el("h2", "manual-title", text);
  }

  function createParagraph(text) {
    return el("p", "manual-copy", text);
  }

  function createHint(text) {
    return el("p", "route-hint", text);
  }

  function createActionButton(label, action, className = "pixel-button") {
    const button = el("button", className, label);
    button.type = "button";
    button.dataset.keynav = "true";
    button.addEventListener("click", () => {
      playSelect();
      action();
    });
    return button;
  }

  function el(tagName, className, text) {
    const node = document.createElement(tagName);
    if (className) node.className = className;
    if (typeof text === "string") node.textContent = text;
    return node;
  }

  function createPixelAvatar(seed, accent) {
    const hash = hashString(seed);
    const cells = [];
    const colors = ["#fff8d7", accent, "#071527", "#ffe66d"];
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 4; x += 1) {
        const bit = (hash >> ((x + y * 4) % 24)) & 1;
        const fill = bit ? colors[(x + y) % colors.length] : "transparent";
        if (fill !== "transparent") {
          cells.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${fill}"/>`);
          cells.push(`<rect x="${7 - x}" y="${y}" width="1" height="1" fill="${fill}"/>`);
        }
      }
    }

    return `<svg viewBox="0 0 8 8" role="img" aria-hidden="true" focusable="false">${cells.join("")}</svg>`;
  }

  function hashString(value) {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
      hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
    }
    return hash || 1;
  }

  function focusFirstRouteControl() {
    window.requestAnimationFrame(() => {
      const first = appViewShell.querySelector("[data-keynav]");
      if (first) first.focus({ preventScroll: true });
    });
  }

  function safeGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function safeSet(key, value) {
    if (!key.startsWith("hsb-manual-")) return;
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Local files can run in restricted browser contexts; storage is a progressive enhancement.
    }
  }

  async function handleDenied() {
    statusText.textContent = "";
    showView("denied");
    app.classList.add("glitching");
    playNoise(1.5);
    await wait(1500);
    app.classList.remove("glitching");
    app.classList.add("powering-off");
    playPowerDown();
    await wait(920);
    showView("blackout");
    app.classList.remove("powering-off");
    await wait(3000);
    rebootButton.classList.add("is-visible");
    rebootButton.focus({ preventScroll: true });
  }

  function getAudioContext() {
    if (state.muted) return null;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;

    if (!state.audioContext) {
      state.audioContext = new AudioContext();
    }

    if (state.audioContext.state === "suspended") {
      state.audioContext.resume();
    }

    return state.audioContext;
  }

  function playTone(frequency, duration, type = "square", gainValue = 0.055, offset = 0) {
    const context = getAudioContext();
    if (!context) return;

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + offset;
    const end = start + duration;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(end + 0.02);
  }

  function playBootChime() {
    playTone(330, 0.08, "square", 0.035);
    playTone(660, 0.08, "square", 0.035, 0.1);
  }

  function playSelect() {
    playTone(523.25, 0.06, "square", 0.045);
  }

  function playErrorBeep() {
    playTone(130.81, 0.1, "sawtooth", 0.05);
    playTone(98, 0.12, "sawtooth", 0.04, 0.09);
  }

  function playLevelUp() {
    [392, 523.25, 659.25, 783.99, 1046.5].forEach((note, index) => {
      playTone(note, 0.085, "square", 0.052, index * 0.09);
    });
  }

  function playPowerDown() {
    const context = getAudioContext();
    if (!context) return;

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime;
    const end = start + 0.72;

    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(180, start);
    oscillator.frequency.exponentialRampToValueAtTime(28, end);
    gain.gain.setValueAtTime(0.045, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(end + 0.04);
  }

  function playNoise(seconds) {
    const context = getAudioContext();
    if (!context) return;

    const sampleRate = context.sampleRate;
    const frameCount = Math.max(1, Math.floor(sampleRate * seconds));
    const buffer = context.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < frameCount; index += 1) {
      data[index] = (Math.random() * 2 - 1) * 0.42;
    }

    const source = context.createBufferSource();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();

    filter.type = "bandpass";
    filter.frequency.value = 1400;
    gain.gain.value = 0.08;
    source.buffer = buffer;
    source.connect(filter).connect(gain).connect(context.destination);
    source.start();
  }

  function toggleMute() {
    state.muted = !state.muted;
    muteButton.textContent = state.muted ? "SOUND OFF" : "SOUND ON";
    muteButton.setAttribute("aria-pressed", String(state.muted));
    if (state.muted && state.audioContext) {
      state.audioContext.suspend();
    }
  }

  function handleRouteKeydown(event) {
    if (state.activeView !== "manual") return;

    if (event.key === "Escape") {
      event.preventDefault();
      if (state.route !== ROUTES.menu) goBack(getParentRoute(state.route));
      return;
    }

    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(event.key)) return;
    const controls = Array.from(appViewShell.querySelectorAll("[data-keynav]:not(:disabled)"));
    if (controls.length < 2) return;

    const direction = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
    const currentIndex = Math.max(0, controls.indexOf(document.activeElement));
    const next = controls[(currentIndex + direction + controls.length) % controls.length];
    event.preventDefault();
    next.focus({ preventScroll: true });
  }

  startButton.addEventListener("click", openIdentityScreen);
  identityForm.addEventListener("submit", verifyIdentity);
  muteButton.addEventListener("click", toggleMute);
  rebootButton.addEventListener("click", bootSequence);

  window.addEventListener("hashchange", () => {
    if (!state.unlocked) return;
    const target = getValidRoute(window.location.hash) || ROUTES.menu;
    if (state.routeHistory[state.routeHistory.length - 1] === target) {
      state.routeHistory.pop();
    }
    renderRoute(target);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      if (state.activeView === "boot" && state.startReady) {
        event.preventDefault();
        openIdentityScreen();
      }
    }
    handleRouteKeydown(event);
  });

  document.addEventListener("click", (event) => {
    if (event.target === muteButton || event.target === rebootButton) return;
    if (state.activeView === "boot" && state.startReady) {
      openIdentityScreen();
    }
  });

  bootSequence();
})();
