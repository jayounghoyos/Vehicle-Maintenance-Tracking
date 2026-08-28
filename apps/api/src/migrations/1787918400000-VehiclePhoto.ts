import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * A picture of the van, which clients asked for after seeing the fleet
 * list. Nullable, because it is added by editing a vehicle that already
 * exists rather than at the moment it is registered.
 *
 * The key, not the file: the image lives in the object store, which is
 * what data_model.dbml already said storage_key means.
 */
export class VehiclePhoto1787918400000 implements MigrationInterface {
  name = 'VehiclePhoto1787918400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "vehicles" ADD "photo_key" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "photo_key"`);
  }
}
