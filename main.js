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
  const manualKicker = document.querySelector("#manualKicker");
  const manualTitle = document.querySelector("#manualTitle");
  const manualSubtitle = document.querySelector("#manualSubtitle");
  const manualBody = document.querySelector("#manualBody");
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
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const state = {
    activeView: "boot",
    startReady: false,
    muted: false,
    audioContext: null,
    typedToken: 0,
    processing: false,
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
    showView("success");
    await wait(1450);
    renderManual(manual);
    showView("manual");
  }

  function renderManual(manual) {
    manualKicker.textContent = manual.kicker || "";
    manualTitle.textContent = manual.title || "";
    manualSubtitle.textContent = manual.subtitle || "";
    manualBody.replaceChildren();

    const paragraphs = Array.isArray(manual.body) ? manual.body : [];
    for (const paragraph of paragraphs) {
      const node = document.createElement("p");
      node.textContent = paragraph;
      manualBody.append(node);
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

  startButton.addEventListener("click", openIdentityScreen);
  identityForm.addEventListener("submit", verifyIdentity);
  muteButton.addEventListener("click", toggleMute);
  rebootButton.addEventListener("click", bootSequence);

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (state.activeView !== "boot" || !state.startReady) return;
    event.preventDefault();
    openIdentityScreen();
  });

  document.addEventListener("click", (event) => {
    if (event.target === muteButton || event.target === rebootButton) return;
    if (state.activeView === "boot" && state.startReady) {
      openIdentityScreen();
    }
  });

  bootSequence();
})();
