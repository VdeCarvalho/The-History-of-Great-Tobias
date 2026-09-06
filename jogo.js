(() => {
  const save = window.TobiasSave ? TobiasSave.load() : null;

  if (!save) {
    window.location.replace("nome.html");
    return;
  }

  TobiasSave.initializeTestInventory();

  const AUDIO_KEY = "tobias_audio_settings_v1";

  const playerChip = document.getElementById("playerChip");

  const settingsToggle = document.getElementById("settingsToggle");
  const discoveriesToggle = document.getElementById("discoveriesToggle");
  const equipmentToggle = document.getElementById("equipmentToggle");
  const inventoryToggle = document.getElementById("inventoryToggle");

  const settingsPanel = document.getElementById("settingsPanel");
  const discoveriesPanel = document.getElementById("discoveriesPanel");
  const equipmentPanel = document.getElementById("equipmentPanel");
  const inventoryPanel = document.getElementById("inventoryPanel");

  const gameMusic = document.getElementById("gameMusic");
  const uiClickSound = document.getElementById("uiClickSound");
  const closeSettings = document.getElementById("closeSettings");

  const musicSlider = document.getElementById("musicVolume");
  const sfxSlider = document.getElementById("sfxVolume");
  const musicValue = document.getElementById("musicValue");
  const sfxValue = document.getElementById("sfxValue");
  const musicMute = document.getElementById("musicMute");
  const sfxMute = document.getElementById("sfxMute");

  const deleteButton = document.getElementById("deleteProgress");
  const dialogOne = document.getElementById("deleteDialogOne");
  const dialogTwo = document.getElementById("deleteDialogTwo");
  const noOne = document.getElementById("deleteNoOne");
  const yesOne = document.getElementById("deleteYesOne");
  const noTwo = document.getElementById("deleteNoTwo");
  const yesTwo = document.getElementById("deleteYesTwo");

  const inventoryGrid = document.getElementById("inventoryGrid");
  const closeInventory = document.getElementById("closeInventory");

  const itemDetailPanel = document.getElementById("itemDetailPanel");
  const detailIcon = document.getElementById("detailIcon");
  const detailName = document.getElementById("detailName");
  const detailType = document.getElementById("detailType");
  const detailDescription = document.getElementById("detailDescription");
  const detailCrafting = document.getElementById("detailCrafting");
  const detailQuantity = document.getElementById("detailQuantity");
  const equipItem = document.getElementById("equipItem");
  const discardItem = document.getElementById("discardItem");
  const closeItemDetail = document.getElementById("closeItemDetail");

  const discardDialog = document.getElementById("discardDialog");
  const discardQuestion = document.getElementById("discardQuestion");
  const discardNo = document.getElementById("discardNo");
  const discardYes = document.getElementById("discardYes");

  const allPanels = [
    settingsPanel,
    discoveriesPanel,
    equipmentPanel,
    inventoryPanel,
    itemDetailPanel
  ];

  let selectedInventoryIndex = null;

  // ----------------------------------------------------------
  // Player identity
  // ----------------------------------------------------------
  playerChip.textContent = save.playerName;
  playerChip.title = `Jogador: ${save.playerName}`;

  // ----------------------------------------------------------
  // Generic panel helpers
  // ----------------------------------------------------------
  function hidePanel(panel) {
    if (!panel) return;
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
  }

  function showPanel(panel) {
    if (!panel) return;

    allPanels.forEach(p => {
      if (p !== panel) hidePanel(p);
    });

    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
  }

  function closeDanger(dialog) {
    if (!dialog) return;
    dialog.classList.remove("open");
    dialog.setAttribute("aria-hidden", "true");
  }

  function openDanger(dialog) {
    if (!dialog) return;
    dialog.classList.add("open");
    dialog.setAttribute("aria-hidden", "false");
  }

  discoveriesToggle.addEventListener("click", () => {
    showPanel(discoveriesPanel);
  });

  equipmentToggle.addEventListener("click", () => {
    showPanel(equipmentPanel);
  });

  inventoryToggle.addEventListener("click", () => {
    renderInventory();
    showPanel(inventoryPanel);
  });

  settingsToggle.addEventListener("click", () => {
    showPanel(settingsPanel);
  });

  document.querySelectorAll("[data-close-panel]").forEach(button => {
    button.addEventListener("click", () => {
      hidePanel(
        document.getElementById(
          button.dataset.closePanel
        )
      );
    });
  });

  closeInventory.addEventListener("click", () => {
    hidePanel(inventoryPanel);
  });

  closeSettings.addEventListener("click", () => {
    hidePanel(settingsPanel);
    closeDanger(dialogOne);
    closeDanger(dialogTwo);
  });

  // ----------------------------------------------------------
  // Audio settings
  // ----------------------------------------------------------
  const defaultAudio = {
    musicVolume: 0.42,
    musicMuted: false,
    sfxVolume: 0.70,
    sfxMuted: false
  };

  function readAudioSettings() {
    try {
      const stored = JSON.parse(
        localStorage.getItem(AUDIO_KEY) || "{}"
      );

      return {
        musicVolume:
          Number.isFinite(Number(stored.musicVolume))
            ? Math.max(0, Math.min(1, Number(stored.musicVolume)))
            : defaultAudio.musicVolume,

        musicMuted:
          typeof stored.musicMuted === "boolean"
            ? stored.musicMuted
            : defaultAudio.musicMuted,

        sfxVolume:
          Number.isFinite(Number(stored.sfxVolume))
            ? Math.max(0, Math.min(1, Number(stored.sfxVolume)))
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

    musicSlider.value = Math.round(audio.musicVolume * 100);
    sfxSlider.value = Math.round(audio.sfxVolume * 100);

    musicValue.textContent = `${musicSlider.value}%`;
    sfxValue.textContent = `${sfxSlider.value}%`;

    musicMute.querySelector(".audio-icon").textContent =
      audio.musicMuted ? "🔇" : "🔊";

    sfxMute.querySelector(".audio-icon").textContent =
      audio.sfxMuted ? "🔇" : "🔊";

    musicMute.classList.toggle("muted", audio.musicMuted);
    sfxMute.classList.toggle("muted", audio.sfxMuted);
  }

  function resumeMusic() {
    if (!audio.musicMuted) {
      gameMusic.play().catch(() => {});
    }
  }

  musicSlider.addEventListener("input", () => {
    audio.musicVolume = Number(musicSlider.value) / 100;
    musicValue.textContent = `${musicSlider.value}%`;
    gameMusic.volume = audio.musicVolume;
    saveAudioSettings();
  });

  sfxSlider.addEventListener("input", () => {
    audio.sfxVolume = Number(sfxSlider.value) / 100;
    sfxValue.textContent = `${sfxSlider.value}%`;
    saveAudioSettings();
  });

  musicMute.addEventListener("click", async () => {
    audio.musicMuted = !audio.musicMuted;
    applyAudioSettings();
    saveAudioSettings();

    if (!audio.musicMuted) {
      await gameMusic.play().catch(() => {});
    }
  });

  sfxMute.addEventListener("click", () => {
    audio.sfxMuted = !audio.sfxMuted;
    applyAudioSettings();
    saveAudioSettings();
  });

  // ----------------------------------------------------------
  // Inventory: 100 slots, 4 columns x 25 rows
  // ----------------------------------------------------------
  function renderInventory() {
    const inventory = TobiasSave.loadInventory();

    inventoryGrid.innerHTML = "";

    for (let slotIndex = 0; slotIndex < 100; slotIndex++) {
      const slot = document.createElement("button");
      slot.type = "button";
      slot.className = "inventory-slot";
      slot.dataset.slotIndex = String(slotIndex);

      const item = inventory[slotIndex];

      if (item) {
        slot.classList.add("occupied");

        const icon = document.createElement("span");
        icon.className = "slot-icon";
        icon.textContent = item.icon || "◆";

        const quantity = document.createElement("span");
        quantity.className = "slot-quantity";
        quantity.textContent =
          Number(item.quantity || 0).toLocaleString("pt-BR");

        slot.appendChild(icon);
        slot.appendChild(quantity);

        slot.setAttribute(
          "aria-label",
          `${item.name}, quantidade ${item.quantity}`
        );

        slot.addEventListener("click", () => {
          openItemDetail(slotIndex);
        });
      } else {
        slot.disabled = true;
        slot.setAttribute(
          "aria-label",
          `Slot ${slotIndex + 1} vazio`
        );
      }

      inventoryGrid.appendChild(slot);
    }
  }

  function openItemDetail(index) {
    const inventory = TobiasSave.loadInventory();
    const item = inventory[index];

    if (!item) return;

    selectedInventoryIndex = index;

    detailIcon.textContent = item.icon || "◆";
    detailName.textContent = item.name;
    detailType.textContent = item.type;
    detailDescription.textContent = item.description || "Descrição a definir.";
    detailCrafting.textContent =
      item.craftable
        ? `Materiais necessários: ${item.crafting || "a definir"}`
        : "Item não fabricável";

    detailQuantity.textContent =
      `Quantidade: ${Number(item.quantity || 0).toLocaleString("pt-BR")}`;

    equipItem.style.display =
      item.equippable ? "" : "none";

    document
      .getElementById("itemActions")
      .classList.toggle(
        "single-action",
        !item.equippable
      );

    showPanel(itemDetailPanel);
  }

  closeItemDetail.addEventListener("click", () => {
    hidePanel(itemDetailPanel);
    renderInventory();
    showPanel(inventoryPanel);
  });

  equipItem.addEventListener("click", () => {
    if (selectedInventoryIndex === null) return;

    const inventory = TobiasSave.loadInventory();
    const item = inventory[selectedInventoryIndex];

    if (!item || !item.equippable) return;

    const equipment = TobiasSave.loadEquipment();

    // Prototype: one generic equipment field until equipment slots
    // are defined later.
    equipment.main = {
      ...item,
      quantity: 1
    };

    TobiasSave.saveEquipment(equipment);

    // Equipment leaves the inventory when equipped.
    if (item.quantity > 1) {
      item.quantity -= 1;
    } else {
      inventory.splice(selectedInventoryIndex, 1);
    }

    TobiasSave.saveInventory(inventory);

    selectedInventoryIndex = null;
    hidePanel(itemDetailPanel);
    renderInventory();
    showPanel(inventoryPanel);
  });

  discardItem.addEventListener("click", () => {
    if (selectedInventoryIndex === null) return;

    const inventory = TobiasSave.loadInventory();
    const item = inventory[selectedInventoryIndex];

    if (!item) return;

    discardQuestion.textContent =
      "Ao confirmar, todas as unidades desse item serão descartadas. Você tem certeza?";

    openDanger(discardDialog);
  });

  discardNo.addEventListener("click", () => {
    closeDanger(discardDialog);
  });

  discardYes.addEventListener("click", () => {
    if (selectedInventoryIndex === null) {
      closeDanger(discardDialog);
      return;
    }

    const inventory = TobiasSave.loadInventory();
    const item = inventory[selectedInventoryIndex];

    if (item) {
      const remainingInventory =
        inventory.filter(
          slot =>
            !slot ||
            slot.itemId !== item.itemId
        );

      TobiasSave.saveInventory(
        remainingInventory
      );
    }

    selectedInventoryIndex = null;

    closeDanger(discardDialog);
    hidePanel(itemDetailPanel);

    renderInventory();
    showPanel(inventoryPanel);
  });

  // ----------------------------------------------------------
  // Delete all progress + release username
  // ----------------------------------------------------------
  deleteButton.addEventListener("click", () => {
    openDanger(dialogOne);
  });

  noOne.addEventListener("click", () => {
    closeDanger(dialogOne);
  });

  yesOne.addEventListener("click", () => {
    closeDanger(dialogOne);
    openDanger(dialogTwo);
  });

  noTwo.addEventListener("click", () => {
    closeDanger(dialogTwo);
  });

  yesTwo.addEventListener("click", async () => {
    const currentSave = TobiasSave.load();

    yesTwo.disabled = true;
    yesTwo.textContent = "APAGANDO...";

    try {
      if (
        currentSave?.playerName &&
        window.TobiasNameRegistry
      ) {
        await TobiasNameRegistry.release(
          currentSave.playerName
        );
      }

      TobiasSave.clearAllProgress();

      window.location.replace("index.html");
    } catch (error) {
      console.error(error);

      yesTwo.disabled = false;
      yesTwo.textContent = "SIM, APAGAR TUDO";

      alert(
        "Não foi possível liberar o nome e apagar o progresso. Tente novamente."
      );
    }
  });

  // ----------------------------------------------------------
  // UI interaction sound
  // ----------------------------------------------------------
  function playUiClick() {
    if (!uiClickSound) return;
    if (audio.sfxMuted) return;

    uiClickSound.volume =
      Math.max(
        0,
        Math.min(1, audio.sfxVolume)
      );

    try {
      uiClickSound.currentTime = 0;
    } catch {}

    uiClickSound.play().catch(() => {});
  }

  /*
    Play the interface sound only for real interactive controls,
    not for arbitrary taps on the screen.
  */
  document.addEventListener(
    "click",
    event => {
      const control = event.target.closest(
        "button, a[href], input[type='range']"
      );

      if (!control) return;

      // Range sliders already provide continuous tactile interaction,
      // so avoid spamming the sound while dragging them.
      if (
        control.matches("input[type='range']")
      ) {
        return;
      }

      playUiClick();
    },
    true
  );

  // ----------------------------------------------------------
  // Lifecycle
  // ----------------------------------------------------------
  window.addEventListener("pageshow", resumeMusic);
  window.addEventListener("focus", resumeMusic);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) resumeMusic();
  });

  document.addEventListener(
    "pointerdown",
    () => {
      if (!audio.musicMuted) {
        gameMusic.play().catch(() => {});
      }
    },
    { passive: true }
  );

  applyAudioSettings();
  resumeMusic();
  renderInventory();
})();
