"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Replaces window.confirm for destructive actions. The native dialog is outside the design
 * system, can't say which item is being deleted with any styling, and — because it blocks the
 * renderer — makes the flows it guards untestable in browser automation.
 */
interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

type Confirm = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<Confirm | null>(null);

export function useConfirm(): Confirm {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return ctx;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<Confirm>((opts) => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const settle = useCallback((value: boolean) => {
    resolveRef.current?.(value);
    resolveRef.current = null;
    setOptions(null);
  }, []);

  useEffect(() => {
    if (!options) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") settle(false);
      if (e.key === "Enter") settle(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [options, settle]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-6"
          style={{ background: "rgba(20,32,54,.42)", backdropFilter: "blur(7px)", WebkitBackdropFilter: "blur(7px)" }}
          onClick={() => settle(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="glass-card w-full max-w-[380px] p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="mb-1.5 text-lg font-bold text-(--color-ink)">{options.title}</div>
            {options.description && (
              <p className="mb-5 text-sm text-(--color-muted)">{options.description}</p>
            )}
            <div className="flex gap-2">
              <button type="button" onClick={() => settle(false)} className="btn-secondary flex-1 py-2.5 text-sm">
                {options.cancelLabel ?? "Отмена"}
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => settle(true)}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white"
                style={{ background: options.destructive === false ? "var(--color-primary)" : "var(--color-danger)" }}
              >
                {options.confirmLabel ?? "Удалить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
