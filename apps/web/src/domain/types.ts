/* Mirrors docs/design/data_model.dbml. Field for field, nothing added:
 * if a column is not in the schema, it is not here, and the UI cannot
 * show it. Names are camelCase; the columns are snake_case. */

export type UserRole = 'fleet_coordinator' | 'mechanic' | 'operations_manager'
export type VehicleStatus = 'active' | 'in_shop' | 'out_of_service'
export type ServiceType = 'preventive' | 'corrective'

export type Organization = {
  id: number
  name: string
  ownerName: string
  address: string
  phone: string
  email: string
  isActive: boolean
  deletedAt: string | null
  createdAt: string
}

export type User = {
  id: number
  organizationId: number
  fullName: string
  email: string
  role: UserRole
  createdAt: string
}

export type VehicleModel = {
  id: number
  make: string
  name: string
}

export type Vehicle = {
  id: number
  organizationId: number
  plate: string
  modelId: number
  year: number | null
  odometerKm: number
  status: VehicleStatus
  createdAt: string
}

export type MaintenanceTask = {
  id: number
  organizationId: number
  name: string
}

export type MaintenanceSchedule = {
  id: number
  organizationId: number
  vehicleId: number
  taskId: number
  intervalDays: number | null
  intervalKm: number | null
  nextDueDate: string | null
  nextDueKm: number | null
  createdAt: string
}

export type ServiceEvent = {
  id: number
  organizationId: number
  vehicleId: number
  /** null when the work was not planned, e.g. a breakdown */
  scheduleId: number | null
  taskId: number
  recordedBy: number
  type: ServiceType
  performedAt: string
  odometerKm: number | null
  notes: string | null
  createdAt: string
}
