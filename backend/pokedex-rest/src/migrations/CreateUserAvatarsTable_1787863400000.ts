import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserAvatarsTable_1787863400000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // One row per user: userId is the PK (and the FK index).
    await queryRunner.query(`
      CREATE TABLE "users"."user_avatars" (
        "userId" uuid NOT NULL,
        "mimeType" character varying(32) NOT NULL,
        "data" bytea NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_avatars_userId" PRIMARY KEY ("userId"),
        CONSTRAINT "FK_user_avatars_userId" FOREIGN KEY ("userId")
          REFERENCES "users"."users"("id") ON DELETE CASCADE,
        -- 500 KiB on stored bytes, not the ~33% larger base64 request body.
        CONSTRAINT "CK_user_avatars_size" CHECK (octet_length("data") BETWEEN 1 AND 512000),
        -- Raster only: an SVG served from this origin would be stored XSS.
        CONSTRAINT "CK_user_avatars_mime" CHECK (
          "mimeType" IN ('image/png', 'image/jpeg', 'image/webp')
        )
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "users"."user_avatars" CASCADE`,
    );
  }
}
