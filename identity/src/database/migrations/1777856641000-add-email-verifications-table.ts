import { MigrationInterface, QueryRunner } from "typeorm";

export class addEmailVerificationsTable1777856641000
  implements MigrationInterface
{
  name = "addEmailVerificationsTable1777856641000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "email_verifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "token_hash" character varying(255) NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "used_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_email_verifications_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_email_verifications_token_hash" ON "email_verifications" ("token_hash")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_email_verifications_user_id" ON "email_verifications" ("user_id")
    `);
    await queryRunner.query(`
      ALTER TABLE "email_verifications"
      ADD CONSTRAINT "FK_email_verifications_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "email_verifications" DROP CONSTRAINT "FK_email_verifications_user_id"
    `);
    await queryRunner.query(`
      DROP INDEX "idx_email_verifications_user_id"
    `);
    await queryRunner.query(`
      DROP INDEX "uq_email_verifications_token_hash"
    `);
    await queryRunner.query(`
      DROP TABLE "email_verifications"
    `);
  }
}

