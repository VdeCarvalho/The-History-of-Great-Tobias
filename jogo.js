
(() => {
  const save = window.TobiasSave ? TobiasSave.load() : null;

  if (!save) {
    window.location.replace("nome.html");
    return;
  }

  TobiasSave.initializeTestInventory();

  const AUDIO_KEY = "tobias_audio_settings_v1";
  const GAME_STATE_KEY = "tobias_game_state_v1";

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
  // QUARTO DO TOBIAS — WORLD / CAMERA / MOVEMENT
  // ----------------------------------------------------------
  const ctx = roomCanvas.getContext("2d");
  const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  ctx.imageSmoothingEnabled = true;

  let exitTriggered = false;
  let lastTimestamp = 0;
  let nearDoor = false;
  let navigationPath = [];
  let navigationTarget = null;
  let targetPulse = 0;

  let view = { width: 1170, height: 1890 };
  let world = { width: 2340, height: 3780 };
  let camera = { x: 0, y: 0 };
  let roomObjects = [];
  let doorZone = { x: 0, y: 0, width: 0, height: 0 };
  let savedFractions = null;

  const player = {
    x: 0,
    y: 0,
    radius: 34,
    speed: 260,
    facing: "down"
  };

  function saveRoomState() {
    try {
      localStorage.setItem(
        GAME_STATE_KEY,
        JSON.stringify({
          room: {
            x: world.width ? player.x / world.width : .5,
            y: world.height ? player.y / world.height : .6
          }
        })
      );
    } catch {}
  }

  function loadRoomState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(GAME_STATE_KEY) || "{}");
      const roomState = parsed?.room;
      if (
        roomState &&
        Number.isFinite(Number(roomState.x)) &&
        Number.isFinite(Number(roomState.y))
      ) {
        return {
          x: Math.max(0, Math.min(1, Number(roomState.x))),
          y: Math.max(0, Math.min(1, Number(roomState.y)))
        };
      }
    } catch {}
    return null;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function buildRoomLayout() {
    const rect = gameplayStage.getBoundingClientRect();
    const previous = {
      fx: world.width ? player.x / world.width : .5,
      fy: world.height ? player.y / world.height : .62
    };

    view.width = Math.max(320, rect.width || 1170);
    view.height = Math.max(540, rect.height || 1890);

    roomCanvas.width = Math.round(view.width * DPR);
    roomCanvas.height = Math.round(view.height * DPR);
    roomCanvas.style.width = `${view.width}px`;
    roomCanvas.style.height = `${view.height}px`;

    world.width = view.width * 2;
    world.height = view.height * 2;

    const wall = Math.round(Math.min(world.width, world.height) * 0.05);
    const leftWall = wall;
    const topWall = wall;
    const rightWall = wall * 0.9;
    const bottomWall = wall * 1.05;

    const familyFrame = {
      x: world.width * 0.55,
      y: topWall + 55,
      width: world.width * 0.22,
      height: world.height * 0.11,
      type: "familyFrame"
    };

    const burgerPoster = {
      x: world.width * 0.22,
      y: topWall + 70,
      width: world.width * 0.23,
      height: world.height * 0.12,
      type: "burgerPoster"
    };

    const bed = {
      x: world.width * 0.66,
      y: world.height * 0.20,
      width: world.width * 0.23,
      height: world.height * 0.18,
      collide: true,
      type: "bed"
    };

    const desk = {
      x: world.width * 0.68,
      y: world.height * 0.58,
      width: world.width * 0.18,
      height: world.height * 0.12,
      collide: true,
      type: "desk"
    };

    const chest = {
      x: world.width * 0.17,
      y: world.height * 0.72,
      width: world.width * 0.14,
      height: world.height * 0.09,
      collide: true,
      type: "chest"
    };

    const shelf = {
      x: world.width * 0.10,
      y: world.height * 0.27,
      width: world.width * 0.14,
      height: world.height * 0.17,
      collide: true,
      type: "shelf"
    };

    const rug = {
      x: world.width * 0.33,
      y: world.height * 0.45,
      width: world.width * 0.34,
      height: world.height * 0.22,
      type: "rug"
    };

    const smallTable = {
      x: world.width * 0.44,
      y: world.height * 0.25,
      width: world.width * 0.12,
      height: world.height * 0.08,
      collide: true,
      type: "table"
    };

    doorZone = {
      x: world.width * 0.43,
      y: world.height - bottomWall - 20,
      width: world.width * 0.14,
      height: bottomWall + 35
    };

    roomObjects = [burgerPoster, familyFrame, bed, desk, chest, shelf, rug, smallTable];

    const loaded = loadRoomState();
    const spawn = loaded || savedFractions || previous;

    player.x = clamp(spawn.x * world.width, leftWall + 90, world.width - rightWall - 90);
    player.y = clamp(spawn.y * world.height, topWall + 120, world.height - bottomWall - 110);

    if (!player.x || !player.y) {
      player.x = world.width * .5;
      player.y = world.height * .74;
    }

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
    return {
      x: nextX - player.radius * 0.72,
      y: nextY - player.radius * 0.54,
      width: player.radius * 1.44,
      height: player.radius * 1.1
    };
  }

  function solidObstacles() {
    const wall = Math.min(world.width, world.height) * 0.05;
    const rightWall = wall * 0.9;
    const bottomWall = wall * 1.05;

    const solids = [
      { x: 0, y: 0, width: world.width, height: wall },
      { x: 0, y: 0, width: wall, height: world.height },
      { x: world.width - rightWall, y: 0, width: rightWall, height: world.height },
      { x: 0, y: world.height - bottomWall, width: doorZone.x, height: bottomWall },
      { x: doorZone.x + doorZone.width, y: world.height - bottomWall, width: world.width - (doorZone.x + doorZone.width), height: bottomWall }
    ];

    for (const object of roomObjects) {
      if (!object.collide) continue;
      solids.push({
        x: object.x,
        y: object.y,
        width: object.width,
        height: object.height
      });
    }

    return solids;
  }

  function collides(nextX, nextY) {
    const bounds = playerBounds(nextX, nextY);
    return solidObstacles().some(obstacle => rectsOverlap(bounds, obstacle));
  }

  function nearestWalkablePoint(targetX, targetY) {
    const safeX = clamp(targetX, 0, world.width);
    const safeY = clamp(targetY, 0, world.height);

    if (!collides(safeX, safeY)) {
      return { x: safeX, y: safeY };
    }

    const step = Math.max(18, player.radius * .65);
    const maxRadius = Math.max(view.width, view.height) * .45;

    for (let radius = step; radius <= maxRadius; radius += step) {
      const samples = Math.max(12, Math.ceil((Math.PI * 2 * radius) / step));
      for (let i = 0; i < samples; i++) {
        const angle = (i / samples) * Math.PI * 2;
        const x = clamp(safeX + Math.cos(angle) * radius, 0, world.width);
        const y = clamp(safeY + Math.sin(angle) * radius, 0, world.height);
        if (!collides(x, y)) {
          return { x, y };
        }
      }
    }

    return { x: player.x, y: player.y };
  }

  function segmentClear(a, b) {
    const distance = Math.hypot(b.x - a.x, b.y - a.y);
    const steps = Math.max(1, Math.ceil(distance / Math.max(12, player.radius * .45)));

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const x = a.x + (b.x - a.x) * t;
      const y = a.y + (b.y - a.y) * t;
      if (collides(x, y)) return false;
    }

    return true;
  }

  function findPath(start, rawTarget) {
    const target = nearestWalkablePoint(rawTarget.x, rawTarget.y);

    if (segmentClear(start, target)) {
      return [target];
    }

    const cell = Math.max(24, Math.min(42, Math.min(view.width, view.height) * .055));
    const cols = Math.ceil(world.width / cell);
    const rows = Math.ceil(world.height / cell);

    const toCell = point => ({
      c: clamp(Math.floor(point.x / cell), 0, cols - 1),
      r: clamp(Math.floor(point.y / cell), 0, rows - 1)
    });

    const toPoint = node => ({
      x: clamp((node.c + .5) * cell, 0, world.width),
      y: clamp((node.r + .5) * cell, 0, world.height)
    });

    const startCell = toCell(start);
    let targetCell = toCell(target);

    const key = (c, r) => `${c},${r}`;
    const isWalkableCell = (c, r) => {
      if (c < 0 || r < 0 || c >= cols || r >= rows) return false;
      const p = toPoint({ c, r });
      return !collides(p.x, p.y);
    };

    if (!isWalkableCell(targetCell.c, targetCell.r)) {
      const adjusted = nearestWalkablePoint(target.x, target.y);
      targetCell = toCell(adjusted);
    }

    const open = [{ ...startCell, g: 0, f: 0 }];
    const cameFrom = new Map();
    const gScore = new Map([[key(startCell.c, startCell.r), 0]]);
    const closed = new Set();

    const heuristic = (c, r) => Math.hypot(targetCell.c - c, targetCell.r - r);
    open[0].f = heuristic(startCell.c, startCell.r);

    const directions = [
      [1,0,1],[-1,0,1],[0,1,1],[0,-1,1],
      [1,1,Math.SQRT2],[1,-1,Math.SQRT2],[-1,1,Math.SQRT2],[-1,-1,Math.SQRT2]
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

        // Prevent diagonal corner-cutting through furniture/walls.
        if (dc !== 0 && dr !== 0) {
          if (!isWalkableCell(current.c + dc, current.r) || !isWalkableCell(current.c, current.r + dr)) {
            continue;
          }
        }

        const nk = key(nc, nr);
        if (closed.has(nk)) continue;

        const tentative = current.g + cost;
        if (tentative >= (gScore.get(nk) ?? Infinity)) continue;

        cameFrom.set(nk, currentKey);
        gScore.set(nk, tentative);
        open.push({ c: nc, r: nr, g: tentative, f: tentative + heuristic(nc, nr) });
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

    // Line-of-sight smoothing avoids a visibly "grid-like" walk.
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
    const path = findPath({ x: player.x, y: player.y }, desired);

    navigationTarget = desired;
    navigationPath = path;
    targetPulse = 1;

    if (pointClickHint) {
      pointClickHint.classList.add("used");
    }
  }

  function updateCamera(force = false) {
    const targetX = clamp(player.x - view.width / 2, 0, world.width - view.width);
    const targetY = clamp(player.y - view.height / 2, 0, world.height - view.height);

    if (force) {
      camera.x = targetX;
      camera.y = targetY;
      return;
    }

    camera.x += (targetX - camera.x) * 0.14;
    camera.y += (targetY - camera.y) * 0.14;
  }

  function drawRoundedRect(x, y, width, height, radius, fill, stroke) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }

  function drawWallDecor() {
    const wall = Math.min(world.width, world.height) * 0.05;

    // left wall windows
    const windowWidth = wall * 0.55;
    const windowHeight = world.height * 0.12;
    const windowX = wall * 0.22;
    const firstY = world.height * 0.22;
    const secondY = world.height * 0.50;

    [firstY, secondY].forEach((winY, index) => {
      drawRoundedRect(windowX, winY, windowWidth, windowHeight, 12, "#97d8ff", "#5a4022");
      drawRoundedRect(windowX + 10, winY + 10, windowWidth - 20, windowHeight - 20, 10, "#d7f3ff", null);
      ctx.strokeStyle = "rgba(94, 126, 151, .75)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(windowX + windowWidth / 2, winY + 12);
      ctx.lineTo(windowX + windowWidth / 2, winY + windowHeight - 12);
      ctx.moveTo(windowX + 12, winY + windowHeight / 2);
      ctx.lineTo(windowX + windowWidth - 12, winY + windowHeight / 2);
      ctx.stroke();

      // little curtains
      ctx.fillStyle = index === 0 ? "#f5c7b0" : "#a9d1f0";
      ctx.beginPath();
      ctx.moveTo(windowX + 8, winY + 8);
      ctx.lineTo(windowX + 8, winY + windowHeight - 8);
      ctx.lineTo(windowX + 26, winY + windowHeight * 0.65);
      ctx.lineTo(windowX + 26, winY + windowHeight * 0.35);
      ctx.closePath();
      ctx.fill();
    });
  }

  function drawBurgerPoster(object) {
    drawRoundedRect(object.x, object.y, object.width, object.height, 18, "#f4e7c9", "#6c4e28");
    ctx.fillStyle = "#3e2d19";
    ctx.font = `700 ${Math.max(16, object.width * 0.08)}px Georgia`;
    ctx.textAlign = "center";
    ctx.fillText("I love carrot", object.x + object.width / 2, object.y + object.height * 0.24);
    ctx.fillText("cheeseburger", object.x + object.width / 2, object.y + object.height * 0.40);

    const cx = object.x + object.width / 2;
    const cy = object.y + object.height * 0.72;
    drawRoundedRect(cx - object.width * 0.20, cy - object.height * 0.05, object.width * 0.40, object.height * 0.08, 18, "#d6912b", "#8b5716");
    ctx.fillStyle = "#6ab15e";
    ctx.fillRect(cx - object.width * 0.19, cy - object.height * 0.01, object.width * 0.38, object.height * 0.03);
    ctx.fillStyle = "#f4a84b";
    ctx.fillRect(cx - object.width * 0.17, cy + object.height * 0.02, object.width * 0.34, object.height * 0.05);
    drawRoundedRect(cx - object.width * 0.18, cy + object.height * 0.05, object.width * 0.36, object.height * 0.07, 18, "#d69a3c", "#8b5716");
  }

  function drawFamilyFrame(object) {
    drawRoundedRect(object.x, object.y, object.width, object.height, 18, "#f4e7c9", "#6c4e28");
    ctx.save();
    ctx.beginPath();
    ctx.rect(object.x + 12, object.y + 12, object.width - 24, object.height - 24);
    ctx.clip();
    ctx.fillStyle = "#b9d9ee";
    ctx.fillRect(object.x + 12, object.y + 12, object.width - 24, object.height - 24);

    const centers = [
      [object.x + object.width * .28, object.y + object.height * .58, 22],
      [object.x + object.width * .50, object.y + object.height * .52, 28],
      [object.x + object.width * .72, object.y + object.height * .58, 22]
    ];

    centers.forEach(([x, y, size], index) => {
      ctx.fillStyle = index === 1 ? "#fff7ef" : "#f2efe8";
      ctx.beginPath();
      ctx.ellipse(x, y, size * .6, size * .75, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#c9cdd4";
      ctx.beginPath();
      ctx.arc(x, y - size * .35, size * .55, Math.PI, Math.PI * 2);
      ctx.lineTo(x + size * .55, y - size * .35);
      ctx.strokeStyle = "#76808b";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = "#111";
      ctx.beginPath();
      ctx.arc(x - size * .2, y - size * .05, 2.3, 0, Math.PI * 2);
      ctx.arc(x + size * .2, y - size * .05, 2.3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  function drawBed(object) {
    drawRoundedRect(object.x, object.y, object.width, object.height, 24, "#7c4b28", "#4e2c15");
    drawRoundedRect(object.x + 18, object.y + 18, object.width - 36, object.height - 36, 22, "#f5f4ea", null);
    drawRoundedRect(object.x + 18, object.y + object.height * .42, object.width - 36, object.height * .40, 22, "#4f7fbe", "#36598c");
    ctx.fillStyle = "rgba(255,255,255,.28)";
    ctx.fillRect(object.x + 26, object.y + object.height * .45, object.width - 52, 10);
    // pillow
    drawRoundedRect(object.x + object.width * .12, object.y + object.height * .13, object.width * .26, object.height * .14, 14, "#fffdf6", "#c9c4b0");
  }

  function drawDesk(object) {
    drawRoundedRect(object.x, object.y, object.width, object.height, 16, "#835429", "#5b3514");
    ctx.fillStyle = "#6c4421";
    ctx.fillRect(object.x + object.width * .10, object.y + object.height, object.width * .10, object.height * .33);
    ctx.fillRect(object.x + object.width * .80, object.y + object.height, object.width * .10, object.height * .33);
    drawRoundedRect(object.x + object.width * .12, object.y + object.height * .18, object.width * .32, object.height * .20, 10, "#f0e2bb", "#a68c56");
    drawRoundedRect(object.x + object.width * .58, object.y + object.height * .18, object.width * .12, object.height * .24, 10, "#f0a955", "#8f5824");
    ctx.fillStyle = "#3aa18f";
    ctx.fillRect(object.x + object.width * .60, object.y + object.height * .08, object.width * .08, object.height * .12);
  }

  function drawShelf(object) {
    drawRoundedRect(object.x, object.y, object.width, object.height, 12, "#7a4d24", "#593313");
    ctx.strokeStyle = "#5f3817";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(object.x + 10, object.y + object.height * .33);
    ctx.lineTo(object.x + object.width - 10, object.y + object.height * .33);
    ctx.moveTo(object.x + 10, object.y + object.height * .66);
    ctx.lineTo(object.x + object.width - 10, object.y + object.height * .66);
    ctx.stroke();
    const colors = ["#db7f4d", "#5cc28f", "#6ca2f3", "#e6c04d", "#e76db2"];
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = colors[i % colors.length];
      const bx = object.x + 14 + (i % 3) * (object.width * .26);
      const by = object.y + 12 + Math.floor(i / 3) * (object.height * .18);
      ctx.fillRect(bx, by, object.width * .12, object.height * .12);
    }
  }

  function drawRug(object) {
    drawRoundedRect(object.x, object.y, object.width, object.height, 28, "#8dc9e6", "#4d7094");
    drawRoundedRect(object.x + 18, object.y + 18, object.width - 36, object.height - 36, 24, "#b8ebf5", "#7eabc2");

    const cx = object.x + object.width / 2;
    const cy = object.y + object.height / 2 + 8;
    ctx.fillStyle = "#fffaf3";
    ctx.beginPath();
    ctx.ellipse(cx, cy, object.width * .12, object.height * .17, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#3b66a7";
    ctx.beginPath();
    ctx.moveTo(cx - object.width * .08, cy + object.height * .04);
    ctx.lineTo(cx, cy - object.height * .13);
    ctx.lineTo(cx + object.width * .08, cy + object.height * .04);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#fffaf3";
    ctx.beginPath();
    ctx.ellipse(cx - object.width * .04, cy - object.height * .18, object.width * .035, object.height * .08, -.3, 0, Math.PI * 2);
    ctx.ellipse(cx + object.width * .04, cy - object.height * .18, object.width * .035, object.height * .08, .3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#eecf4c";
    ctx.fillRect(cx + object.width * .08, cy - object.height * .03, object.width * .04, object.height * .18);
    ctx.fillStyle = "#ce3f2a";
    ctx.beginPath();
    ctx.arc(cx - object.width * .14, cy, object.width * .04, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawChest(object) {
    drawRoundedRect(object.x, object.y, object.width, object.height, 18, "#996330", "#5e3815");
    ctx.fillStyle = "#f4cd57";
    ctx.fillRect(object.x + object.width * .08, object.y + object.height * .16, object.width * .84, object.height * .12);
    ctx.fillRect(object.x + object.width * .46, object.y + object.height * .18, object.width * .08, object.height * .42);
    drawRoundedRect(object.x + object.width * .43, object.y + object.height * .38, object.width * .14, object.height * .18, 8, "#ffeb9f", "#8b5d14");
  }

  function drawTable(object) {
    drawRoundedRect(object.x, object.y, object.width, object.height, 14, "#946133", "#603814");
    ctx.fillStyle = "#fff6dd";
    ctx.fillRect(object.x + object.width * .18, object.y + object.height * .18, object.width * .24, object.height * .26);
    ctx.fillStyle = "#f58220";
    ctx.beginPath();
    ctx.arc(object.x + object.width * .70, object.y + object.height * .46, object.height * .13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#6a4518";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(object.x + object.width * .20, object.y + object.height);
    ctx.lineTo(object.x + object.width * .20, object.y + object.height * 1.35);
    ctx.moveTo(object.x + object.width * .80, object.y + object.height);
    ctx.lineTo(object.x + object.width * .80, object.y + object.height * 1.35);
    ctx.stroke();
  }

  function drawDoor() {
    const wall = Math.min(world.width, world.height) * 0.05;
    const bottomY = world.height - wall * 1.05;
    drawRoundedRect(doorZone.x, bottomY - 12, doorZone.width, wall + 12, 18, "#764626", "#502d12");
    drawRoundedRect(doorZone.x + 14, bottomY + 10, doorZone.width - 28, wall * .72, 14, "#9e6840", "#5d3517");
    ctx.fillStyle = "#eacb6e";
    ctx.beginPath();
    ctx.arc(doorZone.x + doorZone.width * .78, bottomY + wall * .48, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,244,185,.35)";
    ctx.fillRect(doorZone.x + 30, bottomY + 24, doorZone.width - 60, 10);
    ctx.fillStyle = "rgba(0,0,0,.12)";
    ctx.fillRect(doorZone.x, bottomY + wall * .85, doorZone.width, 14);
  }

  function drawPlayer() {
    const x = player.x;
    const y = player.y;
    const scale = player.radius;

    ctx.fillStyle = "rgba(0,0,0,.20)";
    ctx.beginPath();
    ctx.ellipse(x, y + scale * .86, scale * .72, scale * .28, 0, 0, Math.PI * 2);
    ctx.fill();

    // cape
    ctx.fillStyle = "#3f6eb3";
    ctx.beginPath();
    ctx.moveTo(x - scale * .45, y + scale * .10);
    ctx.quadraticCurveTo(x - scale * .85, y + scale * .55, x - scale * .36, y + scale * .92);
    ctx.lineTo(x + scale * .15, y + scale * .58);
    ctx.lineTo(x + scale * .02, y + scale * .14);
    ctx.closePath();
    ctx.fill();

    // body
    ctx.fillStyle = "#f7f4ef";
    ctx.beginPath();
    ctx.ellipse(x, y + scale * .26, scale * .46, scale * .54, 0, 0, Math.PI * 2);
    ctx.fill();

    // arms/shield/sword hint by direction
    if (player.facing === "left") {
      ctx.fillStyle = "#d1d5dc";
      drawRoundedRect(x - scale * .90, y + scale * .08, scale * .24, scale * .34, 8, "#c0c6cf", "#7e8794");
      ctx.strokeStyle = "#c7cbd2";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(x + scale * .15, y - scale * .18);
      ctx.lineTo(x + scale * .70, y - scale * .48);
      ctx.stroke();
    } else if (player.facing === "right") {
      drawRoundedRect(x + scale * .66, y + scale * .08, scale * .24, scale * .34, 8, "#c0c6cf", "#7e8794");
      ctx.strokeStyle = "#c7cbd2";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(x - scale * .15, y - scale * .18);
      ctx.lineTo(x - scale * .70, y - scale * .48);
      ctx.stroke();
    } else {
      drawRoundedRect(x + scale * .48, y + scale * .18, scale * .22, scale * .30, 8, "#c0c6cf", "#7e8794");
      ctx.strokeStyle = "#c7cbd2";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(x - scale * .30, y + scale * .05);
      ctx.lineTo(x - scale * .80, y + scale * .28);
      ctx.stroke();
    }

    // head
    ctx.fillStyle = "#fffaf3";
    ctx.beginPath();
    ctx.ellipse(x, y - scale * .20, scale * .42, scale * .42, 0, 0, Math.PI * 2);
    ctx.fill();

    // ears
    ctx.fillStyle = "#fffaf3";
    ctx.beginPath();
    ctx.ellipse(x - scale * .18, y - scale * .68, scale * .11, scale * .30, -.18, 0, Math.PI * 2);
    ctx.ellipse(x + scale * .18, y - scale * .68, scale * .11, scale * .30, .18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f6d6d6";
    ctx.beginPath();
    ctx.ellipse(x - scale * .18, y - scale * .68, scale * .05, scale * .19, -.18, 0, Math.PI * 2);
    ctx.ellipse(x + scale * .18, y - scale * .68, scale * .05, scale * .19, .18, 0, Math.PI * 2);
    ctx.fill();

    // helmet
    ctx.fillStyle = "#d0d4dc";
    ctx.beginPath();
    ctx.arc(x, y - scale * .26, scale * .44, Math.PI, Math.PI * 2);
    ctx.lineTo(x + scale * .44, y - scale * .22);
    ctx.strokeStyle = "#808995";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fill();

    // face
    ctx.fillStyle = "#1b1b1b";
    const eyeShift = player.facing === "left" ? -3 : player.facing === "right" ? 3 : 0;
    ctx.beginPath();
    ctx.arc(x - scale * .12 + eyeShift, y - scale * .18, 2.4, 0, Math.PI * 2);
    ctx.arc(x + scale * .12 + eyeShift, y - scale * .18, 2.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#b88989";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x - scale * .10, y - scale * .02);
    ctx.quadraticCurveTo(x, y + scale * .05, x + scale * .10, y - scale * .02);
    ctx.stroke();

    ctx.fillStyle = "#f6b6b6";
    ctx.beginPath();
    ctx.arc(x, y - scale * .08, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }

  function renderRoom() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, view.width, view.height);

    // background
    ctx.fillStyle = "#b68654";
    ctx.fillRect(0, 0, view.width, view.height);

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    const wall = Math.min(world.width, world.height) * 0.05;
    const leftWall = wall;
    const rightWall = wall * 0.9;
    const bottomWall = wall * 1.05;

    // floor
    ctx.fillStyle = "#bf8d57";
    ctx.fillRect(0, 0, world.width, world.height);
    for (let y = wall; y < world.height - bottomWall; y += 44) {
      ctx.fillStyle = y % 88 === 0 ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.05)";
      ctx.fillRect(leftWall, y, world.width - leftWall - rightWall, 6);
    }

    // walls
    ctx.fillStyle = "#e7d6bd";
    ctx.fillRect(0, 0, world.width, wall);
    ctx.fillRect(0, 0, leftWall, world.height);
    ctx.fillRect(world.width - rightWall, 0, rightWall, world.height);
    ctx.fillRect(0, world.height - bottomWall, doorZone.x, bottomWall);
    ctx.fillRect(doorZone.x + doorZone.width, world.height - bottomWall, world.width - (doorZone.x + doorZone.width), bottomWall);

    ctx.fillStyle = "rgba(255,255,255,.24)";
    ctx.fillRect(0, wall - 8, world.width, 8);
    ctx.fillRect(leftWall - 8, 0, 8, world.height);

    drawWallDecor();

    for (const object of roomObjects) {
      switch (object.type) {
        case "burgerPoster":
          drawBurgerPoster(object);
          break;
        case "familyFrame":
          drawFamilyFrame(object);
          break;
        case "bed":
          drawBed(object);
          break;
        case "desk":
          drawDesk(object);
          break;
        case "shelf":
          drawShelf(object);
          break;
        case "rug":
          drawRug(object);
          break;
        case "chest":
          drawChest(object);
          break;
        case "table":
          drawTable(object);
          break;
      }
    }

    // simple little plant
    drawRoundedRect(world.width * .83, world.height * .79, world.width * .05, world.height * .05, 10, "#b27544", "#6b3b15");
    ctx.fillStyle = "#5cb96c";
    ctx.beginPath();
    ctx.ellipse(world.width * .855, world.height * .77, world.width * .03, world.height * .03, 0, 0, Math.PI * 2);
    ctx.fill();

    drawDoor();

    if (navigationTarget && (navigationPath.length || targetPulse > 0)) {
      const pulse = 1 + Math.sin(performance.now() / 110) * .10;
      const radius = 17 * pulse;
      ctx.save();
      ctx.globalAlpha = .42 + .28 * Math.max(0, targetPulse);
      ctx.strokeStyle = "#f5d45c";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(navigationTarget.x, navigationTarget.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(navigationTarget.x, navigationTarget.y, radius * .35, 0, Math.PI * 2);
      ctx.fillStyle = "#fff2a8";
      ctx.fill();
      ctx.restore();
    }

    drawPlayer();

    // door rug/path
    ctx.fillStyle = "rgba(76, 112, 154, .55)";
    drawRoundedRect(doorZone.x + doorZone.width * .14, doorZone.y - world.height * .09, doorZone.width * .72, world.height * .11, 18, "rgba(94, 142, 196, .65)", "rgba(61, 94, 136, .85)");

    ctx.restore();
  }

  function updatePlayer(dt) {
    if (navigationPath.length) {
      const waypoint = navigationPath[0];
      const dx = waypoint.x - player.x;
      const dy = waypoint.y - player.y;
      const distance = Math.hypot(dx, dy);
      const speed = Math.min(world.width, world.height) * 0.34;
      const step = speed * dt;

      if (distance <= Math.max(3, step)) {
        player.x = waypoint.x;
        player.y = waypoint.y;
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
          player.x = nextX;
          player.y = nextY;
        } else {
          // Dynamic safety: recalculate from the current location.
          if (navigationTarget) {
            navigationPath = findPath(
              { x: player.x, y: player.y },
              navigationTarget
            );
          } else {
            navigationPath = [];
          }
        }
      }
    }

    if (targetPulse > 0) {
      targetPulse = Math.max(0, targetPulse - dt * .8);
    }

    nearDoor = rectsOverlap(playerBounds(), doorZone);
    roomExitHint.classList.toggle("visible", nearDoor);

    if (nearDoor && !exitTriggered && player.y > world.height - doorZone.height - 60) {
      exitTriggered = true;
      saveRoomState();
      window.location.href = "proximo-comodo.html";
    }
  }

  roomCanvas.addEventListener("pointerdown", event => {
    if (anyBlockingOverlayOpen()) return;

    // A click/tap anywhere in the room becomes a destination.
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

  // ----------------------------------------------------------
  // Lifecycle
  // ----------------------------------------------------------
  window.addEventListener("pagehide", () => {
    disconnectRealtimeChat();
    saveRoomState();
  });

  window.addEventListener("resize", () => {
    navigationPath = [];
    navigationTarget = null;
    buildRoomLayout();
  });
  applyAudioSettings();
  renderInventory();
  buildRoomLayout();
  requestAnimationFrame(gameLoop);
})();
