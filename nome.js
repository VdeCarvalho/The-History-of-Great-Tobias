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
  const uiClickSound = document.getElementById("uiClickSound");

  const AUDIO_KEY = "tobias_audio_settings_v1";
  const MUSIC_POSITION_KEY = "tobias_music_position_v1";

  let baseName = "";
  let suggestion = "";

  /*
    Once a save exists, name creation cannot be used again.
  */
  if (window.TobiasSave && TobiasSave.exists()) {
    window.location.replace("index.html");
    return;
  }

  // ----------------------------------------------------------
  // Background music — continues from index.html
  // ----------------------------------------------------------
  function readMusicSettings() {
    try {
      return JSON.parse(
        localStorage.getItem(AUDIO_KEY) || "{}"
      ) || {};
    } catch {
      return {};
    }
  }

  const musicSettings = readMusicSettings();

  if (nameMusic) {
    nameMusic.volume =
      Number.isFinite(Number(musicSettings.musicVolume))
        ? Math.max(
            0,
            Math.min(
              1,
              Number(musicSettings.musicVolume)
            )
          )
        : 0.42;

    nameMusic.muted =
      typeof musicSettings.musicMuted === "boolean"
        ? musicSettings.musicMuted
        : localStorage.getItem("tobiasMusic") === "off";
  }

  function restoreMusicPosition() {
    if (!nameMusic) return;

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
    if (!nameMusic) return;

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

  async function startNameMusic() {
    if (!nameMusic || nameMusic.muted) return;

    try {
      await nameMusic.play();
    } catch {
      // Mobile browser may require the first user gesture.
    }
  }

  if (nameMusic) {
    nameMusic.addEventListener(
      "loadedmetadata",
      () => {
        restoreMusicPosition();
        startNameMusic();
      }
    );

    nameMusic.addEventListener(
      "timeupdate",
      rememberMusicPosition
    );

    window.addEventListener(
      "pageshow",
      startNameMusic
    );

    window.addEventListener(
      "focus",
      startNameMusic
    );

    document.addEventListener(
      "visibilitychange",
      () => {
        if (!document.hidden) {
          startNameMusic();
        }
      }
    );

    document.addEventListener(
      "pointerdown",
      startNameMusic,
      {
        passive: true,
        once: true
      }
    );

    startNameMusic();
  }

  // ----------------------------------------------------------
  // UI SFX
  // ----------------------------------------------------------
  function playUiClick() {
    if (!uiClickSound) return;

    let settings = {};

    try {
      settings =
        JSON.parse(
          localStorage.getItem(AUDIO_KEY) || "{}"
        ) || {};
    } catch {}

    if (settings.sfxMuted === true) return;

    uiClickSound.volume =
      Number.isFinite(Number(settings.sfxVolume))
        ? Math.max(0, Math.min(1, Number(settings.sfxVolume)))
        : 0.7;

    try {
      uiClickSound.currentTime = 0;
    } catch {}

    uiClickSound.play().catch(() => {});
  }

  document.addEventListener(
    "click",
    event => {
      const control =
        event.target.closest("button, a[href]");

      if (control) {
        playUiClick();
      }
    },
    true
  );

  // ----------------------------------------------------------
  // Name creation
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
      Removes nome.html from browser history:
        index -> jogo
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

  setTimeout(
    () => input.focus(),
    250
  );
})();
