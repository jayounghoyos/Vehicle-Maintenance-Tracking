import { createContext, use } from 'react';

import type { Principal } from './session';

export type AuthState = {
  principal: Principal | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<Principal>;
  register: (body: Record<string, string>) => Promise<Principal>;
  signOut: () => void;
};

/* The context and the hook live apart from the provider so that file
 * exports only a component. Fast refresh gives up on a module that
 * mixes components with anything else. */
export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
