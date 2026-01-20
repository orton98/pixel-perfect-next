import * as React from "react";

import type { Presets, Session, SettingsState } from "./types";
import { Modal } from "./Modal";
import { PresetEditor } from "./PresetEditor";
import { defaultPresets, defaultSettings, STORAGE_OLLAMA_MODELS, STORAGE_OPENROUTER_MODELS } from "./storage";
import { fetchOllamaModels, fetchOpenRouterModels } from "./aiRuntime";
import {
  applyImportedLocalData,
  buildLocalExportPayload,
  exportLocalData,
  parseAndValidateImportPayload,
  resetLocalData,
} from "./dataPortability";

export function SettingsDialog({
  open,
  onClose,
  settings,
  setSettings,
  presets,
  setPresets,
  sessions,
  setSessions,
  activeSessionId,
  setActiveSessionId,
}: {
  open: boolean;
  onClose: () => void;
  settings: SettingsState;
  setSettings: (next: SettingsState) => void;
  presets: Presets;
  setPresets: (next: Presets) => void;
  sessions: Session[];
  setSessions: (updater: Session[] | ((prev: Session[]) => Session[])) => void;
  activeSessionId: string;
  setActiveSessionId: (next: string) => void;
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

  const defaultOpenRouterModels = [
    "openai/gpt-4o-mini",
    "openai/gpt-4o",
    "anthropic/claude-3.5-sonnet",
    "anthropic/claude-3.5-haiku",
    "google/gemini-2.0-flash",
    "meta-llama/llama-3.1-70b-instruct",
  ] as const;

  const [modelQuery, setModelQuery] = React.useState("");

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

  const [ollamaModelOptions, setOllamaModelOptions] = React.useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_OLLAMA_MODELS);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as { models?: unknown };
      const models = Array.isArray(parsed.models) ? parsed.models.map((m) => String(m)) : [];
      return models.length ? models : [];
    } catch {
      return [];
    }
  });

  const [openRouterFetch, setOpenRouterFetch] = React.useState<{ status: "idle" | "fetching" | "success" | "error"; message?: string }>({
    status: "idle",
  });

  const [ollamaFetch, setOllamaFetch] = React.useState<{ status: "idle" | "fetching" | "success" | "error"; message?: string }>({
    status: "idle",
  });

  const filteredOpenRouterModels = React.useMemo(() => {
    const q = modelQuery.trim().toLowerCase();
    if (!q) return openRouterModelOptions;
    return openRouterModelOptions.filter((m) => m.toLowerCase().includes(q));
  }, [openRouterModelOptions, modelQuery]);

  const filteredOllamaModels = React.useMemo(() => {
    const q = modelQuery.trim().toLowerCase();
    if (!q) return ollamaModelOptions;
    return ollamaModelOptions.filter((m) => m.toLowerCase().includes(q));
  }, [ollamaModelOptions, modelQuery]);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [importStatus, setImportStatus] = React.useState<{ status: "idle" | "success" | "error"; message?: string }>({
    status: "idle",
  });

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
          <p className="text-sm text-muted-foreground">Changes are saved locally on this device.</p>
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
      <div className="grid h-full min-h-0 grid-cols-1 md:grid-cols-[260px_1fr]">
        <div
          className="border-b p-4 sm:p-5 md:border-b-0 md:border-r"
          style={{ borderColor: `hsl(var(--border))` }}
        >
          <nav className="custom-scrollbar flex gap-2 overflow-x-auto md:block md:space-y-2 md:overflow-visible">
            {sections.map((s) => {
              const active = s.id === section;
              return (
                <button
                  key={s.id}
                  className="flex w-full shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors md:w-full"
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

        <div className="min-h-0 p-4 sm:p-6">
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
                  Choose a runtime for local development.
                </p>
              </div>

              <div
                className="rounded-2xl border p-4"
                style={{ borderColor: `hsl(var(--border))`, background: `hsl(var(--background) / 0.10)` }}
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-medium">Runtime</span>
                    <select
                      className="h-10 w-full rounded-xl border bg-transparent px-3"
                      style={{ borderColor: `hsl(var(--border))` }}
                      value={settings.aiRuntime}
                      onChange={(e) => {
                        const next = e.target.value as SettingsState["aiRuntime"];
                        setSettings({ ...settings, aiRuntime: next });
                        setModelQuery("");
                      }}
                    >
                      <option value="disabled">Disabled (no AI calls)</option>
                      <option value="ollama">Ollama (localhost)</option>
                      <option value="openrouter_byok">OpenRouter (BYOK — local/dev only)</option>
                    </select>
                    <p className="text-xs" style={{ color: `hsl(var(--muted-foreground))` }}>
                      For production, use a server-side integration to keep keys safe.
                    </p>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium">Context</span>
                    <select
                      className="h-10 w-full rounded-xl border bg-transparent px-3"
                      style={{ borderColor: `hsl(var(--border))` }}
                      value={settings.contextMode}
                      onChange={(e) => setSettings({ ...settings, contextMode: e.target.value as SettingsState["contextMode"] })}
                    >
                      <option value="lastN">Last N messages</option>
                      <option value="full">Full chat history</option>
                    </select>
                    {settings.contextMode === "lastN" ? (
                      <div className="flex items-center gap-2">
                        <input
                          className="h-10 w-full rounded-xl border bg-transparent px-3"
                          style={{ borderColor: `hsl(var(--border))` }}
                          type="number"
                          min={1}
                          max={200}
                          value={settings.contextLastN}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              contextLastN: Math.max(1, Math.min(200, Number(e.target.value || 20))),
                            })
                          }
                        />
                        <span className="text-xs" style={{ color: `hsl(var(--muted-foreground))` }}>
                          msgs
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs" style={{ color: `hsl(var(--muted-foreground))` }}>
                        Sends the entire conversation each time.
                      </p>
                    )}
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium">Model</span>
                    <input
                      className="h-10 w-full rounded-xl border bg-transparent px-3"
                      style={{ borderColor: `hsl(var(--border))` }}
                      value={modelQuery}
                      onChange={(e) => setModelQuery(e.target.value)}
                      placeholder="Search models…"
                      autoComplete="off"
                    />

                    <select
                      className="h-10 w-full rounded-xl border bg-transparent px-3"
                      style={{ borderColor: `hsl(var(--border))` }}
                      value={settings.llmModel}
                      onChange={(e) => setSettings({ ...settings, llmModel: e.target.value })}
                      disabled={settings.aiRuntime === "disabled"}
                    >
                      {settings.aiRuntime === "ollama" ? (
                        filteredOllamaModels.length ? (
                          filteredOllamaModels.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>
                            No Ollama models found
                          </option>
                        )
                      ) : filteredOpenRouterModels.length ? (
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
                  </label>

                  {settings.aiRuntime === "ollama" ? (
                    <div className="md:col-span-2">
                      <div className="rounded-xl border px-4 py-3" style={{ borderColor: `hsl(var(--border))` }}>
                        <p className="text-sm font-medium">Ollama (localhost)</p>
                        <p className="mt-1 text-sm" style={{ color: `hsl(var(--muted-foreground))` }}>
                          Requires Ollama running locally. If requests fail, it’s usually a CORS issue.
                        </p>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
                        <label className="space-y-2">
                          <span className="text-sm font-medium">Base URL</span>
                          <input
                            className="h-10 w-full rounded-xl border bg-transparent px-3"
                            style={{ borderColor: `hsl(var(--border))` }}
                            value={settings.ollamaBaseUrl}
                            onChange={(e) => setSettings({ ...settings, ollamaBaseUrl: e.target.value })}
                            placeholder="http://localhost:11434"
                            autoComplete="off"
                            spellCheck={false}
                          />
                        </label>

                        <div className="flex flex-col justify-end">
                          <button
                            type="button"
                            className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-transparent px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
                            onClick={async () => {
                              setOllamaFetch({ status: "fetching", message: "Fetching…" });
                              try {
                                const models = await fetchOllamaModels(settings.ollamaBaseUrl);
                                setOllamaModelOptions(models);
                                localStorage.setItem(
                                  STORAGE_OLLAMA_MODELS,
                                  JSON.stringify({ updatedAt: Date.now(), models }),
                                );
                                if (models.length && settings.llmModel.trim() === "") {
                                  setSettings({ ...settings, llmModel: models[0] });
                                }
                                setOllamaFetch({ status: "success", message: `${models.length} models loaded.` });
                              } catch (e) {
                                setOllamaFetch({ status: "error", message: e instanceof Error ? e.message : "Failed." });
                              }
                            }}
                            disabled={ollamaFetch.status === "fetching"}
                          >
                            {ollamaFetch.status === "fetching" ? "Fetching…" : "Fetch models"}
                          </button>
                          {ollamaFetch.status !== "idle" ? (
                            <p
                              className="mt-2 text-xs"
                              style={{
                                color:
                                  ollamaFetch.status === "success"
                                    ? `hsl(var(--primary))`
                                    : ollamaFetch.status === "error"
                                      ? `hsl(var(--destructive))`
                                      : `hsl(var(--muted-foreground))`,
                              }}
                            >
                              {ollamaFetch.message}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {settings.aiRuntime === "openrouter_byok" ? (
                    <div className="md:col-span-2">
                      <div className="rounded-xl border px-4 py-3" style={{ borderColor: `hsl(var(--border))` }}>
                        <p className="text-sm font-medium">OpenRouter (BYOK — local/dev only)</p>
                        <p className="mt-1 text-sm" style={{ color: `hsl(var(--muted-foreground))` }}>
                          This calls OpenRouter directly from your browser. Not safe for production.
                        </p>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
                        <label className="space-y-2">
                          <span className="text-sm font-medium">API key</span>
                          <input
                            className="h-10 w-full rounded-xl border bg-transparent px-3"
                            style={{ borderColor: `hsl(var(--border))` }}
                            type="password"
                            value={settings.openRouterApiKey}
                            onChange={(e) => setSettings({ ...settings, openRouterApiKey: e.target.value })}
                            placeholder="sk-or-…"
                            autoComplete="off"
                            spellCheck={false}
                          />
                        </label>

                        <div className="flex flex-col justify-end">
                          <button
                            type="button"
                            className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-transparent px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
                            onClick={async () => {
                              setOpenRouterFetch({ status: "fetching", message: "Fetching…" });
                              try {
                                const models = await fetchOpenRouterModels(settings.openRouterApiKey);
                                setOpenRouterModelOptions(models);
                                localStorage.setItem(
                                  STORAGE_OPENROUTER_MODELS,
                                  JSON.stringify({ updatedAt: Date.now(), models }),
                                );
                                setOpenRouterFetch({ status: "success", message: `${models.length} models loaded.` });
                              } catch (e) {
                                setOpenRouterFetch({
                                  status: "error",
                                  message: e instanceof Error ? e.message : "Failed.",
                                });
                              }
                            }}
                            disabled={openRouterFetch.status === "fetching"}
                          >
                            {openRouterFetch.status === "fetching" ? "Fetching…" : "Fetch models"}
                          </button>
                          {openRouterFetch.status !== "idle" ? (
                            <p
                              className="mt-2 text-xs"
                              style={{
                                color:
                                  openRouterFetch.status === "success"
                                    ? `hsl(var(--primary))`
                                    : openRouterFetch.status === "error"
                                      ? `hsl(var(--destructive))`
                                      : `hsl(var(--muted-foreground))`,
                              }}
                            >
                              {openRouterFetch.message}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null}
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
                  Export, import, and reset (local-only).
                </p>
              </div>

              <div
                className="rounded-2xl border p-4"
                style={{ borderColor: `hsl(var(--border))`, background: `hsl(var(--background) / 0.10)` }}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium">Export data</p>
                    <p className="text-sm" style={{ color: `hsl(var(--muted-foreground))` }}>
                      Downloads a JSON backup of chats, presets, and settings.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-transparent px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                    onClick={() => {
                      const payload = buildLocalExportPayload({
                        settings,
                        presets,
                        sessions,
                        activeSessionId,
                      });
                      exportLocalData(payload);
                    }}
                  >
                    Export JSON
                  </button>
                </div>
              </div>

              <div
                className="rounded-2xl border p-4"
                style={{ borderColor: `hsl(var(--border))`, background: `hsl(var(--background) / 0.10)` }}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium">Import data</p>
                    <p className="text-sm" style={{ color: `hsl(var(--muted-foreground))` }}>
                      Replaces your current local data with the imported backup.
                    </p>
                    {importStatus.status !== "idle" ? (
                      <p
                        className="mt-2 text-sm"
                        style={{
                          color:
                            importStatus.status === "success"
                              ? `hsl(var(--primary))`
                              : `hsl(var(--destructive))`,
                        }}
                      >
                        {importStatus.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/json"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const text = await file.text();
                          const payload = parseAndValidateImportPayload(text);
                          applyImportedLocalData(payload);

                          // Update in-memory state to match.
                          setSettings(payload.settings);
                          setPresets(payload.presets);
                          setSessions(payload.sessions);
                          setActiveSessionId(payload.activeSessionId || payload.sessions[0]?.id || "");

                          setImportStatus({ status: "success", message: "Import complete." });
                          // Close the dialog to avoid confusing state.
                        } catch {
                          setImportStatus({ status: "error", message: "Invalid file format." });
                        } finally {
                          // allow importing same file twice
                          e.target.value = "";
                        }
                      }}
                    />

                    <button
                      type="button"
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-transparent px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                      onClick={() => {
                        setImportStatus({ status: "idle" });
                        fileInputRef.current?.click();
                      }}
                    >
                      Choose file
                    </button>
                  </div>
                </div>
              </div>

              <div
                className="rounded-2xl border p-4"
                style={{ borderColor: `hsl(var(--border))`, background: `hsl(var(--background) / 0.10)` }}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium">Danger zone</p>
                    <p className="text-sm" style={{ color: `hsl(var(--muted-foreground))` }}>
                      Clears all local chats, presets, and settings on this device.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-transparent px-4 text-sm font-medium transition-colors hover:bg-accent"
                    style={{ color: `hsl(var(--destructive))` }}
                    onClick={() => {
                      const ok = window.confirm("Reset all local AI Studio data on this device?");
                      if (!ok) return;

                      resetLocalData();
                      setSettings(defaultSettings);
                      setPresets(defaultPresets);
                      setSessions([]);
                      setActiveSessionId("");
                      setImportStatus({ status: "idle" });
                      onClose();
                    }}
                  >
                    Reset local data
                  </button>
                </div>
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
