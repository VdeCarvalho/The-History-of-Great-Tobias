(() => {
  const save = window.TobiasSave ? TobiasSave.load() : null;

  if (!save) {
    window.location.replace("nome.html");
    return;
  }

  TobiasSave.initializeTestInventory();

  const AUDIO_KEY = "tobias_audio_settings_v1";

  const gameplayStage = document.getElementById("gameplayStage");
  const playerChip = document.getElementById("playerChip");

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
  let chatRecoveryTimer = null;


  const CHAT_USER_COLOR_KEY =
    "tobias_chat_username_colors_v3";

  /*
    Every new username receives the next unused color.
    Therefore different visible users are guaranteed different colors
    until all 32 colors are used. Repetition is allowed after that.
  */
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
    return String(username || "")
      .trim()
      .toLocaleLowerCase("pt-BR");
  }

  function loadChatUserColorMap() {
    try {
      const parsed = JSON.parse(
        localStorage.getItem(
          CHAT_USER_COLOR_KEY
        ) || "{}"
      );

      return (
        parsed &&
        typeof parsed === "object"
      )
        ? parsed
        : {};
    } catch {
      return {};
    }
  }

  let chatUserColorMap =
    loadChatUserColorMap();

  function saveChatUserColorMap() {
    try {
      localStorage.setItem(
        CHAT_USER_COLOR_KEY,
        JSON.stringify(
          chatUserColorMap
        )
      );
    } catch {}
  }

  function ensureChatUserColors(messages) {
    const usedColors =
      new Set(
        Object.values(
          chatUserColorMap
        )
      );

    for (const message of messages) {
      const key =
        normalizeChatUsername(
          message.username
        );

      if (
        !key ||
        chatUserColorMap[key]
      ) {
        continue;
      }

      let chosenColor = null;

      for (
        const candidate
        of CHAT_USER_COLORS
      ) {
        if (
          !usedColors.has(
            candidate
          )
        ) {
          chosenColor =
            candidate;

          break;
        }
      }

      if (!chosenColor) {
        const index =
          Object.keys(
            chatUserColorMap
          ).length %
          CHAT_USER_COLORS.length;

        chosenColor =
          CHAT_USER_COLORS[index];
      }

      chatUserColorMap[key] =
        chosenColor;

      usedColors.add(
        chosenColor
      );
    }

    saveChatUserColorMap();
  }

  function colorForUsername(username) {
    const key =
      normalizeChatUsername(
        username
      );

    if (!chatUserColorMap[key]) {
      ensureChatUserColors([
        { username }
      ]);
    }

    return (
      chatUserColorMap[key] ||
      "#F2C14E"
    );
  }

  const TOBIAS_EMOJIS = {
    ":tobias_nervoso:": {
      src: "tobias_nervoso.png",
      label: "Tobias nervoso"
    },
    ":tobias_apaixonado:": {
      src: "tobias_apaixonado.png",
      label: "Tobias apaixonado"
    },
    ":tobias_sorridente:": {
      src: "tobias_sorridente.png",
      label: "Tobias sorridente"
    },
    ":tobias_chorando:": {
      src: "tobias_chorando.png",
      label: "Tobias chorando"
    },
    ":tobias_gargalhada:": {
      src: "tobias_gargalhada.png",
      label: "Tobias dando gargalhada"
    }
  };

  let selectedTobiasEmojis = [];

  function messageEmojiTokens(body) {
    return String(body || "").match(
      /:tobias_(?:nervoso|apaixonado|sorridente|chorando|gargalhada):/g
    ) || [];
  }

  function messageIsEmojiOnly(body) {
    const stripped =
      String(body || "")
        .replace(
          /:tobias_(?:nervoso|apaixonado|sorridente|chorando|gargalhada):/g,
          ""
        )
        .trim();

    return (
      stripped === "" &&
      messageEmojiTokens(body).length > 0
    );
  }

  function renderMessageContent(container, body) {
    const source = String(body || "");

    const tokenPattern =
      /(:tobias_(?:nervoso|apaixonado|sorridente|chorando|gargalhada):)/g;

    const parts = source.split(tokenPattern);

    for (const part of parts) {
      const emoji = TOBIAS_EMOJIS[part];

      if (emoji) {
        const image =
          document.createElement("img");

        image.className =
          "chat-custom-emoji";

        image.src = emoji.src;
        image.alt = emoji.label;
        image.title = emoji.label;

        container.appendChild(image);
      } else if (part) {
        container.appendChild(
          document.createTextNode(part)
        );
      }
    }

    container.classList.toggle(
      "emoji-only",
      messageIsEmojiOnly(source)
    );
  }

  function renderEmojiDraft() {
    chatEmojiDraft.innerHTML = "";

    if (!selectedTobiasEmojis.length) {
      chatEmojiDraft.hidden = true;
      return;
    }

    chatEmojiDraft.hidden = false;

    selectedTobiasEmojis.forEach(
      (token, index) => {
        const emoji =
          TOBIAS_EMOJIS[token];

        if (!emoji) return;

        const chip =
          document.createElement("button");

        chip.type = "button";
        chip.className =
          "chat-emoji-draft-chip";

        chip.setAttribute(
          "aria-label",
          `Remover ${emoji.label}`
        );

        const image =
          document.createElement("img");

        image.src = emoji.src;
        image.alt = emoji.label;

        const remove =
          document.createElement("span");

        remove.textContent = "×";
        remove.setAttribute(
          "aria-hidden",
          "true"
        );

        chip.appendChild(image);
        chip.appendChild(remove);

        chip.addEventListener(
          "click",
          () => {
            selectedTobiasEmojis.splice(
              index,
              1
            );

            renderEmojiDraft();
          }
        );

        chatEmojiDraft.appendChild(chip);
      }
    );
  }

  function closeTobiasEmojiPicker() {
    tobiasEmojiPicker.classList.remove("open");
    tobiasEmojiPicker.setAttribute(
      "aria-hidden",
      "true"
    );

    tobiasEmojiToggle.setAttribute(
      "aria-expanded",
      "false"
    );
  }

  function openTobiasEmojiPicker() {
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

    tobiasEmojiPicker.classList.add("open");
    tobiasEmojiPicker.setAttribute(
      "aria-hidden",
      "false"
    );

    tobiasEmojiToggle.setAttribute(
      "aria-expanded",
      "true"
    );
  }


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

    if (!cleaned) {
      return null;
    }

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

      currentChatMessages =
        messages.slice(-1000);

      renderChat(
        currentChatMessages,
        true
      );

      return message;
    }

    const client =
      getRealtimeClient();

    /*
      Return the inserted row immediately.
      This makes the sender's message appear even if the WebSocket event
      is delayed or reconnecting. appendRealtimeMessage() prevents duplicates
      when the same INSERT later arrives through Realtime.
    */
    const {
      data,
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
      })
      .select(
        "id,username,body,created_at"
      )
      .single();

    if (error) {
      throw error;
    }

    if (data) {
      appendRealtimeMessage(data);
    }

    return data || null;
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
    ensureChatUserColors(messages);

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

        const userColor =
          colorForUsername(
            message.username
          );

        user.style.setProperty(
          "color",
          userColor,
          "important"
        );

        user.style.setProperty(
          "-webkit-text-fill-color",
          userColor,
          "important"
        );

        row.style.setProperty(
          "--chat-user-color",
          userColor
        );

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

        renderMessageContent(
          body,
          message.body
        );

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

  async function reconcileChatMessages() {
    if (
      !chatPanel.classList.contains(
        "open"
      )
    ) {
      return;
    }

    try {
      const latest =
        await fetchChatMessages();

      currentChatMessages =
        latest.slice(-1000);

      renderChat(
        currentChatMessages,
        false
      );
    } catch (error) {
      console.warn(
        "Chat reconciliation failed:",
        error
      );
    }
  }

  function startChatRecovery() {
    stopChatRecovery();

    /*
      Realtime remains the primary transport.
      This low-frequency reconciliation only repairs a missed event or
      a temporary WebSocket interruption.
    */
    chatRecoveryTimer =
      window.setInterval(
        reconcileChatMessages,
        15000
      );
  }

  function stopChatRecovery() {
    if (
      chatRecoveryTimer !== null
    ) {
      clearInterval(
        chatRecoveryTimer
      );

      chatRecoveryTimer = null;
    }
  }

  async function disconnectRealtimeChat() {
    stopChatRecovery();

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

    /*
      Do not focus the input here.
      Opening the chat is read-only until the player taps the field.
    */
    try {
      currentChatMessages =
        await fetchChatMessages();

      renderChat(
        currentChatMessages,
        true
      );

      /*
        Realtime is started independently from the initial SELECT.
        If subscription has a temporary problem, already-loaded messages
        and sending still work.
      */
      try {
        await connectRealtimeChat();
      } catch (realtimeError) {
        console.warn(
          "Realtime connection failed:",
          realtimeError
        );
      }

      startChatRecovery();
    } catch (error) {
      console.error(
        "Initial chat load failed:",
        error
      );

      /*
        Keep the interface usable and retry shortly instead of leaving
        a permanently empty/broken panel.
      */
      currentChatMessages = [];
      renderChat(
        currentChatMessages,
        true
      );

      startChatRecovery();
    }
  }

  // ----------------------------------------------------------
  // TOBIAS EMOTICON PICKER
  // ----------------------------------------------------------
  tobiasEmojiToggle.addEventListener(
    "click",
    () => {
      if (
        tobiasEmojiPicker.classList.contains(
          "open"
        )
      ) {
        closeTobiasEmojiPicker();
      } else {
        openTobiasEmojiPicker();
      }
    }
  );

  document
    .querySelectorAll(
      "[data-tobias-emoji]"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          const token =
            button.dataset.tobiasEmoji;

          if (
            !TOBIAS_EMOJIS[token] ||
            selectedTobiasEmojis.length >= 8
          ) {
            return;
          }

          selectedTobiasEmojis.push(
            token
          );

          renderEmojiDraft();
          closeTobiasEmojiPicker();
        }
      );
    });

  chatInput.addEventListener(
    "focus",
    closeTobiasEmojiPicker
  );

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

      closeTobiasEmojiPicker();

      selectedTobiasEmojis = [];
      renderEmojiDraft();

      await disconnectRealtimeChat();
      hidePanel(chatPanel);
    }
  );

  chatForm.addEventListener(
    "submit",
    async event => {
      event.preventDefault();

      const typedText =
        chatInput.value.trim();

      const emojiText =
        selectedTobiasEmojis.join(" ");

      const body =
        [typedText, emojiText]
          .filter(Boolean)
          .join(" ")
          .trim();

      if (!body) return;

      if (body.length > 500) {
        return;
      }

      const keyboardWasOpen =
        document.activeElement ===
        chatInput;

      chatSend.disabled = true;

      try {
        await sendChatMessage(body);

        chatInput.value = "";

        selectedTobiasEmojis = [];
        renderEmojiDraft();
        closeTobiasEmojiPicker();

        if (keyboardWasOpen) {
          chatInput.focus();
        }
      } catch (error) {
        console.error(error);

        console.error(
          "Não foi possível enviar a mensagem.",
          error
        );
      } finally {
        chatSend.disabled = false;
      }
    }
  );

  // ----------------------------------------------------------
  // GAME HUD HIDE / RESTORE
  // ----------------------------------------------------------
  function isHudHidden() {
    return gameplayStage.classList.contains(
      "hud-hidden"
    );
  }

  function hideGameHud() {
    gameplayStage.classList.add(
      "hud-hidden"
    );
  }

  function showGameHud() {
    gameplayStage.classList.remove(
      "hud-hidden"
    );
  }

  function anyGamePanelOpen() {
    return allPanels.some(
      panel =>
        panel &&
        panel.classList.contains(
          "open"
        )
    );
  }

  gameplayStage.addEventListener(
    "click",
    event => {
      /*
        The ad is outside gameplayStage.
        Empty-area clicks hide the HUD; controls do not.
      */
      if (
        isHudHidden() ||
        anyGamePanelOpen()
      ) {
        return;
      }

      if (
        event.target.closest(
          "button, a, input, form, label, " +
          ".player-chip, .game-side-menu, .game-left-menu"
        )
      ) {
        return;
      }

      hideGameHud();
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
