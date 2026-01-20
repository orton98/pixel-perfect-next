import * as React from "react";

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button className="modal-backdrop absolute inset-0" aria-label="Close dialog" onClick={onClose} />
      <div
        className="relative w-full max-w-4xl rounded-3xl border p-0 shadow-elev"
        style={{ borderColor: `hsl(var(--border))`, background: `hsl(var(--popover))` }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="border-b px-6 py-5" style={{ borderColor: `hsl(var(--border))` }}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              className="grid size-9 place-items-center rounded-xl transition-colors"
              style={{ color: `hsl(var(--muted-foreground))` }}
              onClick={onClose}
              aria-label="Close"
              type="button"
            >
              <span aria-hidden="true">✕</span>
            </button>
          </div>
        </div>
        <div className="p-6">{children}</div>
        {footer ? (
          <div className="border-t px-6 py-4" style={{ borderColor: `hsl(var(--border))` }}>
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
