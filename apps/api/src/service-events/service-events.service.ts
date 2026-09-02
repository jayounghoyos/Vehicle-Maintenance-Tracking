import { Injectable } from '@nestjs/common';

import { ServiceEvent } from '../entities';
import { TenantRepositories } from '../tenant/tenant-repository';
import type { ServiceLogRow } from './service-events.types';

@Injectable()
export class ServiceEventsService {
  constructor(private readonly tenants: TenantRepositories) {}

  async list(organizationId: number, vehicleId?: number): Promise<ServiceLogRow[]> {
    const events = this.tenants.for(ServiceEvent, organizationId);

    const rows = await events.find({
      where: vehicleId === undefined ? {} : { vehicleId },
      relations: { vehicle: { model: true }, task: true, recorder: true },
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
      recorder: event.recorder.fullName,
    }));
  }
}
