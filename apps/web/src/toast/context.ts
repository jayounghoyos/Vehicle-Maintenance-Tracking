import { createContext, use } from 'react';

export type ToastTone = 'done' | 'failed';

export type ToastApi = {
  /** Say what happened, in the past tense, naming who it happened to. */
  show: (message: string, tone?: ToastTone) => void;
};

export const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const api = use(ToastContext);
  if (!api) throw new Error('useToast used outside ToastProvider');
  return api;
}
