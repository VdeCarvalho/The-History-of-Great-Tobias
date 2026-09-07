(() => {
  const save = window.TobiasSave ? TobiasSave.load() : null;

  if (!save) {
    window.location.replace("nome.html");
    return;
  }

  TobiasSave.initializeTestInventory();

  const AUDIO_KEY = "tobias_audio_settings_v1";

  const playerChip = document.getElementById("playerChip");

  const chatToggle = document.getElementById("chatToggle");
  const chatPanel = document.getElementById("chatPanel");
  const closeChat = document.getElementById("closeChat");
  const chatMessages = document.getElementById("chatMessages");
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");
  const chatSend = document.getElementById("chatSend");
  const chatStatus = document.getElementById("chatStatus");


  const settingsToggle = document.getElementById("settingsToggle");
  const discoveriesToggle = document.getElementById("discoveriesToggle");
  const equipmentToggle = document.getElementById("equipmentToggle");
  const inventoryToggle = document.getElementById("inventoryToggle");

  const settingsPanel = document.getElementById("settingsPanel");
  const discoveriesPanel = document.getElementById("discoveriesPanel");
  const equipmentPanel = document.getElementById("equipmentPanel");
  const inventoryPanel = document.getElementById("inventoryPanel");

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
    itemDetailPanel,
    chatPanel
  ];

  let selectedInventoryIndex = null;

  // ----------------------------------------------------------
  // Player identity
  // ----------------------------------------------------------
  playerChip.textContent = save.playerName;
  playerChip.title = `Jogador: ${save.playerName}`;

  // ----------------------------------------------------------
  // GLOBAL CHAT — SUPABASE REALTIME
  // ----------------------------------------------------------
  const CHAT_LOCAL_KEY = "tobias_chat_local_prototype_v1";
  const backend = window.TOBIAS_BACKEND || {};

  let realtimeClient = null;
  let realtimeChannel = null;
  let currentChatMessages = [];

  function backendPublicKey() {
    return (
      backend.supabasePublishableKey ||
      backend.supabaseAnonKey ||
      ""
    );
  }

  function chatUsesGlobalBackend() {
    return (
      backend.mode === "supabase" &&
      Boolean(backend.supabaseUrl) &&
      Boolean(backendPublicKey()) &&
      Boolean(window.supabase?.createClient)
    );
  }

  function getRealtimeClient() {
    if (!chatUsesGlobalBackend()) {
      return null;
    }

    if (!realtimeClient) {
      realtimeClient =
        window.supabase.createClient(
          backend.supabaseUrl,
          backendPublicKey(),
          {
            realtime: {
              params: {
                eventsPerSecond: 20
              }
            }
          }
        );
    }

    return realtimeClient;
  }

  function loadLocalChat() {
    try {
      const value =
        JSON.parse(
          localStorage.getItem(CHAT_LOCAL_KEY) || "[]"
        );

      return Array.isArray(value)
        ? value.slice(-1000)
        : [];
    } catch {
      return [];
    }
  }

  function saveLocalChat(messages) {
    localStorage.setItem(
      CHAT_LOCAL_KEY,
      JSON.stringify(messages.slice(-1000))
    );
  }

  async function fetchChatMessages() {
    if (!chatUsesGlobalBackend()) {
      return loadLocalChat();
    }

    const client = getRealtimeClient();

    const {
      data,
      error
    } = await client
      .from("chat_messages")
      .select("id,username,body,created_at")
      .order("id", { ascending: false })
      .limit(1000);

    if (error) {
      throw error;
    }

    return (data || []).reverse();
  }

  async function sendChatMessage(body) {
    const cleaned =
      String(body || "")
        .trim()
        .replace(/\s+/g, " ");

    if (!cleaned) return false;

    if (!chatUsesGlobalBackend()) {
      const messages = loadLocalChat();

      messages.push({
        id: Date.now(),
        username: save.playerName,
        body: cleaned,
        created_at: new Date().toISOString()
      });

      saveLocalChat(messages);

      currentChatMessages =
        messages.slice(-1000);

      renderChat(currentChatMessages, true);

      return true;
    }

    const client = getRealtimeClient();

    const {
      error
    } = await client
      .from("chat_messages")
      .insert({
        username: save.playerName,
        username_key:
          String(save.playerName)
            .trim()
            .toLocaleLowerCase("pt-BR"),
        body: cleaned
      });

    if (error) {
      throw error;
    }

    /*
      Do not append manually here.
      Supabase Realtime will deliver the INSERT to every connected
      device, including the sender.
    */
    return true;
  }

  function formatChatTime(value) {
    try {
      return new Intl.DateTimeFormat(
        "pt-BR",
        {
          hour: "2-digit",
          minute: "2-digit"
        }
      ).format(new Date(value));
    } catch {
      return "";
    }
  }

  function renderChat(messages, forceBottom = false) {
    const nearBottom =
      chatMessages.scrollHeight -
        chatMessages.scrollTop -
        chatMessages.clientHeight
        < 80;

    chatMessages.innerHTML = "";

    if (!messages.length) {
      const empty =
        document.createElement("div");

      empty.className = "chat-empty";

      empty.textContent =
        chatUsesGlobalBackend()
          ? "Ainda não há mensagens."
          : "Chat local de teste vazio.";

      chatMessages.appendChild(empty);
    } else {
      for (const message of messages) {
        const row =
          document.createElement("article");

        row.className = "chat-message";

        if (
          String(message.username) ===
          String(save.playerName)
        ) {
          row.classList.add("mine");
        }

        const meta =
          document.createElement("div");

        meta.className =
          "chat-message-meta";

        const user =
          document.createElement("strong");

        user.textContent =
          message.username || "Jogador";

        const time =
          document.createElement("time");

        time.textContent =
          formatChatTime(
            message.created_at
          );

        meta.appendChild(user);
        meta.appendChild(time);

        const body =
          document.createElement("p");

        body.textContent =
          message.body;

        row.appendChild(meta);
        row.appendChild(body);
        chatMessages.appendChild(row);
      }
    }

    if (
      forceBottom ||
      nearBottom ||
      messages.length <= 3
    ) {
      chatMessages.scrollTop =
        chatMessages.scrollHeight;
    }
  }

  function appendRealtimeMessage(message) {
    if (!message?.id) return;

    const alreadyExists =
      currentChatMessages.some(
        existing =>
          String(existing.id) ===
          String(message.id)
      );

    if (alreadyExists) return;

    currentChatMessages.push(message);

    if (currentChatMessages.length > 1000) {
      currentChatMessages =
        currentChatMessages.slice(-1000);
    }

    renderChat(
      currentChatMessages,
      true
    );
  }

  async function disconnectRealtimeChat() {
    if (
      realtimeClient &&
      realtimeChannel
    ) {
      try {
        await realtimeClient
          .removeChannel(
            realtimeChannel
          );
      } catch {}
    }

    realtimeChannel = null;
  }

  async function connectRealtimeChat() {
    await disconnectRealtimeChat();

    if (!chatUsesGlobalBackend()) {
      chatStatus.textContent =
        "MODO LOCAL · CONFIGURE O SUPABASE";

      chatStatus.classList.remove(
        "error"
      );

      return;
    }

    const client =
      getRealtimeClient();

    chatStatus.textContent =
      "CONECTANDO...";

    chatStatus.classList.remove(
      "error"
    );

    realtimeChannel =
      client
        .channel(
          "tobias-global-chat"
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "chat_messages"
          },
          payload => {
            appendRealtimeMessage(
              payload.new
            );

            chatStatus.textContent =
              "GLOBAL · TEMPO REAL";

            chatStatus.classList.remove(
              "error"
            );
          }
        )
        .subscribe(status => {
          if (
            status ===
            "SUBSCRIBED"
          ) {
            chatStatus.textContent =
              "GLOBAL · TEMPO REAL";

            chatStatus.classList.remove(
              "error"
            );
          } else if (
            status ===
              "CHANNEL_ERROR" ||
            status ===
              "TIMED_OUT"
          ) {
            chatStatus.textContent =
              "ERRO NA CONEXÃO";

            chatStatus.classList.add(
              "error"
            );
          }
        });
  }

  async function openChat() {
    showPanel(chatPanel);

    try {
      currentChatMessages =
        await fetchChatMessages();

      renderChat(
        currentChatMessages,
        true
      );

      await connectRealtimeChat();
    } catch (error) {
      console.error(error);

      chatStatus.textContent =
        "CHAT INDISPONÍVEL";

      chatStatus.classList.add(
        "error"
      );
    }

    /*
      Não focamos o campo automaticamente.
      O jogador pode abrir o chat apenas para acompanhar as mensagens.
      O teclado só aparece quando ele toca no campo de mensagem.
    */
  }

  // ----------------------------------------------------------
  // MOBILE KEYBOARD / VISUAL VIEWPORT
  // ----------------------------------------------------------
  function updateChatVisibleViewport() {
    const viewport =
      window.visualViewport;

    const visibleHeight =
      viewport
        ? viewport.height
        : window.innerHeight;

    document.documentElement.style.setProperty(
      "--tobias-visible-height",
      `${Math.round(visibleHeight)}px`
    );
  }

  function enterChatKeyboardMode() {
    document.body.classList.add(
      "chat-keyboard-open"
    );

    updateChatVisibleViewport();

    requestAnimationFrame(
      updateChatVisibleViewport
    );

    setTimeout(
      updateChatVisibleViewport,
      120
    );

    setTimeout(
      updateChatVisibleViewport,
      350
    );
  }

  function leaveChatKeyboardMode() {
    /*
      Small delay avoids layout flashing when the user taps ENVIAR
      and focus briefly transitions between controls.
    */
    setTimeout(
      () => {
        if (
          document.activeElement !==
          chatInput
        ) {
          document.body.classList.remove(
            "chat-keyboard-open"
          );

          document.documentElement.style.removeProperty(
            "--tobias-visible-height"
          );
        }
      },
      120
    );
  }

  chatInput.addEventListener(
    "focus",
    enterChatKeyboardMode
  );

  chatInput.addEventListener(
    "blur",
    leaveChatKeyboardMode
  );

  if (window.visualViewport) {
    window.visualViewport.addEventListener(
      "resize",
      () => {
        if (
          document.body.classList.contains(
            "chat-keyboard-open"
          )
        ) {
          updateChatVisibleViewport();
        }
      }
    );

    window.visualViewport.addEventListener(
      "scroll",
      () => {
        if (
          document.body.classList.contains(
            "chat-keyboard-open"
          )
        ) {
          updateChatVisibleViewport();
        }
      }
    );
  }

  chatToggle.addEventListener(
    "click",
    openChat
  );

  closeChat.addEventListener(
    "click",
    async () => {
      if (
        document.activeElement ===
        chatInput
      ) {
        chatInput.blur();
      }

      document.body.classList.remove(
        "chat-keyboard-open"
      );

      document.documentElement.style.removeProperty(
        "--tobias-visible-height"
      );

      await disconnectRealtimeChat();
      hidePanel(chatPanel);
    }
  );

  chatForm.addEventListener(
    "submit",
    async event => {
      event.preventDefault();

      const body =
        chatInput.value.trim();

      if (!body) return;

      chatSend.disabled = true;

      try {
        await sendChatMessage(body);

        chatInput.value = "";
        chatInput.focus();
      } catch (error) {
        console.error(error);

        chatStatus.textContent =
          "NÃO FOI POSSÍVEL ENVIAR";

        chatStatus.classList.add(
          "error"
        );
      } finally {
        chatSend.disabled = false;
      }
    }
  );

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

    if (
      panel !== chatPanel &&
      chatPanel.classList.contains("open")
    ) {
      disconnectRealtimeChat();
    }

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

  musicSlider.addEventListener("input", () => {
    audio.musicVolume = Number(musicSlider.value) / 100;
    musicValue.textContent = `${musicSlider.value}%`;
    saveAudioSettings();
  });

  sfxSlider.addEventListener("input", () => {
    audio.sfxVolume = Number(sfxSlider.value) / 100;
    sfxValue.textContent = `${sfxSlider.value}%`;
    saveAudioSettings();
  });

  musicMute.addEventListener("click", () => {
    /*
      This preference now affects ONLY the title-page music.
      No background music is played on jogo.html.
    */
    audio.musicMuted = !audio.musicMuted;
    applyAudioSettings();
    saveAudioSettings();
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
  window.addEventListener(
    "pagehide",
    () => {
      disconnectRealtimeChat();
    }
  );

  applyAudioSettings();
  renderInventory();
})();
