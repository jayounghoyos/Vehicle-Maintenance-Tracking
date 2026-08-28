import { Navigate, useLocation } from 'react-router-dom';

import { can, type Permission } from './permissions';
import { useAuth } from './context';

/** Guards a screen. `kind` narrows it to fleet members or to whoever
 *  runs the service; `need` narrows it further to a role the client set
 *  up to open this one. The API checks the same thing on every call: this
 *  only decides what to draw. */
export function RequireAuth({
  kind,
  need,
  children,
}: {
  kind?: 'user' | 'admin';
  need?: Permission;
  children: React.ReactNode;
}) {
  const { principal, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-page text-body text-ink-muted">
        Checking your session…
      </div>
    );
  }

  if (!principal) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // send each principal where it belongs instead of showing an error
  if (kind && principal.kind !== kind) {
    return <Navigate to={principal.kind === 'admin' ? '/admin' : '/'} replace />;
  }

  // the dashboard needs no permission, so it is always somewhere to land
  if (need && !can(principal, need)) return <Navigate to="/" replace />;

  return <>{children}</>;
}
