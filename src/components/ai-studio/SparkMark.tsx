import * as React from "react";

export function SparkMark() {
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
