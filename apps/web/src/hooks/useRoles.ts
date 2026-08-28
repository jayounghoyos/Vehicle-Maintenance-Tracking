import { useQuery } from '@tanstack/react-query';

import { api, type RoleSummary } from '../lib/api';

/** The organization's own roles, in the order it made them. Everybody
 *  reads them: any screen showing a colleague shows what they are. */
export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: () => api.get<RoleSummary[]>('/roles'),
  });
}
