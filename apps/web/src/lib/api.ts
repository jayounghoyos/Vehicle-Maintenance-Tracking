import type { Principal } from '../auth/session';
import { tokenStore } from '../auth/session';
import type { MaintenanceState } from '../domain/maintenance';

export class ApiError extends Error {
  // declared and assigned rather than a parameter property: the tsconfig
  // sets erasableSyntaxOnly, so the shorthand is not available
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = tokenStore.get();
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new ApiError(res.status, body?.message ?? `Request failed (${res.status})`);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  del: (path: string) => request<void>(path, { method: 'DELETE' }),
};

export type AuthResponse = { accessToken: string; principal: Principal };

export type DashboardResponse = {
  user: { id: number; fullName: string; role: string };
  counts: { active: number; overdue: number; dueSoon: number; inShop: number };
  attention: {
    scheduleId: number;
    plate: string;
    make: string;
    model: string;
    task: string;
    nextDueDate: string | null;
    state: MaintenanceState;
  }[];
  recentEvents: {
    id: number;
    task: string;
    plate: string;
    recorder: string;
    performedAt: string;
    type: 'preventive' | 'corrective';
  }[];
  fleet: {
    vehicleId: number;
    plate: string;
    make: string;
    model: string;
    year: number | null;
    odometerKm: number;
    nextTask: string | null;
    nextDueDate: string | null;
    state: MaintenanceState;
  }[];
};

export type OrganizationProfile = {
  id: number;
  name: string;
  ownerName: string;
  address: string;
  phone: string;
  email: string;
  memberCount: number;
  createdAt: string;
};

/** The answer to a bulk import. `row` indexes the list that was sent,
 *  not the pasted text, so the screen maps it back to a line number. */
export type ImportResult = {
  created: (TeamMember & { temporaryPassword: string })[];
  skipped: { row: number; email: string; reason: string }[];
};

export type TeamMember = {
  id: number;
  fullName: string;
  email: string;
  role: string;
  /** false once the person has left: the row stays, the login does not */
  active: boolean;
  /** what decides whether an account can be removed or only retired */
  recordedEvents: number;
  createdAt: string;
};

export type AdminOrganization = {
  id: number;
  name: string;
  ownerName: string;
  address: string;
  phone: string;
  email: string;
  isActive: boolean;
  deletedAt: string | null;
  memberCount: number;
  createdAt: string;
};

export const fetchDashboard = () => api.get<DashboardResponse>('/dashboard');
