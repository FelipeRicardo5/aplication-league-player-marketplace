import React, { useState, useCallback } from 'react';
import { ToastContext, type ToastItem, type ToastType } from './toast-context';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({
      type = 'info',
      title,
      description,
    }: {
      type?: ToastType;
      title: string;
      description?: string;
    }) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast: ToastItem = { id, type, title, description };

      setToasts((prev) => [...prev, newToast]);

      // Auto dismiss após 5s
      setTimeout(() => {
        removeToast(id);
      }, 5000);
    },
    [removeToast],
  );

  const success = useCallback(
    (title: string, description?: string) => toast({ type: 'success', title, description }),
    [toast],
  );
  const error = useCallback(
    (title: string, description?: string) => toast({ type: 'error', title, description }),
    [toast],
  );
  const warning = useCallback(
    (title: string, description?: string) => toast({ type: 'warning', title, description }),
    [toast],
  );
  const info = useCallback(
    (title: string, description?: string) => toast({ type: 'info', title, description }),
    [toast],
  );

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}

      {/* Container de Toasts fixado no canto superior direito */}
      <div
        className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-md transition-all animate-in fade-in slide-in-from-top-2 ${
              item.type === 'success'
                ? 'bg-card border-[#B9F8CF] text-card-foreground'
                : item.type === 'error'
                  ? 'bg-card border-[#BF000F]/30 text-card-foreground'
                  : item.type === 'warning'
                    ? 'bg-card border-warning/30 text-card-foreground'
                    : 'bg-card border-border text-card-foreground'
            }`}
            role="alert"
          >
            <div className="shrink-0 mt-0.5">
              {item.type === 'success' && <CheckCircle2 className="h-5 w-5 text-[#016630]" />}
              {item.type === 'error' && <AlertCircle className="h-5 w-5 text-[#BF000F]" />}
              {item.type === 'warning' && <AlertTriangle className="h-5 w-5 text-warning" />}
              {item.type === 'info' && <Info className="h-5 w-5 text-primary" />}
            </div>
            <div className="flex-1 space-y-1">
              <h5 className="text-sm font-semibold text-foreground leading-tight">{item.title}</h5>
              {item.description && (
                <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(item.id)}
              className="rounded-md p-1 opacity-70 hover:opacity-100 transition-opacity focus:outline-none"
              aria-label="Fechar notificação"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
