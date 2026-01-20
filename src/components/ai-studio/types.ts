export type PresetIcon = "sparkles" | "telescope" | "brain" | "wrench";

export type PresetItem = {
  id: string;
  name: string;
  shortName: string;
  icon: PresetIcon;
  extra?: string;
  webhookUrl?: string;
};

export type Presets = {
  mindset: PresetItem[];
  skillset: PresetItem[];
  toolset: PresetItem[];
};

export type SettingsState = {
  compactMode: boolean;
  showTimestamps: boolean;
  sidebarAutoCloseMobile: boolean;

  /**
   * Local-first MVP: choose how (or whether) the UI talks to a model runtime.
   * - disabled: no model calls
   * - ollama: http://localhost:11434
   * - openrouter_byok: user-provided key (local/dev only)
   */
  aiRuntime: "disabled" | "ollama" | "openrouter_byok";
  ollamaBaseUrl: string;

  /**
   * Context policy for runtime calls.
   */
  contextMode: "full" | "lastN";
  contextLastN: number;

  /**
   * Render assistant messages as markdown (tables, task lists, code).
   */
  renderMarkdown: boolean;

  /**
   * Stored locally; used as a model preference and for BYOK OpenRouter calls.
   */
  llmProvider: "openrouter";
  llmModel: string;

  /**
   * Local/dev only: stored in localStorage on this device.
   */
  openRouterApiKey: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
};

export type Session = {
  id: string;
  title: string;
  createdAt: number;
  pinned: boolean;
  messages: ChatMessage[];
};
