import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReferenceUuidColumns1778500000000
  implements MigrationInterface
{
  name = "AddReferenceUuidColumns1778500000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // The uuid-ossp extension is already enabled by the initial migration
    // (PrimaryGeneratedColumn('uuid') on the users table). Re-issue the
    // CREATE EXTENSION as IF NOT EXISTS to be safe across environments.
    await queryRunner.query(
      `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,
    );

    // Languages
    await queryRunner.query(
      `ALTER TABLE "languages" ADD "uuid" uuid NOT NULL DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_languages_uuid" ON "languages" ("uuid")`,
    );

    // Timezones
    await queryRunner.query(
      `ALTER TABLE "timezones" ADD "uuid" uuid NOT NULL DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_timezones_uuid" ON "timezones" ("uuid")`,
    );

    // Locations
    await queryRunner.query(
      `ALTER TABLE "locations" ADD "uuid" uuid NOT NULL DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_locations_uuid" ON "locations" ("uuid")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "uq_locations_uuid"`);
    await queryRunner.query(`ALTER TABLE "locations" DROP COLUMN "uuid"`);

    await queryRunner.query(`DROP INDEX "uq_timezones_uuid"`);
    await queryRunner.query(`ALTER TABLE "timezones" DROP COLUMN "uuid"`);

    await queryRunner.query(`DROP INDEX "uq_languages_uuid"`);
    await queryRunner.query(`ALTER TABLE "languages" DROP COLUMN "uuid"`);
  }
}
