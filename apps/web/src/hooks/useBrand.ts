import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useAuth } from '../auth/context';
import { applyAccent } from '../lib/brand';
import { api, type OrganizationProfile } from '../lib/api';

/**
 * Dresses the workspace in the client's brand.
 *
 * The organization is already the most cached query in the app, so this
 * costs nothing beyond an effect. Signing out clears it in AuthContext,
 * which is what puts the default back before the next person arrives.
 */
export function useBrand(): { logoUrl: string | null; name: string | null } {
  const { principal } = useAuth();
  const isMember = principal?.kind === 'user';

  const { data } = useQuery({
    queryKey: ['organization'],
    queryFn: () => api.get<OrganizationProfile>('/organization'),
    enabled: isMember,
  });

  const accent = data?.accentColor ?? null;
  useEffect(() => {
    applyAccent(accent);
  }, [accent]);

  return { logoUrl: data?.logoUrl ?? null, name: data?.name ?? null };
}
