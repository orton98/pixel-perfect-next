import { Bot, Brain, Sparkles, Telescope, User, Wrench } from "lucide-react";

import type { PresetIcon } from "./types";

export function PresetIconGlyph({
  name,
  className,
}: {
  name: PresetIcon | "bot" | "user";
  className?: string;
}) {
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
