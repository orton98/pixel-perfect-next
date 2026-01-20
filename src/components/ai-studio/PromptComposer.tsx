import * as React from "react";
import { ArrowUp, ImagePlus, Mic, Square, X } from "lucide-react";

import type { PresetItem, Presets, SettingsState } from "./types";
import { Popover } from "./Popover";
import { ModelPicker } from "./ModelPicker";

export function PromptComposer({
  presets,
  compact,
  aiRuntime,
  llmModel,
  onSelectModel,
  onSend,
  isStreaming,
  onStop,
}: {
  presets: Presets;
  compact: boolean;
  aiRuntime: SettingsState["aiRuntime"];
  llmModel: string;
  onSelectModel: (next: string) => void;
  onSend: (payload: {
    text: string;
    mindset: PresetItem | null;
    skillset: PresetItem | null;
    toolset: PresetItem | null;
    imageUrl: string | null;
  }) => void;
  isStreaming: boolean;
  onStop: () => void;
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

  const canSend = value.trim().length > 0 && !isStreaming;

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
        ...({
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
            {isStreaming ? (
              <button
                type="button"
                className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-transparent px-3 text-sm text-foreground transition-colors hover:bg-accent"
                onClick={onStop}
                aria-label="Stop generating"
              >
                <Square className="size-4" aria-hidden="true" />
                Stop
              </button>
            ) : (
              <>
                <ModelPicker
                  runtime={aiRuntime}
                  value={llmModel}
                  disabled={aiRuntime === "disabled"}
                  onChange={onSelectModel}
                />

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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
