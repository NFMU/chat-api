import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPlanOcc1778841000000 implements MigrationInterface {
  name = "AddPlanOcc1778841000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "plans"
        ADD COLUMN "latest_version_number" integer NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      ALTER TABLE "plans"
        ADD COLUMN "aggregate_version" integer NOT NULL DEFAULT 1
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "aggregate_version"`);
    await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "latest_version_number"`);
  }
}
