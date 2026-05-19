import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { UUID } from "crypto";
import { TenantStatus } from "src/shared/enums";
import { TenantBrandingJson, TenantSettingsJson } from "src/shared/types";
import { BaseOrm } from "./base.orm";
import { InvitationOrm } from "./invitation.orm";
import { PlanOrm } from "./plan.orm";
import { PlanVersionOrm } from "./plan-version.orm";
import { TenantMemberOrm } from "./tenant-member.orm";
import { TenantSubscriptionOrm } from "./tenant-subscription.orm";

@Entity("tenants")
export class TenantOrm extends BaseOrm<TenantOrm> {
  @PrimaryColumn({ type: "uuid" })
  uuid: UUID;

  @Index("idx_tenants_plan_code")
  @Column({ name: "plan_code", type: "varchar", length: 50 })
  planCode: string;

  @Column({ name: "current_plan_version_id", type: "integer", nullable: true })
  currentPlanVersionId?: number | null;

  @Column({ name: "owner_user_id", type: "uuid" })
  ownerUserId: UUID;

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
  timezoneId: UUID;

  @Column({ name: "language_id", type: "uuid" })
  languageId: UUID;

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
  @JoinColumn({ name: "plan_code", referencedColumnName: "code" })
  plan: PlanOrm;

  @ManyToOne(() => PlanVersionOrm, { onDelete: "RESTRICT", nullable: true })
  @JoinColumn({ name: "current_plan_version_id", referencedColumnName: "id" })
  currentPlanVersion?: PlanVersionOrm | null;

  @OneToMany(() => TenantSubscriptionOrm, (sub) => sub.tenant)
  subscriptions: TenantSubscriptionOrm[];

  @OneToMany(() => TenantMemberOrm, (member) => member.tenant)
  members: TenantMemberOrm[];

  @OneToMany(() => InvitationOrm, (invitation) => invitation.tenant)
  invitations: InvitationOrm[];
}
