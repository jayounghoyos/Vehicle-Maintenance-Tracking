import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * recorded_by says who typed the record in, which is often not who did
 * the work, and the work is often done by a workshop with no account
 * (issue #39). Two columns rather than one: performed_by when the person
 * is a member, performed_by_name when they are not, and the check makes
 * sure every event has one of them.
 *
 * Events logged before this have nobody else to point at, so they are
 * backfilled with their recorder, which is the best the history knows.
 */
export class ServicePerformer1792800000000 implements MigrationInterface {
  name = 'ServicePerformer1792800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "service_events" ADD "performed_by" integer, ADD "performed_by_name" character varying(120)`,
    );
    await queryRunner.query(
      `UPDATE "service_events" SET "performed_by" = "recorded_by" WHERE "performed_by" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "service_events_performed_by_idx" ON "service_events" ("performed_by")`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_events" ADD CONSTRAINT "service_events_performed_by_fk" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_events" ADD CONSTRAINT "service_events_performer_check" CHECK ("performed_by" IS NOT NULL OR "performed_by_name" IS NOT NULL)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "service_events" DROP CONSTRAINT "service_events_performer_check"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_events" DROP CONSTRAINT "service_events_performed_by_fk"`,
    );
    await queryRunner.query(`DROP INDEX "public"."service_events_performed_by_idx"`);
    await queryRunner.query(
      `ALTER TABLE "service_events" DROP COLUMN "performed_by_name", DROP COLUMN "performed_by"`,
    );
  }
}
