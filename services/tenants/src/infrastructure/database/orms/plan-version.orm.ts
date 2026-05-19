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
import { PlanFeaturesJson } from "src/shared/types";
import { BaseOrm } from "./base.orm";
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

  @Column({
    name: "features_json",
    type: "jsonb",
    default: () => "'{}'::jsonb",
  })
  featuresJson: PlanFeaturesJson;

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
