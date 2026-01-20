import React from "react";
import {
  ArrowUp,
  Bot,
  Brain,
  ImagePlus,
  MessageSquarePlus,
  Mic,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sparkles,
  Telescope,
  User,
  Wrench,
  X,
} from "lucide-react";

const STORAGE_SETTINGS = "ai_studio_settings_v1";
const STORAGE_PRESETS = "ai_studio_agent_presets_v1";

type PresetIcon = "sparkles" | "telescope" | "brain" | "wrench";

type PresetItem = {
  id: string;
  name: string;
  shortName: string;
  icon: PresetIcon;
  extra?: string;
  webhookUrl?: string;
};

type Presets = {
  mindset: PresetItem[];
  skillset: PresetItem[];
  toolset: PresetItem[];
};

type SettingsState = {
  compactMode: boolean;
  showTimestamps: boolean;
  sidebarAutoCloseMobile: boolean;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
};

type Session = {
  id: string;
  title: string;
  createdAt: number;
  pinned: boolean;
  messages: ChatMessage[];
};

const defaultSettings: SettingsState = {
  compactMode: false,
  showTimestamps: false,
  sidebarAutoCloseMobile: true,
};

const defaultPresets: Presets = {
  mindset: [
    { id: "growth", name: "Growth mindset", shortName: "Growth", icon: "sparkles" },
    { id: "focus", name: "Deep focus mode", shortName: "Focus", icon: "telescope" },
    { id: "creative", name: "Creative thinking", shortName: "Creative", icon: "brain" },
    { id: "analytical", name: "Analytical approach", shortName: "Analytical", icon: "telescope" },
  ],
  skillset: [
    { id: "writing", name: "Writing & content", shortName: "Writing", icon: "sparkles" },
    { id: "coding", name: "Coding & development", shortName: "Coding", icon: "wrench" },
    { id: "research", name: "Research & analysis", shortName: "Research", icon: "telescope" },
    { id: "design", name: "Design & visuals", shortName: "Design", icon: "brain" },
  ],
  toolset: [
    { id: "createImage", name: "Create an image", shortName: "Image", icon: "sparkles" },
    { id: "searchWeb", name: "Search the web", shortName: "Search", icon: "telescope" },
    { id: "writeCode", name: "Write or code", shortName: "Write", icon: "wrench" },
    { id: "deepResearch", name: "Run deep research", shortName: "Deep Search", icon: "telescope", extra: "5 left" },
    { id: "thinkLonger", name: "Think for longer", shortName: "Think", icon: "brain" },
  ],
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return { ...fallback, ...(JSON.parse(raw) as object) } as T;
  } catch {
    return fallback;
  }
}

function useLocalStorageState<T>(key: string, initialValue: T) {
  const [value, setValue] = React.useState<T>(() => safeParse(localStorage.getItem(key), initialValue));
  React.useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue] as const;
}

function slugId(input: string) {
  const base = String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base || "preset"}-${suffix}`;
}

function guessShortName(name: string) {
  const first = String(name || "").trim().split(/\s+/)[0] || "";
  const raw = first.length ? first : String(name || "").trim();
  return raw.length > 12 ? `${raw.slice(0, 12)}…` : raw;
}

function formatTime(ms: number) {
  const d = new Date(ms);
  return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(d);
}

function SparkMark() {
  return (
    <div
      className="grid size-7 place-items-center rounded-xl border"
      style={{
        borderColor: `hsl(var(--border))`,
        background: `linear-gradient(135deg, hsl(var(--primary) / 0.25), transparent 60%)`,
      }}
      aria-hidden="true"
    >
      <span style={{ color: `hsl(var(--primary))` }}>✦</span>
    </div>
  );
}

function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button className="modal-backdrop absolute inset-0" aria-label="Close dialog" onClick={onClose} />
      <div
        className="relative w-full max-w-4xl rounded-3xl border p-0 shadow-elev"
        style={{ borderColor: `hsl(var(--border))`, background: `hsl(var(--popover))` }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="border-b px-6 py-5" style={{ borderColor: `hsl(var(--border))` }}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              className="grid size-9 place-items-center rounded-xl transition-colors"
              style={{ color: `hsl(var(--muted-foreground))` }}
              onClick={onClose}
              aria-label="Close"
              type="button"
            >
              <span aria-hidden="true">✕</span>
            </button>
          </div>
        </div>
        <div className="p-6">{children}</div>
        {footer ? (
          <div className="border-t px-6 py-4" style={{ borderColor: `hsl(var(--border))` }}>
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function PresetIconGlyph({ name, className }: { name: PresetIcon | "bot" | "user"; className?: string }) {
  const props = { className };
  switch (name) {
    case "sparkles":
      return <Sparkles {...props} />;
    case "telescope":
      return <Telescope {...props} />;
    case "brain":
      return <Brain {...props} />;
    case "wrench":
      return <Wrench {...props} />;
    case "bot":
      return <Bot {...props} />;
    case "user":
      return <User {...props} />;
  }
}

function Popover({
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

function PromptComposer({
  presets,
  compact,
  onSend,
}: {
  presets: Presets;
  compact: boolean;
  onSend: (payload: { text: string; mindset: PresetItem | null; skillset: PresetItem | null; toolset: PresetItem | null; imageUrl: string | null }) => void;
}) {
  const [value, setValue] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [mindset, setMindset] = React.useState<PresetItem | null>(null);
  const [skillset, setSkillset] = React.useState<PresetItem | null>(null);
  const [toolset, setToolset] = React.useState<PresetItem | null>(null);

  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const fileRef = React.useRef<HTMLInputElement | null>(null);
  const [glow, setGlow] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  React.useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  const canSend = value.trim().length > 0;

  const handleSend = () => {
    if (!canSend) return;
    onSend({ text: value, mindset, skillset, toolset, imageUrl });
    setValue("");
    setMindset(null);
    setSkillset(null);
    setToolset(null);
    setImageUrl(null);
  };

  const activeTags = [
    mindset ? { id: "mindset", label: mindset.shortName } : null,
    skillset ? { id: "skillset", label: skillset.shortName } : null,
    toolset ? { id: "toolset", label: toolset.shortName } : null,
  ].filter(Boolean) as { id: "mindset" | "skillset" | "toolset"; label: string }[];

  return (
    <div
      className="relative rounded-[28px] border border-border bg-card/55 shadow-elev"
      style={{
        // signature moment: pointer-follow light field
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...( {
          "--mx": `${glow.x}px`,
          "--my": `${glow.y}px`,
          backgroundImage:
            "radial-gradient(650px circle at var(--mx) var(--my), hsl(var(--primary) / 0.20), transparent 45%)",
        } as any),
      }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setGlow({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
    >
      <div className="p-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            if (imageUrl) URL.revokeObjectURL(imageUrl);
            setImageUrl(URL.createObjectURL(file));
          }}
        />

        {imageUrl ? (
          <div className="relative mb-2 w-fit pl-1 pt-1">
            <button
              type="button"
              className="group relative overflow-hidden rounded-2xl"
              onClick={() => window.open(imageUrl, "_blank")}
            >
              <img
                src={imageUrl}
                alt="Attached image preview"
                className="h-14 w-14 rounded-2xl border border-border object-cover shadow-crisp transition-transform duration-200 group-hover:scale-[1.03]"
                loading="lazy"
              />
            </button>

            <button
              type="button"
              className="absolute right-1 top-1 grid size-5 place-items-center rounded-full border border-border bg-background/70 text-foreground shadow-crisp transition-colors hover:bg-accent"
              onClick={() => setImageUrl(null)}
              aria-label="Remove attached image"
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          </div>
        ) : null}

        <textarea
          ref={textareaRef}
          className={
            "w-full max-h-[200px] resize-none overflow-y-auto rounded-2xl bg-transparent text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none " +
            (compact ? "px-3 py-2.5" : "px-4 py-3")
          }
          rows={1}
          placeholder="Message…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />

        <div className={"flex items-center px-1 " + (compact ? "gap-1 pb-0.5" : "gap-1 pb-1")}>
          <button
            type="button"
            className="grid size-9 place-items-center rounded-full transition-colors hover:bg-accent"
            onClick={() => fileRef.current?.click()}
            aria-label="Attach image"
          >
            <ImagePlus className="size-5" aria-hidden="true" />
          </button>

          <Popover label="Mindset" value={mindset} items={presets.mindset} onSelect={setMindset} />
          <Popover label="Skillset" value={skillset} items={presets.skillset} onSelect={setSkillset} />
          <Popover label="Toolset" value={toolset} items={presets.toolset} onSelect={setToolset} />

          {activeTags.length ? (
            <div className="hidden items-center gap-2 pl-1 sm:flex">
              <span className="h-4 w-px bg-border" aria-hidden="true" />
              {activeTags.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className="inline-flex h-8 items-center gap-2 rounded-full border border-border bg-background/40 px-3 text-sm text-primary shadow-crisp transition-colors hover:bg-accent"
                  onClick={() => {
                    if (t.id === "mindset") setMindset(null);
                    if (t.id === "skillset") setSkillset(null);
                    if (t.id === "toolset") setToolset(null);
                  }}
                  aria-label={`Remove ${t.id} tag`}
                >
                  {t.label}
                  <X className="size-3" aria-hidden="true" />
                </button>
              ))}
            </div>
          ) : null}

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              className="grid size-9 place-items-center rounded-full transition-colors hover:bg-accent"
              aria-label="Record voice (prototype)"
            >
              <Mic className="size-5" aria-hidden="true" />
            </button>

            <button
              type="button"
              className={
                "grid size-9 place-items-center rounded-full transition-colors " +
                (canSend ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")
              }
              disabled={!canSend}
              onClick={handleSend}
              aria-label="Send message"
            >
              <ArrowUp className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatThread({ messages, compact, showTimestamps }: { messages: ChatMessage[]; compact: boolean; showTimestamps: boolean }) {
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
                    {m.content}
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

function PresetEditor({
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
              onChange={(e) => onChange(items.map((x) => (x.id === item.id ? { ...x, icon: e.target.value as PresetIcon } : x)))}
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

function SettingsDialog({
  open,
  onClose,
  settings,
  setSettings,
  presets,
  setPresets,
}: {
  open: boolean;
  onClose: () => void;
  settings: SettingsState;
  setSettings: (next: SettingsState) => void;
  presets: Presets;
  setPresets: (next: Presets) => void;
}) {
  const sections = [
    { id: "general", label: "General" },
    { id: "profile", label: "Profile" },
    { id: "mindset", label: "Mindset" },
    { id: "skillset", label: "Skillset" },
    { id: "toolset", label: "Toolset" },
    { id: "data", label: "Data" },
    { id: "about", label: "About" },
  ] as const;

  const [section, setSection] = React.useState<(typeof sections)[number]["id"]>("general");

  React.useEffect(() => {
    if (!open) setSection("general");
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Settings"
      footer={
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Changes are saved locally in this demo.</p>
          <button
            type="button"
            className="inline-flex items-center rounded-full border border-border bg-transparent px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      }
    >
      <div className="grid min-h-[520px] grid-cols-1 md:grid-cols-[260px_1fr]">
        <div className="border-b p-5 md:border-b-0 md:border-r" style={{ borderColor: `hsl(var(--border))` }}>
          <nav className="space-y-2">
            {sections.map((s) => {
              const active = s.id === section;
              return (
                <button
                  key={s.id}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors"
                  style={{
                    background: active ? `hsl(var(--accent))` : "transparent",
                    boxShadow: active ? `0 0 0 2px hsl(var(--primary) / 0.35)` : "none",
                  }}
                  onClick={() => setSection(s.id)}
                  type="button"
                >
                  <span className="text-base">{s.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {section === "general" ? (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-base font-semibold">General</h3>
                <p className="text-sm" style={{ color: `hsl(var(--muted-foreground))` }}>
                  Interface & behavior
                </p>
              </div>

              <div className="space-y-3">
                <label
                  className="flex items-center justify-between gap-4 rounded-2xl border px-4 py-4"
                  style={{ borderColor: `hsl(var(--border))`, background: `hsl(var(--background) / 0.20)` }}
                >
                  <div>
                    <p className="text-sm font-medium">Compact mode</p>
                    <p className="text-sm" style={{ color: `hsl(var(--muted-foreground))` }}>
                      Tighter spacing in chat and sidebar.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.compactMode}
                    onChange={(e) => setSettings({ ...settings, compactMode: e.target.checked })}
                  />
                </label>

                <label
                  className="flex items-center justify-between gap-4 rounded-2xl border px-4 py-4"
                  style={{ borderColor: `hsl(var(--border))`, background: `hsl(var(--background) / 0.20)` }}
                >
                  <div>
                    <p className="text-sm font-medium">Show timestamps</p>
                    <p className="text-sm" style={{ color: `hsl(var(--muted-foreground))` }}>
                      Display message time in the chat thread.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showTimestamps}
                    onChange={(e) => setSettings({ ...settings, showTimestamps: e.target.checked })}
                  />
                </label>

                <label
                  className="flex items-center justify-between gap-4 rounded-2xl border px-4 py-4"
                  style={{ borderColor: `hsl(var(--border))`, background: `hsl(var(--background) / 0.20)` }}
                >
                  <div>
                    <p className="text-sm font-medium">Sidebar auto-close on mobile</p>
                    <p className="text-sm" style={{ color: `hsl(var(--muted-foreground))` }}>
                      Close sidebar after selecting a chat on small screens.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.sidebarAutoCloseMobile}
                    onChange={(e) => setSettings({ ...settings, sidebarAutoCloseMobile: e.target.checked })}
                  />
                </label>
              </div>
            </div>
          ) : null}

          {section === "mindset" ? (
            <PresetEditor
              title="Mindset"
              description="Edit and add mindsets (shown in the chat composer)."
              items={presets.mindset}
              allowExtra={false}
              onChange={(next) => setPresets({ ...presets, mindset: next })}
            />
          ) : null}

          {section === "skillset" ? (
            <PresetEditor
              title="Skillset"
              description="Edit and add skillsets (shown in the chat composer)."
              items={presets.skillset}
              allowExtra={false}
              onChange={(next) => setPresets({ ...presets, skillset: next })}
            />
          ) : null}

          {section === "toolset" ? (
            <PresetEditor
              title="Toolset"
              description="Edit and add toolsets (shown in the chat composer)."
              items={presets.toolset}
              allowExtra={true}
              onChange={(next) => setPresets({ ...presets, toolset: next })}
            />
          ) : null}

          {section === "profile" ? (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-base font-semibold">Profile</h3>
                <p className="text-sm" style={{ color: `hsl(var(--muted-foreground))` }}>
                  Account
                </p>
              </div>
              <div
                className="rounded-2xl border p-4"
                style={{ borderColor: `hsl(var(--border))`, background: `hsl(var(--background) / 0.10)` }}
              >
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium">Name</span>
                  <span className="text-sm">User</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium">Email address</span>
                  <span className="text-sm" style={{ color: `hsl(var(--muted-foreground))` }}>
                    —
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          {section === "data" ? (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-base font-semibold">Data</h3>
                <p className="text-sm" style={{ color: `hsl(var(--muted-foreground))` }}>
                  Sharing & exports
                </p>
              </div>
              <div
                className="rounded-2xl border p-4"
                style={{ borderColor: `hsl(var(--border))`, background: `hsl(var(--background) / 0.10)` }}
              >
                <p className="text-sm" style={{ color: `hsl(var(--muted-foreground))` }}>
                  This single-file demo stores settings and presets in localStorage.
                </p>
              </div>
            </div>
          ) : null}

          {section === "about" ? (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-base font-semibold">About</h3>
                <p className="text-sm" style={{ color: `hsl(var(--muted-foreground))` }}>
                  Legal
                </p>
              </div>
              <div
                className="rounded-2xl border p-4"
                style={{ borderColor: `hsl(var(--border))`, background: `hsl(var(--background) / 0.10)` }}
              >
                <p className="text-sm" style={{ color: `hsl(var(--muted-foreground))` }}>
                  Single-file HTML build for offline/demo use.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}

export default function AIStudio() {
  React.useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => document.documentElement.classList.remove("dark");
  }, []);

  const [settings, setSettings] = useLocalStorageState<SettingsState>(STORAGE_SETTINGS, defaultSettings);
  const [presets, setPresets] = useLocalStorageState<Presets>(STORAGE_PRESETS, defaultPresets);

  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  const createSession = (title: string): Session => ({
    id: crypto.randomUUID(),
    title,
    createdAt: Date.now(),
    pinned: false,
    messages: [],
  });

  const [sessions, setSessions] = React.useState<Session[]>(() => [
    createSession("Work…"),
    { ...createSession("Design critique"), createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10 },
    { ...createSession("Research plan"), createdAt: Date.now() - 1000 * 60 * 60 * 24 * 25 },
  ]);

  const [activeId, setActiveId] = React.useState(() => sessions[0].id);

  const activeSession = sessions.find((s) => s.id === activeId) || sessions[0];
  const hasMessages = (activeSession?.messages?.length || 0) > 0;

  const isMobile = React.useMemo(() => window.matchMedia && window.matchMedia("(max-width: 768px)").matches, []);

  const titleFromFirstLine = (text: string) => {
    const line = String(text || "").trim().split("\n")[0] || "";
    return line.length > 40 ? `${line.slice(0, 40)}…` : line;
  };

  const handleNewChat = () => {
    const next = createSession("New chat");
    setSessions((prev) => [next, ...prev]);
    setActiveId(next.id);
    if (isMobile && settings.sidebarAutoCloseMobile) setSidebarOpen(false);
  };

  const handleSend = ({ text, mindset, skillset, toolset }: { text: string; mindset: PresetItem | null; skillset: PresetItem | null; toolset: PresetItem | null; imageUrl: string | null }) => {
    const trimmed = text.trim();
    if (!trimmed || !activeSession) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      createdAt: Date.now(),
    };

    const chosen = [mindset, skillset, toolset].filter(Boolean) as PresetItem[];
    const webhookSummary = chosen
      .map((p) => `${p.shortName}${p.webhookUrl ? " (webhook set)" : ""}`)
      .join(", ");

    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content:
        "Got it. (Single-file UI demo)" +
        (webhookSummary ? `\n\nSelected: ${webhookSummary}` : "") +
        "\n\nNext: wire sending to n8n webhooks.",
      createdAt: Date.now() + 1,
    };

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== activeSession.id) return s;
        const isFirstUserMessage = s.messages.filter((m) => m.role === "user").length === 0;
        return {
          ...s,
          title: isFirstUserMessage ? titleFromFirstLine(trimmed) || s.title : s.title,
          messages: [...s.messages, userMsg, assistantMsg],
        };
      }),
    );
  };

  return (
    <div className={"min-h-screen bg-background text-foreground transition-[padding] duration-300 ease-out " + (sidebarOpen ? "md:pl-[280px]" : "md:pl-0")}>
      {/* Sidebar */}
      <aside
        className={
          "fixed left-0 top-0 z-40 flex h-screen w-[280px] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-300 ease-out " +
          (sidebarOpen ? "translate-x-0" : "-translate-x-full")
        }
        aria-hidden={!sidebarOpen}
      >
        <div className="flex items-center justify-between border-b border-sidebar-border p-4">
          <div className="flex items-center gap-2">
            <div className="grid size-6 place-items-center text-primary">
              <SparkMark />
            </div>
            <span className="text-[18px] font-semibold text-primary">AI Studio</span>
          </div>

          <button
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            type="button"
          >
            <PanelLeftClose className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-4">
          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] border border-border bg-transparent px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            onClick={handleNewChat}
            type="button"
          >
            <MessageSquarePlus className="size-4" aria-hidden="true" />
            New chat
          </button>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto px-2">
          <div className="space-y-1">
            {sessions.map((s) => (
              <button
                key={s.id}
                className={
                  "flex w-full items-center gap-2 rounded-lg px-2 text-left transition-colors " +
                  (settings.compactMode ? "py-0.5 " : "py-1 ") +
                  (s.id === activeId ? "bg-accent" : "hover:bg-accent")
                }
                onClick={() => {
                  setActiveId(s.id);
                  if (isMobile && settings.sidebarAutoCloseMobile) setSidebarOpen(false);
                }}
                type="button"
              >
                <span className="truncate text-sm">{s.title}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-sidebar-border p-3">
          <button
            className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-accent"
            onClick={() => setSettingsOpen(true)}
            type="button"
          >
            <div className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-primary/40 to-primary/10 text-sm">
              <span aria-hidden="true">🧙</span>
            </div>
            <span className="flex-1 text-base font-medium">User1</span>
            <span className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-border/50 hover:text-foreground">
              <Settings className="size-4" aria-hidden="true" />
            </span>
          </button>
        </div>
      </aside>

      {/* Top header (only when sidebar is closed) */}
      {!sidebarOpen ? (
        <div className="fixed left-4 top-4 z-30 flex items-center gap-3">
          <div className="grid size-7 place-items-center text-primary">
            <SparkMark />
          </div>

          <div className="flex items-center gap-1 rounded-xl bg-accent p-1">
            <button
              className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-border/50 hover:text-foreground"
              onClick={() => setSidebarOpen(true)}
              aria-label="Toggle sidebar"
              type="button"
            >
              <PanelLeftOpen className="size-4" aria-hidden="true" />
            </button>

            <button
              className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-border/50 hover:text-foreground"
              onClick={handleNewChat}
              aria-label="New chat"
              type="button"
            >
              <MessageSquarePlus className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}

      <main className={"min-h-screen px-5 py-5 " + (hasMessages ? "flex justify-center" : "flex items-center justify-center")}>
        <div className={"w-full max-w-[700px] " + (hasMessages ? "flex h-[calc(100vh-40px)] flex-col gap-5" : "")}
        >
          {hasMessages ? (
            <div className="min-h-0 flex-1">
              <ChatThread messages={activeSession.messages} compact={settings.compactMode} showTimestamps={settings.showTimestamps} />
            </div>
          ) : null}

          <div className={hasMessages ? "mt-auto" : ""}>
            <PromptComposer presets={presets} compact={settings.compactMode} onSend={handleSend} />
          </div>

          {!hasMessages ? (
            <div className="pt-4 text-center text-sm text-muted-foreground">
              Tip: open Settings → Mindset/Skillset/Toolset to set per-option n8n webhook URLs.
            </div>
          ) : null}
        </div>
      </main>

      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        setSettings={setSettings}
        presets={presets}
        setPresets={setPresets}
      />
    </div>
  );
}
