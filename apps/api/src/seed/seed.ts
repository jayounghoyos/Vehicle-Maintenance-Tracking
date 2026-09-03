import { hashPassword } from '../auth/password';
import dataSource from '../data-source';
import { BASE_ROLES } from '../roles/base-roles';
import {
  MaintenanceSchedule,
  MaintenanceTask,
  Organization,
  PlatformAdmin,
  Role,
  ServiceEvent,
  ServiceType,
  User,
  Vehicle,
  VehicleModel,
  VehicleStatus,
} from '../entities';

/**
 * Development data, so there is something to look at. Wipes the tables
 * and refills them, so running it twice does not pile rows on top of
 * whatever was already there.
 *
 * Dates are relative to the day it runs, which keeps the derived states
 * meaningful however long after seeding the app is opened.
 */

function isoDaysFromToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * A year of history behind the handful of recent events, so the report
 * charts have a shape to draw rather than one bar.
 *
 * Deterministic on purpose: a seed built on Math.random gives a
 * different demo every run and a chart nobody can compare with the one
 * they saw yesterday. The dates are still relative to the day it runs,
 * like everything else here.
 */
function backfill(
  org: number,
  vehicleIds: number[],
  taskIds: number[],
  recorderIds: number[],
): Record<string, unknown>[] {
  const events: Record<string, unknown>[] = [];
  // one every nine days, walked backwards from a month ago
  for (let i = 0; i < 40; i += 1) {
    const day = -30 - i * 9;
    events.push({
      organizationId: org,
      vehicleId: vehicleIds[i % vehicleIds.length],
      scheduleId: null,
      taskId: taskIds[i % taskIds.length],
      recordedBy: recorderIds[i % recorderIds.length],
      // every fifth is a breakdown, which is roughly what a fleet sees
      type: i % 5 === 0 ? ServiceType.CORRECTIVE : ServiceType.PREVENTIVE,
      performedAt: isoDaysFromToday(day),
      odometerKm: 40_000 + i * 1_500,
      notes: null,
    });
  }
  return events;
}

// Development credentials, printed on the way out so they are never a
// secret anybody has to guess. Fine for a local database full of made-up
// vehicles; nothing here is a real account.
const DEV_PASSWORD = process.env.SEED_PASSWORD ?? 'mts-dev-password';

async function seed(): Promise<void> {
  await dataSource.initialize();
  const db = dataSource.manager;

  await dataSource.query(`
    TRUNCATE service_event_photos, service_events, maintenance_schedules,
             maintenance_tasks, vehicles, vehicle_models, users, role_permissions,
             roles, organizations, platform_admins
    RESTART IDENTITY CASCADE
  `);

  const org = await db.save(
    db.create(Organization, {
      name: 'City Logistics Fleet',
      ownerName: 'Ana Restrepo',
      address: 'Cra 43A #1-50, El Poblado, Medellin',
      phone: '3217240555',
      email: 'logistics@citylogistics.co',
      isActive: true,
      deletedAt: null,
    }),
  );

  const passwordHash = await hashPassword(DEV_PASSWORD);

  // the three every organization starts with, which the client is then
  // free to rename, re-grant or add to
  const [coordinator, mechanic, manager] = await db.save(
    BASE_ROLES.map(({ name, permissions }) =>
      db.create(Role, {
        organizationId: org.id,
        name,
        permissions: permissions.map((permission) => ({ permission })),
      }),
    ),
  );

  // one of each, so the difference between them can be seen by signing
  // in rather than by reading the guards
  const [ana, carlos] = await db.save(User, [
    {
      organizationId: org.id,
      fullName: 'Ana Restrepo',
      email: 'ana@citylogistics.co',
      passwordHash,
      roleId: coordinator.id,
    },
    {
      organizationId: org.id,
      fullName: 'Carlos Mejia',
      email: 'carlos@citylogistics.co',
      passwordHash,
      roleId: mechanic.id,
    },
    {
      organizationId: org.id,
      fullName: 'Laura Gomez',
      email: 'laura@citylogistics.co',
      passwordHash,
      roleId: manager.id,
    },
  ]);

  // whoever runs the service, in no organization at all
  await db.save(
    db.create(PlatformAdmin, {
      fullName: 'MTS Admin',
      email: 'admin@mts.local',
      passwordHash,
    }),
  );

  const models = await db.save(VehicleModel, [
    { make: 'Chevrolet', name: 'NHR' },
    { make: 'Hyundai', name: 'H100' },
    { make: 'Renault', name: 'Kangoo' },
    { make: 'Chevrolet', name: 'N300' },
    { make: 'Renault', name: 'Master' },
    { make: 'Hyundai', name: 'Porter' },
  ]);

  const vehicles = await db.save(Vehicle, [
    {
      organizationId: org.id,
      plate: 'ABC123',
      modelId: models[0].id,
      year: 2019,
      odometerKm: 128_450,
      status: VehicleStatus.ACTIVE,
    },
    {
      organizationId: org.id,
      plate: 'GHI789',
      modelId: models[1].id,
      year: 2020,
      odometerKm: 143_980,
      status: VehicleStatus.ACTIVE,
    },
    {
      organizationId: org.id,
      plate: 'DEF456',
      modelId: models[2].id,
      year: 2021,
      odometerKm: 96_210,
      status: VehicleStatus.ACTIVE,
    },
    {
      organizationId: org.id,
      plate: 'JKL012',
      modelId: models[3].id,
      year: 2018,
      odometerKm: 187_320,
      status: VehicleStatus.IN_SHOP,
    },
    {
      organizationId: org.id,
      plate: 'MNO345',
      modelId: models[4].id,
      year: 2022,
      odometerKm: 54_600,
      status: VehicleStatus.ACTIVE,
    },
    {
      organizationId: org.id,
      plate: 'STU901',
      modelId: models[5].id,
      year: 2020,
      odometerKm: 77_940,
      status: VehicleStatus.IN_SHOP,
    },
  ]);

  const tasks = await db.save(MaintenanceTask, [
    { organizationId: org.id, name: 'Oil change' },
    { organizationId: org.id, name: 'Brake inspection' },
    { organizationId: org.id, name: 'Tire rotation' },
    { organizationId: org.id, name: 'Clutch check' },
  ]);

  const schedules = await db.save(MaintenanceSchedule, [
    {
      organizationId: org.id,
      vehicleId: vehicles[0].id,
      taskId: tasks[0].id,
      intervalDays: 180,
      intervalKm: null,
      nextDueDate: isoDaysFromToday(-12),
      nextDueKm: null,
    },
    {
      organizationId: org.id,
      vehicleId: vehicles[1].id,
      taskId: tasks[1].id,
      intervalDays: 365,
      intervalKm: null,
      nextDueDate: isoDaysFromToday(3),
      nextDueKm: null,
    },
    {
      organizationId: org.id,
      vehicleId: vehicles[2].id,
      taskId: tasks[2].id,
      intervalDays: 120,
      intervalKm: null,
      nextDueDate: isoDaysFromToday(9),
      nextDueKm: null,
    },
    {
      organizationId: org.id,
      vehicleId: vehicles[3].id,
      taskId: tasks[0].id,
      intervalDays: 180,
      intervalKm: null,
      nextDueDate: isoDaysFromToday(-4),
      nextDueKm: null,
    },
    {
      organizationId: org.id,
      vehicleId: vehicles[4].id,
      taskId: tasks[3].id,
      intervalDays: 365,
      intervalKm: null,
      nextDueDate: isoDaysFromToday(32),
      nextDueKm: null,
    },
    {
      organizationId: org.id,
      vehicleId: vehicles[5].id,
      taskId: tasks[0].id,
      intervalDays: 180,
      intervalKm: null,
      nextDueDate: isoDaysFromToday(43),
      nextDueKm: null,
    },
  ]);

  await db.save(ServiceEvent, [
    {
      organizationId: org.id,
      vehicleId: vehicles[2].id,
      scheduleId: schedules[2].id,
      taskId: tasks[0].id,
      recordedBy: carlos.id,
      type: ServiceType.PREVENTIVE,
      performedAt: isoDaysFromToday(-2),
      odometerKm: 96_210,
      notes: 'Oil and filter changed, full synthetic',
    },
    {
      organizationId: org.id,
      vehicleId: vehicles[1].id,
      scheduleId: schedules[1].id,
      taskId: tasks[1].id,
      recordedBy: carlos.id,
      type: ServiceType.PREVENTIVE,
      performedAt: isoDaysFromToday(-5),
      odometerKm: 143_980,
      notes: 'Pads at 40 percent, replace next service',
    },
    // schedule_id null: the breakdown nobody planned
    {
      organizationId: org.id,
      vehicleId: vehicles[4].id,
      scheduleId: null,
      taskId: tasks[3].id,
      recordedBy: carlos.id,
      type: ServiceType.CORRECTIVE,
      performedAt: isoDaysFromToday(-7),
      odometerKm: 54_600,
      notes: 'Clutch failure on route, vehicle towed in',
    },
    {
      organizationId: org.id,
      vehicleId: vehicles[3].id,
      scheduleId: schedules[3].id,
      taskId: tasks[2].id,
      recordedBy: ana.id,
      type: ServiceType.PREVENTIVE,
      performedAt: isoDaysFromToday(-23),
      odometerKm: 187_320,
      notes: 'Rotated, front tires worn unevenly',
    },
    ...backfill(
      org.id,
      vehicles.map((vehicle) => vehicle.id),
      tasks.map((task) => task.id),
      [carlos.id, ana.id],
    ),
  ]);

  console.log(
    `seeded: 1 organization, 3 users, 1 platform admin, ${models.length} models, ${vehicles.length} vehicles, ${tasks.length} tasks, ${schedules.length} schedules, 4 service events`,
  );
  console.log('');
  console.log('  sign in with            password');
  console.log(`  ana@citylogistics.co    ${DEV_PASSWORD}   (fleet coordinator)`);
  console.log(`  carlos@citylogistics.co ${DEV_PASSWORD}   (mechanic)`);
  console.log(`  laura@citylogistics.co  ${DEV_PASSWORD}   (operations manager)`);
  console.log(`  admin@mts.local         ${DEV_PASSWORD}   (platform admin)`);
  console.log('');
  await dataSource.destroy();
}

seed().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
