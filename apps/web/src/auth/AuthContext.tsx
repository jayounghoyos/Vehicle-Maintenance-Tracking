import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ApiError, api, type AuthResponse } from '../lib/api';
import { AuthContext } from './context';
import { tokenStore, type Principal } from './session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [principal, setPrincipal] = useState<Principal | null>(null);
  // derived at init rather than set from inside the effect: with no token
  // there is nothing to wait for, and setting it during the effect would
  // start a second render for no reason
  const [loading, setLoading] = useState(() => tokenStore.get() !== null);
  const queryClient = useQueryClient();

  // a token in storage is only a claim; the API decides whether it still
  // means anything, so ask before showing any signed-in screen
  useEffect(() => {
    if (!tokenStore.get()) return;

    let cancelled = false;
    api
      .get<Principal>('/auth/me')
      .then((me) => {
        if (!cancelled) setPrincipal(me);
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError) tokenStore.clear();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const accept = useCallback((res: AuthResponse) => {
    tokenStore.set(res.accessToken);
    setPrincipal(res.principal);
    return res.principal;
  }, []);

  const signIn = useCallback(
    (email: string, password: string) =>
      api.post<AuthResponse>('/auth/login', { email, password }).then(accept),
    [accept],
  );

  const register = useCallback(
    (body: Record<string, string>) =>
      api.post<AuthResponse>('/auth/register', body).then(accept),
    [accept],
  );

  const signOut = useCallback(() => {
    tokenStore.clear();
    setPrincipal(null);
    // otherwise the next person to sign in on this browser sees the
    // previous one's fleet for a moment
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo(
    () => ({ principal, loading, signIn, register, signOut }),
    [principal, loading, signIn, register, signOut],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
