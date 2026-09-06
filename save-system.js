window.TobiasSave = (() => {
  const SAVE_KEY = "tobias_save_v1";

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
    return save;
  }

  function exists() {
    return !!load();
  }

  function clear() {
    localStorage.removeItem(SAVE_KEY);
  }

  /*
    Deletes game progress stored in this browser/device.
    Audio preferences are intentionally NOT deleted because they are
    interface preferences rather than game progress.
  */
  function clearAllProgress() {
    const progressKeys = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (
        key === SAVE_KEY ||
        key === "tobias_game_state_v1" ||
        key === "tobias_inventory_v1" ||
        key === "tobias_quests_v1" ||
        key === "tobias_world_state_v1" ||
        (key && key.startsWith("tobias_progress_"))
      ) {
        progressKeys.push(key);
      }
    }

    progressKeys.forEach(key => localStorage.removeItem(key));
  }

  return {
    SAVE_KEY,
    load,
    create,
    exists,
    clear,
    clearAllProgress
  };
})();
