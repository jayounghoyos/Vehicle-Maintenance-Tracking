import type {
  MaintenanceSchedule,
  MaintenanceTask,
  ServiceEvent,
  User,
  Vehicle,
  VehicleModel,
} from '../domain/types'

/* Stand-in rows until the API serves the real ones. Shaped exactly like
 * docs/design/data_model.dbml, so replacing this file with a fetch is a
 * change of source, not of types.
 *
 * Dates are relative to today only because these are fixtures: it keeps
 * the derived states meaningful whenever the app is opened. Real rows
 * hold fixed dates. */

const ORG = 1

function isoDaysFromToday(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export const currentUser: User = {
  id: 1,
  organizationId: ORG,
  fullName: 'Ana Restrepo',
  email: 'ana@citylogistics.co',
  role: 'fleet_coordinator',
  createdAt: isoDaysFromToday(-400),
}

export const users: User[] = [
  currentUser,
  {
    id: 2,
    organizationId: ORG,
    fullName: 'Carlos Mejia',
    email: 'carlos@citylogistics.co',
    role: 'mechanic',
    createdAt: isoDaysFromToday(-380),
  },
]

export const vehicleModels: VehicleModel[] = [
  { id: 1, make: 'Chevrolet', name: 'NHR' },
  { id: 2, make: 'Hyundai', name: 'H100' },
  { id: 3, make: 'Renault', name: 'Kangoo' },
  { id: 4, make: 'Chevrolet', name: 'N300' },
  { id: 5, make: 'Renault', name: 'Master' },
  { id: 6, make: 'Hyundai', name: 'Porter' },
]

export const vehicles: Vehicle[] = [
  { id: 1, organizationId: ORG, plate: 'ABC123', modelId: 1, year: 2019, odometerKm: 128_450, status: 'active', createdAt: isoDaysFromToday(-500) },
  { id: 2, organizationId: ORG, plate: 'GHI789', modelId: 2, year: 2020, odometerKm: 143_980, status: 'active', createdAt: isoDaysFromToday(-480) },
  { id: 3, organizationId: ORG, plate: 'DEF456', modelId: 3, year: 2021, odometerKm: 96_210, status: 'active', createdAt: isoDaysFromToday(-460) },
  { id: 4, organizationId: ORG, plate: 'JKL012', modelId: 4, year: 2018, odometerKm: 187_320, status: 'in_shop', createdAt: isoDaysFromToday(-520) },
  { id: 5, organizationId: ORG, plate: 'MNO345', modelId: 5, year: 2022, odometerKm: 54_600, status: 'active', createdAt: isoDaysFromToday(-300) },
  { id: 6, organizationId: ORG, plate: 'STU901', modelId: 6, year: 2020, odometerKm: 77_940, status: 'in_shop', createdAt: isoDaysFromToday(-450) },
]

export const maintenanceTasks: MaintenanceTask[] = [
  { id: 1, organizationId: ORG, name: 'Oil change' },
  { id: 2, organizationId: ORG, name: 'Brake inspection' },
  { id: 3, organizationId: ORG, name: 'Tire rotation' },
  { id: 4, organizationId: ORG, name: 'Clutch check' },
]

export const maintenanceSchedules: MaintenanceSchedule[] = [
  { id: 1, organizationId: ORG, vehicleId: 1, taskId: 1, intervalDays: 180, intervalKm: null, nextDueDate: isoDaysFromToday(-12), nextDueKm: null, createdAt: isoDaysFromToday(-400) },
  { id: 2, organizationId: ORG, vehicleId: 2, taskId: 2, intervalDays: 365, intervalKm: null, nextDueDate: isoDaysFromToday(3), nextDueKm: null, createdAt: isoDaysFromToday(-400) },
  { id: 3, organizationId: ORG, vehicleId: 3, taskId: 3, intervalDays: 120, intervalKm: null, nextDueDate: isoDaysFromToday(9), nextDueKm: null, createdAt: isoDaysFromToday(-400) },
  { id: 4, organizationId: ORG, vehicleId: 4, taskId: 1, intervalDays: 180, intervalKm: null, nextDueDate: isoDaysFromToday(-4), nextDueKm: null, createdAt: isoDaysFromToday(-400) },
  { id: 5, organizationId: ORG, vehicleId: 5, taskId: 4, intervalDays: 365, intervalKm: null, nextDueDate: isoDaysFromToday(32), nextDueKm: null, createdAt: isoDaysFromToday(-400) },
  { id: 6, organizationId: ORG, vehicleId: 6, taskId: 1, intervalDays: 180, intervalKm: null, nextDueDate: isoDaysFromToday(43), nextDueKm: null, createdAt: isoDaysFromToday(-400) },
]

export const serviceEvents: ServiceEvent[] = [
  { id: 1, organizationId: ORG, vehicleId: 3, scheduleId: 3, taskId: 1, recordedBy: 2, type: 'preventive', performedAt: isoDaysFromToday(-2), odometerKm: 96_210, notes: 'Oil and filter changed, full synthetic', createdAt: isoDaysFromToday(-2) },
  { id: 2, organizationId: ORG, vehicleId: 2, scheduleId: 2, taskId: 2, recordedBy: 2, type: 'preventive', performedAt: isoDaysFromToday(-5), odometerKm: 143_980, notes: 'Pads at 40 percent, replace next service', createdAt: isoDaysFromToday(-5) },
  // the nullable schedule_id from the data model: work nobody planned
  { id: 3, organizationId: ORG, vehicleId: 5, scheduleId: null, taskId: 4, recordedBy: 2, type: 'corrective', performedAt: isoDaysFromToday(-7), odometerKm: 54_600, notes: 'Clutch failure on route, vehicle towed in', createdAt: isoDaysFromToday(-7) },
  { id: 4, organizationId: ORG, vehicleId: 4, scheduleId: 4, taskId: 3, recordedBy: 1, type: 'preventive', performedAt: isoDaysFromToday(-23), odometerKm: 187_320, notes: 'Rotated, front tires worn unevenly', createdAt: isoDaysFromToday(-23) },
]
