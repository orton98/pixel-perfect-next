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
  const [tooltipOpen, setTooltipOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const longPressTimerRef = React.useRef<number | null>(null);
  const suppressNextClickRef = React.useRef(false);

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
        setTooltipOpen(false);
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

  React.useEffect(() => {
    return () => {
      if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
    };
  }, []);


  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={
          "inline-flex h-9 items-center gap-2 rounded-full px-2 text-sm transition-colors hover:bg-accent sm:px-3 " +
          (value ? "text-primary" : "text-foreground")
        }
        aria-label={value?.shortName ?? label}
        onPointerDown={(e) => {
          // Long-press (mobile) to preview full label without opening the menu.
          // Only trigger on primary touch/pen pointers.
          if (e.pointerType === "touch" || e.pointerType === "pen") {
            if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = window.setTimeout(() => {
              suppressNextClickRef.current = true;
              setTooltipOpen(true);
              window.setTimeout(() => setTooltipOpen(false), 1400);
            }, 450);
          }
        }}
        onPointerUp={() => {
          if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }}
        onPointerCancel={() => {
          if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }}
        onClick={() => {
          if (suppressNextClickRef.current) {
            suppressNextClickRef.current = false;
            return;
          }
          setOpen((v) => !v);
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {Icon ? <Icon className="size-4 text-muted-foreground" aria-hidden="true" /> : null}
        <span className="hidden font-medium sm:inline">{value?.shortName ?? label}</span>
        <span className="sr-only sm:hidden">{value?.shortName ?? label}</span>
      </button>

      {tooltipOpen ? (
        <div
          className="pointer-events-none absolute left-0 bottom-11 z-40 max-w-[240px] rounded-xl border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-elev"
          role="status"
          aria-live="polite"
        >
          <span className="font-medium">{value?.shortName ?? label}</span>
          {value?.name ? <span className="ml-2 text-muted-foreground">{value.name}</span> : null}
        </div>
      ) : null}


      {isMobile ? (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="rounded-t-[28px] border-border bg-popover">
            <DrawerHeader className="text-left">
              <DrawerTitle>{label}</DrawerTitle>
              <p className="text-sm text-muted-foreground">Choose one — it becomes a tag.</p>
              {value?.shortName ? (
                <p className="text-xs text-muted-foreground">
                  Current: <span className="font-medium text-foreground">{value.shortName}</span>
                </p>
              ) : null}
            </DrawerHeader>

            <div className="custom-scrollbar max-h-[50vh] space-y-1 overflow-auto px-2 pb-6">
              {items.map((item) => (
                <button
                  key={item.id}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-colors hover:bg-accent"
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
              ))}
            </div>
          </DrawerContent>
        </Drawer>
      ) : open ? (
        <div
          className="absolute left-0 bottom-11 z-50 w-72 rounded-2xl border border-border bg-popover p-2 text-popover-foreground shadow-elev"
          role="dialog"
        >
          <div className="px-2 pb-2 pt-1">
            <p className="text-sm font-semibold">{label}</p>
            <p className="text-xs text-muted-foreground">Choose one — it becomes a tag.</p>
          </div>

          <div className="space-y-1">
            {items.map((item) => (
              <button
                key={item.id}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                onClick={() => {
                  onSelect(item);
                  setOpen(false);
                }}
                type="button"
              >
                <span className="grid size-8 place-items-center rounded-xl border border-border bg-card shadow-crisp">
                  <PresetIconGlyph name={item.icon} className="size-4 text-primary" />
                </span>
                <span className="flex-1">{item.name}</span>
                {item.extra ? <span className="text-xs text-muted-foreground">{item.extra}</span> : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

