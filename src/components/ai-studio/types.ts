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
