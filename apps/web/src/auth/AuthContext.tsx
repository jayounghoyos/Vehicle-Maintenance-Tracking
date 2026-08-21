import { useQueryClient } from '@tanstack/react-query'
import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react'

import { ApiError, api, type AuthResponse } from '../lib/api'
import { tokenStore, type Principal } from './session'

type AuthState = {
  principal: Principal | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<Principal>
  register: (body: Record<string, string>) => Promise<Principal>
  signOut: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [principal, setPrincipal] = useState<Principal | null>(null)
  const [loading, setLoading] = useState(true)
  const queryClient = useQueryClient()

  // a token in storage is only a claim; the API decides whether it still
  // means anything, so ask before showing any signed-in screen
  useEffect(() => {
    if (!tokenStore.get()) {
      setLoading(false)
      return
    }
    api
      .get<Principal>('/auth/me')
      .then(setPrincipal)
      .catch((err: unknown) => {
        if (err instanceof ApiError) tokenStore.clear()
      })
      .finally(() => setLoading(false))
  }, [])

  const accept = useCallback((res: AuthResponse) => {
    tokenStore.set(res.accessToken)
    setPrincipal(res.principal)
    return res.principal
  }, [])

  const signIn = useCallback(
    (email: string, password: string) =>
      api.post<AuthResponse>('/auth/login', { email, password }).then(accept),
    [accept],
  )

  const register = useCallback(
    (body: Record<string, string>) =>
      api.post<AuthResponse>('/auth/register', body).then(accept),
    [accept],
  )

  const signOut = useCallback(() => {
    tokenStore.clear()
    setPrincipal(null)
    // otherwise the next person to sign in on this browser sees the
    // previous one's fleet for a moment
    queryClient.clear()
  }, [queryClient])

  const value = useMemo(
    () => ({ principal, loading, signIn, register, signOut }),
    [principal, loading, signIn, register, signOut],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}

export function useAuth(): AuthState {
  const ctx = use(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
