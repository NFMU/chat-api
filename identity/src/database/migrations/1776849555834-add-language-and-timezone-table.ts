import { MigrationInterface, QueryRunner } from 'typeorm';

export class addlanguageandtimezonetable1776849555834 implements MigrationInterface {
  name = 'addlanguageandtimezonetable1776849555834';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "languages" (
        "id" SERIAL NOT NULL,
        "code" character varying(10) NOT NULL,
        "locale" character varying(100) NOT NULL,
        "name" character varying(120) NOT NULL,
        CONSTRAINT "UQ_7397752718d1c9eb873722ec9b2" UNIQUE ("code"),
        CONSTRAINT "UQ_1c216b7894308fcecbee67c5d07" UNIQUE ("locale"),
        CONSTRAINT "UQ_9c0e155475f0aa782e4a6178969" UNIQUE ("name"),
        CONSTRAINT "PK_b517f827ca496b29f4d549c631d" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "timezones" (
        "id" SERIAL NOT NULL,
        "name" character varying(100) NOT NULL,
        "utc_offset" character varying(10) NOT NULL,
        CONSTRAINT "UQ_b6248bf632ed7b73d6e96a26210" UNIQUE ("name"),
        CONSTRAINT "PK_589871db156cc7f92942334ab7e" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "user_settings" DROP COLUMN "language"
    `);
    await queryRunner.query(`
      ALTER TABLE "user_settings" DROP COLUMN "timezone"
    `);
    await queryRunner.query(`
      ALTER TABLE "user_settings"
      ADD "language_id" integer NOT NULL DEFAULT '1'
    `);
    await queryRunner.query(`
      ALTER TABLE "user_settings"
      ADD "timezone_id" integer NOT NULL DEFAULT '1'
    `);
    await queryRunner.query(`
      ALTER TABLE "user_settings"
      ADD CONSTRAINT "FK_10e0a840a9019445f8794d66730" FOREIGN KEY ("language_id") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "user_settings"
      ADD CONSTRAINT "FK_df4cc3145d90d66ebb66314e11f" FOREIGN KEY ("timezone_id") REFERENCES "timezones"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE "languages"
    `);
    await queryRunner.query(`
      DROP TABLE "timezones"
    `);
    await queryRunner.query(`
      ALTER TABLE "user_settings"
      ADD "language" character varying(10) NOT NULL DEFAULT 'en'
    `);
    await queryRunner.query(`
      ALTER TABLE "user_settings"
      ADD "timezone" character varying(100) NOT NULL DEFAULT 'UTC'
    `);
    await queryRunner.query(`
      ALTER TABLE "user_settings" DROP COLUMN "language_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "user_settings" DROP COLUMN "timezone_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "user_settings" DROP CONSTRAINT "FK_10e0a840a9019445f8794d66730"
    `);
    await queryRunner.query(`
      ALTER TABLE "user_settings" DROP CONSTRAINT "FK_df4cc3145d90d66ebb66314e11f"
    `);
  }
}
