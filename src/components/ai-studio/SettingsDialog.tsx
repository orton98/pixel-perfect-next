import * as React from "react";

import type { Presets, SettingsState } from "./types";
import { Modal } from "./Modal";
import { PresetEditor } from "./PresetEditor";

export function SettingsDialog({
  open,
  onClose,
  settings,
  setSettings,
  presets,
  setPresets,
}: {
  open: boolean;
  onClose: () => void;
  settings: SettingsState;
  setSettings: (next: SettingsState) => void;
  presets: Presets;
  setPresets: (next: Presets) => void;
}) {
  const sections = [
    { id: "general", label: "General" },
    { id: "ai", label: "AI" },
    { id: "profile", label: "Profile" },
    { id: "mindset", label: "Mindset" },
    { id: "skillset", label: "Skillset" },
    { id: "toolset", label: "Toolset" },
    { id: "data", label: "Data" },
    { id: "about", label: "About" },
  ] as const;

  const [section, setSection] = React.useState<(typeof sections)[number]["id"]>("general");

  const [revealOpenRouterKey, setRevealOpenRouterKey] = React.useState(false);
  const [openRouterKeyTest, setOpenRouterKeyTest] = React.useState<
    { status: "idle" | "testing" | "success" | "error"; message?: string }
  >({ status: "idle" });

  const STORAGE_OPENROUTER_MODELS = "ai_studio_openrouter_models_cache_v1";

  const defaultOpenRouterModels = [
    "openai/gpt-4o-mini",
    "openai/gpt-4o",
    "anthropic/claude-3.5-sonnet",
    "anthropic/claude-3.5-haiku",
    "google/gemini-2.0-flash",
    "meta-llama/llama-3.1-70b-instruct",
  ] as const;

  const [openRouterModelQuery, setOpenRouterModelQuery] = React.useState("");

  const [openRouterModelOptions, setOpenRouterModelOptions] = React.useState<string[]>(() => {
    const fallback = [...defaultOpenRouterModels] as string[];
    try {
      const raw = localStorage.getItem(STORAGE_OPENROUTER_MODELS);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw) as { models?: unknown };
      const models = Array.isArray(parsed.models) ? parsed.models.map((m) => String(m)) : [];
      return models.length ? models : fallback;
    } catch {
      return fallback;
    }
  });

  const [openRouterModelsFetch, setOpenRouterModelsFetch] = React.useState<
    { status: "idle" | "fetching" | "success" | "error"; message?: string }
  >({ status: "idle" });

  const testOpenRouterKey = async () => {
    const key = settings.openRouterApiKey.trim();
    if (!key) {
      setOpenRouterKeyTest({ status: "error", message: "Paste a key first." });
      return;
    }

    setOpenRouterKeyTest({ status: "testing", message: "Testing…" });
    try {
      const resp = await fetch("https://openrouter.ai/api/v1/auth/key", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${key}`,
        },
      });

      if (!resp.ok) {
        setOpenRouterKeyTest({
          status: "error",
          message: resp.status === 401 ? "Invalid key." : `Request failed (${resp.status}).`,
        });
        return;
      }

      setOpenRouterKeyTest({ status: "success", message: "Key looks valid." });
    } catch {
      setOpenRouterKeyTest({ status: "error", message: "Network error." });
    }
  };

  const fetchOpenRouterModels = async () => {
    const key = settings.openRouterApiKey.trim();
    if (!key) {
      setOpenRouterModelsFetch({ status: "error", message: "Paste a key first." });
      return;
    }

    setOpenRouterModelsFetch({ status: "fetching", message: "Fetching…" });

    try {
      const resp = await fetch("https://openrouter.ai/api/v1/models", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${key}`,
        },
      });

      if (!resp.ok) {
        setOpenRouterModelsFetch({
          status: "error",
          message: resp.status === 401 ? "Invalid key." : `Request failed (${resp.status}).`,
        });
        return;
      }

      const data = (await resp.json()) as { data?: Array<{ id?: string }> };
      const ids = (data.data ?? [])
        .map((m) => String(m.id || "").trim())
        .filter(Boolean);

      if (!ids.length) {
        setOpenRouterModelsFetch({ status: "error", message: "No models returned." });
        return;
      }

      // Deduplicate and keep things stable.
      const unique = Array.from(new Set(ids));
      setOpenRouterModelOptions(unique);

      try {
        localStorage.setItem(
          STORAGE_OPENROUTER_MODELS,
          JSON.stringify({ updatedAt: Date.now(), models: unique }),
        );
      } catch {
        // Ignore quota / private mode errors.
      }

      setOpenRouterModelsFetch({ status: "success", message: `${unique.length} models loaded.` });

      // If current selection isn't in the fetched list, keep it (it remains selectable via the special option below).
    } catch {
      setOpenRouterModelsFetch({ status: "error", message: "Network error." });
    }
  };

  React.useEffect(() => {
    // Auto-hide the key when switching sections.
    setRevealOpenRouterKey(false);
  }, [section]);

  React.useEffect(() => {
    // Reset test/fetch states whenever the key changes.
    // (Model list is cached independently in localStorage.)
    setOpenRouterKeyTest({ status: "idle" });
    setOpenRouterModelsFetch({ status: "idle" });
  }, [settings.openRouterApiKey]);

  const filteredOpenRouterModels = React.useMemo(() => {
    const q = openRouterModelQuery.trim().toLowerCase();
    if (!q) return openRouterModelOptions;
    return openRouterModelOptions.filter((m) => m.toLowerCase().includes(q));
  }, [openRouterModelOptions, openRouterModelQuery]);

  React.useEffect(() => {
    if (!open) setSection("general");
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Settings"
      footer={
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Changes are saved locally in this demo.</p>
          <button
            type="button"
            className="inline-flex items-center rounded-full border border-border bg-transparent px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      }
    >
      <div className="grid min-h-[520px] grid-cols-1 md:grid-cols-[260px_1fr]">
        <div className="border-b p-5 md:border-b-0 md:border-r" style={{ borderColor: `hsl(var(--border))` }}>
          <nav className="space-y-2">
            {sections.map((s) => {
              const active = s.id === section;
              return (
                <button
                  key={s.id}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors"
                  style={{
                    background: active ? `hsl(var(--accent))` : "transparent",
                    boxShadow: active ? `0 0 0 2px hsl(var(--primary) / 0.35)` : "none",
                  }}
                  onClick={() => setSection(s.id)}
                  type="button"
                >
                  <span className="text-base">{s.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {section === "general" ? (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-base font-semibold">General</h3>
                <p className="text-sm" style={{ color: `hsl(var(--muted-foreground))` }}>
                  Interface & behavior
                </p>
              </div>

              <div className="space-y-3">
                <label
                  className="flex items-center justify-between gap-4 rounded-2xl border px-4 py-4"
                  style={{ borderColor: `hsl(var(--border))`, background: `hsl(var(--background) / 0.20)` }}
                >
                  <div>
                    <p className="text-sm font-medium">Compact mode</p>
                    <p className="text-sm" style={{ color: `hsl(var(--muted-foreground))` }}>
                      Tighter spacing in chat and sidebar.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.compactMode}
                    onChange={(e) => setSettings({ ...settings, compactMode: e.target.checked })}
                  />
                </label>

                <label
                  className="flex items-center justify-between gap-4 rounded-2xl border px-4 py-4"
                  style={{ borderColor: `hsl(var(--border))`, background: `hsl(var(--background) / 0.20)` }}
                >
                  <div>
                    <p className="text-sm font-medium">Show timestamps</p>
                    <p className="text-sm" style={{ color: `hsl(var(--muted-foreground))` }}>
                      Display message time in the chat thread.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showTimestamps}
                    onChange={(e) => setSettings({ ...settings, showTimestamps: e.target.checked })}
                  />
                </label>

                <label
                  className="flex items-center justify-between gap-4 rounded-2xl border px-4 py-4"
                  style={{ borderColor: `hsl(var(--border))`, background: `hsl(var(--background) / 0.20)` }}
                >
                  <div>
                    <p className="text-sm font-medium">Sidebar auto-close on mobile</p>
                    <p className="text-sm" style={{ color: `hsl(var(--muted-foreground))` }}>
                      Close sidebar after selecting a chat on small screens.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.sidebarAutoCloseMobile}
                    onChange={(e) => setSettings({ ...settings, sidebarAutoCloseMobile: e.target.checked })}
                  />
                </label>
              </div>
            </div>
          ) : null}

          {section === "ai" ? (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-base font-semibold">AI</h3>
                <p className="text-sm" style={{ color: `hsl(var(--muted-foreground))` }}>
                  Provider & model (MVP: selection only)
                </p>
              </div>

              <div
                className="rounded-2xl border p-4"
                style={{ borderColor: `hsl(var(--border))`, background: `hsl(var(--background) / 0.10)` }}
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-medium">Provider</span>
                    <select
                      className="h-10 w-full rounded-xl border bg-transparent px-3"
                      style={{ borderColor: `hsl(var(--border))` }}
                      value={settings.llmProvider}
                      onChange={() => setSettings({ ...settings, llmProvider: "openrouter" })}
                    >
                      <option value="openrouter">OpenRouter</option>
                    </select>
                    <p className="text-xs" style={{ color: `hsl(var(--muted-foreground))` }}>
                      MVP: preferences only.
                    </p>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium">Model</span>

                    <input
                      className="h-10 w-full rounded-xl border bg-transparent px-3"
                      style={{ borderColor: `hsl(var(--border))` }}
                      value={openRouterModelQuery}
                      onChange={(e) => setOpenRouterModelQuery(e.target.value)}
                      placeholder="Search models…"
                      autoComplete="off"
                    />

                    <select
                      className="h-10 w-full rounded-xl border bg-transparent px-3"
                      style={{ borderColor: `hsl(var(--border))` }}
                      value={settings.llmModel}
                      onChange={(e) => setSettings({ ...settings, llmModel: e.target.value })}
                    >
                      {!openRouterModelOptions.includes(settings.llmModel) ? (
                        <option value={settings.llmModel}>{settings.llmModel}</option>
                      ) : null}
                      {filteredOpenRouterModels.length ? (
                        filteredOpenRouterModels.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>
                          No matches
                        </option>
                      )}
                    </select>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs" style={{ color: `hsl(var(--muted-foreground))` }}>
                        This only saves your preference.
                      </p>
                      <div className="flex items-center gap-3">
                        {openRouterModelsFetch.status !== "idle" ? (
                          <span
                            className="text-xs"
                            style={{
                              color:
                                openRouterModelsFetch.status === "success"
                                  ? `hsl(var(--primary))`
                                  : openRouterModelsFetch.status === "error"
                                    ? `hsl(var(--destructive))`
                                    : `hsl(var(--muted-foreground))`,
                            }}
                          >
                            {openRouterModelsFetch.message}
                          </span>
                        ) : null}
                        <button
                          type="button"
                          className="inline-flex h-9 items-center rounded-xl border border-border bg-transparent px-3 text-xs text-foreground transition-colors hover:bg-accent disabled:opacity-50"
                          onClick={fetchOpenRouterModels}
                          disabled={openRouterModelsFetch.status === "fetching"}
                        >
                          {openRouterModelsFetch.status === "fetching" ? "Fetching…" : "Fetch models"}
                        </button>
                      </div>
                    </div>
                  </label>

                  <div className="md:col-span-2">
                    <label className="space-y-2">
                      <span className="text-sm font-medium">OpenRouter API key</span>
                      <div className="flex gap-2">
                        <input
                          className="h-10 w-full rounded-xl border bg-transparent px-3"
                          style={{ borderColor: `hsl(var(--border))` }}
                          type={revealOpenRouterKey ? "text" : "password"}
                          value={settings.openRouterApiKey}
                          onChange={(e) => setSettings({ ...settings, openRouterApiKey: e.target.value })}
                          placeholder="sk-or-…"
                          autoComplete="off"
                          spellCheck={false}
                        />
                        <button
                          type="button"
                          className="inline-flex h-10 shrink-0 items-center rounded-xl border border-border bg-transparent px-3 text-sm text-foreground transition-colors hover:bg-accent"
                          onClick={() => setRevealOpenRouterKey((v) => !v)}
                        >
                          {revealOpenRouterKey ? "Hide" : "Show"}
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs" style={{ color: `hsl(var(--muted-foreground))` }}>
                          Not secure in MVP: stored in localStorage on this device.
                        </p>
                        <div className="flex items-center gap-3">
                          {openRouterKeyTest.status !== "idle" ? (
                            <span
                              className="text-xs"
                              style={{
                                color:
                                  openRouterKeyTest.status === "success"
                                    ? `hsl(var(--primary))`
                                    : openRouterKeyTest.status === "error"
                                      ? `hsl(var(--destructive))`
                                      : `hsl(var(--muted-foreground))`,
                              }}
                            >
                              {openRouterKeyTest.message}
                            </span>
                          ) : null}
                          <button
                            type="button"
                            className="inline-flex h-9 items-center rounded-xl border border-border bg-transparent px-3 text-xs text-foreground transition-colors hover:bg-accent disabled:opacity-50"
                            onClick={testOpenRouterKey}
                            disabled={openRouterKeyTest.status === "testing"}
                          >
                            {openRouterKeyTest.status === "testing" ? "Testing…" : "Test key"}
                          </button>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {section === "mindset" ? (
            <PresetEditor
              title="Mindset"
              description="Edit and add mindsets (shown in the chat composer)."
              items={presets.mindset}
              allowExtra={false}
              onChange={(next) => setPresets({ ...presets, mindset: next })}
            />
          ) : null}

          {section === "skillset" ? (
            <PresetEditor
              title="Skillset"
              description="Edit and add skillsets (shown in the chat composer)."
              items={presets.skillset}
              allowExtra={false}
              onChange={(next) => setPresets({ ...presets, skillset: next })}
            />
          ) : null}

          {section === "toolset" ? (
            <PresetEditor
              title="Toolset"
              description="Edit and add toolsets (shown in the chat composer)."
              items={presets.toolset}
              allowExtra={true}
              onChange={(next) => setPresets({ ...presets, toolset: next })}
            />
          ) : null}

          {section === "profile" ? (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-base font-semibold">Profile</h3>
                <p className="text-sm" style={{ color: `hsl(var(--muted-foreground))` }}>
                  Account
                </p>
              </div>
              <div
                className="rounded-2xl border p-4"
                style={{ borderColor: `hsl(var(--border))`, background: `hsl(var(--background) / 0.10)` }}
              >
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium">Name</span>
                  <span className="text-sm">User</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium">Email address</span>
                  <span className="text-sm" style={{ color: `hsl(var(--muted-foreground))` }}>
                    —
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          {section === "data" ? (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-base font-semibold">Data</h3>
                <p className="text-sm" style={{ color: `hsl(var(--muted-foreground))` }}>
                  Sharing & exports
                </p>
              </div>
              <div
                className="rounded-2xl border p-4"
                style={{ borderColor: `hsl(var(--border))`, background: `hsl(var(--background) / 0.10)` }}
              >
                <p className="text-sm" style={{ color: `hsl(var(--muted-foreground))` }}>
                  This single-file demo stores settings and presets in localStorage.
                </p>
              </div>
            </div>
          ) : null}

          {section === "about" ? (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-base font-semibold">About</h3>
                <p className="text-sm" style={{ color: `hsl(var(--muted-foreground))` }}>
                  Legal
                </p>
              </div>
              <div
                className="rounded-2xl border p-4"
                style={{ borderColor: `hsl(var(--border))`, background: `hsl(var(--background) / 0.10)` }}
              >
                <p className="text-sm" style={{ color: `hsl(var(--muted-foreground))` }}>
                  Single-file HTML build for offline/demo use.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
