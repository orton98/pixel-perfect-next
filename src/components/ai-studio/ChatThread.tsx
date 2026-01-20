import * as React from "react";
import { Bot, Copy, RotateCcw, User } from "lucide-react";

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
}: {
  messages: ChatMessage[];
  compact: boolean;
  showTimestamps: boolean;
  renderMarkdown: boolean;
  canRegenerate: boolean;
  onRegenerateLast: () => void;
}) {
  const endRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  return (
    <div className="h-full rounded-3xl border border-border bg-card/40 shadow-crisp">
      <div className="custom-scrollbar h-full overflow-auto p-4 sm:p-6">
        <div className="space-y-4">
          {messages.map((m, idx) => {
            const isUser = m.role === "user";
            const isLast = idx === messages.length - 1;
            const isLastAssistant = isLast && !isUser;

            return (
              <div
                key={m.id}
                className={"group/message flex gap-3 " + (isUser ? "justify-end" : "justify-start")}
              >
                {!isUser ? (
                  <div
                    className={
                      "grid shrink-0 place-items-center rounded-2xl border border-border bg-background/40 shadow-crisp " +
                      (compact ? "size-8" : "size-9")
                    }
                    aria-hidden="true"
                  >
                    <Bot className="size-4 text-primary" aria-hidden="true" />
                  </div>
                ) : null}

                <div className="max-w-[78%]">
                  <div
                    className={
                      "rounded-3xl border border-border text-sm leading-relaxed shadow-crisp " +
                      (compact ? "px-3 py-2 " : "px-4 py-3 ") +
                      (isUser ? "bg-primary/10" : "bg-background/30")
                    }
                  >
                    {isUser ? (
                      m.content
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
                  ) : null}

                  {showTimestamps ? (
                    <div
                      className={"pt-1 text-[11px] text-muted-foreground " + (isUser ? "text-right" : "text-left")}
                    >
                      {formatTime(m.createdAt)}
                    </div>
                  ) : null}
                </div>

                {isUser ? (
                  <div
                    className={
                      "grid shrink-0 place-items-center rounded-2xl border border-border bg-background/40 shadow-crisp " +
                      (compact ? "size-8" : "size-9")
                    }
                    aria-hidden="true"
                  >
                    <User className="size-4 text-foreground" aria-hidden="true" />
                  </div>
                ) : null}
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
      </div>
    </div>
  );
}
