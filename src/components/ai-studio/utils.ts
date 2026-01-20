import * as React from "react";

export function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return { ...fallback, ...(JSON.parse(raw) as object) } as T;
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
