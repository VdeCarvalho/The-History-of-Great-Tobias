(() => {
  const music = document.getElementById("bgMusic");
  const toggle = document.getElementById("soundToggle");
  const icon = document.getElementById("soundIcon");
  const hint = document.getElementById("soundHint");
  const video = document.getElementById("heroVideo");
  const playButton = document.getElementById("playButton");

  const RELOAD_GUARD = "tobias_back_video_reload_guard";

  function navigationWasBackForward(event) {
    try {
      const nav = performance.getEntriesByType("navigation")[0];
      return Boolean(event?.persisted || nav?.type === "back_forward");
    } catch {
      return Boolean(event?.persisted);
    }
  }

  /*
    Some mobile browsers restore the page from BFCache with the <video>
    visually frozen even when play() succeeds.

    Therefore, on an actual Back/Forward restoration we rebuild the page
    once with a normal reload. The guard prevents any reload loop.
  */
  window.addEventListener("pageshow", (event) => {
    const cameFromHistory = navigationWasBackForward(event);
    const alreadyReloaded = sessionStorage.getItem(RELOAD_GUARD) === "1";

    if (cameFromHistory && !alreadyReloaded) {
      sessionStorage.setItem(RELOAD_GUARD, "1");
      window.location.reload();
      return;
    }

    // A reload is now a normal navigation, so release the guard.
    sessionStorage.removeItem(RELOAD_GUARD);

    restartIntroVideo();
  });

  async function restartIntroVideo() {
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    try {
      // If the browser has left the media pipeline in a bad state,
      // reload the media element instead of merely calling play().
      if (video.error || video.readyState === 0) {
        const currentTime = Number.isFinite(video.currentTime)
          ? video.currentTime
          : 0;

        video.load();

        video.addEventListener(
          "loadedmetadata",
          () => {
            try {
              if (
                currentTime > 0 &&
                currentTime < video.duration
              ) {
                video.currentTime = currentTime;
              }
            } catch {}

            video.play().catch(() => {});
          },
          { once: true }
        );

        return;
      }

      await video.play();
    } catch {
      // Final fallback for delayed mobile rendering.
      setTimeout(() => {
        video.load();
        video.play().catch(() => {});
      }, 120);
    }
  }

  window.addEventListener("focus", restartIntroVideo);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      restartIntroVideo();

      if (soundEnabled && hasUnlockedAudio) {
        music.play().catch(() => {});
      }
    }
  });

  video.addEventListener("canplay", () => {
    if (!document.hidden && video.paused) {
      video.play().catch(() => {});
    }
  });

  // ----------------------------------------------------------
  // Music preferences
  // ----------------------------------------------------------
  const storedAudio = (() => {
    try {
      return JSON.parse(
        localStorage.getItem("tobias_audio_settings_v1") || "null"
      );
    } catch {
      return null;
    }
  })();

  let soundEnabled =
    storedAudio && typeof storedAudio.musicMuted === "boolean"
      ? !storedAudio.musicMuted
      : localStorage.getItem("tobiasMusic") !== "off";

  let hasUnlockedAudio = false;

  music.volume =
    storedAudio &&
    Number.isFinite(Number(storedAudio.musicVolume))
      ? Math.max(0, Math.min(1, Number(storedAudio.musicVolume)))
      : 0.42;

  function persistIntroAudio() {
    let settings = {};

    try {
      settings =
        JSON.parse(
          localStorage.getItem("tobias_audio_settings_v1") || "{}"
        ) || {};
    } catch {}

    settings.musicVolume = music.volume;
    settings.musicMuted = !soundEnabled;

    if (!Number.isFinite(Number(settings.sfxVolume))) {
      settings.sfxVolume = 0.7;
    }

    if (typeof settings.sfxMuted !== "boolean") {
      settings.sfxMuted = false;
    }

    localStorage.setItem(
      "tobias_audio_settings_v1",
      JSON.stringify(settings)
    );
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

  document.addEventListener(
    "pointerdown",
    unlockAudio,
    { passive: true }
  );

  document.addEventListener("keydown", unlockAudio);

  toggle.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();

    soundEnabled = !soundEnabled;

    localStorage.setItem(
      "tobiasMusic",
      soundEnabled ? "on" : "off"
    );

    persistIntroAudio();

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
  if (playButton) {
    playButton.addEventListener("click", (event) => {
      event.preventDefault();

      window.location.href =
        window.TobiasSave && TobiasSave.exists()
          ? "jogo.html"
          : "nome.html";
    });
  }

  restartIntroVideo();
  startMusic();

  setTimeout(() => {
    if (soundEnabled && music.paused) {
      hint.classList.add("visible");
    }
  }, 1800);

  setTimeout(() => {
    hint.classList.remove("visible");
  }, 6500);

  renderSoundState();
})();
