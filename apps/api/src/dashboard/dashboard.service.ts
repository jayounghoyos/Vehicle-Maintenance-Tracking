import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import {
  MaintenanceSchedule,
  Organization,
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
import {
  STATE_ORDER,
  scheduleState,
  worstState,
  type MaintenanceState,
} from './maintenance';

const RECENT_EVENT_LIMIT = 3;

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizations: Repository<Organization>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Vehicle) private readonly vehicles: Repository<Vehicle>,
    @InjectRepository(MaintenanceSchedule)
    private readonly schedules: Repository<MaintenanceSchedule>,
    @InjectRepository(ServiceEvent)
    private readonly events: Repository<ServiceEvent>,
  ) {}

  async build(today = new Date()): Promise<DashboardResponse> {
    // Until sign-in exists there is one organization and its coordinator
    // stands in for the signed-in user. Both lookups become the session
    // once auth is built, and nothing else here changes.
    const org = await this.organizations.findOne({
      where: { deletedAt: IsNull(), isActive: true },
      order: { id: 'ASC' },
    });
    if (!org) throw new NotFoundException('No active organization');

    const user = await this.users.findOne({
      where: { organizationId: org.id },
      order: { id: 'ASC' },
    });
    if (!user) throw new NotFoundException('No user in the organization');

    const vehicles = await this.vehicles.find({
      where: { organizationId: org.id },
      relations: { model: true },
      order: { plate: 'ASC' },
    });

    const schedules = await this.schedules.find({
      where: { organizationId: org.id },
      relations: { vehicle: { model: true }, task: true },
    });

    const events = await this.events.find({
      where: { organizationId: org.id },
      relations: { vehicle: true, task: true, recorder: true },
      order: { performedAt: 'DESC' },
      take: RECENT_EVENT_LIMIT,
    });

    const stated = schedules
      .map((s) => ({ schedule: s, state: scheduleState(s.nextDueDate, today) }))
      .sort((a, b) => {
        const byState = STATE_ORDER.indexOf(a.state) - STATE_ORDER.indexOf(b.state);
        if (byState !== 0) return byState;
        return (a.schedule.nextDueDate ?? '').localeCompare(b.schedule.nextDueDate ?? '');
      });

    const perVehicle = new Map<number, MaintenanceState[]>();
    for (const { schedule, state } of stated) {
      perVehicle.set(schedule.vehicleId, [
        ...(perVehicle.get(schedule.vehicleId) ?? []),
        state,
      ]);
    }
    const vehicleState = new Map<number, MaintenanceState>(
      [...perVehicle].map(([id, states]) => [id, worstState(states)]),
    );

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
        // stated is already worst-first, so the first hit is the schedule
        // this vehicle is judged by
        const next = stated.find((s) => s.schedule.vehicleId === vehicle.id);
        return {
          vehicleId: vehicle.id,
          plate: vehicle.plate,
          make: vehicle.model.make,
          model: vehicle.model.name,
          year: vehicle.year,
          odometerKm: vehicle.odometerKm,
          nextTask: next?.schedule.task.name ?? null,
          nextDueDate: next?.schedule.nextDueDate ?? null,
          state: vehicleState.get(vehicle.id) ?? 'on_track',
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

    const states = [...vehicleState.values()];
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
