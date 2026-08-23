import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Postgres indexes primary keys and unique constraints and nothing else,
 * so every foreign key we declared was left unindexed. Each of these
 * columns is either what a tenant query filters by or what a join reads,
 * and without them both are sequential scans over the whole table.
 *
 * vehicles and maintenance_tasks are absent on purpose: their unique
 * indexes already start with organization_id, and a second index on the
 * same prefix would cost writes and buy nothing.
 */
const INDEXES: [name: string, table: string, columns: string][] = [
  // what a tenant query filters by
  ['users_organization_idx', 'users', '"organization_id"'],
  [
    'maintenance_schedules_organization_idx',
    'maintenance_schedules',
    '"organization_id"',
  ],
  ['service_event_photos_organization_idx', 'service_event_photos', '"organization_id"'],
  // the service log is read newest first, within one organization
  [
    'service_events_organization_performed_idx',
    'service_events',
    '"organization_id", "performed_at" DESC',
  ],

  // what a join or a delete has to look up
  ['vehicles_model_idx', 'vehicles', '"model_id"'],
  ['maintenance_schedules_vehicle_idx', 'maintenance_schedules', '"vehicle_id"'],
  ['maintenance_schedules_task_idx', 'maintenance_schedules', '"task_id"'],
  ['service_events_vehicle_idx', 'service_events', '"vehicle_id"'],
  ['service_events_schedule_idx', 'service_events', '"schedule_id"'],
  ['service_events_recorded_by_idx', 'service_events', '"recorded_by"'],
  ['service_event_photos_uploaded_by_idx', 'service_event_photos', '"uploaded_by"'],
];

export class TenantIndexes1787452000000 implements MigrationInterface {
  name = 'TenantIndexes1787452000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [name, table, columns] of INDEXES) {
      await queryRunner.query(`CREATE INDEX "${name}" ON "${table}" (${columns})`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const [name] of [...INDEXES].reverse()) {
      await queryRunner.query(`DROP INDEX "public"."${name}"`);
    }
  }
}
