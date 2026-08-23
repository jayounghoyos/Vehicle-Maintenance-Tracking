import type { MaintenanceState } from '../maintenance/maintenance';

export type DashboardUser = {
  id: number;
  fullName: string;
  role: string;
};

export type FleetCounts = {
  active: number;
  overdue: number;
  dueSoon: number;
  inShop: number;
};

export type AttentionItem = {
  scheduleId: number;
  plate: string;
  make: string;
  model: string;
  task: string;
  nextDueDate: string | null;
  state: MaintenanceState;
};

export type RecentEventItem = {
  id: number;
  task: string;
  plate: string;
  recorder: string;
  performedAt: string;
  type: 'preventive' | 'corrective';
};

export type FleetRowItem = {
  vehicleId: number;
  plate: string;
  make: string;
  model: string;
  year: number | null;
  odometerKm: number;
  nextTask: string | null;
  nextDueDate: string | null;
  state: MaintenanceState;
};

export type DashboardResponse = {
  user: DashboardUser;
  counts: FleetCounts;
  attention: AttentionItem[];
  recentEvents: RecentEventItem[];
  fleet: FleetRowItem[];
};
