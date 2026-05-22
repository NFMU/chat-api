import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UniqueConstraint,
} from "typeorm";
import { PlanVersionStatus } from "src/shared/enums";
import { BaseOrm } from "@xlr8-nest/core/database";
import { PlanOrm } from "./plan.orm";

@Entity("plan_versions")
@UniqueConstraint("uq_plan_versions_code_version", ["planCode", "version"])
@Index("idx_plan_versions_plan_code", ["planCode"])
export class PlanVersionOrm extends BaseOrm<PlanVersionOrm> {
  @PrimaryGeneratedColumn({ type: "integer" })
  id: number;

  @Column({ name: "plan_code", type: "varchar", length: 50 })
  planCode: string;

  @Column({ type: "integer" })
  version: number;

  // ── Limits ────────────────────────────────────────────────────────────────
  @Column({ name: "max_members", type: "integer", nullable: true })
  maxMembers?: number | null;

  @Column({ name: "max_channels", type: "integer", nullable: true })
  maxChannels?: number | null;

  @Column({
    name: "max_storage_gb",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  maxStorageGb?: string | null;

  // ── Features ─────────────────────────────────────────────────────────────
  @Column({ name: "feature_guest_access", type: "boolean", default: false })
  featureGuestAccess: boolean;

  @Column({ name: "feature_custom_branding", type: "boolean", default: false })
  featureCustomBranding: boolean;

  @Column({ name: "feature_sso", type: "boolean", default: false })
  featureSso: boolean;

  @Column({ name: "feature_audit_log", type: "boolean", default: false })
  featureAuditLog: boolean;

  // ── Lifecycle ────────────────────────────────────────────────────────────
  @Column({
    type: "enum",
    enum: PlanVersionStatus,
    default: PlanVersionStatus.DRAFT,
  })
  status: PlanVersionStatus;

  @Column({ name: "published_at", type: "timestamptz", nullable: true })
  publishedAt?: Date | null;

  @Column({ name: "deprecated_at", type: "timestamptz", nullable: true })
  deprecatedAt?: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @ManyToOne(() => PlanOrm, (plan) => plan.versions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "plan_code", referencedColumnName: "code" })
  plan: PlanOrm;
}
