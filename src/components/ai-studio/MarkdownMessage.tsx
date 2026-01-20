// @ts-nocheck
import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import Prism from "prismjs";

import "prismjs/components/prism-bash";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-json";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-tsx";

// Safe markdown rendering for assistant messages (sanitized)

const sanitizeSchema = {
  ...defaultSchema,
  tagNames: Array.from(
    new Set([
      ...(defaultSchema.tagNames ?? []),
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "input",
    ]),
  ),
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
    input: [
      ...(defaultSchema.attributes?.input ?? []),
      ["type"],
      ["checked"],
      ["disabled"],
    ],
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

function normalizeLanguage(lang: string) {
  const l = String(lang || "").toLowerCase();
  if (l === "js") return "javascript";
  if (l === "ts") return "typescript";
  if (l === "sh") return "bash";
  return l;
}

function CodeBlock({ className, children }: { className?: string; children?: React.ReactNode }) {
  const raw = getText(children);
  const language = normalizeLanguage((className || "").match(/language-([a-z0-9-]+)/i)?.[1] ?? "");
  const [copied, setCopied] = React.useState(false);

  const html = React.useMemo(() => {
    try {
      const grammar = (Prism.languages as any)[language];
      if (grammar) return Prism.highlight(raw, grammar, language);
    } catch {
      // ignore
    }
    // Fallback: escape minimal
    return raw.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }, [language, raw]);

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
        <code className="md-code" dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  );
}

export function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="md-markdown max-w-none">
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
          table: ({ children }) => (
            <div className="custom-scrollbar my-3 overflow-x-auto rounded-2xl border border-border bg-background/20">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-border bg-background/30 px-3 py-2 text-left text-xs font-semibold text-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-border px-3 py-2 align-top text-sm text-foreground">{children}</td>
          ),
          ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
          li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
          input: (props) => (
            <input
              type="checkbox"
              className="mr-2 translate-y-[1px]"
              style={{ accentColor: `hsl(var(--primary))` }}
              checked={Boolean((props as any)?.checked)}
              disabled
              readOnly
            />
          ),
          p: ({ children }) => <p className="my-2 text-sm leading-relaxed">{children}</p>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}