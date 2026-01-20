import * as React from "react";

export function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as unknown;

    // Merge only when both fallback + parsed are plain objects.
    // This keeps the original "partial override" behavior for settings/presets,
    // while allowing arrays/primitives (e.g. sessions) to round-trip correctly.
    const isPlainObject = (v: unknown) =>
      typeof v === "object" && v !== null && !Array.isArray(v);

    if (isPlainObject(fallback) && isPlainObject(parsed)) {
      return { ...(fallback as object), ...(parsed as object) } as T;
    }

    return parsed as T;
  } catch {
    return fallback;
  }
}

export function useLocalStorageState<T>(key: string, initialValue: T) {
  const [value, setValue] = React.useState<T>(() => safeParse(localStorage.getItem(key), initialValue));
  React.useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue] as const;
}

export function slugId(input: string) {
  const base = String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base || "preset"}-${suffix}`;
}

export function guessShortName(name: string) {
  const first = String(name || "").trim().split(/\s+/)[0] || "";
  const raw = first.length ? first : String(name || "").trim();
  return raw.length > 12 ? `${raw.slice(0, 12)}…` : raw;
}

export function formatTime(ms: number) {
  const d = new Date(ms);
  return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(d);
}
