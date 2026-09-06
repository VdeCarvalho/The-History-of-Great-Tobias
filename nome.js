(() => {
  const form = document.getElementById("nameForm");
  const input = document.getElementById("playerName");
  const statusEl = document.getElementById("nameStatus");
  const box = document.getElementById("suggestionBox");
  const suggestedNameEl = document.getElementById("suggestedName");
  const acceptSuggested = document.getElementById("acceptSuggested");
  const retryName = document.getElementById("retryName");
  const submitButton = document.getElementById("confirmName");

  const nameMusic = document.getElementById("nameMusic");
  const nameSoundToggle = document.getElementById("nameSoundToggle");
  const nameSoundIcon = document.getElementById("nameSoundIcon");

  const AUDIO_KEY = "tobias_audio_settings_v1";
  const MUSIC_POSITION_KEY = "tobias_music_position_v1";

  let baseName = "";
  let suggestion = "";
  let audioUnlocked = false;

  /*
    IMPORTANT:
    Once a save exists, this page must never be usable again.
    If browser history or a direct URL reaches it, go to the title page.
  */
  if (window.TobiasSave && TobiasSave.exists()) {
    window.location.replace("index.html");
    return;
  }

  // ----------------------------------------------------------
  // Music continuity from index.html
  // ----------------------------------------------------------
  function readAudioSettings() {
    try {
      return JSON.parse(
        localStorage.getItem(AUDIO_KEY) || "{}"
      ) || {};
    } catch {
      return {};
    }
  }

  let audioSettings = readAudioSettings();

  nameMusic.volume =
    Number.isFinite(Number(audioSettings.musicVolume))
      ? Math.max(0, Math.min(1, Number(audioSettings.musicVolume)))
      : 0.42;

  let musicMuted =
    typeof audioSettings.musicMuted === "boolean"
      ? audioSettings.musicMuted
      : localStorage.getItem("tobiasMusic") === "off";

  nameMusic.muted = musicMuted;

  function restoreMusicPosition() {
    try {
      const saved = Number(
        sessionStorage.getItem(MUSIC_POSITION_KEY)
      );

      if (
        Number.isFinite(saved) &&
        saved >= 0 &&
        Number.isFinite(nameMusic.duration) &&
        nameMusic.duration > 0
      ) {
        nameMusic.currentTime =
          saved % nameMusic.duration;
      }
    } catch {}
  }

  function rememberMusicPosition() {
    try {
      sessionStorage.setItem(
        MUSIC_POSITION_KEY,
        String(
          Number.isFinite(nameMusic.currentTime)
            ? nameMusic.currentTime
            : 0
        )
      );
    } catch {}
  }

  function persistAudioSettings() {
    audioSettings.musicVolume = nameMusic.volume;
    audioSettings.musicMuted = musicMuted;

    if (!Number.isFinite(Number(audioSettings.sfxVolume))) {
      audioSettings.sfxVolume = 0.7;
    }

    if (typeof audioSettings.sfxMuted !== "boolean") {
      audioSettings.sfxMuted = false;
    }

    localStorage.setItem(
      AUDIO_KEY,
      JSON.stringify(audioSettings)
    );

    localStorage.setItem(
      "tobiasMusic",
      musicMuted ? "off" : "on"
    );
  }

  function renderSoundState() {
    nameSoundToggle.classList.toggle(
      "off",
      musicMuted
    );

    nameSoundIcon.textContent =
      musicMuted ? "×" : "♪";

    nameSoundToggle.setAttribute(
      "aria-label",
      musicMuted
        ? "Ligar música"
        : "Desligar música"
    );
  }

  async function startMusic() {
    if (musicMuted) return;

    try {
      await nameMusic.play();
      audioUnlocked = true;
    } catch {
      // The first user gesture below unlocks audio when needed.
    }
  }

  nameMusic.addEventListener(
    "loadedmetadata",
    () => {
      restoreMusicPosition();
      startMusic();
    }
  );

  nameMusic.addEventListener(
    "timeupdate",
    rememberMusicPosition
  );

  nameSoundToggle.addEventListener(
    "click",
    async event => {
      event.preventDefault();
      event.stopPropagation();

      musicMuted = !musicMuted;
      nameMusic.muted = musicMuted;

      persistAudioSettings();
      renderSoundState();

      if (!musicMuted) {
        await startMusic();
      }
    }
  );

  document.addEventListener(
    "pointerdown",
    () => {
      if (!musicMuted && !audioUnlocked) {
        startMusic();
      }
    },
    { passive: true }
  );

  window.addEventListener("pageshow", startMusic);
  window.addEventListener("focus", startMusic);

  document.addEventListener(
    "visibilitychange",
    () => {
      if (!document.hidden) {
        startMusic();
      }
    }
  );

  // ----------------------------------------------------------
  // Name flow
  // ----------------------------------------------------------
  function setBusy(busy) {
    input.disabled = busy;
    submitButton.disabled = busy;
    acceptSuggested.disabled = busy;
    retryName.disabled = busy;

    submitButton.textContent =
      busy ? "VERIFICANDO..." : "CONFIRMAR";
  }

  function setStatus(message, error = false) {
    statusEl.textContent = message || "";
    statusEl.classList.toggle("error", error);
  }

  function hideSuggestion() {
    box.classList.remove("visible");
    suggestion = "";
    suggestedNameEl.textContent = "";
  }

  function showSuggestion(name) {
    suggestion = name;
    suggestedNameEl.textContent = name;
    box.classList.add("visible");
  }

  function enterGame(name) {
    rememberMusicPosition();
    TobiasSave.create(name);

    /*
      replace() removes nome.html from the history stack.
      Before:
          index -> nome -> jogo
      After replacement:
          index -> jogo

      Therefore Back from the game returns to index.html.
    */
    window.location.replace("jogo.html");
  }

  async function claim(name) {
    const ok =
      await TobiasNameRegistry.claim(name);

    if (ok) {
      enterGame(name);
      return true;
    }

    return false;
  }

  async function processName(raw) {
    const name =
      TobiasNameRegistry.cleanName(raw);

    const validation =
      TobiasNameRegistry.validate(name);

    hideSuggestion();

    if (validation) {
      setStatus(validation, true);
      input.focus();
      return;
    }

    baseName = name;
    setBusy(true);
    setStatus("Verificando disponibilidade...");

    try {
      const suggested =
        await TobiasNameRegistry.suggest(name);

      if (
        TobiasNameRegistry.keyOf(suggested) ===
        TobiasNameRegistry.keyOf(name)
      ) {
        if (!(await claim(name))) {
          const next =
            await TobiasNameRegistry.suggest(name);

          showSuggestion(next);
          setStatus("");
        }
      } else {
        showSuggestion(suggested);
        setStatus("");
      }
    } catch (error) {
      console.error(error);

      setStatus(
        error.message ||
          "Não foi possível verificar o nome.",
        true
      );
    } finally {
      setBusy(false);
    }
  }

  form.addEventListener(
    "submit",
    event => {
      event.preventDefault();
      processName(input.value);
    }
  );

  acceptSuggested.addEventListener(
    "click",
    async () => {
      if (!suggestion) return;

      setBusy(true);
      setStatus("Registrando nome...");

      try {
        if (!(await claim(suggestion))) {
          const next =
            await TobiasNameRegistry.suggest(baseName);

          showSuggestion(next);

          setStatus(
            "Esse nome acabou de ser escolhido. Tenho outra opção:"
          );
        }
      } catch (error) {
        setStatus(
          error.message ||
            "Não foi possível registrar o nome.",
          true
        );
      } finally {
        setBusy(false);
      }
    }
  );

  retryName.addEventListener(
    "click",
    () => {
      hideSuggestion();
      setStatus("");
      input.disabled = false;
      input.value = "";
      input.focus();
    }
  );

  input.addEventListener(
    "input",
    () => {
      if (box.classList.contains("visible")) {
        hideSuggestion();
      }

      setStatus("");
    }
  );

  renderSoundState();
  startMusic();

  setTimeout(
    () => input.focus(),
    250
  );
})();
