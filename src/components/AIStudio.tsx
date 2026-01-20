import * as React from "react";
import {
  MessageSquarePlus,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Settings,
  Trash2,
} from "lucide-react";

import type { ChatMessage, PresetItem, Session } from "./ai-studio/types";
import {
  defaultPresets,
  defaultSettings,
  STORAGE_ACTIVE_SESSION,
  STORAGE_PRESETS,
  STORAGE_SESSIONS,
  STORAGE_SETTINGS,
} from "./ai-studio/storage";
import { Modal } from "./ai-studio/Modal";
import { useLocalStorageState } from "./ai-studio/utils";
import { runLocalMigrations } from "./ai-studio/migrations";
import { streamRuntimeChat } from "./ai-studio/aiRuntime";
import { SparkMark } from "./ai-studio/SparkMark";
import { ChatThread } from "./ai-studio/ChatThread";
import { PromptComposer } from "./ai-studio/PromptComposer";
import { SettingsDialog } from "./ai-studio/SettingsDialog";
import { useMediaQuery } from "@/hooks/use-media-query";

runLocalMigrations();

function createEmptySession(title = "New chat"): Session {
  return {
    id: crypto.randomUUID(),
    title,
    createdAt: Date.now(),
    pinned: false,
    messages: [],
  };
}

export default function AIStudio() {
  React.useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => document.documentElement.classList.remove("dark");
  }, []);

  const isMobile = useMediaQuery("(max-width: 768px)");

  const [settings, setSettings] = useLocalStorageState(STORAGE_SETTINGS, defaultSettings);
  const [presets, setPresets] = useLocalStorageState(STORAGE_PRESETS, defaultPresets);

  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [isStreaming, setIsStreaming] = React.useState(false);
  const abortRef = React.useRef<AbortController | null>(null);

  // Sessions: persisted locally (no demo/seeded chats)
  const [sessions, setSessions] = useLocalStorageState<Session[]>(STORAGE_SESSIONS, [createEmptySession()]);
  const [activeId, setActiveId] = useLocalStorageState<string>(STORAGE_ACTIVE_SESSION, sessions[0]?.id ?? "");

  // Keep activeId valid + ensure at least one session exists.
  React.useEffect(() => {
    if (!sessions.length) {
      const fresh = [createEmptySession()];
      setSessions(fresh);
      setActiveId(fresh[0].id);
      return;
    }

    const exists = sessions.some((s) => s.id === activeId);
    if (!exists) setActiveId(sessions[0].id);
  }, [activeId, sessions, setActiveId, setSessions]);

  // Close sidebar automatically when switching to desktop
  React.useEffect(() => {
    if (!isMobile) setSidebarOpen(false);
  }, [isMobile]);

  const activeSession = sessions.find((s) => s.id === activeId) || sessions[0];
  const hasMessages = (activeSession?.messages?.length || 0) > 0;

  const titleFromFirstLine = (text: string) => {
    const line = String(text || "").trim().split("\n")[0] || "";
    return line.length > 40 ? `${line.slice(0, 40)}…` : line;
  };

  const createSession = (title: string): Session => ({
    id: crypto.randomUUID(),
    title,
    createdAt: Date.now(),
    pinned: false,
    messages: [],
  });

  const handleNewChat = () => {
    const next = createSession("New chat");
    setSessions((prev) => [next, ...prev]);
    setActiveId(next.id);
    if (isMobile && settings.sidebarAutoCloseMobile) setSidebarOpen(false);
  };

  const [renameId, setRenameId] = React.useState<string | null>(null);
  const [renameValue, setRenameValue] = React.useState("");
  const renameOpen = renameId !== null;

  const openRename = (s: Session) => {
    setRenameId(s.id);
    setRenameValue(s.title);
  };

  const commitRename = () => {
    if (!renameId) return;
    const title = renameValue.trim();
    if (!title) return;
    setSessions((prev) => prev.map((s) => (s.id === renameId ? { ...s, title } : s)));
    setRenameId(null);
  };

  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const deleteOpen = deleteId !== null;

  const commitDelete = () => {
    if (!deleteId) return;

    const deleting = deleteId;

    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== deleting);

      // Ensure we always have at least one session.
      const ensured = next.length ? next : [createEmptySession()];

      // If we deleted the active session, move active to the first remaining.
      setActiveId((prevActive) => (prevActive === deleting ? ensured[0].id : prevActive));

      return ensured;
    });

    setDeleteId(null);
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

    // Stop any previous in-flight generation.
    abortRef.current?.abort();
    abortRef.current = null;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      createdAt: Date.now(),
    };

    const chosen = [mindset, skillset, toolset].filter(Boolean) as PresetItem[];
    const webhookSummary = chosen.map((p) => `${p.shortName}${p.webhookUrl ? " (webhook set)" : ""}`).join(", ");

    const assistantId = crypto.randomUUID();
    const placeholder: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: settings.aiRuntime === "disabled" ? "Got it." : "",
      createdAt: Date.now() + 1,
    };

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== activeSession.id) return s;
        const isFirstUserMessage = s.messages.filter((m) => m.role === "user").length === 0;
        return {
          ...s,
          title: isFirstUserMessage ? titleFromFirstLine(trimmed) || s.title : s.title,
          messages: [...s.messages, userMsg, placeholder],
        };
      }),
    );

    if (settings.aiRuntime === "disabled") {
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== activeSession.id) return s;
          return {
            ...s,
            messages: s.messages.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content:
                      "Got it. (UI-only local build)" +
                      (webhookSummary ? `\n\nSelected: ${webhookSummary}` : "") +
                      "\n\nEnable Ollama/OpenRouter in Settings → AI to get real responses.",
                  }
                : m,
            ),
          };
        }),
      );
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setIsStreaming(true);

    const history = [...(activeSession.messages ?? []), userMsg];
    const contextCount = Math.max(1, Math.min(200, Number(settings.contextLastN || 20)));
    const contextMessages =
      settings.contextMode === "full" ? history : history.slice(Math.max(0, history.length - contextCount));

    // (MVP) runtime calls ignore tool/webhook settings; those are for future wiring.
    (async () => {
      let soFar = "";
      try {
        await streamRuntimeChat({
          runtime: settings.aiRuntime,
          model: settings.llmModel,
          ollamaBaseUrl: settings.ollamaBaseUrl,
          openRouterApiKey: settings.openRouterApiKey,
          messages: contextMessages.map((m) => ({ role: m.role, content: m.content })),
          signal: controller.signal,
          onDelta: (chunk) => {
            soFar += chunk;
            setSessions((prev) =>
              prev.map((s) => {
                if (s.id !== activeSession.id) return s;
                return {
                  ...s,
                  messages: s.messages.map((m) => (m.id === assistantId ? { ...m, content: soFar } : m)),
                };
              }),
            );
          },
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Request failed.";
        const final = controller.signal.aborted ? (soFar.trim() ? soFar : "Stopped.") : `Error: ${msg}`;
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== activeSession.id) return s;
            return {
              ...s,
              messages: s.messages.map((m) => (m.id === assistantId ? { ...m, content: final } : m)),
            };
          }),
        );
      } finally {
        setIsStreaming(false);
        if (abortRef.current === controller) abortRef.current = null;
      }
    })();
  };

  return (
    <div
      className={
        "min-h-screen bg-background text-foreground transition-[padding] duration-300 ease-out " +
        (sidebarOpen ? "md:pl-[280px]" : "md:pl-0")
      }
    >
      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen ? (
        <button
          className="modal-backdrop fixed inset-0 z-30"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          type="button"
        />
      ) : null}

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
            {sessions.map((s) => {
              const active = s.id === activeId;
              return (
                <div
                  key={s.id}
                  className={
                    "group flex items-center gap-2 rounded-lg px-2 transition-colors " +
                    (settings.compactMode ? "py-0.5 " : "py-1 ") +
                    (active ? "bg-accent" : "hover:bg-accent")
                  }
                >
                  <button
                    className="min-w-0 flex-1 truncate text-left text-sm"
                    onClick={() => {
                      setActiveId(s.id);
                      if (isMobile && settings.sidebarAutoCloseMobile) setSidebarOpen(false);
                    }}
                    type="button"
                  >
                    {s.title}
                  </button>

                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      className="grid size-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-border/50 hover:text-foreground"
                      aria-label="Rename chat"
                      onClick={() => openRename(s)}
                    >
                      <Pencil className="size-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="grid size-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-border/50 hover:text-foreground"
                      aria-label="Delete chat"
                      onClick={() => setDeleteId(s.id)}
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
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

           <div className="hidden items-center gap-2 rounded-full border border-border bg-background/40 px-3 py-1 text-xs text-muted-foreground shadow-crisp sm:flex">
             <span className="font-medium text-foreground">
               {settings.aiRuntime === "disabled"
                 ? "AI: Disabled"
                 : settings.aiRuntime === "ollama"
                   ? "AI: Ollama"
                   : "AI: OpenRouter"}
             </span>
             <span className="h-3 w-px bg-border" aria-hidden="true" />
             <span className="max-w-[220px] truncate">{settings.llmModel}</span>
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
            <PromptComposer
              presets={presets}
              compact={settings.compactMode}
              onSend={handleSend}
              isStreaming={isStreaming}
              onStop={() => abortRef.current?.abort()}
            />
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
        sessions={sessions}
        setSessions={setSessions}
        activeSessionId={activeId}
        setActiveSessionId={setActiveId}
      />

      {/* Rename dialog */}
      <Modal
        open={renameOpen}
        onClose={() => setRenameId(null)}
        title="Rename chat"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="inline-flex items-center rounded-full border border-border bg-transparent px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              onClick={() => setRenameId(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="inline-flex items-center rounded-full px-4 py-2 text-sm font-medium"
              style={{ background: `hsl(var(--primary))`, color: "hsl(0 0% 8%)" }}
              onClick={commitRename}
              disabled={!renameValue.trim()}
            >
              Save
            </button>
          </div>
        }
      >
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground" htmlFor="rename-chat-input">
            Title
          </label>
          <input
            id="rename-chat-input"
            className="h-10 w-full rounded-xl border bg-transparent px-3"
            style={{ borderColor: `hsl(var(--border))` }}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
            }}
            autoComplete="off"
          />
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteId(null)}
        title="Delete chat?"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="inline-flex items-center rounded-full border border-border bg-transparent px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              onClick={() => setDeleteId(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="inline-flex items-center rounded-full px-4 py-2 text-sm font-medium"
              style={{ background: `hsl(var(--primary))`, color: "hsl(0 0% 8%)" }}
              onClick={commitDelete}
            >
              Delete
            </button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground">This will remove the chat and its messages from this device.</p>
      </Modal>
    </div>
  );
}
