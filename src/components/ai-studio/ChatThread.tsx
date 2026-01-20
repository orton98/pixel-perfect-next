import * as React from "react";
import { Check, Copy, Pencil, RotateCcw, X } from "lucide-react";

import type { ChatMessage } from "./types";
import { MarkdownMessage } from "./MarkdownMessage";
import { formatTime } from "./utils";

export function ChatThread({
  messages,
  compact,
  showTimestamps,
  renderMarkdown,
  canRegenerate,
  onRegenerateLast,
  onUpdateUserMessage,
}: {
  messages: ChatMessage[];
  compact: boolean;
  showTimestamps: boolean;
  renderMarkdown: boolean;
  canRegenerate: boolean;
  onRegenerateLast: () => void;
  onUpdateUserMessage: (messageId: string, nextContent: string) => void;
}) {
  const endRef = React.useRef<HTMLDivElement | null>(null);

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<string>("");
  const draftRef = React.useRef<HTMLTextAreaElement | null>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  React.useEffect(() => {
    if (editingId) draftRef.current?.focus();
  }, [editingId]);

  return (
    <div className="h-full">
      <div className="custom-scrollbar h-full overflow-auto p-4 sm:p-6">
        <div className="space-y-4">
          {messages.map((m, idx) => {
            const isUser = m.role === "user";
            const isLast = idx === messages.length - 1;
            const isLastAssistant = isLast && !isUser;

            return (
              <div
                key={m.id}
                className={"group/message flex " + (isUser ? "justify-end" : "justify-start")}
              >
                <div className="max-w-[78%]">
                  <div
                    className={
                      "rounded-3xl border border-border text-sm leading-relaxed shadow-crisp " +
                      (compact ? "px-3 py-2 " : "px-4 py-3 ") +
                      (isUser ? "bg-primary/10" : "bg-background/30")
                    }
                  >
                    {isUser ? (
                      editingId === m.id ? (
                        <textarea
                          ref={draftRef}
                          className={
                            "w-full max-h-[240px] resize-none overflow-y-auto rounded-2xl bg-transparent text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none " +
                            (compact ? "px-0 py-0" : "px-0 py-0")
                          }
                          rows={1}
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              const trimmed = draft.trim();
                              if (!trimmed) return;
                              onUpdateUserMessage(m.id, trimmed);
                              setEditingId(null);
                            }
                            if (e.key === "Escape") {
                              setEditingId(null);
                            }
                          }}
                        />
                      ) : (
                        m.content
                      )
                    ) : renderMarkdown ? (
                      <MarkdownMessage content={m.content} />
                    ) : (
                      <div className="whitespace-pre-wrap">{m.content}</div>
                    )}
                  </div>

                  {!isUser ? (
                    <div className="mt-2 flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover/message:opacity-100">
                      <button
                        type="button"
                        className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        aria-label="Copy message"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(m.content);
                          } catch {
                            // ignore
                          }
                        }}
                      >
                        <Copy className="size-4" aria-hidden="true" />
                      </button>

                      {canRegenerate && isLastAssistant ? (
                        <button
                          type="button"
                          className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                          aria-label="Regenerate last reply"
                          onClick={onRegenerateLast}
                        >
                          <RotateCcw className="size-4" aria-hidden="true" />
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <div
                      className={
                        "mt-2 flex items-center justify-end gap-1 transition-opacity " +
                        (editingId === m.id ? "opacity-100" : "opacity-0 group-hover/message:opacity-100")
                      }
                    >
                      <button
                        type="button"
                        className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        aria-label="Copy message"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(m.content);
                          } catch {
                            // ignore
                          }
                        }}
                      >
                        <Copy className="size-4" aria-hidden="true" />
                      </button>

                      {editingId === m.id ? (
                        <>
                          <button
                            type="button"
                            className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                            aria-label="Save edit"
                            onClick={() => {
                              const trimmed = draft.trim();
                              if (!trimmed) return;
                              onUpdateUserMessage(m.id, trimmed);
                              setEditingId(null);
                            }}
                          >
                            <Check className="size-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                            aria-label="Cancel edit"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="size-4" aria-hidden="true" />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                          aria-label="Edit message"
                          onClick={() => {
                            setEditingId(m.id);
                            setDraft(m.content);
                          }}
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  )}


                  {showTimestamps ? (
                    <div
                      className={"pt-1 text-[11px] text-muted-foreground " + (isUser ? "text-right" : "text-left")}
                    >
                      {formatTime(m.createdAt)}
                    </div>
                  ) : null}
                </div>

              </div>
            );
          })}
          <div ref={endRef} />
        </div>
      </div>
    </div>
  );
}
