import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAccountsTable_1788000001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "auth"."accounts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying(255) NOT NULL,
        "password" character varying(255) NOT NULL,
        "emailVerified" boolean NOT NULL DEFAULT false,
        "failedPasswordAttempts" smallint NOT NULL DEFAULT 0,
        "passwordLockedUntil" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_accounts_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_accounts_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_accounts_email" ON "auth"."accounts" ("email")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "auth"."accounts" CASCADE`);
  }
}
