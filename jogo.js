(() => {
  const save =
    window.TobiasSave
      ? TobiasSave.load()
      : null;

  if (!save) {
    window.location.replace("nome.html");
    return;
  }

  const gameMusic =
    document.getElementById("gameMusic");

  const settingsToggle =
    document.getElementById("settingsToggle");

  const settingsPanel =
    document.getElementById("settingsPanel");

  const closeSettings =
    document.getElementById("closeSettings");

  const musicSlider =
    document.getElementById("musicVolume");

  const sfxSlider =
    document.getElementById("sfxVolume");

  const musicValue =
    document.getElementById("musicValue");

  const sfxValue =
    document.getElementById("sfxValue");

  const musicMute =
    document.getElementById("musicMute");

  const sfxMute =
    document.getElementById("sfxMute");

  const deleteButton =
    document.getElementById("deleteProgress");

  const dialogOne =
    document.getElementById("deleteDialogOne");

  const dialogTwo =
    document.getElementById("deleteDialogTwo");

  const noOne =
    document.getElementById("deleteNoOne");

  const yesOne =
    document.getElementById("deleteYesOne");

  const noTwo =
    document.getElementById("deleteNoTwo");

  const yesTwo =
    document.getElementById("deleteYesTwo");

  const AUDIO_KEY =
    "tobias_audio_settings_v1";

  const defaultAudio = {
    musicVolume: 0.42,
    musicMuted: false,
    sfxVolume: 0.70,
    sfxMuted: false
  };

  function readAudioSettings() {
    try {
      const stored =
        JSON.parse(
          localStorage.getItem(AUDIO_KEY) || "{}"
        );

      return {
        musicVolume:
          Number.isFinite(
            Number(stored.musicVolume)
          )
            ? Math.max(
                0,
                Math.min(
                  1,
                  Number(stored.musicVolume)
                )
              )
            : defaultAudio.musicVolume,

        musicMuted:
          typeof stored.musicMuted === "boolean"
            ? stored.musicMuted
            : defaultAudio.musicMuted,

        sfxVolume:
          Number.isFinite(
            Number(stored.sfxVolume)
          )
            ? Math.max(
                0,
                Math.min(
                  1,
                  Number(stored.sfxVolume)
                )
              )
            : defaultAudio.sfxVolume,

        sfxMuted:
          typeof stored.sfxMuted === "boolean"
            ? stored.sfxMuted
            : defaultAudio.sfxMuted
      };
    } catch {
      return { ...defaultAudio };
    }
  }

  let audio = readAudioSettings();

  function saveAudioSettings() {
    localStorage.setItem(
      AUDIO_KEY,
      JSON.stringify(audio)
    );
  }

  function applyAudioSettings() {
    gameMusic.volume = audio.musicVolume;
    gameMusic.muted = audio.musicMuted;

    musicSlider.value =
      Math.round(audio.musicVolume * 100);

    sfxSlider.value =
      Math.round(audio.sfxVolume * 100);

    musicValue.textContent =
      `${musicSlider.value}%`;

    sfxValue.textContent =
      `${sfxSlider.value}%`;

    const musicIcon =
      musicMute.querySelector(".audio-icon");

    const sfxIcon =
      sfxMute.querySelector(".audio-icon");

    musicIcon.textContent =
      audio.musicMuted ? "🔇" : "🔊";

    sfxIcon.textContent =
      audio.sfxMuted ? "🔇" : "🔊";

    musicMute.classList.toggle(
      "muted",
      audio.musicMuted
    );

    sfxMute.classList.toggle(
      "muted",
      audio.sfxMuted
    );

    musicMute.setAttribute(
      "aria-label",
      audio.musicMuted
        ? "Desmutar música"
        : "Mutar música"
    );

    sfxMute.setAttribute(
      "aria-label",
      audio.sfxMuted
        ? "Desmutar efeitos de áudio"
        : "Mutar efeitos de áudio"
    );
  }

  function resumeMusic() {
    if (!audio.musicMuted) {
      gameMusic.play().catch(() => {});
    }
  }

  window.addEventListener(
    "pageshow",
    resumeMusic
  );

  window.addEventListener(
    "focus",
    resumeMusic
  );

  document.addEventListener(
    "visibilitychange",
    () => {
      if (!document.hidden) {
        resumeMusic();
      }
    }
  );

  // ----------------------------------------------------------
  // Settings panel
  // ----------------------------------------------------------
  function openSettings() {
    settingsPanel.classList.add("open");

    settingsPanel.setAttribute(
      "aria-hidden",
      "false"
    );

    settingsToggle.setAttribute(
      "aria-expanded",
      "true"
    );
  }

  function closeDangerDialog(dialog) {
    dialog.classList.remove("open");

    dialog.setAttribute(
      "aria-hidden",
      "true"
    );
  }

  function closeSettingsPanel() {
    settingsPanel.classList.remove("open");

    settingsPanel.setAttribute(
      "aria-hidden",
      "true"
    );

    settingsToggle.setAttribute(
      "aria-expanded",
      "false"
    );

    closeDangerDialog(dialogOne);
    closeDangerDialog(dialogTwo);
  }

  settingsToggle.addEventListener(
    "click",
    openSettings
  );

  closeSettings.addEventListener(
    "click",
    closeSettingsPanel
  );

  // ----------------------------------------------------------
  // Volume controls
  // ----------------------------------------------------------
  musicSlider.addEventListener(
    "input",
    () => {
      audio.musicVolume =
        Number(musicSlider.value) / 100;

      musicValue.textContent =
        `${musicSlider.value}%`;

      gameMusic.volume =
        audio.musicVolume;

      saveAudioSettings();
    }
  );

  sfxSlider.addEventListener(
    "input",
    () => {
      audio.sfxVolume =
        Number(sfxSlider.value) / 100;

      sfxValue.textContent =
        `${sfxSlider.value}%`;

      saveAudioSettings();
    }
  );

  musicMute.addEventListener(
    "click",
    async () => {
      audio.musicMuted =
        !audio.musicMuted;

      applyAudioSettings();
      saveAudioSettings();

      if (!audio.musicMuted) {
        await gameMusic
          .play()
          .catch(() => {});
      }
    }
  );

  sfxMute.addEventListener(
    "click",
    () => {
      audio.sfxMuted =
        !audio.sfxMuted;

      applyAudioSettings();
      saveAudioSettings();
    }
  );

  // ----------------------------------------------------------
  // Delete progress
  // ----------------------------------------------------------
  function openDangerDialog(dialog) {
    dialog.classList.add("open");

    dialog.setAttribute(
      "aria-hidden",
      "false"
    );
  }

  deleteButton.addEventListener(
    "click",
    () => {
      openDangerDialog(dialogOne);
    }
  );

  noOne.addEventListener(
    "click",
    () => {
      closeDangerDialog(dialogOne);
    }
  );

  yesOne.addEventListener(
    "click",
    () => {
      closeDangerDialog(dialogOne);
      openDangerDialog(dialogTwo);
    }
  );

  noTwo.addEventListener(
    "click",
    () => {
      closeDangerDialog(dialogTwo);
    }
  );

  yesTwo.addEventListener(
    "click",
    async () => {
      const currentSave =
        TobiasSave.load();

      yesTwo.disabled = true;
      yesTwo.textContent = "APAGANDO...";

      try {
        /*
          The player's username is released before the
          local save is erased.

          Tobias -> delete progress -> Tobias is available again.
        */
        if (
          currentSave?.playerName &&
          window.TobiasNameRegistry
        ) {
          await TobiasNameRegistry.release(
            currentSave.playerName
          );
        }

        TobiasSave.clearAllProgress();

        window.location.replace(
          "index.html"
        );
      } catch (error) {
        console.error(error);

        yesTwo.disabled = false;

        yesTwo.textContent =
          "SIM, APAGAR TUDO";

        alert(
          "Não foi possível liberar o nome e apagar o progresso. Tente novamente."
        );
      }
    }
  );

  // ----------------------------------------------------------
  // Initial state
  // ----------------------------------------------------------
  applyAudioSettings();
  resumeMusic();

  /*
    Audible autoplay can be blocked by the browser.
    First player interaction unlocks it.
  */
  document.addEventListener(
    "pointerdown",
    () => {
      if (!audio.musicMuted) {
        gameMusic.play().catch(() => {});
      }
    },
    { passive: true }
  );
})();
