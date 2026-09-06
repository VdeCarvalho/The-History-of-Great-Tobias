window.TobiasNameRegistry = (() => {
  const LOCAL_KEY = "tobias_registered_names_v1";

  const cfg = () =>
    window.TOBIAS_BACKEND || {
      mode: "local",
      supabaseUrl: "",
      supabaseAnonKey: "",
      maxSuffix: 99999
    };

  function cleanName(value) {
    return String(value ?? "")
      .trim()
      .replace(/\s+/g, " ");
  }

  function keyOf(name) {
    return cleanName(name).toLocaleLowerCase("pt-BR");
  }

  function validate(name) {
    const cleaned = cleanName(name);

    if (!cleaned) {
      return "Digite um nome.";
    }

    if (cleaned.length > 30) {
      return "O nome pode ter no máximo 30 caracteres.";
    }

    return "";
  }

  function loadLocal() {
    try {
      const value = JSON.parse(
        localStorage.getItem(LOCAL_KEY) || "[]"
      );

      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  function saveLocal(names) {
    localStorage.setItem(
      LOCAL_KEY,
      JSON.stringify(names)
    );
  }

  /*
    One-time migration for the current development build:
    an old local test had left "Tobias" reserved after its save was deleted.
    Remove only that stale local reservation once, without touching any save.
  */
  function runLocalMigrations() {
    const MIGRATION_KEY = "tobias_migration_release_stale_tobias_v1";

    if (cfg().mode !== "local") return;

    try {
      if (localStorage.getItem(MIGRATION_KEY) === "done") return;

      const names = loadLocal();
      const cleaned = names.filter(
        existing => keyOf(existing) !== keyOf("Tobias")
      );

      saveLocal(cleaned);
      localStorage.setItem(MIGRATION_KEY, "done");
    } catch {}
  }

  async function localSuggest(base) {
    base = cleanName(base);

    const used = new Set(
      loadLocal().map(keyOf)
    );

    if (!used.has(keyOf(base))) {
      return base;
    }

    const maxSuffix =
      Number(cfg().maxSuffix) || 99999;

    for (let i = 1; i <= maxSuffix; i++) {
      const candidate = `${base}_${i}`;

      if (!used.has(keyOf(candidate))) {
        return candidate;
      }
    }

    throw new Error(
      "Não há mais variações disponíveis para esse nome."
    );
  }

  async function localClaim(name) {
    const cleaned = cleanName(name);
    const names = loadLocal();
    const wanted = keyOf(cleaned);

    if (
      names.some(
        existing => keyOf(existing) === wanted
      )
    ) {
      return false;
    }

    names.push(cleaned);
    saveLocal(names);

    return true;
  }

  async function localRelease(name) {
    const wanted = keyOf(name);
    const names = loadLocal();

    const remaining = names.filter(
      existing => keyOf(existing) !== wanted
    );

    saveLocal(remaining);

    return remaining.length !== names.length;
  }

  function headers() {
    const c = cfg();

    return {
      apikey: c.supabaseAnonKey,
      Authorization: `Bearer ${c.supabaseAnonKey}`,
      "Content-Type": "application/json"
    };
  }

  function assertSupabaseConfigured() {
    const c = cfg();

    if (!c.supabaseUrl || !c.supabaseAnonKey) {
      throw new Error(
        "O registro global ainda não foi configurado."
      );
    }
  }

  async function rpc(functionName, payload) {
    assertSupabaseConfigured();

    const c = cfg();

    const response = await fetch(
      `${c.supabaseUrl.replace(/\/$/, "")}/rest/v1/rpc/${functionName}`,
      {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      throw new Error(
        (await response.text()) ||
        `Erro ${response.status}`
      );
    }

    return await response.json();
  }

  async function supabaseSuggest(base) {
    return await rpc(
      "suggest_username",
      {
        requested_name: cleanName(base)
      }
    );
  }

  async function supabaseClaim(name) {
    assertSupabaseConfigured();

    const c = cfg();
    const cleaned = cleanName(name);

    const response = await fetch(
      `${c.supabaseUrl.replace(/\/$/, "")}/rest/v1/players`,
      {
        method: "POST",
        headers: {
          ...headers(),
          Prefer: "return=minimal"
        },
        body: JSON.stringify({
          username: cleaned,
          username_key: keyOf(cleaned)
        })
      }
    );

    if (response.ok) {
      return true;
    }

    const body = await response.text();

    if (
      response.status === 409 ||
      /duplicate|unique|23505/i.test(body)
    ) {
      return false;
    }

    throw new Error(
      body || `Erro ${response.status}`
    );
  }

  async function supabaseRelease(name) {
    return Boolean(
      await rpc(
        "release_username",
        {
          requested_name: cleanName(name)
        }
      )
    );
  }

  async function suggest(name) {
    return cfg().mode === "supabase"
      ? supabaseSuggest(name)
      : localSuggest(name);
  }

  async function claim(name) {
    return cfg().mode === "supabase"
      ? supabaseClaim(name)
      : localClaim(name);
  }

  async function release(name) {
    return cfg().mode === "supabase"
      ? supabaseRelease(name)
      : localRelease(name);
  }

  runLocalMigrations();

  return {
    cleanName,
    keyOf,
    validate,
    suggest,
    claim,
    release
  };
})();
