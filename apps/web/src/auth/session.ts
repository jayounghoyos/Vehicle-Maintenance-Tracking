export type Principal =
  | {
      kind: 'user'
      id: number
      fullName: string
      email: string
      role: string
      organizationId: number
    }
  | { kind: 'admin'; id: number; fullName: string; email: string }

const TOKEN_KEY = 'mts.token'

/* localStorage, not a cookie: the API is stateless and takes a bearer
 * token, and there is no server rendering that would need the cookie.
 * The trade-off is that a script on the page could read it, which is
 * worth revisiting if this ever serves third-party content. */
export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}
