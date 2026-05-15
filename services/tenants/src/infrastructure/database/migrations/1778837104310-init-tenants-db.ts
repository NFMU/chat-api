import { MigrationInterface, QueryRunner } from 'typeorm';

export class inittenantsdb1778837104310 implements MigrationInterface {
  name = 'inittenantsdb1778837104310';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."invitations_invite_type_enum" AS ENUM('email', 'link')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."invitations_role_scope_enum" AS ENUM('tenant', 'channel')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."invitations_status_enum" AS ENUM('pending', 'accepted', 'expired', 'revoked')
    `);
    await queryRunner.query(`
      CREATE TABLE "invitations" (
        "uuid" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "channel_id" integer,
        "invited_by" uuid NOT NULL,
        "accepted_by_user_id" uuid,
        "email" character varying(255) NOT NULL,
        "invite_type" "public"."invitations_invite_type_enum" NOT NULL DEFAULT 'email',
        "token" character varying(255) NOT NULL,
        "role_scope" "public"."invitations_role_scope_enum" NOT NULL DEFAULT 'tenant',
        "role_code" character varying(50) NOT NULL,
        "status" "public"."invitations_status_enum" NOT NULL DEFAULT 'pending',
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "accepted_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_8fa3ec2fe23b3604fa812f3fdcd" PRIMARY KEY ("uuid")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_invitations_token" ON "invitations" ("token")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_invitations_tenant_email" ON "invitations" ("tenant_id", "email")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_invitations_tenant_id" ON "invitations" ("tenant_id")
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."plans_status_enum" AS ENUM('active', 'deprecated', 'hidden')
    `);
    await queryRunner.query(`
      CREATE TABLE "plans" (
        "code" character varying(50) NOT NULL,
        "name" character varying(120) NOT NULL,
        "description" text,
        "max_members" integer,
        "max_channels" integer,
        "max_storage_gb" numeric(10, 2),
        "features_json" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "status" "public"."plans_status_enum" NOT NULL DEFAULT 'active',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_95f7ef3fc4c31a3545b4d825dd4" PRIMARY KEY ("code")
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."tenant_members_status_enum" AS ENUM('active', 'left', 'removed', 'suspended')
    `);
    await queryRunner.query(`
      CREATE TABLE "tenant_members" (
        "id" SERIAL NOT NULL,
        "tenant_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "invited_by" uuid,
        "status" "public"."tenant_members_status_enum" NOT NULL DEFAULT 'active',
        "joined_at" TIMESTAMP WITH TIME ZONE,
        "left_at" TIMESTAMP WITH TIME ZONE,
        "removed_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_f698fea03ae8f690b936971aa99" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_tenant_members_user_id" ON "tenant_members" ("user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_tenant_members_tenant_id" ON "tenant_members" ("tenant_id")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_tenant_members_tenant_user" ON "tenant_members" ("tenant_id", "user_id")
      WHERE "status" = 'active'
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."tenants_status_enum" AS ENUM('active', 'suspended', 'deleted')
    `);
    await queryRunner.query(`
      CREATE TABLE "tenants" (
        "uuid" uuid NOT NULL,
        "plan_code" character varying(50) NOT NULL,
        "owner_user_id" uuid NOT NULL,
        "name" character varying(255) NOT NULL,
        "slug" character varying(100) NOT NULL,
        "domain" character varying(255),
        "status" "public"."tenants_status_enum" NOT NULL DEFAULT 'active',
        "timezone_id" uuid NOT NULL,
        "language_id" uuid NOT NULL,
        "branding_json" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "settings_json" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "activated_at" TIMESTAMP WITH TIME ZONE,
        "suspended_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_30223f2eb10f4a2684508232082" PRIMARY KEY ("uuid")
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
    await queryRunner.query(`
      ALTER TABLE "invitations"
      ADD CONSTRAINT "FK_290e75d606ba89eb421b8b5ec49" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "tenant_members"
      ADD CONSTRAINT "FK_ffba0c9ecd4fd98550b3300ae68" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "tenants"
      ADD CONSTRAINT "FK_6768840c11b572526d5f3017ddf" FOREIGN KEY ("plan_code") REFERENCES "plans"("code") ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TYPE "public"."invitations_invite_type_enum"
    `);
    await queryRunner.query(`
      DROP TYPE "public"."invitations_role_scope_enum"
    `);
    await queryRunner.query(`
      DROP TYPE "public"."invitations_status_enum"
    `);
    await queryRunner.query(`
      DROP TABLE "invitations"
    `);
    await queryRunner.query(`
      DROP INDEX "public"."uq_invitations_token"
    `);
    await queryRunner.query(`
      DROP INDEX "public"."idx_invitations_tenant_email"
    `);
    await queryRunner.query(`
      DROP INDEX "public"."idx_invitations_tenant_id"
    `);
    await queryRunner.query(`
      DROP TYPE "public"."plans_status_enum"
    `);
    await queryRunner.query(`
      DROP TABLE "plans"
    `);
    await queryRunner.query(`
      DROP TYPE "public"."tenant_members_status_enum"
    `);
    await queryRunner.query(`
      DROP TABLE "tenant_members"
    `);
    await queryRunner.query(`
      DROP INDEX "public"."idx_tenant_members_user_id"
    `);
    await queryRunner.query(`
      DROP INDEX "public"."idx_tenant_members_tenant_id"
    `);
    await queryRunner.query(`
      DROP INDEX "public"."uq_tenant_members_tenant_user"
    `);
    await queryRunner.query(`
      DROP TYPE "public"."tenants_status_enum"
    `);
    await queryRunner.query(`
      DROP TABLE "tenants"
    `);
    await queryRunner.query(`
      DROP INDEX "public"."idx_tenants_plan_code"
    `);
    await queryRunner.query(`
      DROP INDEX "public"."uq_tenants_slug"
    `);
    await queryRunner.query(`
      DROP INDEX "public"."uq_tenants_domain"
    `);
    await queryRunner.query(`
      ALTER TABLE "invitations" DROP CONSTRAINT "FK_290e75d606ba89eb421b8b5ec49"
    `);
    await queryRunner.query(`
      ALTER TABLE "tenant_members" DROP CONSTRAINT "FK_ffba0c9ecd4fd98550b3300ae68"
    `);
    await queryRunner.query(`
      ALTER TABLE "tenants" DROP CONSTRAINT "FK_6768840c11b572526d5f3017ddf"
    `);
  }
}
