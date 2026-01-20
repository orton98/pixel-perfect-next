import type { Session } from "./types";
import { STORAGE_SCHEMA_VERSION, STORAGE_SESSIONS } from "./storage";

const CURRENT_SCHEMA_VERSION = 2;

function parseSchemaVersion(raw: string | null) {
  const v = Number(raw);
  return Number.isFinite(v) && v > 0 ? Math.floor(v) : 1;
}

function looksLikeSeededDemoSessions(sessions: Session[]) {
  if (!Array.isArray(sessions) || sessions.length !== 3) return false;
  const titles = sessions.map((s) => s.title);
  const expected = ["Work…", "Design critique", "Research plan"];
  const titleMatch = expected.every((t) => titles.includes(t));
  const allEmpty = sessions.every((s) => (s.messages?.length ?? 0) === 0);
  return titleMatch && allEmpty;
}

export function runLocalMigrations() {
  try {
    const current = parseSchemaVersion(localStorage.getItem(STORAGE_SCHEMA_VERSION));
    if (current >= CURRENT_SCHEMA_VERSION) return;

    // v1 -> v2: remove seeded demo chats if they were never used.
    if (current < 2) {
      try {
        const raw = localStorage.getItem(STORAGE_SESSIONS);
        const parsed = raw ? (JSON.parse(raw) as unknown) : null;
        const sessions = Array.isArray(parsed) ? (parsed as Session[]) : [];

        if (looksLikeSeededDemoSessions(sessions)) {
          localStorage.removeItem(STORAGE_SESSIONS);
        }
      } catch {
        // Ignore parse errors.
      }
    }

    localStorage.setItem(STORAGE_SCHEMA_VERSION, String(CURRENT_SCHEMA_VERSION));
  } catch {
    // localStorage may be unavailable; ignore.
  }
}
