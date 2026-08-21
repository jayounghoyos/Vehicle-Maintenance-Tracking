import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from './AuthContext'

/** Guards a screen. `kind` narrows it further: the fleet screens are for
 *  fleet members, the admin panel is for whoever runs the service. */
export function RequireAuth({
  kind,
  children,
}: {
  kind?: 'user' | 'admin'
  children: React.ReactNode
}) {
  const { principal, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-page text-body text-ink-muted">
        Checking your session…
      </div>
    )
  }

  if (!principal) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  // send each principal where it belongs instead of showing an error
  if (kind && principal.kind !== kind) {
    return <Navigate to={principal.kind === 'admin' ? '/admin' : '/'} replace />
  }

  return <>{children}</>
}
