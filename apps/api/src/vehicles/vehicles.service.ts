import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  MaintenanceSchedule,
  ServiceEvent,
  VehiclePhoto,
  Vehicle,
  VehicleModel,
  VehicleStatus,
} from '../entities';
import { maintenanceByVehicle, stateSchedules } from '../maintenance/fleet-state';
import { scheduleState } from '../maintenance/maintenance';
import { PhotoStorage } from '../photos/photo-storage.service';
import { TenantRepositories, type TenantRepository } from '../tenant/tenant-repository';
import type { CreateVehicleDto, ImportVehiclesDto, UpdateVehicleDto } from './dto';
import type {
  ImportResult,
  ScheduleItem,
  ServiceEventItem,
  VehicleDetail,
  VehicleRow,
} from './vehicles.types';

const RECENT_EVENT_LIMIT = 5;

/* Delivery widths, in pixels. One stored file, sized by whoever asks for
 * it, so the fleet table does not download a photo meant for a profile. */
const PHOTO_THUMBNAIL = 96;
const PHOTO_PROFILE = 640;
/* Enough to show a van from every side. A gallery with no ceiling is an
   object store bill nobody agreed to. */
const MAX_GALLERY_PHOTOS = 12;

/**
 * Plates are written down by people, so ABC123, abc123 and "ABC 123" are
 * the same van. Normalised on the way in, which means the unique index
 * on (organization_id, plate) actually catches the duplicate rather than
 * storing a third spelling of it.
 */
export function normalisePlate(plate: string): string {
  return plate.replace(/\s+/g, '').toUpperCase();
}

@Injectable()
export class VehiclesService {
  constructor(
    private readonly tenants: TenantRepositories,
    /** vehicle_models has no organization_id: it is reference data every
     *  client reads, so it cannot go through a tenant repository */
    @InjectRepository(VehicleModel)
    private readonly models: Repository<VehicleModel>,
    private readonly photos: PhotoStorage,
  ) {}

  private scoped(organizationId: number): {
    vehicles: TenantRepository<Vehicle>;
    schedules: TenantRepository<MaintenanceSchedule>;
    events: TenantRepository<ServiceEvent>;
    gallery: TenantRepository<VehiclePhoto>;
  } {
    return {
      vehicles: this.tenants.for(Vehicle, organizationId),
      schedules: this.tenants.for(MaintenanceSchedule, organizationId),
      events: this.tenants.for(ServiceEvent, organizationId),
      gallery: this.tenants.for(VehiclePhoto, organizationId),
    };
  }

  async list(
    organizationId: number,
    today = new Date(),
    photoWidth = PHOTO_THUMBNAIL,
  ): Promise<VehicleRow[]> {
    const { vehicles, schedules } = this.scoped(organizationId);

    const rows = await vehicles.find({
      relations: { model: true },
      // id breaks the tie: a whole import shares one timestamp
      order: { plate: 'ASC', id: 'ASC' },
    });
    const allSchedules = await schedules.find({ relations: { task: true } });
    const byVehicle = maintenanceByVehicle(stateSchedules(allSchedules, today));
    const eventCounts = await this.eventCounts(organizationId);

    const scheduleCounts = new Map<number, number>();
    for (const schedule of allSchedules) {
      scheduleCounts.set(
        schedule.vehicleId,
        (scheduleCounts.get(schedule.vehicleId) ?? 0) + 1,
      );
    }

    return rows.map((vehicle) => ({
      id: vehicle.id,
      plate: vehicle.plate,
      make: vehicle.model.make,
      model: vehicle.model.name,
      year: vehicle.year,
      odometerKm: vehicle.odometerKm,
      status: vehicle.status,
      photoUrl: this.photos.url(vehicle.photoKey, photoWidth),
      // a vehicle nobody scheduled anything for is not behind on anything
      state: byVehicle.get(vehicle.id)?.state ?? 'on_track',
      nextTask: byVehicle.get(vehicle.id)?.nextTask ?? null,
      nextDueDate: byVehicle.get(vehicle.id)?.nextDueDate ?? null,
      scheduleCount: scheduleCounts.get(vehicle.id) ?? 0,
      serviceEventCount: eventCounts.get(vehicle.id) ?? 0,
      createdAt: vehicle.createdAt,
    }));
  }

  async one(
    organizationId: number,
    id: number,
    today = new Date(),
  ): Promise<VehicleDetail> {
    const { schedules, events, gallery } = this.scoped(organizationId);
    const row = (await this.list(organizationId, today, PHOTO_PROFILE)).find(
      (one) => one.id === id,
    );
    if (!row) throw new NotFoundException('No such vehicle');

    const pictures = await gallery.find({
      where: { vehicleId: id },
      order: { position: 'ASC', id: 'ASC' },
    });

    const mine = await schedules.find({
      where: { vehicleId: id },
      relations: { task: true },
      order: { nextDueDate: 'ASC' },
    });
    const history = await events.find({
      where: { vehicleId: id },
      relations: { task: true, recorder: true, photos: true },
      order: { performedAt: 'DESC' },
      take: RECENT_EVENT_LIMIT,
    });

    const scheduleItems: ScheduleItem[] = mine.map((schedule) => ({
      id: schedule.id,
      task: schedule.task.name,
      intervalDays: schedule.intervalDays,
      intervalKm: schedule.intervalKm,
      nextDueDate: schedule.nextDueDate,
      nextDueKm: schedule.nextDueKm,
      state: scheduleState(schedule.nextDueDate, today),
    }));

    const recentEvents: ServiceEventItem[] = history.map((event) => ({
      id: event.id,
      task: event.task.name,
      type: event.type,
      performedAt: event.performedAt,
      odometerKm: event.odometerKm,
      notes: event.notes,
      recorder: event.recorder?.fullName ?? 'Unknown',
      photos: (event.photos ?? []).map((photo) => ({
        id: photo.id,
        storageKey: photo.storageKey,
        url:
          this.photos.url(photo.storageKey, 1600, { crop: 'limit' }) ??
          `/api/service-events/photos/${encodeURIComponent(photo.storageKey)}`,
      })),
    }));

    return {
      ...row,
      schedules: scheduleItems,
      recentEvents,
      photos: pictures.map((photo) => ({
        id: photo.id,
        storageKey: photo.storageKey,
        url: this.photos.url(photo.storageKey, PHOTO_PROFILE) ?? '',
      })),
    };
  }

  async create(organizationId: number, dto: CreateVehicleDto): Promise<VehicleRow> {
    const { vehicles } = this.scoped(organizationId);
    const plate = normalisePlate(dto.plate);

    // scoped, not global: the plate is unique per organization, so two
    // clients are each allowed to run a van called ABC123
    const taken = await vehicles.findOne({ where: { plate } });
    if (taken) throw new ConflictException(`${plate} is already in this fleet`);

    const { model } = await this.findOrCreateModel(dto.make, dto.model);
    const saved = await vehicles.save(
      vehicles.create({
        plate,
        modelId: model.id,
        year: dto.year ?? null,
        odometerKm: dto.odometerKm ?? 0,
        status: dto.status ?? VehicleStatus.ACTIVE,
      }),
    );
    return this.rowFor(organizationId, saved.id);
  }

  async update(
    organizationId: number,
    id: number,
    dto: UpdateVehicleDto,
  ): Promise<VehicleRow> {
    const { vehicles } = this.scoped(organizationId);
    const vehicle = await vehicles.findOne({ where: { id } });
    if (!vehicle) throw new NotFoundException('No such vehicle');

    if (dto.plate !== undefined) {
      const plate = normalisePlate(dto.plate);
      if (plate !== vehicle.plate) {
        const taken = await vehicles.findOne({ where: { plate } });
        if (taken) throw new ConflictException(`${plate} is already in this fleet`);
        vehicle.plate = plate;
      }
    }
    // make and model travel together: either names a model row, and one
    // without the other would resolve against a half-changed pair
    if (dto.make !== undefined || dto.model !== undefined) {
      const current = await this.models.findOne({ where: { id: vehicle.modelId } });
      const { model } = await this.findOrCreateModel(
        dto.make ?? current?.make ?? '',
        dto.model ?? current?.name ?? '',
      );
      vehicle.modelId = model.id;
    }
    if (dto.year !== undefined) vehicle.year = dto.year;
    if (dto.odometerKm !== undefined) vehicle.odometerKm = dto.odometerKm;
    if (dto.status !== undefined) vehicle.status = dto.status;

    await vehicles.save(vehicle);
    return this.rowFor(organizationId, vehicle.id);
  }

  /**
   * The picture arrives when an existing vehicle is edited, not when it
   * is registered: filling in a plate and choosing a file are different
   * kinds of work, and one should not hold up the other.
   *
   * The row is pointed at the new file before the old one is deleted. A
   * failed delete then costs a leftover image; the other order would
   * cost a vehicle pointing at a file that is gone.
   */
  async setPhoto(organizationId: number, id: number, file: Buffer): Promise<VehicleRow> {
    const { vehicles } = this.scoped(organizationId);
    const vehicle = await vehicles.findOne({ where: { id } });
    if (!vehicle) throw new NotFoundException('No such vehicle');

    const previous = vehicle.photoKey;
    vehicle.photoKey = await this.photos.upload(file, organizationId);
    await vehicles.save(vehicle);
    if (previous) await this.photos.remove(previous);

    return this.rowFor(organizationId, id);
  }

  /**
   * The pictures beyond the main one. Several at a time, because
   * photographing a van is one job rather than six.
   */
  async addPhotos(
    organizationId: number,
    id: number,
    userId: number,
    files: Buffer[],
  ): Promise<VehicleDetail> {
    const { vehicles, gallery } = this.scoped(organizationId);
    const vehicle = await vehicles.findOne({ where: { id } });
    if (!vehicle) throw new NotFoundException('No such vehicle');

    const held = await gallery.count({ where: { vehicleId: id } });
    if (held + files.length > MAX_GALLERY_PHOTOS) {
      throw new ConflictException(
        `A vehicle holds ${MAX_GALLERY_PHOTOS} pictures. This one already has ${held}.`,
      );
    }

    // every file first, so a failure half way through leaves no rows and
    // no gallery that half worked. The uploads already done are undone
    // before the error travels.
    const uploaded: string[] = [];
    try {
      for (const file of files) {
        uploaded.push(await this.photos.upload(file, organizationId));
      }
    } catch (error) {
      await Promise.all(uploaded.map((key) => this.photos.remove(key)));
      throw error;
    }

    await gallery.save(
      gallery.createMany(
        uploaded.map((storageKey, index) => ({
          vehicleId: id,
          storageKey,
          uploadedBy: userId,
          position: held + index,
        })),
      ),
    );

    return this.one(organizationId, id);
  }

  /** Row first, file second, for the reason setPhoto gives. */
  async removeGalleryPhoto(
    organizationId: number,
    id: number,
    photoId: number,
  ): Promise<VehicleDetail> {
    const { gallery } = this.scoped(organizationId);
    const photo = await gallery.findOne({ where: { id: photoId, vehicleId: id } });
    if (!photo) throw new NotFoundException('No such picture');

    await gallery.delete({ id: photoId });
    await this.photos.remove(photo.storageKey);

    return this.one(organizationId, id);
  }

  /**
   * Swaps rather than moves: the main picture takes the promoted one's
   * place in the gallery, so nothing is lost and no file is touched.
   */
  async promotePhoto(
    organizationId: number,
    id: number,
    photoId: number,
  ): Promise<VehicleDetail> {
    const { vehicles, gallery } = this.scoped(organizationId);
    const vehicle = await vehicles.findOne({ where: { id } });
    if (!vehicle) throw new NotFoundException('No such vehicle');

    const photo = await gallery.findOne({ where: { id: photoId, vehicleId: id } });
    if (!photo) throw new NotFoundException('No such picture');

    const demoted = vehicle.photoKey;
    vehicle.photoKey = photo.storageKey;
    await vehicles.save(vehicle);

    if (demoted) {
      photo.storageKey = demoted;
      await gallery.save(photo);
    } else {
      await gallery.delete({ id: photoId });
    }

    return this.one(organizationId, id);
  }

  async removePhoto(organizationId: number, id: number): Promise<VehicleRow> {
    const { vehicles } = this.scoped(organizationId);
    const vehicle = await vehicles.findOne({ where: { id } });
    if (!vehicle) throw new NotFoundException('No such vehicle');

    const previous = vehicle.photoKey;
    vehicle.photoKey = null;
    await vehicles.save(vehicle);
    if (previous) await this.photos.remove(previous);

    return this.rowFor(organizationId, id);
  }

  /**
   * Permanent, and only for a vehicle nothing points at. Schedules and
   * service events both hold a foreign key to it with no cascade, so
   * deleting one that has either fails in the database as a 500 unless
   * it is refused here first. A vehicle that has been worked on is
   * retired with status out_of_service, which keeps its history.
   */
  async remove(organizationId: number, id: number): Promise<void> {
    const { vehicles, schedules, events } = this.scoped(organizationId);
    const vehicle = await vehicles.findOne({ where: { id } });
    if (!vehicle) throw new NotFoundException('No such vehicle');

    const [scheduleCount, eventCount] = await Promise.all([
      schedules.count({ where: { vehicleId: id } }),
      events.count({ where: { vehicleId: id } }),
    ]);
    if (scheduleCount > 0 || eventCount > 0) {
      throw new ConflictException(
        `${vehicle.plate} has ${describe(scheduleCount, 'schedule')} and ` +
          `${describe(eventCount, 'service event')}, so it can only be taken ` +
          `out of service`,
      );
    }

    await vehicles.delete({ id });
    // after the row is gone: an orphaned image is harmless, a vehicle
    // whose picture was deleted by a failed request is not
    if (vehicle.photoKey) await this.photos.remove(vehicle.photoKey);
  }

  /**
   * Partial success, the same shape the team import uses: a plate that
   * is already in the fleet should not cost the coordinator the other
   * forty-six rows.
   */
  async importMany(
    organizationId: number,
    dto: ImportVehiclesDto,
  ): Promise<ImportResult> {
    const { vehicles } = this.scoped(organizationId);
    const skipped: ImportResult['skipped'] = [];
    const wanted = new Map<
      string,
      { row: number; vehicle: ImportVehiclesDto['vehicles'][0] }
    >();

    // the same plate twice in one paste is the caller's typo, and the
    // first occurrence is the one that wins
    dto.vehicles.forEach((vehicle, index) => {
      const plate = normalisePlate(vehicle.plate);
      if (wanted.has(plate)) {
        skipped.push({ row: index, plate, reason: 'Repeated in this list' });
        return;
      }
      wanted.set(plate, { row: index, vehicle });
    });

    // one query for every plate rather than one query each, and scoped,
    // so a plate another client owns is not treated as taken
    const taken = await vehicles.find({
      where: [...wanted.keys()].map((plate) => ({ plate })),
      select: { plate: true },
    });
    for (const { plate } of taken) {
      const entry = wanted.get(plate);
      if (!entry) continue;
      skipped.push({ row: entry.row, plate, reason: 'Already in this fleet' });
      wanted.delete(plate);
    }

    const pending = [...wanted.values()].sort((a, b) => a.row - b.row);
    const createdModels: string[] = [];
    const modelIds = new Map<string, number>();
    for (const { vehicle } of pending) {
      const key = modelKey(vehicle.make, vehicle.model);
      if (modelIds.has(key)) continue;
      const { model, created } = await this.findOrCreateModel(
        vehicle.make,
        vehicle.model,
      );
      modelIds.set(key, model.id);
      if (created) createdModels.push(`${model.make} ${model.name}`);
    }

    const saved = await vehicles.save(
      pending.map(({ vehicle }) =>
        vehicles.create({
          plate: normalisePlate(vehicle.plate),
          modelId: modelIds.get(modelKey(vehicle.make, vehicle.model)),
          year: vehicle.year ?? null,
          odometerKm: vehicle.odometerKm ?? 0,
          status: vehicle.status ?? VehicleStatus.ACTIVE,
        }),
      ),
    );

    const ids = new Set(saved.map((one) => one.id));
    const rows = (await this.list(organizationId)).filter((row) => ids.has(row.id));
    return {
      created: rows,
      skipped: skipped.sort((a, b) => a.row - b.row),
      createdModels,
    };
  }

  /**
   * Looked up without regard to case, so "chevrolet NHR" finds the row
   * that says "Chevrolet NHR" instead of adding a second one to a table
   * every client reads. Stored as it was typed the first time.
   */
  private async findOrCreateModel(
    make: string,
    name: string,
  ): Promise<{ model: VehicleModel; created: boolean }> {
    const found = await this.models
      .createQueryBuilder('model')
      .where('lower(model.make) = lower(:make)', { make: make.trim() })
      .andWhere('lower(model.name) = lower(:name)', { name: name.trim() })
      .getOne();
    if (found) return { model: found, created: false };

    const model = await this.models.save(
      this.models.create({ make: make.trim(), name: name.trim() }),
    );
    return { model, created: true };
  }

  /** One grouped query rather than one per vehicle. */
  private async eventCounts(organizationId: number): Promise<Map<number, number>> {
    const rows = await this.scoped(organizationId)
      .events.builder('event')
      .select('event.vehicle_id', 'vehicleId')
      .addSelect('count(*)', 'count')
      .groupBy('event.vehicle_id')
      .getRawMany<{ vehicleId: number; count: string }>();
    return new Map(rows.map((row) => [Number(row.vehicleId), Number(row.count)]));
  }

  private async rowFor(organizationId: number, id: number): Promise<VehicleRow> {
    const row = (await this.list(organizationId)).find((one) => one.id === id);
    if (!row) throw new NotFoundException('No such vehicle');
    return row;
  }
}

const modelKey = (make: string, name: string) =>
  `${make.trim().toLowerCase()}|${name.trim().toLowerCase()}`;

const describe = (count: number, noun: string) =>
  `${count} ${noun}${count === 1 ? '' : 's'}`;
