import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordAttemptsToUsers_1787863500000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Counter lives on the user row so every serverless instance shares it.
    await queryRunner.query(`
      ALTER TABLE "users"."users"
      ADD COLUMN "failedPasswordAttempts" smallint NOT NULL DEFAULT 0,
      ADD COLUMN "passwordLockedUntil" TIMESTAMP WITH TIME ZONE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"."users"
      DROP COLUMN IF EXISTS "failedPasswordAttempts",
      DROP COLUMN IF EXISTS "passwordLockedUntil"
    `);
  }
}
