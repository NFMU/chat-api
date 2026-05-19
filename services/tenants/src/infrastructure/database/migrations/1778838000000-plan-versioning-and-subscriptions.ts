import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Introduces plan versioning and tenant subscription history.
 *
 * Changes:
 *  - Creates `plan_versions` table (immutable snapshots of plan limits/features).
 *  - Migrates existing limits/features columns from `plans` into `plan_versions` as version 1.
 *  - Removes limits/features columns from `plans`.
 *  - Creates `tenant_subscriptions` table (subscription history per tenant).
 *  - Migrates existing `tenants.plan_code` into initial `ACTIVE` subscription records.
 *  - Adds `tenants.current_plan_version_id` FK to the active plan version.
 */
export class planVersioningAndSubscriptions1778838000000 implements MigrationInterface {
  name = "planVersioningAndSubscriptions1778838000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. New enum types ────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE "public"."plan_versions_status_enum"
        AS ENUM('draft', 'published', 'deprecated')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."tenant_subscriptions_status_enum"
        AS ENUM('active', 'upgraded', 'downgraded', 'cancelled', 'expired')
    `);

    // ── 2. Create plan_versions ──────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "plan_versions" (
        "id"             SERIAL                                      NOT NULL,
        "plan_code"      character varying(50)                       NOT NULL,
        "version"        integer                                     NOT NULL,
        "max_members"    integer,
        "max_channels"   integer,
        "max_storage_gb" numeric(10,2),
        "features_json"  jsonb                                       NOT NULL DEFAULT '{}'::jsonb,
        "status"         "public"."plan_versions_status_enum"        NOT NULL DEFAULT 'draft',
        "published_at"   TIMESTAMP WITH TIME ZONE,
        "deprecated_at"  TIMESTAMP WITH TIME ZONE,
        "created_at"     TIMESTAMP WITH TIME ZONE                    NOT NULL DEFAULT now(),
        CONSTRAINT "PK_plan_versions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_plan_versions_code_version" UNIQUE ("plan_code", "version")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_plan_versions_plan_code" ON "plan_versions" ("plan_code")
    `);

    // ── 3. Migrate existing plan limits/features → plan_versions (version 1, published) ──
    await queryRunner.query(`
      INSERT INTO "plan_versions"
        ("plan_code", "version", "max_members", "max_channels", "max_storage_gb",
         "features_json", "status", "published_at", "created_at")
      SELECT
        "code", 1, "max_members", "max_channels", "max_storage_gb",
        "features_json", 'published', "created_at", "created_at"
      FROM "plans"
    `);

    // ── 4. Remove migrated columns from plans ────────────────────────────────
    await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "max_members"`);
    await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "max_channels"`);
    await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "max_storage_gb"`);
    await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "features_json"`);

    // ── 5. Create tenant_subscriptions ──────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "tenant_subscriptions" (
        "id"              uuid                                            NOT NULL,
        "tenant_id"       uuid                                            NOT NULL,
        "plan_code"       character varying(50)                           NOT NULL,
        "plan_version_id" integer                                         NOT NULL,
        "status"          "public"."tenant_subscriptions_status_enum"     NOT NULL DEFAULT 'active',
        "started_at"      TIMESTAMP WITH TIME ZONE                        NOT NULL,
        "ended_at"        TIMESTAMP WITH TIME ZONE,
        "reason"          text,
        "created_at"      TIMESTAMP WITH TIME ZONE                        NOT NULL DEFAULT now(),
        "updated_at"      TIMESTAMP WITH TIME ZONE                        NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tenant_subscriptions" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_tenant_subscriptions_tenant_id"
        ON "tenant_subscriptions" ("tenant_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_tenant_subscriptions_plan_version_id"
        ON "tenant_subscriptions" ("plan_version_id")
    `);

    // ── 6. Seed initial subscription records from existing tenants ───────────
    await queryRunner.query(`
      INSERT INTO "tenant_subscriptions"
        ("id", "tenant_id", "plan_code", "plan_version_id", "status",
         "started_at", "created_at", "updated_at")
      SELECT
        gen_random_uuid(),
        t."uuid",
        t."plan_code",
        pv."id",
        'active',
        t."created_at",
        now(),
        now()
      FROM "tenants" t
      JOIN "plan_versions" pv
        ON pv."plan_code" = t."plan_code" AND pv."version" = 1
    `);

    // ── 7. Add current_plan_version_id to tenants ────────────────────────────
    await queryRunner.query(`
      ALTER TABLE "tenants"
        ADD COLUMN "current_plan_version_id" integer
    `);
    await queryRunner.query(`
      UPDATE "tenants" t
      SET "current_plan_version_id" = pv."id"
      FROM "plan_versions" pv
      WHERE pv."plan_code" = t."plan_code" AND pv."version" = 1
    `);

    // ── 8. Foreign key constraints ───────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE "plan_versions"
        ADD CONSTRAINT "FK_plan_versions_plan_code"
        FOREIGN KEY ("plan_code") REFERENCES "plans"("code") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "tenant_subscriptions"
        ADD CONSTRAINT "FK_tenant_subscriptions_tenant_id"
        FOREIGN KEY ("tenant_id") REFERENCES "tenants"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "tenant_subscriptions"
        ADD CONSTRAINT "FK_tenant_subscriptions_plan_version_id"
        FOREIGN KEY ("plan_version_id") REFERENCES "plan_versions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "tenants"
        ADD CONSTRAINT "FK_tenants_current_plan_version_id"
        FOREIGN KEY ("current_plan_version_id") REFERENCES "plan_versions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ── Reverse FK constraints ───────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE "tenants"
        DROP CONSTRAINT "FK_tenants_current_plan_version_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "tenant_subscriptions"
        DROP CONSTRAINT "FK_tenant_subscriptions_plan_version_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "tenant_subscriptions"
        DROP CONSTRAINT "FK_tenant_subscriptions_tenant_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "plan_versions"
        DROP CONSTRAINT "FK_plan_versions_plan_code"
    `);

    // ── Reverse tenants column ───────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE "tenants" DROP COLUMN "current_plan_version_id"
    `);

    // ── Restore limits/features columns on plans (from version 1 data) ───────
    await queryRunner.query(`
      ALTER TABLE "plans"
        ADD COLUMN "max_members"    integer,
        ADD COLUMN "max_channels"   integer,
        ADD COLUMN "max_storage_gb" numeric(10,2),
        ADD COLUMN "features_json"  jsonb NOT NULL DEFAULT '{}'::jsonb
    `);
    await queryRunner.query(`
      UPDATE "plans" p
      SET
        "max_members"    = pv."max_members",
        "max_channels"   = pv."max_channels",
        "max_storage_gb" = pv."max_storage_gb",
        "features_json"  = pv."features_json"
      FROM "plan_versions" pv
      WHERE pv."plan_code" = p."code" AND pv."version" = 1
    `);

    // ── Drop tables and indexes ──────────────────────────────────────────────
    await queryRunner.query(`DROP INDEX "public"."idx_tenant_subscriptions_plan_version_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_tenant_subscriptions_tenant_id"`);
    await queryRunner.query(`DROP TABLE "tenant_subscriptions"`);
    await queryRunner.query(`DROP INDEX "public"."idx_plan_versions_plan_code"`);
    await queryRunner.query(`DROP TABLE "plan_versions"`);

    // ── Drop enum types ──────────────────────────────────────────────────────
    await queryRunner.query(`DROP TYPE "public"."tenant_subscriptions_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."plan_versions_status_enum"`);
  }
}
