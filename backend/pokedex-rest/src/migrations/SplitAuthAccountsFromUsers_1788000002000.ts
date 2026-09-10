import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Moves credentials into auth.accounts (owned by the auth service) and leaves
 * only profile fields on users.users. CREATE TABLE IF NOT EXISTS so this is
 * safe whether auth migrations have already created the table or not.
 */
export class SplitAuthAccountsFromUsers_1788000002000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS auth`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

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

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'users'
            AND table_name = 'users'
            AND column_name = 'password'
        ) THEN
          INSERT INTO "auth"."accounts" (
            "id",
            "email",
            "password",
            "emailVerified",
            "failedPasswordAttempts",
            "passwordLockedUntil"
          )
          SELECT
            "id",
            "email",
            "password",
            "emailVerified",
            "failedPasswordAttempts",
            "passwordLockedUntil"
          FROM "users"."users"
          ON CONFLICT ("id") DO NOTHING;

          ALTER TABLE "users"."users"
            DROP COLUMN IF EXISTS "password",
            DROP COLUMN IF EXISTS "email",
            DROP COLUMN IF EXISTS "emailVerified",
            DROP COLUMN IF EXISTS "failedPasswordAttempts",
            DROP COLUMN IF EXISTS "passwordLockedUntil";
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "users"."IDX_users_email"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"."users"
        ADD COLUMN IF NOT EXISTS "email" character varying(255),
        ADD COLUMN IF NOT EXISTS "password" character varying(255),
        ADD COLUMN IF NOT EXISTS "emailVerified" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "failedPasswordAttempts" smallint NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "passwordLockedUntil" TIMESTAMP WITH TIME ZONE
    `);

    await queryRunner.query(`
      UPDATE "users"."users" AS u
      SET
        "email" = a."email",
        "password" = a."password",
        "emailVerified" = a."emailVerified",
        "failedPasswordAttempts" = a."failedPasswordAttempts",
        "passwordLockedUntil" = a."passwordLockedUntil"
      FROM "auth"."accounts" AS a
      WHERE u."id" = a."id"
    `);
  }
}
