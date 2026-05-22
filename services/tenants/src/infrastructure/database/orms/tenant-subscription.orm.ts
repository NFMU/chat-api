import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { UUID } from "crypto";
import { SubscriptionStatus } from "src/shared/enums";
import { BaseOrm } from "@xlr8-nest/core/database";
import { TenantOrm } from "./tenant.orm";
import { PlanVersionOrm } from "./plan-version.orm";

@Entity("tenant_subscriptions")
@Index("idx_tenant_subscriptions_tenant_id", ["tenantId"])
@Index("idx_tenant_subscriptions_plan_version_id", ["planVersionId"])
export class TenantSubscriptionOrm extends BaseOrm<TenantSubscriptionOrm> {
  @PrimaryColumn({ type: "uuid" })
  id: UUID;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId: UUID;

  @Column({ name: "plan_code", type: "varchar", length: 50 })
  planCode: string;

  @Column({ name: "plan_version_id", type: "integer" })
  planVersionId: number;

  @Column({
    type: "enum",
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @Column({ name: "started_at", type: "timestamptz" })
  startedAt: Date;

  @Column({ name: "ended_at", type: "timestamptz", nullable: true })
  endedAt?: Date | null;

  @Column({ type: "text", nullable: true })
  reason?: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @ManyToOne(() => TenantOrm, (tenant) => tenant.subscriptions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id", referencedColumnName: "uuid" })
  tenant: TenantOrm;

  @ManyToOne(() => PlanVersionOrm, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "plan_version_id", referencedColumnName: "id" })
  planVersion: PlanVersionOrm;
}
