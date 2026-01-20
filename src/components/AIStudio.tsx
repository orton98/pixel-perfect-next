import * as React from "react";
import { MessageSquarePlus, PanelLeftClose, PanelLeftOpen, Settings } from "lucide-react";

import type { PresetItem, Session, ChatMessage } from "./ai-studio/types";
import { defaultPresets, defaultSettings, STORAGE_PRESETS, STORAGE_SETTINGS } from "./ai-studio/storage";
import { useLocalStorageState } from "./ai-studio/utils";
import { SparkMark } from "./ai-studio/SparkMark";
import { ChatThread } from "./ai-studio/ChatThread";
import { PromptComposer } from "./ai-studio/PromptComposer";
import { SettingsDialog } from "./ai-studio/SettingsDialog";

export default function AIStudio() {
  React.useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => document.documentElement.classList.remove("dark");
  }, []);

  const [settings, setSettings] = useLocalStorageState(STORAGE_SETTINGS, defaultSettings);
  const [presets, setPresets] = useLocalStorageState(STORAGE_PRESETS, defaultPresets);

  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  const createSession = (title: string): Session => ({
    id: crypto.randomUUID(),
    title,
    createdAt: Date.now(),
    pinned: false,
    messages: [],
  });

  const [sessions, setSessions] = React.useState<Session[]>(() => [
    createSession("Work…"),
    { ...createSession("Design critique"), createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10 },
    { ...createSession("Research plan"), createdAt: Date.now() - 1000 * 60 * 60 * 24 * 25 },
  ]);

  const [activeId, setActiveId] = React.useState(() => sessions[0].id);

  const activeSession = sessions.find((s) => s.id === activeId) || sessions[0];
  const hasMessages = (activeSession?.messages?.length || 0) > 0;

  // NOTE: kept identical to original implementation (snapshot at mount)
  const isMobile = React.useMemo(() => window.matchMedia && window.matchMedia("(max-width: 768px)").matches, []);

  const titleFromFirstLine = (text: string) => {
    const line = String(text || "").trim().split("\n")[0] || "";
    return line.length > 40 ? `${line.slice(0, 40)}…` : line;
  };

  const handleNewChat = () => {
    const next = createSession("New chat");
    setSessions((prev) => [next, ...prev]);
    setActiveId(next.id);
    if (isMobile && settings.sidebarAutoCloseMobile) setSidebarOpen(false);
  };

  const handleSend = ({
    text,
    mindset,
    skillset,
    toolset,
  }: {
    text: string;
    mindset: PresetItem | null;
    skillset: PresetItem | null;
    toolset: PresetItem | null;
    imageUrl: string | null;
  }) => {
    const trimmed = text.trim();
    if (!trimmed || !activeSession) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      createdAt: Date.now(),
    };

    const chosen = [mindset, skillset, toolset].filter(Boolean) as PresetItem[];
    const webhookSummary = chosen.map((p) => `${p.shortName}${p.webhookUrl ? " (webhook set)" : ""}`).join(", ");

    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content:
        "Got it. (Single-file UI demo)" +
        (webhookSummary ? `\n\nSelected: ${webhookSummary}` : "") +
        "\n\nNext: wire sending to n8n webhooks.",
      createdAt: Date.now() + 1,
    };

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== activeSession.id) return s;
        const isFirstUserMessage = s.messages.filter((m) => m.role === "user").length === 0;
        return {
          ...s,
          title: isFirstUserMessage ? titleFromFirstLine(trimmed) || s.title : s.title,
          messages: [...s.messages, userMsg, assistantMsg],
        };
      }),
    );
  };

  return (
    <div
      className={
        "min-h-screen bg-background text-foreground transition-[padding] duration-300 ease-out " +
        (sidebarOpen ? "md:pl-[280px]" : "md:pl-0")
      }
    >
      {/* Sidebar */}
      <aside
        className={
          "fixed left-0 top-0 z-40 flex h-screen w-[280px] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-300 ease-out " +
          (sidebarOpen ? "translate-x-0" : "-translate-x-full")
        }
        aria-hidden={!sidebarOpen}
      >
        <div className="flex items-center justify-between border-b border-sidebar-border p-4">
          <div className="flex items-center gap-2">
            <div className="grid size-6 place-items-center text-primary">
              <SparkMark />
            </div>
            <span className="text-[18px] font-semibold text-primary">AI Studio</span>
          </div>

          <button
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            type="button"
          >
            <PanelLeftClose className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-4">
          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] border border-border bg-transparent px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            onClick={handleNewChat}
            type="button"
          >
            <MessageSquarePlus className="size-4" aria-hidden="true" />
            New chat
          </button>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto px-2">
          <div className="space-y-1">
            {sessions.map((s) => (
              <button
                key={s.id}
                className={
                  "flex w-full items-center gap-2 rounded-lg px-2 text-left transition-colors " +
                  (settings.compactMode ? "py-0.5 " : "py-1 ") +
                  (s.id === activeId ? "bg-accent" : "hover:bg-accent")
                }
                onClick={() => {
                  setActiveId(s.id);
                  if (isMobile && settings.sidebarAutoCloseMobile) setSidebarOpen(false);
                }}
                type="button"
              >
                <span className="truncate text-sm">{s.title}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-sidebar-border p-3">
          <button
            className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-accent"
            onClick={() => setSettingsOpen(true)}
            type="button"
          >
            <div className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-primary/40 to-primary/10 text-sm">
              <span aria-hidden="true">🧙</span>
            </div>
            <span className="flex-1 text-base font-medium">User1</span>
            <span className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-border/50 hover:text-foreground">
              <Settings className="size-4" aria-hidden="true" />
            </span>
          </button>
        </div>
      </aside>

      {/* Top header (only when sidebar is closed) */}
      {!sidebarOpen ? (
        <div className="fixed left-4 top-4 z-30 flex items-center gap-3">
          <div className="grid size-7 place-items-center text-primary">
            <SparkMark />
          </div>

          <div className="flex items-center gap-1 rounded-xl bg-accent p-1">
            <button
              className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-border/50 hover:text-foreground"
              onClick={() => setSidebarOpen(true)}
              aria-label="Toggle sidebar"
              type="button"
            >
              <PanelLeftOpen className="size-4" aria-hidden="true" />
            </button>

            <button
              className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-border/50 hover:text-foreground"
              onClick={handleNewChat}
              aria-label="New chat"
              type="button"
            >
              <MessageSquarePlus className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}

      <main
        className={
          "min-h-screen px-5 py-5 " + (hasMessages ? "flex justify-center" : "flex items-center justify-center")
        }
      >
        <div className={"w-full max-w-[700px] " + (hasMessages ? "flex h-[calc(100vh-40px)] flex-col gap-5" : "")}>
          {hasMessages ? (
            <div className="min-h-0 flex-1">
              <ChatThread
                messages={activeSession.messages}
                compact={settings.compactMode}
                showTimestamps={settings.showTimestamps}
              />
            </div>
          ) : null}

          <div className={hasMessages ? "mt-auto" : ""}>
            <PromptComposer presets={presets} compact={settings.compactMode} onSend={handleSend} />
          </div>

          {!hasMessages ? (
            <div className="pt-4 text-center text-sm text-muted-foreground">
              Tip: open Settings → Mindset/Skillset/Toolset to set per-option n8n webhook URLs.
            </div>
          ) : null}
        </div>
      </main>

      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        setSettings={setSettings}
        presets={presets}
        setPresets={setPresets}
      />
    </div>
  );
}
