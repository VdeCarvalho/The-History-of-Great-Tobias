window.TobiasSave = (() => {
  const SAVE_KEY = "tobias_save_v1";
  const INVENTORY_KEY = "tobias_inventory_v1";
  const EQUIPMENT_KEY = "tobias_equipment_v1";

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;

      const data = JSON.parse(raw);

      if (
        !data ||
        typeof data.playerName !== "string" ||
        !data.playerName.trim()
      ) {
        return null;
      }

      return data;
    } catch {
      return null;
    }
  }

  function create(playerName) {
    const save = {
      version: 1,
      playerName: String(playerName).trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    initializeTestInventory();
    return save;
  }

  function exists() {
    return !!load();
  }

  function clear() {
    localStorage.removeItem(SAVE_KEY);
  }

  function clearAllProgress() {
    const progressKeys = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (
        key === SAVE_KEY ||
        key === INVENTORY_KEY ||
        key === EQUIPMENT_KEY ||
        key === "tobias_game_state_v1" ||
        key === "tobias_quests_v1" ||
        key === "tobias_world_state_v1" ||
        (key && key.startsWith("tobias_progress_"))
      ) {
        progressKeys.push(key);
      }
    }

    progressKeys.forEach(key => localStorage.removeItem(key));
  }

  function loadInventory() {
    try {
      const parsed = JSON.parse(
        localStorage.getItem(INVENTORY_KEY) || "[]"
      );
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveInventory(inventory) {
    localStorage.setItem(
      INVENTORY_KEY,
      JSON.stringify(inventory)
    );
  }

  function loadEquipment() {
    try {
      const parsed = JSON.parse(
        localStorage.getItem(EQUIPMENT_KEY) || "{}"
      );
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  function saveEquipment(equipment) {
    localStorage.setItem(
      EQUIPMENT_KEY,
      JSON.stringify(equipment || {})
    );
  }

  /*
    Adds an item using exact-item stacking.
    Every stack has a hard cap of 9,999.
    If a stack is full, a new slot is used.
    Maximum inventory size: 100 slots.
  */
  function addItem(item) {
    const inventory = loadInventory();
    let remaining = Math.max(0, Number(item.quantity) || 0);

    if (!remaining) return { ok: true, added: 0 };

    const sameItem = slot =>
      slot &&
      slot.itemId === item.itemId &&
      slot.name === item.name &&
      slot.type === item.type &&
      Boolean(slot.equippable) === Boolean(item.equippable);

    for (const slot of inventory) {
      if (remaining <= 0) break;
      if (!sameItem(slot)) continue;
      if ((slot.quantity || 0) >= 9999) continue;

      const free = 9999 - slot.quantity;
      const moved = Math.min(free, remaining);

      slot.quantity += moved;
      remaining -= moved;
    }

    while (remaining > 0) {
      if (inventory.length >= 100) {
        saveInventory(inventory);
        return {
          ok: false,
          added: (Number(item.quantity) || 0) - remaining,
          reason: "inventory_full"
        };
      }

      const moved = Math.min(9999, remaining);

      inventory.push({
        ...item,
        quantity: moved
      });

      remaining -= moved;
    }

    saveInventory(inventory);

    return {
      ok: true,
      added: Number(item.quantity) || 0
    };
  }

  function initializeTestInventory() {
    if (localStorage.getItem(INVENTORY_KEY) !== null) {
      return;
    }

    const testItems = [
      {
        itemId: "metal_sword",
        name: "Espada de Metal",
        type: "Equipamento",
        equippable: true,
        icon: "⚔️",
        quantity: 1,
        description:
          "Uma espada metálica simples e confiável. Item temporário de teste do sistema de equipamentos.",
        craftable: true,
        crafting:
          "2 Barras de Metal + 1 Madeira"
      },
      {
        itemId: "refining_stone",
        name: "Pedra de Refino",
        type: "Material de refino",
        equippable: false,
        icon: "💎",
        quantity: 1,
        description:
          "Uma pedra utilizada no processo de refino. Item temporário de teste do inventário.",
        craftable: false,
        crafting:
          "Item não fabricável"
      }
    ];

    saveInventory(testItems);
  }

  return {
    SAVE_KEY,
    INVENTORY_KEY,
    EQUIPMENT_KEY,
    load,
    create,
    exists,
    clear,
    clearAllProgress,
    loadInventory,
    saveInventory,
    loadEquipment,
    saveEquipment,
    addItem,
    initializeTestInventory
  };
})();
