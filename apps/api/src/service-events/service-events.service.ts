import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import {
  MaintenanceSchedule,
  MaintenanceTask,
  ServiceEvent,
  ServiceEventPhoto,
  User,
  Vehicle,
} from '../entities';
import { PhotoStorage } from '../photos/photo-storage.service';
import { TenantRepositories } from '../tenant/tenant-repository';
import type { LogServiceEventDto } from './dto';
import type { ServiceLogRow } from './service-events.types';

@Injectable()
export class ServiceEventsService {
  private readonly logger = new Logger(ServiceEventsService.name);

  constructor(
    private readonly tenants: TenantRepositories,
    private readonly photos: PhotoStorage,
  ) {}

  async getTasks(organizationId: number): Promise<{ id: number; name: string }[]> {
    const tasks = this.tenants.for(MaintenanceTask, organizationId);
    const rows = await tasks.find({ order: { name: 'ASC' } });
    return rows.map((task) => ({ id: task.id, name: task.name }));
  }

  async list(organizationId: number, vehicleId?: number): Promise<ServiceLogRow[]> {
    const eventsRepo = this.tenants.for(ServiceEvent, organizationId);
    const photosRepo = this.tenants.for(ServiceEventPhoto, organizationId);

    const rows = await eventsRepo.find({
      where: vehicleId === undefined ? {} : { vehicleId },
      relations: { vehicle: { model: true }, task: true, recorder: true },
      // id breaks the tie: two events logged in the same visit share a date
      order: { performedAt: 'DESC', id: 'DESC' },
    });

    const eventPhotos = await photosRepo.find();
    const photoByEventId = new Map<number, string>();
    for (const photo of eventPhotos) {
      photoByEventId.set(photo.serviceEventId, photo.storageKey);
    }

    return rows.map((event) => ({
      id: event.id,
      performedAt: event.performedAt,
      vehicleId: event.vehicleId,
      plate: event.vehicle.plate,
      make: event.vehicle.model.make,
      model: event.vehicle.model.name,
      task: event.task.name,
      type: event.type,
      odometerKm: event.odometerKm,
      notes: event.notes,
      recorder: event.recorder?.fullName ?? 'Unknown',
      photoUrl: this.photos.url(photoByEventId.get(event.id) ?? null, 400),
    }));
  }

  async create(
    organizationId: number,
    currentUserId: number,
    dto: LogServiceEventDto,
    photoBuffer?: Buffer,
  ): Promise<ServiceLogRow> {
    const eventsRepo = this.tenants.for(ServiceEvent, organizationId);
    const photosRepo = this.tenants.for(ServiceEventPhoto, organizationId);
    const vehiclesRepo = this.tenants.for(Vehicle, organizationId);
    const tasksRepo = this.tenants.for(MaintenanceTask, organizationId);
    const usersRepo = this.tenants.for(User, organizationId);
    const schedulesRepo = this.tenants.for(MaintenanceSchedule, organizationId);

    const vehicle = await vehiclesRepo.findOne({
      where: { id: dto.vehicleId },
      relations: { model: true },
    });
    if (!vehicle) {
      throw new NotFoundException('No such vehicle in this organization');
    }

    const task = await tasksRepo.findOne({ where: { id: dto.taskId } });
    if (!task) {
      throw new NotFoundException('No such maintenance task in this organization');
    }

    const recordedById = dto.recordedBy ?? currentUserId;
    const recorder = await usersRepo.findOne({ where: { id: recordedById } });
    if (!recorder) {
      throw new NotFoundException('Recorded-by team member not found');
    }

    // Match if this vehicle has a schedule configured for this task
    const matchingSchedule = await schedulesRepo.findOne({
      where: { vehicleId: dto.vehicleId, taskId: dto.taskId },
    });

    const event = eventsRepo.create({
      organizationId,
      vehicleId: dto.vehicleId,
      taskId: dto.taskId,
      scheduleId: matchingSchedule ? matchingSchedule.id : null,
      type: dto.type,
      performedAt: dto.performedAt,
      odometerKm: dto.odometerKm !== undefined && dto.odometerKm !== null ? Number(dto.odometerKm) : null,
      notes: dto.notes?.trim() ? dto.notes.trim() : null,
      recordedBy: recordedById,
    });

    const savedEvent = await eventsRepo.save(event);

    let photoUrl: string | null = null;
    if (photoBuffer && photoBuffer.length > 0) {
      try {
        const storageKey = await this.photos.upload(photoBuffer, organizationId);
        const photo = photosRepo.create({
          organizationId,
          serviceEventId: savedEvent.id,
          storageKey,
          uploadedBy: currentUserId,
        });
        await photosRepo.save(photo);
        photoUrl = this.photos.url(storageKey, 400);
      } catch (error) {
        this.logger.warn(`Failed to store service event photo: ${String(error)}`);
      }
    }

    // Update vehicle odometer if the reported reading is higher
    if (dto.odometerKm !== undefined && dto.odometerKm !== null && Number(dto.odometerKm) > vehicle.odometerKm) {
      vehicle.odometerKm = Number(dto.odometerKm);
      await vehiclesRepo.save(vehicle);
    }

    // Auto-advance schedule if configured
    if (matchingSchedule) {
      if (matchingSchedule.intervalDays) {
        const performedDate = new Date(dto.performedAt);
        performedDate.setDate(performedDate.getDate() + matchingSchedule.intervalDays);
        matchingSchedule.nextDueDate = performedDate.toISOString().slice(0, 10);
      }
      if (matchingSchedule.intervalKm && dto.odometerKm !== undefined && dto.odometerKm !== null) {
        matchingSchedule.nextDueKm = Number(dto.odometerKm) + matchingSchedule.intervalKm;
      }
      await schedulesRepo.save(matchingSchedule);
    }

    return {
      id: savedEvent.id,
      performedAt: savedEvent.performedAt,
      vehicleId: vehicle.id,
      plate: vehicle.plate,
      make: vehicle.model.make,
      model: vehicle.model.name,
      task: task.name,
      type: savedEvent.type,
      odometerKm: savedEvent.odometerKm,
      notes: savedEvent.notes,
      recorder: recorder.fullName,
      photoUrl,
    };
  }
}

