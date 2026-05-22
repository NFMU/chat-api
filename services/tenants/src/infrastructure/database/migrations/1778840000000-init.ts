import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1778840000000 implements MigrationInterface {
  name = "Init1778840000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Enum types ───────────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TYPE "public"."plans_status_enum"
        AS ENUM('active', 'deprecated', 'hidden')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."plan_versions_status_enum"
        AS ENUM('draft', 'published', 'deprecated')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."tenants_status_enum"
        AS ENUM('active', 'suspended', 'deleted')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."tenant_members_status_enum"
        AS ENUM('active', 'left', 'removed', 'suspended')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."tenant_subscriptions_status_enum"
        AS ENUM('active', 'upgraded', 'downgraded', 'cancelled', 'expired')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."invitations_invite_type_enum"
        AS ENUM('email', 'link')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."invitations_role_scope_enum"
        AS ENUM('tenant', 'channel')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."invitations_status_enum"
        AS ENUM('pending', 'accepted', 'expired', 'revoked')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."outbox_events_status_enum"
        AS ENUM('pending', 'published', 'failed')
    `);

    // ── plans ────────────────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "plans" (
        "code"        character varying(50)                 NOT NULL,
        "name"        character varying(120)                NOT NULL,
        "description" text,
        "status"      "public"."plans_status_enum"          NOT NULL DEFAULT 'active',
        "created_at"  TIMESTAMP WITH TIME ZONE              NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMP WITH TIME ZONE              NOT NULL DEFAULT now(),
        CONSTRAINT "PK_plans" PRIMARY KEY ("code")
      )
    `);

    // ── plan_versions ────────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "plan_versions" (
        "id"                    SERIAL                                NOT NULL,
        "plan_code"             character varying(50)                 NOT NULL,
        "version"               integer                               NOT NULL,
        "max_members"           integer,
        "max_channels"          integer,
        "max_storage_gb"        numeric(10,2),
        "feature_guest_access"    boolean                             NOT NULL DEFAULT false,
        "feature_custom_branding" boolean                             NOT NULL DEFAULT false,
        "feature_sso"             boolean                             NOT NULL DEFAULT false,
        "feature_audit_log"       boolean                             NOT NULL DEFAULT false,
        "status"                "public"."plan_versions_status_enum"  NOT NULL DEFAULT 'draft',
        "published_at"          TIMESTAMP WITH TIME ZONE,
        "deprecated_at"         TIMESTAMP WITH TIME ZONE,
        "created_at"            TIMESTAMP WITH TIME ZONE              NOT NULL DEFAULT now(),
        CONSTRAINT "PK_plan_versions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_plan_versions_code_version" UNIQUE ("plan_code", "version")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_plan_versions_plan_code" ON "plan_versions" ("plan_code")
    `);

    // ── tenants ──────────────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "tenants" (
        "uuid"                           uuid                             NOT NULL,
        "plan_code"                      character varying(50)            NOT NULL,
        "current_plan_version_id"        integer,
        "owner_user_id"                  uuid                             NOT NULL,
        "name"                           character varying(255)           NOT NULL,
        "slug"                           character varying(100)           NOT NULL,
        "domain"                         character varying(255),
        "status"                         "public"."tenants_status_enum"   NOT NULL DEFAULT 'active',
        "timezone_id"                    uuid                             NOT NULL,
        "language_id"                    uuid                             NOT NULL,
        "branding_logo_url"              character varying(2048),
        "branding_color"                 character varying(7),
        "branding_theme"                 character varying(10),
        "settings_message_retention_days" integer,
        "settings_guest_access"          boolean                          NOT NULL DEFAULT false,
        "settings_file_sharing_enabled"  boolean                          NOT NULL DEFAULT true,
        "settings_sso_provider"          character varying(100),
        "activated_at"                   TIMESTAMP WITH TIME ZONE,
        "suspended_at"                   TIMESTAMP WITH TIME ZONE,
        "created_at"                     TIMESTAMP WITH TIME ZONE         NOT NULL DEFAULT now(),
        "updated_at"                     TIMESTAMP WITH TIME ZONE         NOT NULL DEFAULT now(),
        "deleted_at"                     TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_tenants" PRIMARY KEY ("uuid")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_tenants_plan_code" ON "tenants" ("plan_code")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_tenants_slug" ON "tenants" ("slug")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_tenants_domain" ON "tenants" ("domain")
      WHERE domain IS NOT NULL
    `);

    // ── tenant_members ───────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "tenant_members" (
        "id"          SERIAL                                         NOT NULL,
        "tenant_id"   uuid                                           NOT NULL,
        "user_id"     uuid                                           NOT NULL,
        "invited_by"  uuid,
        "status"      "public"."tenant_members_status_enum"          NOT NULL DEFAULT 'active',
        "joined_at"   TIMESTAMP WITH TIME ZONE,
        "left_at"     TIMESTAMP WITH TIME ZONE,
        "removed_at"  TIMESTAMP WITH TIME ZONE,
        "created_at"  TIMESTAMP WITH TIME ZONE                       NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMP WITH TIME ZONE                       NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tenant_members" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_tenant_members_tenant_id" ON "tenant_members" ("tenant_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_tenant_members_user_id" ON "tenant_members" ("user_id")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_tenant_members_tenant_user"
        ON "tenant_members" ("tenant_id", "user_id")
        WHERE "status" = 'active'
    `);

    // ── tenant_subscriptions ─────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "tenant_subscriptions" (
        "id"              uuid                                             NOT NULL,
        "tenant_id"       uuid                                             NOT NULL,
        "plan_code"       character varying(50)                            NOT NULL,
        "plan_version_id" integer                                          NOT NULL,
        "status"          "public"."tenant_subscriptions_status_enum"      NOT NULL DEFAULT 'active',
        "started_at"      TIMESTAMP WITH TIME ZONE                         NOT NULL,
        "ended_at"        TIMESTAMP WITH TIME ZONE,
        "reason"          text,
        "created_at"      TIMESTAMP WITH TIME ZONE                         NOT NULL DEFAULT now(),
        "updated_at"      TIMESTAMP WITH TIME ZONE                         NOT NULL DEFAULT now(),
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

    // ── invitations ──────────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE "invitations" (
        "uuid"                 uuid                                       NOT NULL,
        "tenant_id"            uuid                                       NOT NULL,
        "channel_id"           integer,
        "invited_by"           uuid                                       NOT NULL,
        "accepted_by_user_id"  uuid,
        "email"                character varying(255)                     NOT NULL,
        "invite_type"          "public"."invitations_invite_type_enum"    NOT NULL DEFAULT 'email',
        "token"                character varying(255)                     NOT NULL,
        "role_scope"           "public"."invitations_role_scope_enum"     NOT NULL DEFAULT 'tenant',
        "role_code"            character varying(50)                      NOT NULL,
        "status"               "public"."invitations_status_enum"         NOT NULL DEFAULT 'pending',
        "expires_at"           TIMESTAMP WITH TIME ZONE                   NOT NULL,
        "accepted_at"          TIMESTAMP WITH TIME ZONE,
        "created_at"           TIMESTAMP WITH TIME ZONE                   NOT NULL DEFAULT now(),
        "updated_at"           TIMESTAMP WITH TIME ZONE                   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_invitations" PRIMARY KEY ("uuid")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_invitations_token" ON "invitations" ("token")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_invitations_tenant_id" ON "invitations" ("tenant_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_invitations_tenant_email" ON "invitations" ("tenant_id", "email")
    `);

    // ── outbox_events ────────────────────────────────────────────────────────

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
      CREATE INDEX "idx_outbox_events_due" ON "outbox_events" ("status", "next_attempt_at")
    `);

    // ── Foreign key constraints ──────────────────────────────────────────────

    await queryRunner.query(`
      ALTER TABLE "plan_versions"
        ADD CONSTRAINT "FK_plan_versions_plan_code"
        FOREIGN KEY ("plan_code") REFERENCES "plans"("code") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "tenants"
        ADD CONSTRAINT "FK_tenants_plan_code"
        FOREIGN KEY ("plan_code") REFERENCES "plans"("code") ON DELETE RESTRICT
    `);
    await queryRunner.query(`
      ALTER TABLE "tenants"
        ADD CONSTRAINT "FK_tenants_current_plan_version_id"
        FOREIGN KEY ("current_plan_version_id") REFERENCES "plan_versions"("id") ON DELETE RESTRICT
    `);
    await queryRunner.query(`
      ALTER TABLE "tenant_members"
        ADD CONSTRAINT "FK_tenant_members_tenant_id"
        FOREIGN KEY ("tenant_id") REFERENCES "tenants"("uuid") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "tenant_subscriptions"
        ADD CONSTRAINT "FK_tenant_subscriptions_tenant_id"
        FOREIGN KEY ("tenant_id") REFERENCES "tenants"("uuid") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "tenant_subscriptions"
        ADD CONSTRAINT "FK_tenant_subscriptions_plan_version_id"
        FOREIGN KEY ("plan_version_id") REFERENCES "plan_versions"("id") ON DELETE RESTRICT
    `);
    await queryRunner.query(`
      ALTER TABLE "invitations"
        ADD CONSTRAINT "FK_invitations_tenant_id"
        FOREIGN KEY ("tenant_id") REFERENCES "tenants"("uuid") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "invitations" DROP CONSTRAINT "FK_invitations_tenant_id"`);
    await queryRunner.query(`ALTER TABLE "tenant_subscriptions" DROP CONSTRAINT "FK_tenant_subscriptions_plan_version_id"`);
    await queryRunner.query(`ALTER TABLE "tenant_subscriptions" DROP CONSTRAINT "FK_tenant_subscriptions_tenant_id"`);
    await queryRunner.query(`ALTER TABLE "tenant_members" DROP CONSTRAINT "FK_tenant_members_tenant_id"`);
    await queryRunner.query(`ALTER TABLE "tenants" DROP CONSTRAINT "FK_tenants_current_plan_version_id"`);
    await queryRunner.query(`ALTER TABLE "tenants" DROP CONSTRAINT "FK_tenants_plan_code"`);
    await queryRunner.query(`ALTER TABLE "plan_versions" DROP CONSTRAINT "FK_plan_versions_plan_code"`);

    await queryRunner.query(`DROP INDEX "public"."idx_outbox_events_due"`);
    await queryRunner.query(`DROP TABLE "outbox_events"`);

    await queryRunner.query(`DROP INDEX "public"."idx_invitations_tenant_email"`);
    await queryRunner.query(`DROP INDEX "public"."idx_invitations_tenant_id"`);
    await queryRunner.query(`DROP INDEX "public"."uq_invitations_token"`);
    await queryRunner.query(`DROP TABLE "invitations"`);

    await queryRunner.query(`DROP INDEX "public"."idx_tenant_subscriptions_plan_version_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_tenant_subscriptions_tenant_id"`);
    await queryRunner.query(`DROP TABLE "tenant_subscriptions"`);

    await queryRunner.query(`DROP INDEX "public"."uq_tenant_members_tenant_user"`);
    await queryRunner.query(`DROP INDEX "public"."idx_tenant_members_user_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_tenant_members_tenant_id"`);
    await queryRunner.query(`DROP TABLE "tenant_members"`);

    await queryRunner.query(`DROP INDEX "public"."uq_tenants_domain"`);
    await queryRunner.query(`DROP INDEX "public"."uq_tenants_slug"`);
    await queryRunner.query(`DROP INDEX "public"."idx_tenants_plan_code"`);
    await queryRunner.query(`DROP TABLE "tenants"`);

    await queryRunner.query(`DROP INDEX "public"."idx_plan_versions_plan_code"`);
    await queryRunner.query(`DROP TABLE "plan_versions"`);

    await queryRunner.query(`DROP TABLE "plans"`);

    await queryRunner.query(`DROP TYPE "public"."outbox_events_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."invitations_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."invitations_role_scope_enum"`);
    await queryRunner.query(`DROP TYPE "public"."invitations_invite_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tenant_subscriptions_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tenant_members_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tenants_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."plan_versions_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."plans_status_enum"`);
  }
}
