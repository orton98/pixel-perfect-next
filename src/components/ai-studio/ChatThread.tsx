import * as React from "react";
import { Bot, User } from "lucide-react";

import type { ChatMessage } from "./types";
import { MarkdownMessage } from "./MarkdownMessage";
import { formatTime } from "./utils";

export function ChatThread({
  messages,
  compact,
  showTimestamps,
}: {
  messages: ChatMessage[];
  compact: boolean;
  showTimestamps: boolean;
}) {
  const endRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  return (
    <div className="h-full rounded-3xl border border-border bg-card/40 shadow-crisp">
      <div className="custom-scrollbar h-full overflow-auto p-4 sm:p-6">
        <div className="space-y-4">
          {messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <div key={m.id} className={"flex gap-3 " + (isUser ? "justify-end" : "justify-start")}>
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
                    {isUser ? m.content : <MarkdownMessage content={m.content} />}
                  </div>
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
