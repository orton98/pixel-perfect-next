import type { Presets, SettingsState } from "./types";

export const STORAGE_SCHEMA_VERSION = "ai_studio_schema_version";
export const STORAGE_SETTINGS = "ai_studio_settings_v1";
export const STORAGE_PRESETS = "ai_studio_agent_presets_v1";
export const STORAGE_SESSIONS = "ai_studio_sessions_v1";
export const STORAGE_ACTIVE_SESSION = "ai_studio_active_session_v1";
export const STORAGE_OPENROUTER_MODELS = "ai_studio_openrouter_models_cache_v1";

export const defaultSettings: SettingsState = {
  compactMode: false,
  showTimestamps: false,
  sidebarAutoCloseMobile: true,

  llmProvider: "openrouter",
  llmModel: "openai/gpt-4o-mini",
  openRouterApiKey: "",
};

export const defaultPresets: Presets = {
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
