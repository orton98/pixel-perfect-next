import * as React from "react";

import type { PresetIcon, PresetItem } from "./types";
import { guessShortName, slugId } from "./utils";

export function PresetEditor({
  title,
  description,
  items,
  allowExtra,
  onChange,
}: {
  title: string;
  description: string;
  items: PresetItem[];
  allowExtra: boolean;
  onChange: (next: PresetItem[]) => void;
}) {
  const [newName, setNewName] = React.useState("");
  const [newShort, setNewShort] = React.useState("");
  const [newIcon, setNewIcon] = React.useState<PresetIcon>("sparkles");
  const [newExtra, setNewExtra] = React.useState("");
  const [newWebhookUrl, setNewWebhookUrl] = React.useState("");

  const iconOptions: { value: PresetIcon; label: string }[] = [
    { value: "sparkles", label: "Sparkles" },
    { value: "telescope", label: "Telescope" },
    { value: "brain", label: "Brain" },
    { value: "wrench", label: "Wrench" },
  ];

  const addItem = () => {
    const name = newName.trim();
    if (!name) return;
    const shortName = (newShort.trim() || guessShortName(name)).trim();
    const next: PresetItem = {
      id: slugId(name),
      name,
      shortName,
      icon: newIcon,
      ...(allowExtra && newExtra.trim() ? { extra: newExtra.trim() } : {}),
      ...(newWebhookUrl.trim() ? { webhookUrl: newWebhookUrl.trim() } : {}),
    };
    onChange([next, ...items]);
    setNewName("");
    setNewShort("");
    setNewExtra("");
    setNewWebhookUrl("");
    setNewIcon("sparkles");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-sm" style={{ color: `hsl(var(--muted-foreground))` }}>
          {description}
        </p>
      </div>

      <div
        className="rounded-2xl border p-4"
        style={{ borderColor: `hsl(var(--border))`, background: `hsl(var(--background) / 0.20)` }}
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_160px_1fr_120px]">
          <input
            className="h-10 rounded-xl border bg-transparent px-3"
            style={{ borderColor: `hsl(var(--border))` }}
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              if (!newShort.trim()) setNewShort(guessShortName(e.target.value));
            }}
            placeholder="Name"
          />
          <input
            className="h-10 rounded-xl border bg-transparent px-3"
            style={{ borderColor: `hsl(var(--border))` }}
            value={newShort}
            onChange={(e) => setNewShort(e.target.value)}
            placeholder="Short label"
          />

          {allowExtra ? (
            <input
              className="h-10 rounded-xl border bg-transparent px-3"
              style={{ borderColor: `hsl(var(--border))` }}
              value={newExtra}
              onChange={(e) => setNewExtra(e.target.value)}
              placeholder="Extra (optional)"
            />
          ) : (
            <div className="hidden md:block" />
          )}

          <input
            className="h-10 rounded-xl border bg-transparent px-3"
            style={{ borderColor: `hsl(var(--border))` }}
            value={newWebhookUrl}
            onChange={(e) => setNewWebhookUrl(e.target.value)}
            placeholder="n8n Webhook URL (optional)"
            inputMode="url"
          />

          <select
            className="h-10 rounded-xl border bg-transparent px-3"
            style={{ borderColor: `hsl(var(--border))` }}
            value={newIcon}
            onChange={(e) => setNewIcon(e.target.value as PresetIcon)}
          >
            {iconOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            className="inline-flex items-center rounded-full px-4 py-2 text-sm font-medium"
            style={{ background: `hsl(var(--primary))`, color: "hsl(0 0% 8%)" }}
            onClick={addItem}
            disabled={!newName.trim()}
          >
            + Add
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {items.length === 0 ? (
          <div
            className="rounded-2xl border px-4 py-6 text-sm"
            style={{
              borderColor: `hsl(var(--border))`,
              background: `hsl(var(--background) / 0.10)`,
              color: `hsl(var(--muted-foreground))`,
            }}
          >
            No items yet.
          </div>
        ) : null}

        {items.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-1 gap-3 rounded-2xl border px-4 py-4 md:grid-cols-[1fr_180px_160px_1fr_120px_44px]"
            style={{ borderColor: `hsl(var(--border))`, background: `hsl(var(--background) / 0.10)` }}
          >
            <input
              className="h-10 rounded-xl border bg-transparent px-3"
              style={{ borderColor: `hsl(var(--border))` }}
              value={item.name}
              onChange={(e) => onChange(items.map((x) => (x.id === item.id ? { ...x, name: e.target.value } : x)))}
            />
            <input
              className="h-10 rounded-xl border bg-transparent px-3"
              style={{ borderColor: `hsl(var(--border))` }}
              value={item.shortName}
              onChange={(e) =>
                onChange(items.map((x) => (x.id === item.id ? { ...x, shortName: e.target.value } : x)))
              }
            />

            {allowExtra ? (
              <input
                className="h-10 rounded-xl border bg-transparent px-3"
                style={{ borderColor: `hsl(var(--border))` }}
                value={item.extra || ""}
                onChange={(e) =>
                  onChange(items.map((x) => (x.id === item.id ? { ...x, extra: e.target.value || undefined } : x)))
                }
              />
            ) : (
              <div className="hidden md:block" />
            )}

            <input
              className="h-10 rounded-xl border bg-transparent px-3"
              style={{ borderColor: `hsl(var(--border))` }}
              value={item.webhookUrl || ""}
              onChange={(e) =>
                onChange(items.map((x) => (x.id === item.id ? { ...x, webhookUrl: e.target.value || undefined } : x)))
              }
              placeholder="n8n Webhook URL"
              inputMode="url"
            />

            <select
              className="h-10 rounded-xl border bg-transparent px-3"
              style={{ borderColor: `hsl(var(--border))` }}
              value={item.icon}
              onChange={(e) =>
                onChange(items.map((x) => (x.id === item.id ? { ...x, icon: e.target.value as PresetIcon } : x)))
              }
            >
              {iconOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="h-10 w-10 rounded-xl"
              style={{ color: `hsl(var(--muted-foreground))` }}
              onClick={() => onChange(items.filter((x) => x.id !== item.id))}
              aria-label={`Delete ${item.name}`}
            >
              <span aria-hidden="true">🗑</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
