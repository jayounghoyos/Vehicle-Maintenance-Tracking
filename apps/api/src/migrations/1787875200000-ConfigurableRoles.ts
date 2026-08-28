import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Clients asked for roles of their own, and an enum cannot grow per
 * client. The role becomes a row each organization owns, and what it
 * may do becomes rows next to it.
 *
 * Three steps, because users is populated: the column arrives nullable,
 * every existing person is pointed at the role matching the enum value
 * they had, and only then does it become required.
 */
export class ConfigurableRoles1787875200000 implements MigrationInterface {
  name = 'ConfigurableRoles1787875200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "permission" AS ENUM (
        'view_vehicles', 'view_team', 'view_service_log', 'manage_vehicles',
        'manage_team', 'manage_schedules', 'log_service', 'edit_organization'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id" SERIAL NOT NULL,
        "organization_id" integer NOT NULL,
        "name" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "roles_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "roles_organization_fk" FOREIGN KEY ("organization_id")
          REFERENCES "organizations"("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "roles_organization_name_unique" ON "roles" ("organization_id", "name")`,
    );

    await queryRunner.query(`
      CREATE TABLE "role_permissions" (
        "role_id" integer NOT NULL,
        "permission" "permission" NOT NULL,
        CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id", "permission"),
        CONSTRAINT "role_permissions_role_fk" FOREIGN KEY ("role_id")
          REFERENCES "roles"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`ALTER TABLE "users" ADD "role_id" integer`);

    // every organization that already exists gets the three it had
    await queryRunner.query(`
      INSERT INTO "roles" ("organization_id", "name")
      SELECT o."id", base."name"
      FROM "organizations" o
      CROSS JOIN (VALUES ('Fleet coordinator'), ('Mechanic'), ('Operations manager'))
        AS base("name")
    `);

    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission")
      SELECT r."id", granted."permission"::"permission"
      FROM "roles" r
      JOIN (VALUES
        ('Fleet coordinator', 'view_vehicles'),
        ('Fleet coordinator', 'view_team'),
        ('Fleet coordinator', 'view_service_log'),
        ('Fleet coordinator', 'manage_vehicles'),
        ('Fleet coordinator', 'manage_team'),
        ('Fleet coordinator', 'manage_schedules'),
        ('Fleet coordinator', 'log_service'),
        ('Fleet coordinator', 'edit_organization'),
        ('Mechanic', 'view_vehicles'),
        ('Mechanic', 'view_team'),
        ('Mechanic', 'view_service_log'),
        ('Mechanic', 'log_service'),
        ('Operations manager', 'view_vehicles'),
        ('Operations manager', 'view_team'),
        ('Operations manager', 'view_service_log')
      ) AS granted("role", "permission") ON granted."role" = r."name"
    `);

    await queryRunner.query(`
      UPDATE "users" u
      SET "role_id" = r."id"
      FROM "roles" r
      WHERE r."organization_id" = u."organization_id"
        AND r."name" = CASE u."role"::text
          WHEN 'fleet_coordinator' THEN 'Fleet coordinator'
          WHEN 'mechanic' THEN 'Mechanic'
          ELSE 'Operations manager'
        END
    `);

    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role_id" SET NOT NULL`);
    await queryRunner.query(`
      ALTER TABLE "users" ADD CONSTRAINT "users_role_fk"
        FOREIGN KEY ("role_id") REFERENCES "roles"("id")
    `);
    await queryRunner.query(`CREATE INDEX "users_role_idx" ON "users" ("role_id")`);

    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
    await queryRunner.query(`DROP TYPE "user_role"`);
  }

  /** Lossy on purpose: a role the client invented has no enum value to
   *  go back to, so anybody holding one lands on mechanic, the role that
   *  grants least while still being able to work. */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "user_role" AS ENUM ('fleet_coordinator', 'mechanic', 'operations_manager')
    `);
    await queryRunner.query(`ALTER TABLE "users" ADD "role" "user_role"`);
    await queryRunner.query(`
      UPDATE "users" u
      SET "role" = CASE r."name"
        WHEN 'Fleet coordinator' THEN 'fleet_coordinator'
        WHEN 'Operations manager' THEN 'operations_manager'
        ELSE 'mechanic'
      END::"user_role"
      FROM "roles" r
      WHERE r."id" = u."role_id"
    `);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET NOT NULL`);

    await queryRunner.query(`DROP INDEX "users_role_idx"`);
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "users_role_fk"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role_id"`);
    await queryRunner.query(`DROP TABLE "role_permissions"`);
    await queryRunner.query(`DROP TABLE "roles"`);
    await queryRunner.query(`DROP TYPE "permission"`);
  }
}
