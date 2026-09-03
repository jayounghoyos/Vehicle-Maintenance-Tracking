import { Test, TestingModule } from '@nestjs/testing';
import { QueryFailedError } from 'typeorm';

import { MaintenanceSchedule, MaintenanceTask, ServiceEvent, Vehicle } from '../entities';
import { TenantRepositories } from '../tenant/tenant-repository';
import { SchedulesService } from './schedules.service';

describe('SchedulesService', () => {
  let service: SchedulesService;
  let mockEventCount: number;
  let mockTaskLookup: { name: string } | null;

  const mockVehicle = {
    id: 1,
    organizationId: 10,
    plate: 'ABC123',
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
    taskId: 2,
    intervalDays: 180,
    intervalKm: 5000,
    nextDueDate: null,
    nextDueKm: null,
    vehicle: mockVehicle,
    task: mockTask,
  };

  // a stable reference, not a fresh jest.fn() per call: the service asks
  // for the task repository more than once, and a test that overrides
  // save() for one call needs every call to see the same mock
  const mockTaskSave = jest
    .fn()
    .mockImplementation((t) => Promise.resolve({ id: 3, ...t }));

  const mockTenants = {
    for: jest.fn((entity) => {
      if (entity === Vehicle) {
        return {
          findOne: jest.fn().mockResolvedValue(mockVehicle),
        };
      }
      if (entity === MaintenanceTask) {
        return {
          findOne: jest.fn().mockResolvedValue(mockTask),
          find: jest.fn().mockResolvedValue([mockTask]),
          builder: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockImplementation(() => Promise.resolve(mockTaskLookup)),
          }),
          save: mockTaskSave,
          create: jest
            .fn()
            .mockImplementation((t: Partial<MaintenanceTask>) => t as MaintenanceTask),
        };
      }
      if (entity === MaintenanceSchedule) {
        return {
          find: jest.fn().mockResolvedValue([mockSchedule]),
          findOne: jest.fn().mockResolvedValue({ ...mockSchedule }),
          save: jest.fn().mockImplementation((s) => Promise.resolve({ id: 5, ...s })),
          create: jest
            .fn()
            .mockImplementation(
              (s: Partial<MaintenanceSchedule>) => s as MaintenanceSchedule,
            ),
          delete: jest.fn().mockResolvedValue({ affected: 1 }),
        };
      }
      if (entity === ServiceEvent) {
        return {
          count: jest.fn().mockImplementation(() => Promise.resolve(mockEventCount)),
        };
      }
      return {};
    }),
  };

  beforeEach(async () => {
    mockEventCount = 0;
    mockTaskLookup = null;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulesService,
        { provide: TenantRepositories, useValue: mockTenants },
      ],
    }).compile();

    service = module.get<SchedulesService>(SchedulesService);
  });

  it('lists schedules with vehicle and task detail', async () => {
    const rows = await service.list(10);
    expect(rows.length).toBe(1);
    expect(rows[0].plate).toBe('ABC123');
    expect(rows[0].make).toBe('Toyota');
    expect(rows[0].task).toBe('Oil change');
    expect(rows[0].state).toBe('on_track');
  });

  it('lists task catalog', async () => {
    const tasks = await service.listTasks(10);
    expect(tasks).toEqual([{ id: 2, name: 'Oil change' }]);
  });

  it('creates a schedule for an existing vehicle and task', async () => {
    const row = await service.create(10, {
      vehicleId: 1,
      taskId: 2,
      intervalDays: 180,
      intervalKm: null,
    });
    expect(row.vehicleId).toBe(1);
    expect(row.taskId).toBe(2);
    expect(row.plate).toBe('ABC123');
  });

  it('rejects an update that would leave both intervals empty', async () => {
    await expect(
      service.update(10, 5, { intervalDays: null, intervalKm: null }),
    ).rejects.toThrow('At least one of intervalDays or intervalKm is required');
  });

  it('refuses to delete a schedule with service events logged against it', async () => {
    mockEventCount = 2;
    await expect(service.remove(10, 5)).rejects.toThrow(
      '2 service events logged against this plan, so it cannot be deleted',
    );
  });

  it('rejects a duplicate task name found by the case-insensitive lookup', async () => {
    mockTaskLookup = { name: 'Oil change' };
    await expect(service.createTask(10, 'oil change')).rejects.toThrow(
      '"oil change" is already in the task catalog',
    );
  });

  it('turns a raced unique-constraint violation into a readable error, not a 500', async () => {
    mockTaskSave.mockRejectedValueOnce(
      new QueryFailedError(
        'INSERT INTO maintenance_tasks ...',
        [],
        Object.assign(new Error('duplicate key value violates unique constraint'), {
          code: '23505',
        }),
      ),
    );

    await expect(service.createTask(10, 'Oil change')).rejects.toThrow(
      '"Oil change" is already in the task catalog',
    );
  });
});
