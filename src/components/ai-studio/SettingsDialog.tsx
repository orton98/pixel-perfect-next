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
    { id: "profile", label: "Profile" },
    { id: "mindset", label: "Mindset" },
    { id: "skillset", label: "Skillset" },
    { id: "toolset", label: "Toolset" },
    { id: "data", label: "Data" },
    { id: "about", label: "About" },
  ] as const;

  const [section, setSection] = React.useState<(typeof sections)[number]["id"]>("general");

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
