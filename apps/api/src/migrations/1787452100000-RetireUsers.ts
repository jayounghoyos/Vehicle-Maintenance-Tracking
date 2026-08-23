import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Somebody who leaves the company has to stop being able to sign in, and
 * until now the only way to stop them was deleting the row, which the
 * service events they recorded correctly refuse to allow.
 *
 * Same shape as organizations.deleted_at: the row stays so the history
 * still reads, and the account stops working at once.
 */
export class RetireUsers1787452100000 implements MigrationInterface {
  name = 'RetireUsers1787452100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "deleted_at" TIMESTAMP`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deleted_at"`);
  }
}
