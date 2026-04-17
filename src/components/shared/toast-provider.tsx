"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastTone = "success" | "error" | "warning";

type ToastItem = {
  id: number;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  showToast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_STYLES: Record<
  ToastTone,
  { icon: string; iconClassName: string; borderClassName: string }
> = {
  success: {
    icon: "✓",
    iconClassName: "bg-[#ecfdf3] text-[#16a34a]",
    borderClassName: "border-[#d7f3df]",
  },
  error: {
    icon: "!",
    iconClassName: "bg-[#fff1f1] text-[#dc2626]",
    borderClassName: "border-[#f4d1d1]",
  },
  warning: {
    icon: "!",
    iconClassName: "bg-[#fff7e6] text-[#d97706]",
    borderClassName: "border-[#f6dfb3]",
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, tone: ToastTone = "success") => {
      const id = Date.now() + Math.floor(Math.random() * 1000);

      setToasts((current) => [...current, { id, message, tone }]);

      window.setTimeout(() => {
        dismissToast(id);
      }, 3200);
    },
    [dismissToast],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed bottom-6 right-6 z-[999] flex max-w-[420px] flex-col gap-3">
        {toasts.map((toast) => {
          const style = TOAST_STYLES[toast.tone];

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center gap-3 rounded-2xl border bg-white px-4 py-4 shadow-1 ${style.borderClassName}`}
            >
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-base font-bold ${style.iconClassName}`}
              >
                {style.icon}
              </div>

              <p className="flex-1 text-sm font-medium text-dark">{toast.message}</p>

              <button
                aria-label="ปิดการแจ้งเตือน"
                className="text-lg leading-none text-dark-5 transition-colors hover:text-dark"
                onClick={() => dismissToast(toast.id)}
                type="button"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}
