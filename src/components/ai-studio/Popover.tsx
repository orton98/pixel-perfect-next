import * as React from "react";

import type { PresetItem } from "./types";
import { PresetIconGlyph } from "./PresetIconGlyph";

export function Popover({
  label,
  value,
  items,
  onSelect,
}: {
  label: string;
  value: PresetItem | null;
  items: PresetItem[];
  onSelect: (item: PresetItem) => void;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        className={
          "inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm transition-colors hover:bg-accent " +
          (value ? "text-primary" : "text-foreground")
        }
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="font-medium">{value?.shortName ?? label}</span>
      </button>

      {open ? (
        <div
          className="absolute left-0 top-11 z-30 w-72 rounded-2xl border border-border bg-popover p-2 text-popover-foreground shadow-elev"
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
