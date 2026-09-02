import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Clients asked to see themselves in the product rather than us. Two
 * columns, both nullable, because null means "the default brand" and
 * that is what every organization starts with.
 *
 * Only the accent and the logo. The status hues carry meaning, so they
 * are not the client's to change.
 */
export class ClientBranding1787961600000 implements MigrationInterface {
  name = 'ClientBranding1787961600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organizations" ADD "logo_key" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" ADD "accent_color" character varying(7)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN "accent_color"`);
    await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN "logo_key"`);
  }
}
