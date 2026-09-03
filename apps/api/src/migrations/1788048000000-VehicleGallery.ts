import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * A van has more than one side, and clients wanted to show the inside of
 * the box as well as the plate on the front.
 *
 * The main picture stays where it is, on vehicles.photo_key. Moving it
 * here would mean a join for every row of the fleet table to draw a
 * thumbnail, and a data migration for a column that already works.
 *
 * position, which service_event_photos has no use for: a gallery has an
 * order, and whoever took the photos will want to decide it.
 */
export class VehicleGallery1788048000000 implements MigrationInterface {
  name = 'VehicleGallery1788048000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "vehicle_photos" ("id" SERIAL NOT NULL, "organization_id" integer NOT NULL, "vehicle_id" integer NOT NULL, "storage_key" character varying NOT NULL, "position" integer NOT NULL DEFAULT '0', "uploaded_by" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "vehicle_photos_storage_key_unique" UNIQUE ("storage_key"), CONSTRAINT "vehicle_photos_pkey" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "vehicle_photos_vehicle_idx" ON "vehicle_photos" ("vehicle_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "vehicle_photos_organization_idx" ON "vehicle_photos" ("organization_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "vehicle_photos_uploaded_by_idx" ON "vehicle_photos" ("uploaded_by")`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_photos" ADD CONSTRAINT "vehicle_photos_organization_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_photos" ADD CONSTRAINT "vehicle_photos_vehicle_fk" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_photos" ADD CONSTRAINT "vehicle_photos_uploaded_by_fk" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vehicle_photos" DROP CONSTRAINT "vehicle_photos_uploaded_by_fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_photos" DROP CONSTRAINT "vehicle_photos_vehicle_fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_photos" DROP CONSTRAINT "vehicle_photos_organization_fk"`,
    );
    await queryRunner.query(`DROP INDEX "public"."vehicle_photos_uploaded_by_idx"`);
    await queryRunner.query(`DROP INDEX "public"."vehicle_photos_organization_idx"`);
    await queryRunner.query(`DROP INDEX "public"."vehicle_photos_vehicle_idx"`);
    await queryRunner.query(`DROP TABLE "vehicle_photos"`);
  }
}
