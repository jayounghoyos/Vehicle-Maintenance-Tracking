import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

import { MaintenanceSchedule, MaintenanceTask, ServiceEvent, Vehicle } from '../entities';
import { scheduleState } from '../maintenance/maintenance';
import { TenantRepositories } from '../tenant/tenant-repository';
import type { CreateScheduleDto, UpdateScheduleDto } from './dto';
import type { ScheduleRow, TaskItem } from './schedules.types';

/** postgres unique_violation */
const UNIQUE_VIOLATION = '23505';

@Injectable()
export class SchedulesService {
  constructor(private readonly tenants: TenantRepositories) {}

  async list(
    organizationId: number,
    vehicleId?: number,
    today = new Date(),
  ): Promise<ScheduleRow[]> {
    const schedules = this.tenants.for(MaintenanceSchedule, organizationId);
    const rows = await schedules.find({
      where: vehicleId === undefined ? {} : { vehicleId },
      relations: { vehicle: { model: true }, task: true },
      // id breaks the tie: two plans due the same day share a spot
      order: { nextDueDate: 'ASC', id: 'ASC' },
    });

    return rows.map((schedule) => this.toRow(schedule, today));
  }

  async listTasks(organizationId: number): Promise<TaskItem[]> {
    const tasks = this.tenants.for(MaintenanceTask, organizationId);
    const list = await tasks.find({ order: { name: 'ASC' } });
    return list.map((task) => ({ id: task.id, name: task.name }));
  }

  /**
   * "the coordinator edits this list" — maintenance-task.entity.ts.
   * Looked up without regard to case first, so "Oil change" and "oil
   * change" read as the same task and the caller gets a clear 409
   * instead of a second row nobody meant to create; the unique index is
   * the backstop for two requests racing each other, not the primary
   * check.
   */
  async createTask(organizationId: number, name: string): Promise<TaskItem> {
    const tasks = this.tenants.for(MaintenanceTask, organizationId);
    const trimmed = name.trim();

    const existing = await tasks
      .builder('t')
      .where('LOWER(t.name) = LOWER(:name)', { name: trimmed })
      .getOne();
    if (existing) {
      throw new ConflictException(`"${trimmed}" is already in the task catalog`);
    }

    try {
      const saved = await tasks.save(tasks.create({ name: trimmed }));
      return { id: saved.id, name: saved.name };
    } catch (err) {
      if (this.isUniqueViolation(err)) {
        throw new ConflictException(`"${trimmed}" is already in the task catalog`);
      }
      throw err;
    }
  }

  async create(organizationId: number, dto: CreateScheduleDto): Promise<ScheduleRow> {
    const vehicles = this.tenants.for(Vehicle, organizationId);
    const vehicle = await vehicles.findOne({ where: { id: dto.vehicleId } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');

    const tasks = this.tenants.for(MaintenanceTask, organizationId);
    const task = await tasks.findOne({ where: { id: dto.taskId } });
    if (!task) throw new NotFoundException('Task not found');

    const schedules = this.tenants.for(MaintenanceSchedule, organizationId);
    const saved = await schedules.save(
      schedules.create({
        vehicleId: vehicle.id,
        taskId: task.id,
        intervalDays: dto.intervalDays ?? null,
        intervalKm: dto.intervalKm ?? null,
        // set only once a service is actually logged against this plan —
        // see service-events.service.ts#recordService, which owns that
        // recalculation and is not duplicated here
        nextDueDate: null,
        nextDueKm: null,
      }),
    );
    return this.rowFor(organizationId, saved.id);
  }

  async update(
    organizationId: number,
    id: number,
    dto: UpdateScheduleDto,
  ): Promise<ScheduleRow> {
    const schedules = this.tenants.for(MaintenanceSchedule, organizationId);
    const schedule = await schedules.findOne({ where: { id } });
    if (!schedule) throw new NotFoundException('No such schedule');

    if (dto.taskId !== undefined) {
      const tasks = this.tenants.for(MaintenanceTask, organizationId);
      const task = await tasks.findOne({ where: { id: dto.taskId } });
      if (!task) throw new NotFoundException('Task not found');
      schedule.taskId = dto.taskId;
    }
    if (dto.intervalDays !== undefined) schedule.intervalDays = dto.intervalDays;
    if (dto.intervalKm !== undefined) schedule.intervalKm = dto.intervalKm;

    // the DTO cannot see the row it is patching, so "at least one
    // interval" is checked against what the update actually leaves
    // behind rather than against the DTO in isolation
    if (schedule.intervalDays === null && schedule.intervalKm === null) {
      throw new BadRequestException(
        'At least one of intervalDays or intervalKm is required',
      );
    }

    await schedules.save(schedule);
    return this.rowFor(organizationId, schedule.id);
  }

  /**
   * Permanent, and only for a plan nothing has been logged against.
   * service_events.schedule_id has no cascade, so deleting one that has
   * history fails in the database as a 500 unless it is refused here
   * first — the same reasoning vehicles.service.ts uses for a vehicle.
   */
  async remove(organizationId: number, id: number): Promise<void> {
    const schedules = this.tenants.for(MaintenanceSchedule, organizationId);
    const schedule = await schedules.findOne({ where: { id } });
    if (!schedule) throw new NotFoundException('No such schedule');

    const events = this.tenants.for(ServiceEvent, organizationId);
    const eventCount = await events.count({ where: { scheduleId: id } });
    if (eventCount > 0) {
      throw new ConflictException(
        `${eventCount} service event${eventCount === 1 ? '' : 's'} logged against ` +
          `this plan, so it cannot be deleted`,
      );
    }

    await schedules.delete({ id });
  }

  private toRow(schedule: MaintenanceSchedule, today: Date): ScheduleRow {
    return {
      id: schedule.id,
      vehicleId: schedule.vehicleId,
      plate: schedule.vehicle.plate,
      make: schedule.vehicle.model.make,
      model: schedule.vehicle.model.name,
      taskId: schedule.taskId,
      task: schedule.task.name,
      intervalDays: schedule.intervalDays,
      intervalKm: schedule.intervalKm,
      nextDueDate: schedule.nextDueDate,
      nextDueKm: schedule.nextDueKm,
      state: scheduleState(schedule.nextDueDate, today),
    };
  }

  private async rowFor(organizationId: number, id: number): Promise<ScheduleRow> {
    const schedules = this.tenants.for(MaintenanceSchedule, organizationId);
    const schedule = await schedules.findOne({
      where: { id },
      relations: { vehicle: { model: true }, task: true },
    });
    if (!schedule) throw new NotFoundException('No such schedule');
    return this.toRow(schedule, new Date());
  }

  private isUniqueViolation(err: unknown): boolean {
    if (!(err instanceof QueryFailedError)) return false;
    return (err.driverError as { code?: string } | undefined)?.code === UNIQUE_VIOLATION;
  }
}
