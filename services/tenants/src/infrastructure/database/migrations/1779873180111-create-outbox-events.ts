import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOutboxEvents1779873180111 implements MigrationInterface {
  name = 'CreateOutboxEvents1779873180111';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."outbox_events_status_enum"
        AS ENUM('pending', 'published', 'failed')
    `);

    await queryRunner.query(`
      CREATE TABLE "outbox_events" (
        "id"              uuid                                       NOT NULL,
        "event_name"      character varying(255)                     NOT NULL,
        "aggregate_type"  character varying(100)                     NOT NULL,
        "aggregate_id"    character varying(255)                     NOT NULL,
        "payload"         jsonb                                      NOT NULL,
        "status"          "public"."outbox_events_status_enum"       NOT NULL DEFAULT 'pending',
        "retry_count"     integer                                    NOT NULL DEFAULT 0,
        "next_attempt_at" TIMESTAMP WITH TIME ZONE                   NOT NULL,
        "last_error"      text,
        "occurred_at"     TIMESTAMP WITH TIME ZONE                   NOT NULL,
        "published_at"    TIMESTAMP WITH TIME ZONE,
        "created_at"      TIMESTAMP WITH TIME ZONE                   NOT NULL DEFAULT now(),
        "updated_at"      TIMESTAMP WITH TIME ZONE                   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_outbox_events" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_outbox_events_due"
        ON "outbox_events" ("status", "next_attempt_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."idx_outbox_events_due"`);
    await queryRunner.query(`DROP TABLE "outbox_events"`);
    await queryRunner.query(`DROP TYPE "public"."outbox_events_status_enum"`);
  }
}
