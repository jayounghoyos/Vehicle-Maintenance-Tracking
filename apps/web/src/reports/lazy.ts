import { lazy } from 'react';

/**
 * The only split route in the app. Recharts is roughly as big as
 * everything else put together, and somebody who never opens Reports
 * should not wait for it on the way to the dashboard.
 */
export const Reports = lazy(() => import('../routes/Reports.tsx'));
