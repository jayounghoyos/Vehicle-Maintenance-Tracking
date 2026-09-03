import { Test, TestingModule } from '@nestjs/testing';
import { QueryFailedError } from 'typeorm';

import { MaintenanceSchedule, MaintenanceTask, ServiceEvent, Vehicle } from '../entities';
import { TenantRepositories } from '../tenant/tenant-repository';
import { SchedulesService } from './schedules.service';

function isoDaysFromToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

describe('SchedulesService', () => {
  let service: SchedulesService;
  let mockEventCount: number;
  let mockTaskLookup: { name: string } | null;

  // organization 10 is "us"; organization 20 exists only to prove a
  // vehicle or task that belongs to somebody else is invisible, the
  // same way the real TenantRepository would refuse to find it
  const mockVehicle = {
    id: 1,
    organizationId: 10,
    plate: 'ABC123',
    model: { make: 'Toyota', name: 'Hilux' },
  };
  const mockVehicleOverdue = {
    id: 6,
    organizationId: 10,
    plate: 'XYZ999',
    model: { make: 'Renault', name: 'Kangoo' },
  };
  const mockVehicleDueSoon = {
    id: 7,
    organizationId: 10,
    plate: 'QRS111',
    model: { make: 'Hyundai', name: 'H100' },
  };
  const mockOtherOrgVehicle = {
    id: 99,
    organizationId: 20,
    plate: 'OTHER1',
    model: { make: 'Ford', name: 'Transit' },
  };
  const vehiclesByOrg: Record<number, Record<number, typeof mockVehicle>> = {
    10: { 1: mockVehicle, 6: mockVehicleOverdue, 7: mockVehicleDueSoon },
    20: { 99: mockOtherOrgVehicle },
  };

  const mockTask = { id: 2, organizationId: 10, name: 'Oil change' };
  const mockOtherOrgTask = { id: 88, organizationId: 20, name: 'Foreign task' };
  const tasksByOrg: Record<number, Record<number, typeof mockTask>> = {
    10: { 2: mockTask },
    20: { 88: mockOtherOrgTask },
  };

  // one of each state, so list() is checked against all three rather
  // than only the on_track case a null nextDueDate already covers
  const mockScheduleOnTrack = {
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
  const mockScheduleOverdue = {
    id: 6,
    organizationId: 10,
    vehicleId: 6,
    taskId: 2,
    intervalDays: 90,
    intervalKm: null,
    nextDueDate: isoDaysFromToday(-3),
    nextDueKm: null,
    vehicle: mockVehicleOverdue,
    task: mockTask,
  };
  const mockScheduleDueSoon = {
    id: 7,
    organizationId: 10,
    vehicleId: 7,
    taskId: 2,
    intervalDays: 30,
    intervalKm: null,
    nextDueDate: isoDaysFromToday(5),
    nextDueKm: null,
    vehicle: mockVehicleDueSoon,
    task: mockTask,
  };
  const allSchedules = [mockScheduleOnTrack, mockScheduleOverdue, mockScheduleDueSoon];

  // a stable reference, not a fresh jest.fn() per call: the service asks
  // for the task repository more than once, and a test that overrides
  // save() for one call needs every call to see the same mock
  const mockTaskSave = jest
    .fn()
    .mockImplementation((t) => Promise.resolve({ id: 3, ...t }));

  const mockTenants = {
    for: jest.fn((entity, organizationId: number) => {
      if (entity === Vehicle) {
        return {
          findOne: jest
            .fn()
            .mockImplementation(({ where }: { where: { id: number } }) =>
              Promise.resolve(vehiclesByOrg[organizationId]?.[where.id] ?? null),
            ),
        };
      }
      if (entity === MaintenanceTask) {
        return {
          findOne: jest
            .fn()
            .mockImplementation(({ where }: { where: { id: number } }) =>
              Promise.resolve(tasksByOrg[organizationId]?.[where.id] ?? null),
            ),
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
          find: jest
            .fn()
            .mockImplementation(({ where }: { where?: { vehicleId?: number } } = {}) =>
              Promise.resolve(
                where?.vehicleId === undefined
                  ? allSchedules
                  : allSchedules.filter((s) => s.vehicleId === where.vehicleId),
              ),
            ),
          findOne: jest
            .fn()
            .mockImplementation(({ where }: { where: { id: number } }) =>
              Promise.resolve(allSchedules.find((s) => s.id === where.id) ?? null),
            ),
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
          builder: jest.fn().mockReturnValue({
            distinctOn: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            addOrderBy: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue([]),
          }),
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

  it('lists schedules with vehicle and task detail, and the right state for each due date', async () => {
    const rows = await service.list(10);
    expect(rows.length).toBe(3);

    const byId = new Map(rows.map((row) => [row.id, row]));
    expect(byId.get(5)?.state).toBe('on_track');
    expect(byId.get(5)?.plate).toBe('ABC123');
    expect(byId.get(5)?.make).toBe('Toyota');
    expect(byId.get(5)?.task).toBe('Oil change');
    expect(byId.get(6)?.state).toBe('overdue');
    expect(byId.get(7)?.state).toBe('due_soon');
  });

  it('lists only the schedules for the requested vehicle', async () => {
    const rows = await service.list(10, 6);
    expect(rows.length).toBe(1);
    expect(rows[0].plate).toBe('XYZ999');
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

  it('rejects a create with both intervals empty, before touching the vehicle or task', async () => {
    await expect(
      service.create(10, {
        vehicleId: 1,
        taskId: 2,
        intervalDays: null,
        intervalKm: null,
      }),
    ).rejects.toThrow('At least one of intervalDays or intervalKm is required');
  });

  it('refuses to create against a vehicle that belongs to another organization', async () => {
    await expect(
      service.create(10, { vehicleId: 99, taskId: 2, intervalDays: 30 }),
    ).rejects.toThrow('Vehicle not found');
  });

  it('refuses to create against a task that belongs to another organization', async () => {
    await expect(
      service.create(10, { vehicleId: 1, taskId: 88, intervalDays: 30 }),
    ).rejects.toThrow('Task not found');
  });

  it('rejects an update that would leave both intervals empty', async () => {
    await expect(
      service.update(10, 5, { intervalDays: null, intervalKm: null }),
    ).rejects.toThrow('At least one of intervalDays or intervalKm is required');
  });

  it('refuses to delete a schedule with service events logged against it', async () => {
    mockEventCount = 2;
    await expect(service.remove(10, 5)).rejects.toThrow(
      '2 service events logged against this schedule, so it cannot be deleted',
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
