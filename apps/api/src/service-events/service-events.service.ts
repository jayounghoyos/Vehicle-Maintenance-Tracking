import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

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
import type { RecordServiceEventDto } from './dto';
import type { ServiceLogRow, TaskItem } from './service-events.types';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'photos');

@Injectable()
export class ServiceEventsService {
  constructor(
    private readonly tenants: TenantRepositories,
    private readonly photos: PhotoStorage,
  ) {
    // Ensure upload directory exists as local fallback
    try {
      if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      }
    } catch (err) {
      console.warn('Could not create upload directory:', err);
    }
  }

  resolvePhotoUrl(storageKey: string): string {
    const cloudinaryUrl = this.photos.url(storageKey, 1600, { crop: 'limit' });
    return (
      cloudinaryUrl ?? `/api/service-events/photos/${encodeURIComponent(storageKey)}`
    );
  }

  async list(organizationId: number, vehicleId?: number): Promise<ServiceLogRow[]> {
    const events = this.tenants.for(ServiceEvent, organizationId);

    const rows = await events.find({
      where: vehicleId === undefined ? {} : { vehicleId },
      relations: {
        vehicle: { model: true },
        task: true,
        recorder: true,
        photos: true,
      },
      // id breaks the tie: two events logged in the same visit share a date
      order: { performedAt: 'DESC', id: 'DESC' },
    });

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
      photos: (event.photos ?? []).map((photo) => ({
        id: photo.id,
        storageKey: photo.storageKey,
        url: this.resolvePhotoUrl(photo.storageKey),
      })),
    }));
  }

  async getTasks(organizationId: number): Promise<TaskItem[]> {
    const tasks = this.tenants.for(MaintenanceTask, organizationId);
    const list = await tasks.find({ order: { name: 'ASC' } });
    return list.map((task) => ({ id: task.id, name: task.name }));
  }

  async recordService(
    organizationId: number,
    userId: number,
    dto: RecordServiceEventDto,
  ): Promise<ServiceLogRow> {
    const vehicles = this.tenants.for(Vehicle, organizationId);
    const vehicle = await vehicles.findOne({
      where: { id: dto.vehicleId },
      relations: { model: true },
    });
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    const tasks = this.tenants.for(MaintenanceTask, organizationId);
    const taskName = dto.taskName.trim();
    if (!taskName) {
      throw new BadRequestException('Task name cannot be empty');
    }

    // andWhere, not where: builder() has already applied the organization
    // condition and where() would replace it, matching another client's task
    let task = await tasks
      .builder('t')
      .andWhere('LOWER(t.name) = LOWER(:name)', { name: taskName })
      .getOne();

    if (!task) {
      task = await tasks.save(tasks.create({ name: taskName }));
    }

    // If linked to a schedule item, validate schedule & recalculate next due date/km
    let schedule: MaintenanceSchedule | null = null;
    if (dto.scheduleId) {
      const schedules = this.tenants.for(MaintenanceSchedule, organizationId);
      schedule = await schedules.findOne({
        where: { id: dto.scheduleId, vehicleId: vehicle.id },
      });

      if (!schedule) {
        throw new NotFoundException('Schedule item not found for this vehicle');
      }

      // Recalculate next due date from performed date if intervalDays is set
      if (schedule.intervalDays !== null && schedule.intervalDays > 0) {
        const performedDate = new Date(dto.performedAt + 'T00:00:00Z');
        performedDate.setUTCDate(performedDate.getUTCDate() + schedule.intervalDays);
        schedule.nextDueDate = performedDate.toISOString().slice(0, 10);
      }

      // Recalculate next due km if intervalKm is set
      if (schedule.intervalKm !== null && schedule.intervalKm > 0) {
        const baseKm = dto.odometerKm ?? vehicle.odometerKm;
        schedule.nextDueKm = baseKm + schedule.intervalKm;
      }

      await schedules.save(schedule);
    }

    // Update vehicle odometer if the new reading is higher
    if (
      dto.odometerKm !== undefined &&
      dto.odometerKm !== null &&
      dto.odometerKm > vehicle.odometerKm
    ) {
      vehicle.odometerKm = dto.odometerKm;
      await vehicles.save(vehicle);
    }

    // Create and save service event
    const events = this.tenants.for(ServiceEvent, organizationId);
    const event = await events.save(
      events.create({
        vehicleId: vehicle.id,
        scheduleId: schedule?.id ?? null,
        taskId: task.id,
        recordedBy: userId,
        type: dto.type,
        performedAt: dto.performedAt,
        odometerKm: dto.odometerKm ?? null,
        notes: dto.notes ? dto.notes.trim() : null,
      }),
    );

    // Save attached photos
    const photosRepo = this.tenants.for(ServiceEventPhoto, organizationId);
    const savedPhotos: ServiceEventPhoto[] = [];

    if (dto.photos && dto.photos.length > 0) {
      for (const photoData of dto.photos) {
        try {
          let storageKey: string;
          if (this.photos.isConfigured) {
            const buffer = this.extractBase64Buffer(photoData);
            storageKey = await this.photos.upload(buffer, organizationId);
          } else {
            storageKey = await this.savePhotoToDisk(organizationId, event.id, photoData);
          }
          const photo = await photosRepo.save(
            photosRepo.create({
              serviceEventId: event.id,
              storageKey,
              uploadedBy: userId,
            }),
          );
          savedPhotos.push(photo);
        } catch (err) {
          console.error('Failed to save service photo:', err);
        }
      }
    }

    const users = this.tenants.for(User, organizationId);
    const recorder = await users.findOne({ where: { id: userId } });

    return {
      id: event.id,
      performedAt: event.performedAt,
      vehicleId: vehicle.id,
      plate: vehicle.plate,
      make: vehicle.model.make,
      model: vehicle.model.name,
      task: task.name,
      type: event.type,
      odometerKm: event.odometerKm,
      notes: event.notes,
      recorder: recorder?.fullName ?? 'Unknown',
      photos: savedPhotos.map((photo) => ({
        id: photo.id,
        storageKey: photo.storageKey,
        url: this.resolvePhotoUrl(photo.storageKey),
      })),
    };
  }

  async getPhotoResource(
    organizationId: number,
    storageKey: string,
  ): Promise<
    | { type: 'redirect'; url: string }
    | { type: 'file'; filePath: string; contentType: string }
  > {
    const photos = this.tenants.for(ServiceEventPhoto, organizationId);
    const photo = await photos.findOne({ where: { storageKey } });

    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    if (this.photos.isConfigured && !storageKey.startsWith('org_')) {
      const cloudinaryUrl = this.photos.url(storageKey, 1600, { crop: 'limit' });
      if (cloudinaryUrl) {
        return { type: 'redirect', url: cloudinaryUrl };
      }
    }

    const filePath = path.join(UPLOAD_DIR, storageKey);
    if (!fs.existsSync(filePath)) {
      if (this.photos.isConfigured) {
        const cloudinaryUrl = this.photos.url(storageKey, 1600, { crop: 'limit' });
        if (cloudinaryUrl) return { type: 'redirect', url: cloudinaryUrl };
      }
      throw new NotFoundException('Photo file missing');
    }

    const ext = path.extname(storageKey).toLowerCase();
    let contentType = 'image/jpeg';
    if (ext === '.png') contentType = 'image/png';
    else if (ext === '.webp') contentType = 'image/webp';
    else if (ext === '.gif') contentType = 'image/gif';

    return { type: 'file', filePath, contentType };
  }

  private extractBase64Buffer(photoData: string): Buffer {
    const dataUrlMatch = photoData.match(/^data:(image\/[a-zA-Z0-9-.+]+);base64,(.*)$/);
    const base64String = dataUrlMatch ? dataUrlMatch[2] : photoData;
    return Buffer.from(base64String, 'base64');
  }

  private async savePhotoToDisk(
    organizationId: number,
    eventId: number,
    photoData: string,
  ): Promise<string> {
    if (!fs.existsSync(UPLOAD_DIR)) {
      await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });
    }

    const dataUrlMatch = photoData.match(/^data:(image\/[a-zA-Z0-9-.+]+);base64,(.*)$/);
    let mimeType = 'image/jpeg';
    let base64String = photoData;

    if (dataUrlMatch) {
      mimeType = dataUrlMatch[1];
      base64String = dataUrlMatch[2];
    }

    let ext = '.jpg';
    if (mimeType.includes('png')) ext = '.png';
    else if (mimeType.includes('webp')) ext = '.webp';
    else if (mimeType.includes('gif')) ext = '.gif';

    const storageKey = `org_${organizationId}_evt_${eventId}_${randomUUID()}${ext}`;
    const targetPath = path.join(UPLOAD_DIR, storageKey);

    const buffer = Buffer.from(base64String, 'base64');
    await fs.promises.writeFile(targetPath, buffer);

    return storageKey;
  }
}
