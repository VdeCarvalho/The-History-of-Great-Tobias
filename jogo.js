
(() => {
  const save = window.TobiasSave ? TobiasSave.load() : null;

  if (!save) {
    window.location.replace("nome.html");
    return;
  }

  TobiasSave.initializeTestInventory();

  const AUDIO_KEY = "tobias_audio_settings_v1";
  const GAME_STATE_KEY = "tobias_game_state_v1";
  const constructionMode = document.body.classList.contains("construction-page");
  const urlParams = new URLSearchParams(window.location.search);
  const returningFromConstruction =
    urlParams.get("from") === "construction" ||
    sessionStorage.getItem("tobias_return_from_construction") === "1";

  if (returningFromConstruction) {
    try { sessionStorage.removeItem("tobias_return_from_construction"); } catch {}
  }

  const gameplayStage = document.getElementById("gameplayStage");
  const playerChip = document.getElementById("playerChip");

  const roomCanvas = document.getElementById("roomCanvas");
  const roomExitHint = document.getElementById("roomExitHint");
  const pointClickHint = document.getElementById("pointClickHint");

  const chatToggle = document.getElementById("chatToggle");
  const chatPanel = document.getElementById("chatPanel");
  const closeChat = document.getElementById("closeChat");
  const chatMessages = document.getElementById("chatMessages");
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");
  const chatSend = document.getElementById("chatSend");
  const chatStatus = document.getElementById("chatStatus");
  const tobiasEmojiToggle = document.getElementById("tobiasEmojiToggle");
  const tobiasEmojiPicker = document.getElementById("tobiasEmojiPicker");
  const chatEmojiDraft = document.getElementById("chatEmojiDraft");

  const settingsToggle = document.getElementById("settingsToggle");
  const discoveriesToggle = document.getElementById("discoveriesToggle");
  const equipmentToggle = document.getElementById("equipmentToggle");
  const inventoryToggle = document.getElementById("inventoryToggle");

  const settingsPanel = document.getElementById("settingsPanel");
  const discoveriesPanel = document.getElementById("discoveriesPanel");
  const equipmentPanel = document.getElementById("equipmentPanel");
  const inventoryPanel = document.getElementById("inventoryPanel");

  const uiClickSound = document.getElementById("uiClickSound");
  const footstepSound1 = document.getElementById("footstepSound1");
  const footstepSound2 = document.getElementById("footstepSound2");
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
  let chatRecoveryTimer = null;

  const CHAT_USER_COLOR_KEY = "tobias_chat_username_colors_v3";
  const CHAT_USER_COLORS = [
    "#F2C14E", "#43B8FF", "#F26688", "#55D486",
    "#A88CFF", "#FF934A", "#31C6C0", "#E16DCA",
    "#6F9CFF", "#D8D14B", "#42CDA0", "#F1785B",
    "#8D7BFF", "#39BEE1", "#DA9049", "#E66E98",
    "#86C857", "#C57CFF", "#55B489", "#E7A84A",
    "#58A6E6", "#D76565", "#74C66D", "#B18AE7",
    "#E48939", "#47B6A5", "#D773B3", "#798FE8",
    "#C1B748", "#59BD74", "#D7764E", "#9877D4"
  ];

  function normalizeChatUsername(username) {
    return String(username || "").trim().toLocaleLowerCase("pt-BR");
  }

  function loadChatUserColorMap() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CHAT_USER_COLOR_KEY) || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  let chatUserColorMap = loadChatUserColorMap();

  function saveChatUserColorMap() {
    try {
      localStorage.setItem(CHAT_USER_COLOR_KEY, JSON.stringify(chatUserColorMap));
    } catch {}
  }

  function ensureChatUserColors(messages) {
    const usedColors = new Set(Object.values(chatUserColorMap));

    for (const message of messages) {
      const key = normalizeChatUsername(message.username);
      if (!key || chatUserColorMap[key]) continue;

      let chosenColor = null;
      for (const candidate of CHAT_USER_COLORS) {
        if (!usedColors.has(candidate)) {
          chosenColor = candidate;
          break;
        }
      }

      if (!chosenColor) {
        const index = Object.keys(chatUserColorMap).length % CHAT_USER_COLORS.length;
        chosenColor = CHAT_USER_COLORS[index];
      }

      chatUserColorMap[key] = chosenColor;
      usedColors.add(chosenColor);
    }

    saveChatUserColorMap();
  }

  function colorForUsername(username) {
    const key = normalizeChatUsername(username);
    if (!chatUserColorMap[key]) ensureChatUserColors([{ username }]);
    return chatUserColorMap[key] || "#F2C14E";
  }

  const TOBIAS_EMOJIS = {
    ":tobias_nervoso:": { src: "tobias_nervoso.png", label: "Tobias nervoso" },
    ":tobias_apaixonado:": { src: "tobias_apaixonado.png", label: "Tobias apaixonado" },
    ":tobias_sorridente:": { src: "tobias_sorridente.png", label: "Tobias sorridente" },
    ":tobias_chorando:": { src: "tobias_chorando.png", label: "Tobias chorando" },
    ":tobias_gargalhada:": { src: "tobias_gargalhada.png", label: "Tobias dando gargalhada" }
  };

  let selectedTobiasEmojis = [];

  function messageEmojiTokens(body) {
    return String(body || "").match(/:tobias_(?:nervoso|apaixonado|sorridente|chorando|gargalhada):/g) || [];
  }

  function messageIsEmojiOnly(body) {
    const stripped = String(body || "")
      .replace(/:tobias_(?:nervoso|apaixonado|sorridente|chorando|gargalhada):/g, "")
      .trim();

    return stripped === "" && messageEmojiTokens(body).length > 0;
  }

  function renderMessageContent(container, body) {
    const source = String(body || "");
    const tokenPattern = /(:tobias_(?:nervoso|apaixonado|sorridente|chorando|gargalhada):)/g;
    const parts = source.split(tokenPattern);

    for (const part of parts) {
      const emoji = TOBIAS_EMOJIS[part];
      if (emoji) {
        const image = document.createElement("img");
        image.className = "chat-custom-emoji";
        image.src = emoji.src;
        image.alt = emoji.label;
        image.title = emoji.label;
        container.appendChild(image);
      } else if (part) {
        container.appendChild(document.createTextNode(part));
      }
    }

    container.classList.toggle("emoji-only", messageIsEmojiOnly(source));
  }

  function renderEmojiDraft() {
    chatEmojiDraft.innerHTML = "";
    if (!selectedTobiasEmojis.length) {
      chatEmojiDraft.hidden = true;
      return;
    }

    chatEmojiDraft.hidden = false;
    selectedTobiasEmojis.forEach((token, index) => {
      const emoji = TOBIAS_EMOJIS[token];
      if (!emoji) return;

      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chat-emoji-draft-chip";
      chip.setAttribute("aria-label", `Remover ${emoji.label}`);

      const image = document.createElement("img");
      image.src = emoji.src;
      image.alt = emoji.label;

      const remove = document.createElement("span");
      remove.textContent = "×";
      remove.setAttribute("aria-hidden", "true");

      chip.appendChild(image);
      chip.appendChild(remove);
      chip.addEventListener("click", () => {
        selectedTobiasEmojis.splice(index, 1);
        renderEmojiDraft();
      });
      chatEmojiDraft.appendChild(chip);
    });
  }

  function closeTobiasEmojiPicker() {
    tobiasEmojiPicker.classList.remove("open");
    tobiasEmojiPicker.setAttribute("aria-hidden", "true");
    tobiasEmojiToggle.setAttribute("aria-expanded", "false");
  }

  function openTobiasEmojiPicker() {
    if (document.activeElement === chatInput) chatInput.blur();
    document.body.classList.remove("chat-keyboard-open");
    document.documentElement.style.removeProperty("--tobias-visible-height");
    tobiasEmojiPicker.classList.add("open");
    tobiasEmojiPicker.setAttribute("aria-hidden", "false");
    tobiasEmojiToggle.setAttribute("aria-expanded", "true");
  }

  function backendPublicKey() {
    return backend.supabasePublishableKey || backend.supabaseAnonKey || "";
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
    if (!chatUsesGlobalBackend()) return null;
    if (!realtimeClient) {
      realtimeClient = window.supabase.createClient(backend.supabaseUrl, backendPublicKey(), {
        realtime: { params: { eventsPerSecond: 20 } }
      });
    }
    return realtimeClient;
  }

  function loadLocalChat() {
    try {
      const value = JSON.parse(localStorage.getItem(CHAT_LOCAL_KEY) || "[]");
      return Array.isArray(value) ? value.slice(-1000) : [];
    } catch {
      return [];
    }
  }

  function saveLocalChat(messages) {
    localStorage.setItem(CHAT_LOCAL_KEY, JSON.stringify(messages.slice(-1000)));
  }

  async function fetchChatMessages() {
    if (!chatUsesGlobalBackend()) return loadLocalChat();

    const client = getRealtimeClient();
    const { data, error } = await client
      .from("chat_messages")
      .select("id,username,body,created_at")
      .order("id", { ascending: false })
      .limit(1000);

    if (error) throw error;
    return (data || []).reverse();
  }

  async function sendChatMessage(body) {
    const cleaned = String(body || "").trim().replace(/\s+/g, " ");
    if (!cleaned) return null;

    if (!chatUsesGlobalBackend()) {
      const message = {
        id: Date.now(),
        username: save.playerName,
        body: cleaned,
        created_at: new Date().toISOString()
      };

      const messages = loadLocalChat();
      messages.push(message);
      saveLocalChat(messages);
      currentChatMessages = messages.slice(-1000);
      renderChat(currentChatMessages, true);
      return message;
    }

    const client = getRealtimeClient();
    const { data, error } = await client
      .from("chat_messages")
      .insert({
        username: save.playerName,
        username_key: String(save.playerName).trim().toLocaleLowerCase("pt-BR"),
        body: cleaned
      })
      .select("id,username,body,created_at")
      .single();

    if (error) throw error;
    if (data) appendRealtimeMessage(data);
    return data || null;
  }

  function formatChatTime(value) {
    try {
      return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
    } catch {
      return "";
    }
  }

  function renderChat(messages, forceBottom = false) {
    ensureChatUserColors(messages);

    const nearBottom =
      chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight < 80;

    chatMessages.innerHTML = "";

    if (!messages.length) {
      const empty = document.createElement("div");
      empty.className = "chat-empty";
      empty.textContent = chatUsesGlobalBackend()
        ? "Ainda não há mensagens."
        : "Chat local de teste vazio.";
      chatMessages.appendChild(empty);
    } else {
      for (const message of messages) {
        const row = document.createElement("article");
        row.className = "chat-message";

        if (String(message.username) === String(save.playerName)) {
          row.classList.add("mine");
        }

        const meta = document.createElement("div");
        meta.className = "chat-message-meta";

        const user = document.createElement("strong");
        user.textContent = message.username || "Jogador";

        const userColor = colorForUsername(message.username);
        user.style.setProperty("color", userColor, "important");
        user.style.setProperty("-webkit-text-fill-color", userColor, "important");
        row.style.setProperty("--chat-user-color", userColor);

        const time = document.createElement("time");
        time.textContent = formatChatTime(message.created_at);

        meta.appendChild(user);
        meta.appendChild(time);

        const body = document.createElement("p");
        renderMessageContent(body, message.body);

        row.appendChild(meta);
        row.appendChild(body);
        chatMessages.appendChild(row);
      }
    }

    if (forceBottom || nearBottom || messages.length <= 3) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  function appendRealtimeMessage(message) {
    if (!message?.id) return;
    const alreadyExists = currentChatMessages.some(existing => String(existing.id) === String(message.id));
    if (alreadyExists) return;

    currentChatMessages.push(message);
    if (currentChatMessages.length > 1000) {
      currentChatMessages = currentChatMessages.slice(-1000);
    }
    renderChat(currentChatMessages, true);
  }

  async function reconcileChatMessages() {
    if (!chatPanel.classList.contains("open")) return;
    try {
      const latest = await fetchChatMessages();
      currentChatMessages = latest.slice(-1000);
      renderChat(currentChatMessages, false);
    } catch (error) {
      console.warn("Chat reconciliation failed:", error);
    }
  }

  function startChatRecovery() {
    stopChatRecovery();
    chatRecoveryTimer = window.setInterval(reconcileChatMessages, 15000);
  }

  function stopChatRecovery() {
    if (chatRecoveryTimer !== null) {
      clearInterval(chatRecoveryTimer);
      chatRecoveryTimer = null;
    }
  }

  async function disconnectRealtimeChat() {
    stopChatRecovery();
    if (realtimeClient && realtimeChannel) {
      try {
        await realtimeClient.removeChannel(realtimeChannel);
      } catch {}
    }
    realtimeChannel = null;
  }

  async function connectRealtimeChat() {
    await disconnectRealtimeChat();

    if (!chatUsesGlobalBackend()) {
      chatStatus.textContent = "MODO LOCAL · CONFIGURE O SUPABASE";
      chatStatus.classList.remove("error");
      return;
    }

    const client = getRealtimeClient();
    chatStatus.textContent = "CONECTANDO...";
    chatStatus.classList.remove("error");

    realtimeChannel = client
      .channel("tobias-global-chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        payload => {
          appendRealtimeMessage(payload.new);
          chatStatus.textContent = "GLOBAL · TEMPO REAL";
          chatStatus.classList.remove("error");
        }
      )
      .subscribe(status => {
        if (status === "SUBSCRIBED") {
          chatStatus.textContent = "GLOBAL · TEMPO REAL";
          chatStatus.classList.remove("error");
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          chatStatus.textContent = "ERRO NA CONEXÃO";
          chatStatus.classList.add("error");
        }
      });
  }

  async function openChat() {
    showPanel(chatPanel);
    try {
      currentChatMessages = await fetchChatMessages();
      renderChat(currentChatMessages, true);
      try {
        await connectRealtimeChat();
      } catch (realtimeError) {
        console.warn("Realtime connection failed:", realtimeError);
      }
      startChatRecovery();
    } catch (error) {
      console.error("Initial chat load failed:", error);
      currentChatMessages = [];
      renderChat(currentChatMessages, true);
      startChatRecovery();
    }
  }

  tobiasEmojiToggle.addEventListener("click", () => {
    if (tobiasEmojiPicker.classList.contains("open")) {
      closeTobiasEmojiPicker();
    } else {
      openTobiasEmojiPicker();
    }
  });

  document.querySelectorAll("[data-tobias-emoji]").forEach(button => {
    button.addEventListener("click", () => {
      const token = button.dataset.tobiasEmoji;
      if (!TOBIAS_EMOJIS[token] || selectedTobiasEmojis.length >= 8) return;
      selectedTobiasEmojis.push(token);
      renderEmojiDraft();
      closeTobiasEmojiPicker();
    });
  });

  function updateChatVisibleViewport() {
    const viewport = window.visualViewport;
    const visibleHeight = viewport ? viewport.height : window.innerHeight;
    document.documentElement.style.setProperty("--tobias-visible-height", `${Math.round(visibleHeight)}px`);
  }

  function enterChatKeyboardMode() {
    document.body.classList.add("chat-keyboard-open");
    updateChatVisibleViewport();
    requestAnimationFrame(updateChatVisibleViewport);
    setTimeout(updateChatVisibleViewport, 120);
    setTimeout(updateChatVisibleViewport, 350);
  }

  function leaveChatKeyboardMode() {
    setTimeout(() => {
      if (document.activeElement !== chatInput) {
        document.body.classList.remove("chat-keyboard-open");
        document.documentElement.style.removeProperty("--tobias-visible-height");
      }
    }, 120);
  }

  chatInput.addEventListener("focus", enterChatKeyboardMode);
  chatInput.addEventListener("blur", leaveChatKeyboardMode);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", () => {
      if (document.body.classList.contains("chat-keyboard-open")) updateChatVisibleViewport();
    });
    window.visualViewport.addEventListener("scroll", () => {
      if (document.body.classList.contains("chat-keyboard-open")) updateChatVisibleViewport();
    });
  }

  chatToggle.addEventListener("click", openChat);

  closeChat.addEventListener("click", async () => {
    if (document.activeElement === chatInput) chatInput.blur();
    document.body.classList.remove("chat-keyboard-open");
    document.documentElement.style.removeProperty("--tobias-visible-height");
    closeTobiasEmojiPicker();
    selectedTobiasEmojis = [];
    renderEmojiDraft();
    await disconnectRealtimeChat();
    hidePanel(chatPanel);
  });

  chatForm.addEventListener("submit", async event => {
    event.preventDefault();

    const typedText = chatInput.value.trim();
    const emojiText = selectedTobiasEmojis.join(" ");
    const body = [typedText, emojiText].filter(Boolean).join(" ").trim();

    if (!body || body.length > 500) return;

    const keyboardWasOpen = document.activeElement === chatInput;
    chatSend.disabled = true;

    try {
      await sendChatMessage(body);
      chatInput.value = "";
      selectedTobiasEmojis = [];
      renderEmojiDraft();
      closeTobiasEmojiPicker();
      if (keyboardWasOpen) chatInput.focus();
    } catch (error) {
      console.error("Não foi possível enviar a mensagem.", error);
    } finally {
      chatSend.disabled = false;
    }
  });

  // ----------------------------------------------------------
  // GAME HUD HIDE / RESTORE
  // ----------------------------------------------------------
  function isHudHidden() {
    return gameplayStage.classList.contains("hud-hidden");
  }

  function hideGameHud() {
    gameplayStage.classList.add("hud-hidden");
  }

  function showGameHud() {
    gameplayStage.classList.remove("hud-hidden");
  }

  function anyGamePanelOpen() {
    return allPanels.some(panel => panel && panel.classList.contains("open"));
  }

  function anyBlockingOverlayOpen() {
    return (
      anyGamePanelOpen() ||
      dialogOne.classList.contains("open") ||
      dialogTwo.classList.contains("open") ||
      discardDialog.classList.contains("open")
    );
  }

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
    if (panel !== chatPanel && chatPanel.classList.contains("open")) {
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

  settingsToggle.addEventListener("click", event => {
    if (isHudHidden()) {
      event.preventDefault();
      event.stopPropagation();
      showGameHud();
      return;
    }
    showPanel(settingsPanel);
  });

  document.querySelectorAll("[data-close-panel]").forEach(button => {
    button.addEventListener("click", () => {
      hidePanel(document.getElementById(button.dataset.closePanel));
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
      const stored = JSON.parse(localStorage.getItem(AUDIO_KEY) || "{}");
      return {
        musicVolume: Number.isFinite(Number(stored.musicVolume))
          ? Math.max(0, Math.min(1, Number(stored.musicVolume)))
          : defaultAudio.musicVolume,
        musicMuted: typeof stored.musicMuted === "boolean"
          ? stored.musicMuted
          : defaultAudio.musicMuted,
        sfxVolume: Number.isFinite(Number(stored.sfxVolume))
          ? Math.max(0, Math.min(1, Number(stored.sfxVolume)))
          : defaultAudio.sfxVolume,
        sfxMuted: typeof stored.sfxMuted === "boolean"
          ? stored.sfxMuted
          : defaultAudio.sfxMuted
      };
    } catch {
      return { ...defaultAudio };
    }
  }

  let audio = readAudioSettings();

  function saveAudioSettings() {
    localStorage.setItem(AUDIO_KEY, JSON.stringify(audio));
  }

  function applyAudioSettings() {
    musicSlider.value = Math.round(audio.musicVolume * 100);
    sfxSlider.value = Math.round(audio.sfxVolume * 100);
    musicValue.textContent = `${musicSlider.value}%`;
    sfxValue.textContent = `${sfxSlider.value}%`;
    musicMute.querySelector(".audio-icon").textContent = audio.musicMuted ? "🔇" : "🔊";
    sfxMute.querySelector(".audio-icon").textContent = audio.sfxMuted ? "🔇" : "🔊";
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
        quantity.textContent = Number(item.quantity || 0).toLocaleString("pt-BR");

        slot.appendChild(icon);
        slot.appendChild(quantity);
        slot.setAttribute("aria-label", `${item.name}, quantidade ${item.quantity}`);
        slot.addEventListener("click", () => openItemDetail(slotIndex));
      } else {
        slot.disabled = true;
        slot.setAttribute("aria-label", `Slot ${slotIndex + 1} vazio`);
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
    detailCrafting.textContent = item.craftable
      ? `Materiais necessários: ${item.crafting || "a definir"}`
      : "Item não fabricável";
    detailQuantity.textContent = `Quantidade: ${Number(item.quantity || 0).toLocaleString("pt-BR")}`;
    equipItem.style.display = item.equippable ? "" : "none";
    document.getElementById("itemActions").classList.toggle("single-action", !item.equippable);
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
    equipment.main = { ...item, quantity: 1 };
    TobiasSave.saveEquipment(equipment);

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

  discardNo.addEventListener("click", () => closeDanger(discardDialog));

  discardYes.addEventListener("click", () => {
    if (selectedInventoryIndex === null) {
      closeDanger(discardDialog);
      return;
    }

    const inventory = TobiasSave.loadInventory();
    const item = inventory[selectedInventoryIndex];

    if (item) {
      const remainingInventory = inventory.filter(slot => !slot || slot.itemId !== item.itemId);
      TobiasSave.saveInventory(remainingInventory);
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
  deleteButton.addEventListener("click", () => openDanger(dialogOne));
  noOne.addEventListener("click", () => closeDanger(dialogOne));
  yesOne.addEventListener("click", () => {
    closeDanger(dialogOne);
    openDanger(dialogTwo);
  });
  noTwo.addEventListener("click", () => closeDanger(dialogTwo));

  yesTwo.addEventListener("click", async () => {
    const currentSave = TobiasSave.load();
    yesTwo.disabled = true;
    yesTwo.textContent = "APAGANDO...";

    try {
      if (currentSave?.playerName && window.TobiasNameRegistry) {
        await TobiasNameRegistry.release(currentSave.playerName);
      }

      TobiasSave.clearAllProgress();
      window.location.replace("index.html");
    } catch (error) {
      console.error(error);
      yesTwo.disabled = false;
      yesTwo.textContent = "SIM, APAGAR TUDO";
      alert("Não foi possível liberar o nome e apagar o progresso. Tente novamente.");
    }
  });

  // ----------------------------------------------------------
  // UI interaction sound
  // ----------------------------------------------------------
  function playUiClick() {
    if (!uiClickSound || audio.sfxMuted) return;
    uiClickSound.volume = Math.max(0, Math.min(1, audio.sfxVolume));
    try {
      uiClickSound.currentTime = 0;
    } catch {}
    uiClickSound.play().catch(() => {});
  }

  document.addEventListener(
    "click",
    event => {
      const control = event.target.closest("button, a[href], input[type='range']");
      if (!control) return;
      if (control.matches("input[type='range']")) return;
      playUiClick();
    },
    true
  );

  // ----------------------------------------------------------
  // ----------------------------------------------------------
  // QUARTO DO TOBIAS — CENÁRIO HD + POINT-AND-CLICK
  // ----------------------------------------------------------
  const ctx = roomCanvas.getContext("2d");
  const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const ROOM_IMAGE_WIDTH = 1024;
  const ROOM_IMAGE_HEIGHT = 1536;
  const ROOM_IMAGE_RATIO = ROOM_IMAGE_WIDTH / ROOM_IMAGE_HEIGHT;

  const roomBackground = new Image();
  roomBackground.decoding = "async";
  roomBackground.src = "quarto_tobias_hd.png";
  let roomBackgroundReady = false;
  roomBackground.addEventListener("load", () => {
    roomBackgroundReady = true;
  });

  const playerSprite = new Image();
  playerSprite.decoding = "async";
  playerSprite.src = "tobias_sheet_normalized.png";
  let playerSpriteReady = false;
  playerSprite.addEventListener("load", () => {
    playerSpriteReady = true;
  });

  const walkFrames = Array.from({ length: 6 }, (_, index) => {
    const image = new Image();
    image.decoding = "async";
    image.src = `tobias_walk_${index}.png`;
    return { image, ready: false };
  });
  walkFrames.forEach(frame => {
    frame.image.addEventListener("load", () => { frame.ready = true; });
  });

  // Pixel-level walkability map. White pixels = feet may stand there.
  const walkMaskImage = new Image();
  walkMaskImage.decoding = "async";
  walkMaskImage.src = "room_walkable_mask.png";
  let walkMaskReady = false;
  let walkMaskWidth = ROOM_IMAGE_WIDTH;
  let walkMaskHeight = ROOM_IMAGE_HEIGHT;
  let walkMaskPixels = null;

  walkMaskImage.addEventListener("load", () => {
    const offscreen = document.createElement("canvas");
    walkMaskWidth = walkMaskImage.naturalWidth || ROOM_IMAGE_WIDTH;
    walkMaskHeight = walkMaskImage.naturalHeight || ROOM_IMAGE_HEIGHT;
    offscreen.width = walkMaskWidth;
    offscreen.height = walkMaskHeight;
    const maskCtx = offscreen.getContext("2d", { willReadFrequently: true });
    maskCtx.drawImage(walkMaskImage, 0, 0);
    walkMaskPixels = maskCtx.getImageData(0, 0, walkMaskWidth, walkMaskHeight).data;
    walkMaskReady = true;
    if (!constructionMode) buildRoomLayout();
  });

  // Original room cutouts redrawn over Tobias only when his feet are behind them.
  // This creates correct depth without changing the approved room artwork.
  const OCCLUDER_DEFS = [
    ["occ_desk.png",0,0,1024,1536,460],
    ["occ_nightstand.png",0,0,1024,1536,410],
    ["occ_bed.png",0,0,1024,1536,665],
    ["occ_chest.png",0,0,1024,1536,1085],
    ["occ_left_cabinet.png",0,0,1024,1536,1150],
    ["occ_left_cushion.png",0,0,1024,1536,695],
    ["occ_doorway.png",0,0,1024,1536,1536]
  ];

  const roomOccluders = OCCLUDER_DEFS.map(([src,x,y,w,h,baseline]) => {
    const image = new Image();
    image.decoding = "async";
    image.src = src;
    const entry = { image, x, y, w, h, baseline, ready: false };
    image.addEventListener("load", () => { entry.ready = true; });
    return entry;
  });

  let exitTriggered = false;
  let lastTimestamp = 0;
  let nearDoor = false;
  let targetPulse = 0;
  let navigationTarget = null;
  let navigationPath = [];
  let walkAnimationPhase = 0;
  let footstepDistance = 0;
  let footstepVariant = 0;

  let view = { width: 1170, height: 1890 };
  let world = { width: 2340, height: 3780 };
  let camera = { x: 0, y: 0 };
  let doorZone = { x: 0, y: 0, width: 0, height: 0 };

  const player = {
    x: 0,
    y: 0,
    radius: 62,
    facing: "down"
  };

  /*
    Collision no longer uses broad rectangles or rough polygons.
    The room_walkable_mask.png file is sampled directly at image-pixel level.
    This prevents walking on walls, windows, books, lamps or outside the room,
    while preserving every genuinely free patch of floor.
  */

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function saveRoomState() {
    try {
      localStorage.setItem(
        GAME_STATE_KEY,
        JSON.stringify({
          room: {
            artVersion: 2,
            x: world.width ? player.x / world.width : 0.5,
            y: world.height ? player.y / world.height : 0.40
          }
        })
      );
    } catch {}
  }

  function loadRoomState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(GAME_STATE_KEY) || "{}");
      const state = parsed?.room;
      if (
        state && state.artVersion === 2 &&
        Number.isFinite(Number(state.x)) &&
        Number.isFinite(Number(state.y))
      ) {
        return {
          x: clamp(Number(state.x), 0, 1),
          y: clamp(Number(state.y), 0, 1)
        };
      }
    } catch {}
    return null;
  }

  function buildRoomLayout() {
    const rect = gameplayStage.getBoundingClientRect();
    const previous = {
      x: world.width ? player.x / world.width : 0.50,
      y: world.height ? player.y / world.height : 0.40
    };

    view.width = Math.max(320, rect.width || 1170);
    view.height = Math.max(540, rect.height || 1890);

    roomCanvas.width = Math.round(view.width * DPR);
    roomCanvas.height = Math.round(view.height * DPR);
    roomCanvas.style.width = `${view.width}px`;
    roomCanvas.style.height = `${view.height}px`;

    const sourceWidth = roomBackground.naturalWidth || ROOM_IMAGE_WIDTH;
    const sourceHeight = roomBackground.naturalHeight || ROOM_IMAGE_HEIGHT;

    // Preserve the original artwork ratio and guarantee at least 2x2 screens.
    const scale = Math.max(
      (view.width * 2) / sourceWidth,
      (view.height * 2) / sourceHeight
    );

    world.width = sourceWidth * scale;
    world.height = sourceHeight * scale;

    player.radius = world.width * 0.018;

    // Door in the bottom center of the artwork.
    doorZone = {
      x: world.width * 0.430,
      y: world.height * 0.900,
      width: world.width * 0.150,
      height: world.height * 0.100
    };

    const loaded = returningFromConstruction ? null : loadRoomState();
    const spawn = loaded || (previous.x && previous.y ? previous : { x: 0.50, y: 0.48 });

    player.x = clamp(spawn.x * world.width, world.width * 0.06, world.width * 0.94);
    player.y = clamp(spawn.y * world.height, world.height * 0.06, world.height * 0.92);

    // First load: start on the clean floor where Tobias appears in the illustration.
    if (returningFromConstruction) {
      player.x = world.width * 0.500;
      player.y = world.height * 0.830;
      try {
        const cleanUrl = `${window.location.pathname}`;
        window.history.replaceState({}, "", cleanUrl);
      } catch {}
    } else if (!loaded && (!previous.x || !previous.y)) {
      player.x = world.width * 0.470;
      player.y = world.height * 0.480;
    }

    // Never spawn inside furniture after a layout change.
    if (walkMaskReady && collides(player.x, player.y)) {
      const safe = nearestWalkablePoint(world.width * 0.48, world.height * 0.40);
      player.x = safe.x;
      player.y = safe.y;
    }

    navigationPath = [];
    navigationTarget = null;
    updateCamera(true);
  }

  function rectsOverlap(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  function playerBounds(nextX = player.x, nextY = player.y) {
    // Tiny foot-contact box: the visible body/ears do not artificially enlarge collisions.
    return {
      x: nextX - player.radius * 0.18,
      y: nextY + player.radius * 0.10,
      width: player.radius * 0.36,
      height: player.radius * 0.25
    };
  }

  function walkableMaskValue(worldX, worldY) {
    if (!walkMaskReady || !walkMaskPixels) return 0;
    if (worldX < 0 || worldY < 0 || worldX >= world.width || worldY >= world.height) return 0;

    const sx = clamp(Math.floor((worldX / world.width) * walkMaskWidth), 0, walkMaskWidth - 1);
    const sy = clamp(Math.floor((worldY / world.height) * walkMaskHeight), 0, walkMaskHeight - 1);
    const index = (sy * walkMaskWidth + sx) * 4;
    // Mask is grayscale; red channel is sufficient.
    return walkMaskPixels[index];
  }

  function collides(nextX, nextY) {
    // Before the mask is ready movement is intentionally blocked; no frame exists
    // in which the player can briefly walk through scenery while assets load.
    if (!walkMaskReady) return true;

    const rx = Math.max(4, player.radius * 0.13);
    const ry = Math.max(3, player.radius * 0.075);
    const footY = nextY + player.radius * 0.23;

    const samples = [
      [0,0],[-rx,0],[rx,0],[0,-ry],[0,ry],
      [-rx*0.72,-ry*0.72],[rx*0.72,-ry*0.72],
      [-rx*0.72,ry*0.72],[rx*0.72,ry*0.72]
    ];

    return samples.some(([ox,oy]) => walkableMaskValue(nextX + ox, footY + oy) < 128);
  }

  function nearestWalkablePoint(targetX, targetY) {
    const safeX = clamp(targetX, 0, world.width);
    const safeY = clamp(targetY, 0, world.height);

    if (!collides(safeX, safeY)) {
      return { x: safeX, y: safeY };
    }

    const step = Math.max(8, player.radius * 0.18);
    const maxRadius = Math.max(view.width, view.height) * 0.65;

    for (let radius = step; radius <= maxRadius; radius += step) {
      const samples = Math.max(16, Math.ceil((Math.PI * 2 * radius) / step));
      for (let i = 0; i < samples; i++) {
        const angle = (i / samples) * Math.PI * 2;
        const x = clamp(safeX + Math.cos(angle) * radius, 0, world.width);
        const y = clamp(safeY + Math.sin(angle) * radius, 0, world.height);
        if (!collides(x, y)) return { x, y };
      }
    }

    return { x: player.x, y: player.y };
  }

  function segmentClear(a, b) {
    const distance = Math.hypot(b.x - a.x, b.y - a.y);
    const steps = Math.max(1, Math.ceil(distance / Math.max(7, player.radius * 0.16)));

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      if (collides(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)) {
        return false;
      }
    }

    return true;
  }

  function findPath(start, rawTarget) {
    const target = nearestWalkablePoint(rawTarget.x, rawTarget.y);

    if (segmentClear(start, target)) {
      return [target];
    }

    const cell = Math.max(16, Math.min(32, Math.min(view.width, view.height) * 0.034));
    const cols = Math.ceil(world.width / cell);
    const rows = Math.ceil(world.height / cell);

    const toCell = point => ({
      c: clamp(Math.floor(point.x / cell), 0, cols - 1),
      r: clamp(Math.floor(point.y / cell), 0, rows - 1)
    });

    const toPoint = node => ({
      x: clamp((node.c + 0.5) * cell, 0, world.width),
      y: clamp((node.r + 0.5) * cell, 0, world.height)
    });

    const startCell = toCell(start);
    let targetCell = toCell(target);
    const key = (c, r) => `${c},${r}`;

    const isWalkableCell = (c, r) => {
      if (c < 0 || r < 0 || c >= cols || r >= rows) return false;
      const point = toPoint({ c, r });
      return !collides(point.x, point.y);
    };

    if (!isWalkableCell(targetCell.c, targetCell.r)) {
      targetCell = toCell(nearestWalkablePoint(target.x, target.y));
    }

    const open = [{ ...startCell, g: 0, f: 0 }];
    const cameFrom = new Map();
    const gScore = new Map([[key(startCell.c, startCell.r), 0]]);
    const closed = new Set();
    const heuristic = (c, r) => Math.hypot(targetCell.c - c, targetCell.r - r);
    open[0].f = heuristic(startCell.c, startCell.r);

    const directions = [
      [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
      [1, 1, Math.SQRT2], [1, -1, Math.SQRT2],
      [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]
    ];

    let foundKey = null;
    let safety = 0;

    while (open.length && safety++ < cols * rows * 3) {
      let bestIndex = 0;
      for (let i = 1; i < open.length; i++) {
        if (open[i].f < open[bestIndex].f) bestIndex = i;
      }

      const current = open.splice(bestIndex, 1)[0];
      const currentKey = key(current.c, current.r);
      if (closed.has(currentKey)) continue;
      closed.add(currentKey);

      if (current.c === targetCell.c && current.r === targetCell.r) {
        foundKey = currentKey;
        break;
      }

      for (const [dc, dr, cost] of directions) {
        const nc = current.c + dc;
        const nr = current.r + dr;
        if (!isWalkableCell(nc, nr)) continue;

        if (dc !== 0 && dr !== 0) {
          if (
            !isWalkableCell(current.c + dc, current.r) ||
            !isWalkableCell(current.c, current.r + dr)
          ) {
            continue;
          }
        }

        const nk = key(nc, nr);
        if (closed.has(nk)) continue;

        const tentative = current.g + cost;
        if (tentative >= (gScore.get(nk) ?? Infinity)) continue;

        cameFrom.set(nk, currentKey);
        gScore.set(nk, tentative);
        open.push({
          c: nc,
          r: nr,
          g: tentative,
          f: tentative + heuristic(nc, nr)
        });
      }
    }

    if (!foundKey) {
      return segmentClear(start, target) ? [target] : [];
    }

    const cells = [];
    let cursor = foundKey;
    while (cursor) {
      const [c, r] = cursor.split(",").map(Number);
      cells.push({ c, r });
      if (cursor === key(startCell.c, startCell.r)) break;
      cursor = cameFrom.get(cursor);
    }
    cells.reverse();

    const rawPath = cells.slice(1).map(toPoint);
    rawPath.push(target);

    // Smooth the path so the rabbit walks naturally instead of following grid corners.
    const smoothed = [];
    let anchor = { x: start.x, y: start.y };
    let i = 0;

    while (i < rawPath.length) {
      let furthest = i;
      for (let j = rawPath.length - 1; j >= i; j--) {
        if (segmentClear(anchor, rawPath[j])) {
          furthest = j;
          break;
        }
      }
      smoothed.push(rawPath[furthest]);
      anchor = rawPath[furthest];
      i = furthest + 1;
    }

    return smoothed;
  }

  function setNavigationTarget(worldX, worldY) {
    const desired = nearestWalkablePoint(worldX, worldY);
    navigationTarget = desired;
    navigationPath = findPath({ x: player.x, y: player.y }, desired);
    targetPulse = 1;

    if (pointClickHint) {
      pointClickHint.classList.add("used");
    }
  }

  function updateCamera(force = false) {
    const targetX = clamp(player.x - view.width / 2, 0, Math.max(0, world.width - view.width));
    const targetY = clamp(player.y - view.height / 2, 0, Math.max(0, world.height - view.height));

    if (force) {
      camera.x = targetX;
      camera.y = targetY;
      return;
    }

    // Smooth follow camera.
    camera.x += (targetX - camera.x) * 0.16;
    camera.y += (targetY - camera.y) * 0.16;
  }

  function drawPlayer() {
    const x = player.x;
    const y = player.y;
    const r = player.radius;
    const walking = navigationPath.length > 0;

    const phase = walkAnimationPhase;
    const bob = walking ? Math.abs(Math.sin(phase)) * r * 0.045 : Math.sin(performance.now() / 650) * r * 0.006;
    const lean = walking ? Math.sin(phase) * 0.012 : 0;

    const activeImage = playerSprite;

    ctx.save();
    ctx.translate(x, y - bob);
    ctx.rotate(lean);

    const ready = activeImage === playerSprite ? playerSpriteReady : true;
    if (ready && activeImage.naturalWidth) {
      const naturalW = activeImage.naturalWidth / 4;
      const naturalH = activeImage.naturalHeight / 4;
      const spriteHeight = r * 5;
      const spriteWidth = spriteHeight * (naturalW / naturalH);
      const column = walking ? Math.floor(phase / (Math.PI * 2) * 4) % 4 : 1;
      const row = { down: 0, left: 1, right: 2, up: 3 }[player.facing];

      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(activeImage, column * naturalW, row * naturalH, naturalW, naturalH,
        -spriteWidth / 2, -spriteHeight * 0.94 + r * 0.23, spriteWidth, spriteHeight);
      ctx.restore();
    } else {
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.36, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawOccludersInFrontOfPlayer() {
    if (!roomBackgroundReady) return;
    const sourceW = roomBackground.naturalWidth || ROOM_IMAGE_WIDTH;
    const sourceH = roomBackground.naturalHeight || ROOM_IMAGE_HEIGHT;
    const playerSourceY = (player.y / world.height) * sourceH;

    for (const occ of roomOccluders) {
      if (!occ.ready || playerSourceY >= occ.baseline) continue;
      ctx.drawImage(
        occ.image,
        (occ.x / sourceW) * world.width,
        (occ.y / sourceH) * world.height,
        (occ.w / sourceW) * world.width,
        (occ.h / sourceH) * world.height
      );
    }
  }

  function renderRoom() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, view.width, view.height);

    ctx.fillStyle = "#1a1511";
    ctx.fillRect(0, 0, view.width, view.height);

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    if (roomBackgroundReady) {
      // This is the generated HD room artwork, not procedural furniture.
      ctx.drawImage(roomBackground, 0, 0, world.width, world.height);
    } else {
      const fallback = ctx.createLinearGradient(0, 0, 0, world.height);
      fallback.addColorStop(0, "#4a3526");
      fallback.addColorStop(1, "#201610");
      ctx.fillStyle = fallback;
      ctx.fillRect(0, 0, world.width, world.height);
    }

    // Destination marker.
    if (navigationTarget && (navigationPath.length || targetPulse > 0)) {
      const pulse = 1 + Math.sin(performance.now() / 115) * 0.10;
      const radius = player.radius * 0.24 * pulse;
      ctx.save();
      ctx.globalAlpha = 0.30 + 0.28 * Math.max(0, targetPulse);
      ctx.strokeStyle = "#ffe071";
      ctx.lineWidth = Math.max(3, player.radius * 0.045);
      ctx.beginPath();
      ctx.arc(navigationTarget.x, navigationTarget.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(navigationTarget.x, navigationTarget.y, radius * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = "#fff1a6";
      ctx.fill();
      ctx.restore();
    }

    drawPlayer();
    drawOccludersInFrontOfPlayer();
    ctx.restore();
  }

  function playFootstep() {
    if (audio.sfxMuted) return;
    const sound = footstepVariant++ % 2 === 0 ? footstepSound1 : footstepSound2;
    if (!sound) return;
    sound.volume = Math.max(0, Math.min(1, audio.sfxVolume * 0.34));
    try { sound.currentTime = 0; } catch {}
    sound.play().catch(() => {});
  }

  function updatePlayer(dt) {
    if (navigationPath.length) {
      const waypoint = navigationPath[0];
      const dx = waypoint.x - player.x;
      const dy = waypoint.y - player.y;
      const distance = Math.hypot(dx, dy);
      const speed = Math.min(world.width, world.height) * 0.228; // +20% versus the original 0.19
      const step = speed * dt;

      if (distance <= Math.max(3, step)) {
        const moved = Math.hypot(waypoint.x - player.x, waypoint.y - player.y);
        player.x = waypoint.x;
        player.y = waypoint.y;
        walkAnimationPhase = (walkAnimationPhase + dt * 10.8) % (Math.PI * 2);
        footstepDistance += moved;
        navigationPath.shift();
      } else if (distance > 0) {
        const vx = dx / distance;
        const vy = dy / distance;

        if (Math.abs(vx) > Math.abs(vy)) {
          player.facing = vx < 0 ? "left" : "right";
        } else {
          player.facing = vy < 0 ? "up" : "down";
        }

        const nextX = player.x + vx * step;
        const nextY = player.y + vy * step;

        if (!collides(nextX, nextY)) {
          const moved = Math.hypot(nextX - player.x, nextY - player.y);
          player.x = nextX;
          player.y = nextY;
          walkAnimationPhase = (walkAnimationPhase + dt * 10.8) % (Math.PI * 2);
          footstepDistance += moved;
          const stepSpacing = Math.max(34, player.radius * 0.88);
          if (footstepDistance >= stepSpacing) {
            footstepDistance %= stepSpacing;
            playFootstep();
          }
        } else if (navigationTarget) {
          navigationPath = findPath({ x: player.x, y: player.y }, navigationTarget);
        } else {
          navigationPath = [];
        }
      }
    }

    if (!navigationPath.length) {
      footstepDistance = 0;
    }

    targetPulse = Math.max(0, targetPulse - dt * 0.85);

    nearDoor = rectsOverlap(playerBounds(), doorZone);
    if (roomExitHint) {
      roomExitHint.classList.toggle("visible", nearDoor);
    }

    if (
      !constructionMode &&
      nearDoor &&
      !exitTriggered &&
      player.y > world.height * 0.925
    ) {
      exitTriggered = true;
      saveRoomState();
      window.location.href = "proximo-comodo.html";
    }
  }

  roomCanvas.addEventListener("pointerdown", event => {
    if (anyBlockingOverlayOpen() || !walkMaskReady) return;

    const rect = roomCanvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const localX = (event.clientX - rect.left) * (view.width / rect.width);
    const localY = (event.clientY - rect.top) * (view.height / rect.height);
    const worldX = camera.x + localX;
    const worldY = camera.y + localY;

    setNavigationTarget(worldX, worldY);
    event.preventDefault();
  });

  function gameLoop(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const dt = Math.min(0.04, (timestamp - lastTimestamp) / 1000);
    lastTimestamp = timestamp;

    if (!anyBlockingOverlayOpen()) {
      updatePlayer(dt);
    }

    updateCamera(false);
    renderRoom();
    requestAnimationFrame(gameLoop);
  }

  // Lifecycle
  // ----------------------------------------------------------
  window.addEventListener("pagehide", () => {
    disconnectRealtimeChat();
    if (!constructionMode) {
      saveRoomState();
    }
  });

  window.addEventListener("resize", () => {
    if (constructionMode) return;
    navigationPath = [];
    navigationTarget = null;
    buildRoomLayout();
  });

  applyAudioSettings();
  renderInventory();

  if (!constructionMode) {
    buildRoomLayout();
    requestAnimationFrame(gameLoop);
  }
})();
