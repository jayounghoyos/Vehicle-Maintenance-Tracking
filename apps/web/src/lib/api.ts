import type { MaintenanceState } from '../domain/maintenance'

/** Mirrors DashboardResponse in apps/api/src/dashboard/dashboard.types.ts */
export type DashboardResponse = {
  user: { id: number; fullName: string; role: string }
  counts: { active: number; overdue: number; dueSoon: number; inShop: number }
  attention: {
    scheduleId: number
    plate: string
    make: string
    model: string
    task: string
    nextDueDate: string | null
    state: MaintenanceState
  }[]
  recentEvents: {
    id: number
    task: string
    plate: string
    recorder: string
    performedAt: string
    type: 'preventive' | 'corrective'
  }[]
  fleet: {
    vehicleId: number
    plate: string
    make: string
    model: string
    year: number | null
    odometerKm: number
    nextTask: string | null
    nextDueDate: string | null
    state: MaintenanceState
  }[]
}

export async function fetchDashboard(): Promise<DashboardResponse> {
  const res = await fetch('/api/dashboard')
  if (!res.ok) throw new Error(`Dashboard request failed: ${res.status}`)
  return (await res.json()) as DashboardResponse
}
