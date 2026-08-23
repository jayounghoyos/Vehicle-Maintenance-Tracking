import { Injectable, NotFoundException } from '@nestjs/common';

import { TenantRepositories } from '../tenant/tenant-repository';
import {
  MaintenanceSchedule,
  ServiceEvent,
  User,
  Vehicle,
  VehicleStatus,
} from '../entities';
import type {
  AttentionItem,
  DashboardResponse,
  FleetRowItem,
  RecentEventItem,
} from './dashboard.types';
import { maintenanceByVehicle, stateSchedules } from '../maintenance/fleet-state';
import { STATE_ORDER } from '../maintenance/maintenance';

const RECENT_EVENT_LIMIT = 3;

@Injectable()
export class DashboardService {
  constructor(private readonly tenants: TenantRepositories) {}

  async build(
    userId: number,
    organizationId: number,
    today = new Date(),
  ): Promise<DashboardResponse> {
    // every repository here is bound to the organization on the token,
    // so one client's dashboard cannot be assembled from another's rows
    // even if a where clause below forgot to say so
    const users = this.tenants.for(User, organizationId);
    const vehicles = await this.tenants.for(Vehicle, organizationId).find({
      relations: { model: true },
      order: { plate: 'ASC' },
    });

    const user = await users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const schedules = await this.tenants.for(MaintenanceSchedule, organizationId).find({
      relations: { vehicle: { model: true }, task: true },
    });

    const events = await this.tenants.for(ServiceEvent, organizationId).find({
      relations: { vehicle: true, task: true, recorder: true },
      order: { performedAt: 'DESC' },
      take: RECENT_EVENT_LIMIT,
    });

    const stated = stateSchedules(schedules, today);
    const byVehicle = maintenanceByVehicle(stated);

    const attention: AttentionItem[] = stated
      .filter(({ state }) => state !== 'on_track')
      .map(({ schedule, state }) => ({
        scheduleId: schedule.id,
        plate: schedule.vehicle.plate,
        make: schedule.vehicle.model.make,
        model: schedule.vehicle.model.name,
        task: schedule.task.name,
        nextDueDate: schedule.nextDueDate,
        state,
      }));

    const fleet: FleetRowItem[] = vehicles
      .map((vehicle) => {
        const next = byVehicle.get(vehicle.id);
        return {
          vehicleId: vehicle.id,
          plate: vehicle.plate,
          make: vehicle.model.make,
          model: vehicle.model.name,
          year: vehicle.year,
          odometerKm: vehicle.odometerKm,
          nextTask: next?.nextTask ?? null,
          nextDueDate: next?.nextDueDate ?? null,
          // a vehicle nobody scheduled anything for is not overdue
          state: next?.state ?? 'on_track',
        };
      })
      .sort((a, b) => STATE_ORDER.indexOf(a.state) - STATE_ORDER.indexOf(b.state));

    const recentEvents: RecentEventItem[] = events.map((event) => ({
      id: event.id,
      task: event.task.name,
      plate: event.vehicle.plate,
      recorder: event.recorder.fullName,
      performedAt: event.performedAt,
      type: event.type,
    }));

    const states = [...byVehicle.values()].map((one) => one.state);
    return {
      user: { id: user.id, fullName: user.fullName, role: user.role },
      counts: {
        active: vehicles.filter((v) => v.status === VehicleStatus.ACTIVE).length,
        inShop: vehicles.filter((v) => v.status === VehicleStatus.IN_SHOP).length,
        overdue: states.filter((s) => s === 'overdue').length,
        dueSoon: states.filter((s) => s === 'due_soon').length,
      },
      attention,
      recentEvents,
      fleet,
    };
  }
}
