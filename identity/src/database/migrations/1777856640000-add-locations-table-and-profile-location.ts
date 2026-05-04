import { MigrationInterface, QueryRunner } from "typeorm";

export class addlocationstableandprofilelocation1777856640000 implements MigrationInterface {
  name = "addlocationstableandprofilelocation1777856640000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "locations" (
        "id" SERIAL NOT NULL,
        "code" character varying(2) NOT NULL,
        "name" character varying(120) NOT NULL,
        CONSTRAINT "PK_locations_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_locations_code" UNIQUE ("code"),
        CONSTRAINT "UQ_locations_name" UNIQUE ("name")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "user_profiles"
      ADD "job_title" character varying(120)
    `);
    await queryRunner.query(`
      ALTER TABLE "user_profiles"
      ADD "company" character varying(120)
    `);
    await queryRunner.query(`
      ALTER TABLE "user_profiles"
      ADD "website" character varying(500)
    `);
    await queryRunner.query(`
      ALTER TABLE "user_profiles"
      ADD "location_id" integer
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_user_profiles_location_id" ON "user_profiles" ("location_id")
    `);
    await queryRunner.query(`
      ALTER TABLE "user_profiles"
      ADD CONSTRAINT "FK_user_profiles_location_id" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_profiles" DROP CONSTRAINT "FK_user_profiles_location_id"
    `);
    await queryRunner.query(`
      DROP INDEX "idx_user_profiles_location_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "user_profiles" DROP COLUMN "location_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "user_profiles" DROP COLUMN "website"
    `);
    await queryRunner.query(`
      ALTER TABLE "user_profiles" DROP COLUMN "company"
    `);
    await queryRunner.query(`
      ALTER TABLE "user_profiles" DROP COLUMN "job_title"
    `);
    await queryRunner.query(`
      DROP TABLE "locations"
    `);
  }
}
