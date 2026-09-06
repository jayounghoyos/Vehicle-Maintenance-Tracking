import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Reports shipped open to every member, which contradicted the rest of
 * the app: the screens beside it are all behind a permission, and the
 * charts name mechanics and plates. It becomes a grant like the others.
 *
 * The type is rewritten rather than grown. ALTER TYPE ... ADD VALUE
 * cannot be followed by a use of that value in the same transaction, and
 * TypeORM runs every migration in one, so the insert below would fail
 * with "unsafe use of new value". Renaming the old type, creating the
 * new one and casting the column is the shape that survives a single
 * transaction.
 */
export class ReportsPermission1788652800000 implements MigrationInterface {
  name = 'ReportsPermission1788652800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "permission" RENAME TO "permission_old"`);
    await queryRunner.query(`
      CREATE TYPE "permission" AS ENUM (
        'view_vehicles', 'view_team', 'view_service_log', 'view_reports',
        'manage_vehicles', 'manage_team', 'manage_schedules', 'log_service',
        'edit_organization'
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "role_permissions" ALTER COLUMN "permission"
        TYPE "permission" USING "permission"::text::"permission"
    `);
    await queryRunner.query(`DROP TYPE "permission_old"`);

    // by name, like the migration that created these three, because no
    // grant tells a manager apart from a mechanic. A role the client
    // invented gets nothing: a new permission nobody asked for should
    // start closed, and the roles screen is where it opens
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission")
      SELECT r."id", 'view_reports'::"permission"
      FROM "roles" r
      WHERE r."name" IN ('Fleet coordinator', 'Operations manager')
    `);
  }

  /** Lossy on purpose: a role that was granted reports has no value to
   *  go back to, so the grant goes rather than the migration failing on
   *  a row the shrunken type cannot hold. */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "role_permissions" WHERE "permission" = 'view_reports'`,
    );
    await queryRunner.query(`ALTER TYPE "permission" RENAME TO "permission_new"`);
    await queryRunner.query(`
      CREATE TYPE "permission" AS ENUM (
        'view_vehicles', 'view_team', 'view_service_log', 'manage_vehicles',
        'manage_team', 'manage_schedules', 'log_service', 'edit_organization'
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "role_permissions" ALTER COLUMN "permission"
        TYPE "permission" USING "permission"::text::"permission"
    `);
    await queryRunner.query(`DROP TYPE "permission_new"`);
  }
}
