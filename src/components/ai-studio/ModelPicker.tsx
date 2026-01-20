import * as React from "react";
import { Cpu } from "lucide-react";

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";

type AIRuntime = "disabled" | "ollama" | "openrouter_byok";

const STORAGE_OLLAMA_MODELS = "ai_studio_ollama_models_cache_v1";
const STORAGE_OPENROUTER_MODELS = "ai_studio_openrouter_models_cache_v1";

const DEFAULT_OPENROUTER_MODELS = [
  "openai/gpt-4o-mini",
  "openai/gpt-4o",
  "anthropic/claude-3.5-sonnet",
  "anthropic/claude-3.5-haiku",
  "google/gemini-2.0-flash",
  "meta-llama/llama-3.1-70b-instruct",
];

function readCachedModels(storageKey: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { models?: unknown };
    const models = Array.isArray(parsed.models) ? parsed.models.map((m) => String(m)) : [];
    return models.filter(Boolean);
  } catch {
    return [];
  }
}

export function ModelPicker({
  runtime,
  value,
  disabled,
  onChange,
}: {
  runtime: AIRuntime;
  value: string;
  disabled: boolean;
  onChange: (next: string) => void;
}) {
  const isMobile = useMediaQuery("(max-width: 640px)");

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  const options = React.useMemo(() => {
    if (runtime === "ollama") {
      return readCachedModels(STORAGE_OLLAMA_MODELS);
    }
    return readCachedModels(STORAGE_OPENROUTER_MODELS).length
      ? readCachedModels(STORAGE_OPENROUTER_MODELS)
      : DEFAULT_OPENROUTER_MODELS;
  }, [runtime]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((m) => m.toLowerCase().includes(q));
  }, [options, query]);

  React.useEffect(() => {
    if (!open) return;
    if (isMobile) return; // mobile uses bottom sheet

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const root = rootRef.current;
      if (!root) return;
      const target = e.target as Node | null;
      if (target && !root.contains(target)) setOpen(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown, { passive: true });
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isMobile, open]);


  const label = value?.trim() || (runtime === "ollama" ? "Choose model" : "Model");

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        className={
          "inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-accent disabled:opacity-50"
        }
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Choose model"
      >
        <Cpu className="size-4 text-muted-foreground" aria-hidden="true" />
      </button>

      {isMobile ? (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="bottom-14 mb-2 rounded-2xl border-border bg-popover">
            <DrawerHeader className="text-left">
              <DrawerTitle>Model</DrawerTitle>
              <p className="text-sm text-muted-foreground">
                {runtime === "ollama" ? "Choose from your local Ollama models." : "Choose from cached OpenRouter models."}
              </p>
              {value?.trim() ? (
                <p className="text-xs text-muted-foreground">
                  Current: <span className="font-medium text-foreground">{value}</span>
                </p>
              ) : null}
            </DrawerHeader>

            <div className="px-4 pb-3">
              <input
                className="h-10 w-full rounded-xl border bg-transparent px-3 text-sm"
                style={{ borderColor: `hsl(var(--border))` }}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search models…"
                autoComplete="off"
              />
            </div>

            <div className="custom-scrollbar max-h-[50vh] space-y-1 overflow-auto px-2 pb-6">
              {options.length ? (
                filtered.length ? (
                  filtered.map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={
                        "flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-sm transition-colors hover:bg-accent " +
                        (m === value ? "bg-accent" : "")
                      }
                      onClick={() => {
                        onChange(m);
                        setOpen(false);
                      }}
                    >
                      <span className="min-w-0 flex-1 truncate">{m}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-muted-foreground">No matches</div>
                )
              ) : (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No models yet. Open <span className="text-foreground">Settings → AI</span> and fetch models.
                </div>
              )}
            </div>
          </DrawerContent>
        </Drawer>
      ) : open ? (
        <div
          className="absolute right-0 bottom-11 z-50 w-[320px] rounded-2xl border border-border bg-popover p-2 text-popover-foreground shadow-elev"
          role="dialog"
        >
          <div className="px-2 pb-2 pt-1">
            <p className="text-sm font-semibold">Model</p>
            <p className="text-xs text-muted-foreground">
              {runtime === "ollama" ? "Uses your local Ollama model list." : "Uses cached OpenRouter models (if available)."}
            </p>
          </div>

          <div className="px-2 pb-2">
            <input
              className="h-9 w-full rounded-xl border bg-transparent px-3 text-sm"
              style={{ borderColor: `hsl(var(--border))` }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search models…"
              autoComplete="off"
            />
          </div>

          <div className="custom-scrollbar max-h-[280px] space-y-1 overflow-auto">
            {filtered.length ? (
              filtered.map((m) => (
                <button
                  key={m}
                  type="button"
                  className={
                    "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-accent " +
                    (m === value ? "bg-accent" : "")
                  }
                  onClick={() => {
                    onChange(m);
                    setOpen(false);
                  }}
                >
                  <span className="min-w-0 flex-1 truncate">{m}</span>
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-muted-foreground">No matches</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
