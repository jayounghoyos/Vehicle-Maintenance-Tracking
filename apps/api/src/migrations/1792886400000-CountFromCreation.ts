import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * A schedule nobody had serviced yet had no next due date, and a
 * schedule with no due date can never be overdue (issue #7). New
 * schedules now count from the day they were created; this gives the
 * ones already there the same starting point.
 *
 * The odometer at creation was never stored, so the vehicle's current
 * reading stands in for it. That can only make the due reading later
 * than it should be, never earlier, and it is right from the first
 * service logged against the schedule onwards.
 *
 * No down: there is no telling a backfilled date from one a service
 * set, and emptying them again would hide overdue work.
 */
export class CountFromCreation1792886400000 implements MigrationInterface {
  name = 'CountFromCreation1792886400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "maintenance_schedules"
      SET "next_due_date" = "created_at"::date + "interval_days"
      WHERE "next_due_date" IS NULL AND "interval_days" IS NOT NULL
    `);
    await queryRunner.query(`
      UPDATE "maintenance_schedules" s
      SET "next_due_km" = v."odometer_km" + s."interval_km"
      FROM "vehicles" v
      WHERE v."id" = s."vehicle_id"
        AND s."next_due_km" IS NULL AND s."interval_km" IS NOT NULL
    `);
  }

  public async down(): Promise<void> {
    // intentionally empty, see above
  }
}
