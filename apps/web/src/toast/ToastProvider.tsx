import { AlertTriangle, Check } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';

import { ToastContext, type ToastTone } from './context';

type Toast = { id: number; message: string; tone: ToastTone };

const LIFETIME_MS = 4000;

/**
 * Confirmation that something happened, for the actions that leave no
 * other trace. Removing a member empties a row and that speaks for
 * itself; retiring one only dims it, and a role change moves nothing at
 * all, so without this the screen answers a click with silence.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const show = useCallback((message: string, tone: ToastTone = 'done') => {
    const id = (nextId.current += 1);
    setToasts((current) => [...current, { id, message, tone }]);
    setTimeout(
      () => setToasts((current) => current.filter((toast) => toast.id !== id)),
      LIFETIME_MS,
    );
  }, []);

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext value={api}>
      {children}
      <div
        // polite, not assertive: none of this interrupts anything
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2 px-6"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`mts-toast flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-body shadow-lg ${
              toast.tone === 'failed'
                ? 'border-overdue/40 bg-overdue/15 text-overdue'
                : 'border-white/10 bg-panel text-ink'
            }`}
          >
            {toast.tone === 'failed' ? (
              <AlertTriangle className="size-4 shrink-0" strokeWidth={2.5} />
            ) : (
              <Check className="size-4 shrink-0 text-lime" strokeWidth={2.5} />
            )}
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext>
  );
}
