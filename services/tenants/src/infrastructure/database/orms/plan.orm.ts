import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { PlanStatus } from "src/shared/enums";
import { PlanFeaturesJson } from "src/shared/types";
import { TenantOrm } from "./tenant.orm";
import { BaseOrm } from "./base.orm";

@Entity("plans")
export class PlanOrm extends BaseOrm<PlanOrm> {
  @PrimaryColumn({ type: "varchar", length: 50 })
  code: string;

  @Column({ type: "varchar", length: 120 })
  name: string;

  @Column({ type: "text", nullable: true })
  description?: string | null;

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
    enum: PlanStatus,
    default: PlanStatus.ACTIVE,
  })
  status: PlanStatus;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @OneToMany(() => TenantOrm, (tenant) => tenant.plan)
  tenants: TenantOrm[];
}
