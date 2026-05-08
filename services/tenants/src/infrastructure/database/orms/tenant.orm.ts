import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { TenantStatus } from "src/shared/enums";
import { TenantBrandingJson, TenantSettingsJson } from "src/shared/types";
import { InvitationOrm } from "./invitation.orm";
import { PlanOrm } from "./plan.orm";
import { TenantMemberOrm } from "./tenant-member.orm";

@Entity("tenants")
export class TenantOrm {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Index("uq_tenants_uuid", { unique: true })
  @Column({ type: "uuid" })
  uuid: string;

  @Index("idx_tenants_plan_id")
  @Column({ name: "plan_id", type: "integer" })
  planId: number;

  @Column({ name: "owner_user_id", type: "uuid" })
  ownerUserId: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Index("uq_tenants_slug", { unique: true })
  @Column({ type: "varchar", length: 100 })
  slug: string;

  @Index("uq_tenants_domain", { unique: true, where: "domain IS NOT NULL" })
  @Column({ type: "varchar", length: 255, nullable: true })
  domain?: string | null;

  @Column({
    type: "enum",
    enum: TenantStatus,
    default: TenantStatus.ACTIVE,
  })
  status: TenantStatus;

  @Column({ name: "timezone_id", type: "uuid" })
  timezoneId: string;

  @Column({ name: "language_id", type: "uuid" })
  languageId: string;

  @Column({
    name: "branding_json",
    type: "jsonb",
    default: () => "'{}'::jsonb",
  })
  brandingJson: TenantBrandingJson;

  @Column({
    name: "settings_json",
    type: "jsonb",
    default: () => "'{}'::jsonb",
  })
  settingsJson: TenantSettingsJson;

  @Column({ name: "activated_at", type: "timestamptz", nullable: true })
  activatedAt?: Date | null;

  @Column({ name: "suspended_at", type: "timestamptz", nullable: true })
  suspendedAt?: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt?: Date | null;

  @ManyToOne(() => PlanOrm, (plan) => plan.tenants, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "plan_id" })
  plan: PlanOrm;

  @OneToMany(() => TenantMemberOrm, (member) => member.tenant)
  members: TenantMemberOrm[];

  @OneToMany(() => InvitationOrm, (invitation) => invitation.tenant)
  invitations: InvitationOrm[];
}
