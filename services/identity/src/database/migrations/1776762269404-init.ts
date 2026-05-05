import { MigrationInterface, QueryRunner } from "typeorm";

export class init1776762269404 implements MigrationInterface {
  name = "init1776762269404";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "languages" (
        "id" SERIAL NOT NULL,
        "code" character varying(10) NOT NULL,
        "locale" character varying(100) NOT NULL,
        "name" character varying(120) NOT NULL,
        CONSTRAINT "PK_languages_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_languages_code" UNIQUE ("code"),
        CONSTRAINT "UQ_languages_locale" UNIQUE ("locale"),
        CONSTRAINT "UQ_languages_name" UNIQUE ("name")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "timezones" (
        "id" SERIAL NOT NULL,
        "name" character varying(100) NOT NULL,
        "utc_offset" character varying(10) NOT NULL,
        CONSTRAINT "PK_timezones_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_timezones_name" UNIQUE ("name")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "password_resets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "token_hash" character varying(255) NOT NULL,
        "requested_ip" character varying(45),
        "requested_user_agent" text,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "used_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_4816377aa98211c1de34469e742" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_password_resets_token_hash" ON "password_resets" ("token_hash")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_password_resets_user_id" ON "password_resets" ("user_id")
    `);
    await queryRunner.query(`
      CREATE TABLE "user_profiles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "display_name" character varying(120),
        "first_name" character varying(120),
        "last_name" character varying(120),
        "phone_number" character varying(32),
        "avatar_url" character varying(500),
        "date_of_birth" date,
        "bio" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "REL_6ca9503d77ae39b4b5a6cc3ba8" UNIQUE ("user_id"),
        CONSTRAINT "PK_1ec6662219f4605723f1e41b6cb" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_user_profiles_user_id" ON "user_profiles" ("user_id")
    `);
    await queryRunner.query(`
      CREATE TABLE "user_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "refresh_token_hash" character varying(255) NOT NULL,
        "device_name" character varying(120),
        "ip_address" character varying(45),
        "user_agent" text,
        "last_used_at" TIMESTAMP WITH TIME ZONE,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "revoked_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_e93e031a5fed190d4789b6bfd83" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_user_sessions_refresh_token_hash" ON "user_sessions" ("refresh_token_hash")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_user_sessions_user_id" ON "user_sessions" ("user_id")
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."user_settings_theme_enum" AS ENUM('system', 'light', 'dark')
    `);
    await queryRunner.query(`
      CREATE TABLE "user_settings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "language_id" integer NOT NULL DEFAULT 1,
        "timezone_id" integer NOT NULL DEFAULT 1,
        "theme" "public"."user_settings_theme_enum" NOT NULL DEFAULT 'system',
        "two_factor_enabled" boolean NOT NULL DEFAULT false,
        "marketing_emails_enabled" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "REL_4ed056b9344e6f7d8d46ec4b30" UNIQUE ("user_id"),
        CONSTRAINT "PK_00f004f5922a0744d174530d639" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_user_settings_user_id" ON "user_settings" ("user_id")
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."users_status_enum" AS ENUM('active', 'inactive', 'blocked')
    `);
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying(255) NOT NULL,
        "password_hash" character varying(255) NOT NULL,
        "is_email_verified" boolean NOT NULL DEFAULT false,
        "status" "public"."users_status_enum" NOT NULL DEFAULT 'active',
        "last_login_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_users_email" ON "users" ("email")
    `);
    await queryRunner.query(`
      ALTER TABLE "password_resets"
      ADD CONSTRAINT "FK_f7a4c3bc48f24df007936d217be" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "user_profiles"
      ADD CONSTRAINT "FK_6ca9503d77ae39b4b5a6cc3ba88" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "user_sessions"
      ADD CONSTRAINT "FK_e9658e959c490b0a634dfc54783" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "user_settings"
      ADD CONSTRAINT "FK_4ed056b9344e6f7d8d46ec4b302" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "user_settings"
      ADD CONSTRAINT "FK_user_settings_language_id" FOREIGN KEY ("language_id") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "user_settings"
      ADD CONSTRAINT "FK_user_settings_timezone_id" FOREIGN KEY ("timezone_id") REFERENCES "timezones"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_settings" DROP CONSTRAINT "FK_user_settings_timezone_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "user_settings" DROP CONSTRAINT "FK_user_settings_language_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "user_settings" DROP CONSTRAINT "FK_4ed056b9344e6f7d8d46ec4b302"
    `);
    await queryRunner.query(`
      ALTER TABLE "user_sessions" DROP CONSTRAINT "FK_e9658e959c490b0a634dfc54783"
    `);
    await queryRunner.query(`
      ALTER TABLE "user_profiles" DROP CONSTRAINT "FK_6ca9503d77ae39b4b5a6cc3ba88"
    `);
    await queryRunner.query(`
      ALTER TABLE "password_resets" DROP CONSTRAINT "FK_f7a4c3bc48f24df007936d217be"
    `);
    await queryRunner.query(`
      DROP TABLE "password_resets"
    `);
    await queryRunner.query(`
      DROP TABLE "user_profiles"
    `);
    await queryRunner.query(`
      DROP TABLE "user_sessions"
    `);
    await queryRunner.query(`
      DROP TABLE "user_settings"
    `);
    await queryRunner.query(`
      DROP TABLE "users"
    `);
    await queryRunner.query(`
      DROP TYPE "public"."user_settings_theme_enum"
    `);
    await queryRunner.query(`
      DROP TYPE "public"."users_status_enum"
    `);
    await queryRunner.query(`
      DROP TABLE "timezones"
    `);
    await queryRunner.query(`
      DROP TABLE "languages"
    `);
  }
}
