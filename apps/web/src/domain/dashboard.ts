import {
  scheduleState,
  worstState,
  type MaintenanceState,
} from './maintenance'
import type {
  MaintenanceSchedule,
  MaintenanceTask,
  ServiceEvent,
  User,
  Vehicle,
  VehicleModel,
} from './types'

/** A schedule joined to the vehicle and task it points at. */
export type DueItem = {
  schedule: MaintenanceSchedule
  vehicle: Vehicle
  model: VehicleModel
  task: MaintenanceTask
  state: MaintenanceState
}

export type FleetCounts = {
  active: number
  overdue: number
  dueSoon: number
  inShop: number
}

type Data = {
  vehicles: Vehicle[]
  vehicleModels: VehicleModel[]
  maintenanceTasks: MaintenanceTask[]
  maintenanceSchedules: MaintenanceSchedule[]
}

const byId = <T extends { id: number }>(rows: T[]) =>
  new Map(rows.map((row) => [row.id, row]))

/** Every schedule, joined and stated, worst first. */
export function dueItems(data: Data, today = new Date()): DueItem[] {
  const vehicles = byId(data.vehicles)
  const models = byId(data.vehicleModels)
  const tasks = byId(data.maintenanceTasks)
  const ORDER: MaintenanceState[] = ['overdue', 'due_soon', 'on_track']

  return data.maintenanceSchedules
    .flatMap((schedule) => {
      const vehicle = vehicles.get(schedule.vehicleId)
      const task = tasks.get(schedule.taskId)
      const model = vehicle && models.get(vehicle.modelId)
      if (!vehicle || !task || !model) return []
      return [{ schedule, vehicle, model, task, state: scheduleState(schedule, today) }]
    })
    .sort((a, b) => {
      const byState = ORDER.indexOf(a.state) - ORDER.indexOf(b.state)
      if (byState !== 0) return byState
      return (a.schedule.nextDueDate ?? '').localeCompare(b.schedule.nextDueDate ?? '')
    })
}

/** The state of a vehicle is the state of its worst schedule. */
export function vehicleStates(
  items: DueItem[],
): Map<number, MaintenanceState> {
  const grouped = new Map<number, MaintenanceState[]>()
  for (const item of items) {
    const list = grouped.get(item.vehicle.id) ?? []
    list.push(item.state)
    grouped.set(item.vehicle.id, list)
  }
  return new Map(
    [...grouped].map(([vehicleId, states]) => [vehicleId, worstState(states)]),
  )
}

export function fleetCounts(data: Data, today = new Date()): FleetCounts {
  const items = dueItems(data, today)
  const states = [...vehicleStates(items).values()]
  return {
    // vehicles.status is the operational column; the maintenance state
    // is derived separately and never stored
    active: data.vehicles.filter((v) => v.status === 'active').length,
    inShop: data.vehicles.filter((v) => v.status === 'in_shop').length,
    overdue: states.filter((s) => s === 'overdue').length,
    dueSoon: states.filter((s) => s === 'due_soon').length,
  }
}

export type RecentEvent = {
  event: ServiceEvent
  vehicle: Vehicle
  task: MaintenanceTask
  recorder: User
}

/** Newest first. What the workshop logged, joined to who logged it. */
export function recentEvents(
  data: {
    serviceEvents: ServiceEvent[]
    vehicles: Vehicle[]
    maintenanceTasks: MaintenanceTask[]
    users: User[]
  },
  limit = 3,
): RecentEvent[] {
  const vehicles = byId(data.vehicles)
  const tasks = byId(data.maintenanceTasks)
  const users = byId(data.users)

  return data.serviceEvents
    .slice()
    .sort((a, b) => b.performedAt.localeCompare(a.performedAt))
    .flatMap((event) => {
      const vehicle = vehicles.get(event.vehicleId)
      const task = tasks.get(event.taskId)
      const recorder = users.get(event.recordedBy)
      if (!vehicle || !task || !recorder) return []
      return [{ event, vehicle, task, recorder }]
    })
    .slice(0, limit)
}

export type FleetRow = {
  vehicle: Vehicle
  model: VehicleModel
  /** the soonest schedule, which is the one the table names */
  next: { task: MaintenanceTask; dueDate: string | null } | null
  state: MaintenanceState
}

/** One row per vehicle, worst state first. */
export function fleetRows(data: Data, today = new Date()): FleetRow[] {
  const items = dueItems(data, today)
  const states = vehicleStates(items)
  const models = byId(data.vehicleModels)
  const ORDER: MaintenanceState[] = ['overdue', 'due_soon', 'on_track']

  return data.vehicles
    .flatMap((vehicle) => {
      const model = models.get(vehicle.modelId)
      if (!model) return []
      // dueItems is already sorted worst first, so the first match is
      // the schedule this vehicle is judged by
      const next = items.find((i) => i.vehicle.id === vehicle.id)
      return [
        {
          vehicle,
          model,
          next: next ? { task: next.task, dueDate: next.schedule.nextDueDate } : null,
          state: states.get(vehicle.id) ?? ('on_track' as MaintenanceState),
        },
      ]
    })
    .sort((a, b) => ORDER.indexOf(a.state) - ORDER.indexOf(b.state))
}
