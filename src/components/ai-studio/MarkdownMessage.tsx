// @ts-nocheck
import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

// Safe markdown rendering for assistant messages (sanitized)

const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    a: [
      ...(defaultSchema.attributes?.a ?? []),
      ["target"],
      ["rel"],
      ["href"],
      ["title"],
    ],
    code: [...(defaultSchema.attributes?.code ?? []), ["className"]],
  },
} as const;

function getText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(getText).join("");
  if (React.isValidElement(node)) return getText(node.props.children);
  return "";
}

function InlineCode({ children }: { children?: React.ReactNode }) {
  return (
    <code className="rounded-md border border-border bg-muted px-1.5 py-0.5 text-[0.92em] text-foreground">
      {children}
    </code>
  );
}

function CodeBlock({ className, children }: { className?: string; children?: React.ReactNode }) {
  const raw = getText(children);
  const language = (className || "").match(/language-([a-z0-9-]+)/i)?.[1] ?? "";
  const [copied, setCopied] = React.useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-muted/40 shadow-crisp">
      <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
        <span className="text-[11px] font-medium text-muted-foreground">{language || "code"}</span>
        <button
          type="button"
          className="inline-flex items-center rounded-full border border-border bg-background/40 px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-accent"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(raw);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1200);
            } catch {
              // ignore
            }
          }}
          aria-label="Copy code"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <pre className="custom-scrollbar overflow-auto p-3 text-[13px] leading-relaxed text-foreground">
        <code>{raw}</code>
      </pre>
    </div>
  );
}

export function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="prose prose-invert max-w-none prose-p:my-2 prose-li:my-1 prose-ul:my-2 prose-ol:my-2 prose-pre:my-2 prose-a:text-primary">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
        components={{
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer noopener"
              className="underline underline-offset-4 decoration-primary/50 hover:decoration-primary"
            >
              {children}
            </a>
          ),
          code: ({ children }) => <InlineCode>{children}</InlineCode>,
          pre: ({ children }) => {
            const first = Array.isArray(children) ? children[0] : children;
            if (React.isValidElement(first)) {
              const cls = (first.props as any)?.className as string | undefined;
              const ch = (first.props as any)?.children as React.ReactNode;
              return <CodeBlock className={cls}>{ch}</CodeBlock>;
            }
            return <CodeBlock>{children}</CodeBlock>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
