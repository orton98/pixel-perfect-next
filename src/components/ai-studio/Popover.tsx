import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";

import type { PresetItem } from "./types";
import { PresetIconGlyph } from "./PresetIconGlyph";

export function Popover({
  label,
  value,
  items,
  icon: Icon,
  onSelect,
}: {
  label: string;
  value: PresetItem | null;
  items: PresetItem[];
  icon?: LucideIcon;
  onSelect: (item: PresetItem) => void;
}) {
  const isMobile = useMediaQuery("(max-width: 640px)");

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const hay = `${it.shortName} ${it.name} ${it.extra ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, query]);

  React.useEffect(() => {
    if (!open) return;
    if (isMobile) return; // mobile uses bottom sheet

    const onPointerDown = (e: PointerEvent) => {
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

    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isMobile, open]);

  // Reset search whenever we open.
  React.useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  const buttonLabel = value?.shortName ?? label;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={
          "inline-flex h-9 items-center gap-2 rounded-full px-2 text-sm transition-colors hover:bg-accent sm:px-3 " +
          (value ? "text-primary" : "text-foreground")
        }
        aria-label={buttonLabel}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {Icon ? <Icon className="size-4 text-muted-foreground" aria-hidden="true" /> : null}
        <span className="hidden font-medium sm:inline">{buttonLabel}</span>
        <span className="sr-only sm:hidden">{buttonLabel}</span>
      </button>

      {isMobile ? (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="bottom-14 mb-2 rounded-2xl border-border bg-popover">
            <DrawerHeader className="text-left">
              <DrawerTitle>{label}</DrawerTitle>
              <p className="text-sm text-muted-foreground">Choose one — it becomes a tag.</p>
              {value?.shortName ? (
                <p className="text-xs text-muted-foreground">
                  Current: <span className="font-medium text-foreground">{value.shortName}</span>
                </p>
              ) : null}
            </DrawerHeader>

            <div className="px-4 pb-3">
              <input
                className="h-10 w-full rounded-xl border bg-transparent px-3 text-sm"
                style={{ borderColor: `hsl(var(--border))` }}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}…`}
                autoComplete="off"
              />
            </div>

            <div className="custom-scrollbar max-h-[50vh] space-y-1 overflow-auto px-2 pb-6">
              {filtered.length ? (
                filtered.map((item) => (
                  <button
                    key={item.id}
                    className={
                      "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-colors hover:bg-accent " +
                      (item.id === value?.id ? "bg-accent" : "")
                    }
                    onClick={() => {
                      onSelect(item);
                      setOpen(false);
                    }}
                    type="button"
                  >
                    <span className="grid size-10 place-items-center rounded-xl border border-border bg-background/30 shadow-crisp">
                      <PresetIconGlyph name={item.icon} className="size-5 text-primary" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-foreground">{item.shortName}</span>
                      <span className="block truncate text-xs text-muted-foreground">{item.name}</span>
                    </span>
                    {item.extra ? <span className="text-xs text-muted-foreground">{item.extra}</span> : null}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-muted-foreground">No matches</div>
              )}
            </div>
          </DrawerContent>
        </Drawer>
      ) : open ? (
        <div
          className="absolute left-0 bottom-11 z-50 w-[320px] rounded-2xl border border-border bg-popover p-2 text-popover-foreground shadow-elev"
          role="dialog"
        >
          <div className="px-2 pb-2 pt-1">
            <p className="text-sm font-semibold">{label}</p>
            <p className="text-xs text-muted-foreground">Choose one — it becomes a tag.</p>
          </div>

          <div className="px-2 pb-2">
            <input
              className="h-9 w-full rounded-xl border bg-transparent px-3 text-sm"
              style={{ borderColor: `hsl(var(--border))` }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${label.toLowerCase()}…`}
              autoComplete="off"
            />
          </div>

          <div className="custom-scrollbar max-h-[280px] space-y-1 overflow-auto">
            {filtered.length ? (
              filtered.map((item) => (
                <button
                  key={item.id}
                  className={
                    "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-accent " +
                    (item.id === value?.id ? "bg-accent" : "")
                  }
                  onClick={() => {
                    onSelect(item);
                    setOpen(false);
                  }}
                  type="button"
                >
                  <span className="grid size-8 place-items-center rounded-xl border border-border bg-card shadow-crisp">
                    <PresetIconGlyph name={item.icon} className="size-4 text-primary" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-foreground">{item.shortName}</span>
                    <span className="block truncate text-xs text-muted-foreground">{item.name}</span>
                  </span>
                  {item.extra ? <span className="text-xs text-muted-foreground">{item.extra}</span> : null}
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

