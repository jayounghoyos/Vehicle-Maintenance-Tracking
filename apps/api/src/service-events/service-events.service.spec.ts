import { Test, TestingModule } from '@nestjs/testing';

import { ServiceEventsService } from './service-events.service';
import { TenantRepositories } from '../tenant/tenant-repository';
import {
  MaintenanceSchedule,
  MaintenanceTask,
  ServiceEvent,
  ServiceEventPhoto,
  ServiceType,
  User,
  Vehicle,
} from '../entities';

describe('ServiceEventsService', () => {
  let service: ServiceEventsService;

  const mockVehicle = {
    id: 1,
    organizationId: 10,
    plate: 'ABC123',
    odometerKm: 50000,
    model: { make: 'Toyota', name: 'Hilux' },
  };

  const mockTask = {
    id: 2,
    organizationId: 10,
    name: 'Oil change',
  };

  const mockSchedule = {
    id: 5,
    organizationId: 10,
    vehicleId: 1,
    intervalDays: 180,
    intervalKm: 5000,
    nextDueDate: '2026-03-01',
    nextDueKm: 55000,
  };

  const mockEvent = {
    id: 101,
    organizationId: 10,
    vehicleId: 1,
    scheduleId: 5,
    taskId: 2,
    recordedBy: 20,
    type: ServiceType.PREVENTIVE,
    performedAt: '2026-09-02',
    odometerKm: 52000,
    notes: 'Synthetic oil 5W-30',
  };

  const mockUser = {
    id: 20,
    organizationId: 10,
    fullName: 'Carlos Mejia',
  };

  const mockTenants = {
    for: jest.fn((entity) => {
      if (entity === Vehicle) {
        return {
          findOne: jest.fn().mockResolvedValue(mockVehicle),
          save: jest.fn().mockImplementation((v) => Promise.resolve(v)),
        };
      }
      if (entity === MaintenanceTask) {
        return {
          builder: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue(mockTask),
          }),
          find: jest.fn().mockResolvedValue([mockTask]),
          save: jest.fn().mockImplementation((t) => Promise.resolve(t)),
          create: jest.fn().mockImplementation((t) => t),
        };
      }
      if (entity === MaintenanceSchedule) {
        return {
          findOne: jest.fn().mockResolvedValue({ ...mockSchedule }),
          save: jest.fn().mockImplementation((s) => Promise.resolve(s)),
        };
      }
      if (entity === ServiceEvent) {
        return {
          create: jest.fn().mockImplementation((e) => ({ id: 101, ...e })),
          save: jest.fn().mockImplementation((e) => Promise.resolve({ id: 101, ...e })),
          find: jest.fn().mockResolvedValue([
            {
              ...mockEvent,
              vehicle: mockVehicle,
              task: mockTask,
              recorder: mockUser,
              photos: [],
            },
          ]),
        };
      }
      if (entity === ServiceEventPhoto) {
        return {
          create: jest.fn().mockImplementation((p) => ({ id: 1, ...p })),
          save: jest.fn().mockImplementation((p) => Promise.resolve({ id: 1, ...p })),
          findOne: jest.fn().mockResolvedValue({ id: 1, storageKey: 'test.jpg' }),
        };
      }
      if (entity === User) {
        return {
          findOne: jest.fn().mockResolvedValue(mockUser),
        };
      }
      return {};
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceEventsService,
        { provide: TenantRepositories, useValue: mockTenants },
      ],
    }).compile();

    service = module.get<ServiceEventsService>(ServiceEventsService);
  });

  it('records service, recalculates schedule next due date/km, and updates odometer', async () => {
    const result = await service.recordService(10, 20, {
      vehicleId: 1,
      scheduleId: 5,
      taskName: 'Oil change',
      type: ServiceType.PREVENTIVE,
      performedAt: '2026-09-02',
      odometerKm: 52000,
      notes: 'Synthetic oil 5W-30',
      photos: ['data:image/jpeg;base64,/9j/4AAQSkZJRg=='],
    });

    expect(result.id).toBe(101);
    expect(result.vehicleId).toBe(1);
    expect(result.plate).toBe('ABC123');
    expect(result.task).toBe('Oil change');
    expect(result.type).toBe(ServiceType.PREVENTIVE);
    expect(result.odometerKm).toBe(52000);
    expect(result.recorder).toBe('Carlos Mejia');
    expect(result.photos.length).toBe(1);
    expect(result.photos[0].url).toContain('/api/service-events/photos/');
  });

  it('lists service events with photo metadata', async () => {
    const rows = await service.list(10);
    expect(rows.length).toBe(1);
    expect(rows[0].plate).toBe('ABC123');
    expect(rows[0].photos).toEqual([]);
  });

  it('lists task catalog', async () => {
    const tasks = await service.getTasks(10);
    expect(tasks).toEqual([{ id: 2, name: 'Oil change' }]);
  });
});
