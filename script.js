(() => {
  const music = document.getElementById("bgMusic");
  const toggle = document.getElementById("soundToggle");
  const icon = document.getElementById("soundIcon");
  const hint = document.getElementById("soundHint");
  const video = document.getElementById("heroVideo");

  // ----------------------------------------------------------
  // VIDEO: Android/iOS back-button / BFCache recovery
  // ----------------------------------------------------------
  let videoRecoveryTimer = null;

  async function ensureVideoPlaying() {
    if (!video) return;

    // Muted inline playback is eligible for autoplay on mobile browsers.
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    try {
      if (video.error || video.readyState === 0) {
        video.load();
      }

      if (video.paused || video.ended) {
        await video.play();
      }
    } catch (err) {
      // BFCache restoration can need one render cycle before play() works.
      clearTimeout(videoRecoveryTimer);
      videoRecoveryTimer = setTimeout(() => {
        video.play().catch(() => {});
      }, 120);
    }
  }

  function aggressivelyResumeVideo() {
    ensureVideoPlaying();
    requestAnimationFrame(() => ensureVideoPlaying());
    setTimeout(() => ensureVideoPlaying(), 80);
    setTimeout(() => ensureVideoPlaying(), 260);
  }

  // pageshow is the important event when the page is restored from
  // the mobile browser's back/forward cache.
  window.addEventListener("pageshow", aggressivelyResumeVideo);
  window.addEventListener("focus", aggressivelyResumeVideo);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      aggressivelyResumeVideo();

      if (soundEnabled && hasUnlockedAudio) {
        music.play().catch(() => {});
      }
    }
  });

  // Some Chromium builds dispatch pagehide/pageshow without a full reload.
  window.addEventListener("pagehide", () => {
    clearTimeout(videoRecoveryTimer);
  });

  video.addEventListener("canplay", () => {
    if (!document.hidden) ensureVideoPlaying();
  });

  // ----------------------------------------------------------
  // INTRO MUSIC
  // ----------------------------------------------------------
  const storedAudio = (() => {
    try {
      return JSON.parse(localStorage.getItem("tobias_audio_settings_v1") || "null");
    } catch {
      return null;
    }
  })();

  let soundEnabled =
    storedAudio && typeof storedAudio.musicMuted === "boolean"
      ? !storedAudio.musicMuted
      : localStorage.getItem("tobiasMusic") !== "off";

  let hasUnlockedAudio = false;

  if (storedAudio && Number.isFinite(Number(storedAudio.musicVolume))) {
    music.volume = Math.max(0, Math.min(1, Number(storedAudio.musicVolume)));
  } else {
    music.volume = 0.42;
  }

  function persistIntroMuteState() {
    let settings = {};
    try {
      settings = JSON.parse(localStorage.getItem("tobias_audio_settings_v1") || "{}") || {};
    } catch {}

    settings.musicVolume = music.volume;
    settings.musicMuted = !soundEnabled;

    if (!Number.isFinite(Number(settings.sfxVolume))) settings.sfxVolume = 0.7;
    if (typeof settings.sfxMuted !== "boolean") settings.sfxMuted = false;

    localStorage.setItem("tobias_audio_settings_v1", JSON.stringify(settings));
  }

  function renderSoundState() {
    toggle.classList.toggle("off", !soundEnabled);
    icon.textContent = soundEnabled ? "♪" : "×";
    toggle.setAttribute(
      "aria-label",
      soundEnabled ? "Desligar música" : "Ligar música"
    );
  }

  async function startMusic() {
    if (!soundEnabled) return;

    try {
      await music.play();
      hasUnlockedAudio = true;
      hint.classList.remove("visible");
    } catch {
      hint.classList.add("visible");
    }
  }

  const unlockAudio = async () => {
    if (!hasUnlockedAudio && soundEnabled) {
      await startMusic();
    }
  };

  document.addEventListener("pointerdown", unlockAudio, { passive: true });
  document.addEventListener("keydown", unlockAudio);

  toggle.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();

    soundEnabled = !soundEnabled;
    localStorage.setItem("tobiasMusic", soundEnabled ? "on" : "off");
    persistIntroMuteState();

    if (soundEnabled) {
      await startMusic();
    } else {
      music.pause();
      hint.classList.remove("visible");
    }

    renderSoundState();
  });

  // ----------------------------------------------------------
  // JOGAR
  // ----------------------------------------------------------
  const playButton = document.getElementById("playButton");

  if (playButton) {
    playButton.addEventListener("click", (event) => {
      event.preventDefault();

      window.location.href =
        window.TobiasSave && TobiasSave.exists()
          ? "jogo.html"
          : "nome.html";
    });
  }

  // Initial playback attempts.
  aggressivelyResumeVideo();
  startMusic();

  setTimeout(() => {
    if (soundEnabled && music.paused) hint.classList.add("visible");
  }, 1800);

  setTimeout(() => hint.classList.remove("visible"), 6500);

  renderSoundState();
})();
