import { z } from "zod";

import type { Presets, Session, SettingsState } from "./types";
import {
  defaultPresets,
  defaultSettings,
  STORAGE_ACTIVE_SESSION,
  STORAGE_OPENROUTER_MODELS,
  STORAGE_PRESETS,
  STORAGE_SCHEMA_VERSION,
  STORAGE_SESSIONS,
  STORAGE_SETTINGS,
} from "./storage";

export type LocalExportPayloadV1 = {
  version: 1;
  exportedAt: number;
  settings: SettingsState;
  presets: Presets;
  sessions: Session[];
  activeSessionId: string;
  openRouterModelsCache?: unknown;
};

const chatMessageSchema = z.object({
  id: z.string().min(1).max(200),
  role: z.union([z.literal("user"), z.literal("assistant")]),
  content: z.string().trim().min(1).max(50_000),
  createdAt: z.number().int().nonnegative(),
});

const sessionSchema = z.object({
  id: z.string().min(1).max(200),
  title: z.string().trim().min(1).max(120),
  createdAt: z.number().int().nonnegative(),
  pinned: z.boolean(),
  messages: z.array(chatMessageSchema).max(5_000),
});

const presetsItemSchema = z.object({
  id: z.string().min(1).max(200),
  name: z.string().trim().min(1).max(120),
  shortName: z.string().trim().min(1).max(40),
  icon: z.union([z.literal("sparkles"), z.literal("telescope"), z.literal("brain"), z.literal("wrench")]),
  extra: z.string().trim().max(200).optional(),
  webhookUrl: z.string().trim().max(2000).optional(),
});

const presetsSchema = z.object({
  mindset: z.array(presetsItemSchema).max(200),
  skillset: z.array(presetsItemSchema).max(200),
  toolset: z.array(presetsItemSchema).max(200),
});

const settingsSchema = z.object({
  compactMode: z.boolean(),
  showTimestamps: z.boolean(),
  sidebarAutoCloseMobile: z.boolean(),

  aiRuntime: z
    .union([z.literal("disabled"), z.literal("ollama"), z.literal("openrouter_byok")])
    .optional()
    .default("disabled"),
  ollamaBaseUrl: z.string().trim().min(1).max(2000).optional().default("http://localhost:11434"),

  contextMode: z.union([z.literal("full"), z.literal("lastN")]).optional().default("lastN"),
  contextLastN: z.number().int().min(1).max(200).optional().default(20),

  llmProvider: z.literal("openrouter"),
  llmModel: z.string().trim().min(1).max(200),
  openRouterApiKey: z.string().max(500),
});

const exportPayloadSchemaV1 = z.object({
  version: z.literal(1),
  exportedAt: z.number().int().nonnegative(),
  settings: settingsSchema,
  presets: presetsSchema,
  sessions: z.array(sessionSchema).max(500),
  activeSessionId: z.string().max(200),
  openRouterModelsCache: z.unknown().optional(),
});

export function buildLocalExportPayload(args: {
  settings: SettingsState;
  presets: Presets;
  sessions: Session[];
  activeSessionId: string;
}): LocalExportPayloadV1 {
  let openRouterModelsCache: unknown = undefined;
  try {
    const raw = localStorage.getItem(STORAGE_OPENROUTER_MODELS);
    openRouterModelsCache = raw ? JSON.parse(raw) : undefined;
  } catch {
    openRouterModelsCache = undefined;
  }

  return {
    version: 1,
    exportedAt: Date.now(),
    settings: args.settings,
    presets: args.presets,
    sessions: args.sessions,
    activeSessionId: args.activeSessionId,
    openRouterModelsCache,
  };
}

export function exportLocalData(payload: LocalExportPayloadV1) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `ai-studio-export-${new Date(payload.exportedAt).toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

export function parseAndValidateImportPayload(rawText: string): LocalExportPayloadV1 {
  const parsed = JSON.parse(rawText) as unknown;
  return exportPayloadSchemaV1.parse(parsed) as LocalExportPayloadV1;
}

export function applyImportedLocalData(payload: LocalExportPayloadV1) {
  // Persist raw payload fields using the app's storage keys.
  localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(payload.settings));
  localStorage.setItem(STORAGE_PRESETS, JSON.stringify(payload.presets));
  localStorage.setItem(STORAGE_SESSIONS, JSON.stringify(payload.sessions));
  localStorage.setItem(STORAGE_ACTIVE_SESSION, JSON.stringify(payload.activeSessionId));

  // Cache is optional.
  if (payload.openRouterModelsCache !== undefined) {
    try {
      localStorage.setItem(STORAGE_OPENROUTER_MODELS, JSON.stringify(payload.openRouterModelsCache));
    } catch {
      // Ignore quota errors.
    }
  }

  // Mark schema as current.
  localStorage.setItem(STORAGE_SCHEMA_VERSION, String(2));
}

export function resetLocalData() {
  localStorage.removeItem(STORAGE_SETTINGS);
  localStorage.removeItem(STORAGE_PRESETS);
  localStorage.removeItem(STORAGE_SESSIONS);
  localStorage.removeItem(STORAGE_ACTIVE_SESSION);
  localStorage.removeItem(STORAGE_OPENROUTER_MODELS);
  localStorage.removeItem(STORAGE_SCHEMA_VERSION);

  // Re-seed with defaults (no demo chats; caller should create an empty session in state).
  localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(defaultSettings));
  localStorage.setItem(STORAGE_PRESETS, JSON.stringify(defaultPresets));
  localStorage.setItem(STORAGE_SCHEMA_VERSION, String(2));
}
