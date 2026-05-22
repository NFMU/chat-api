import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { PlanStatus } from "src/shared/enums";
import { BaseOrm } from "@xlr8-nest/core/database";
import { PlanVersionOrm } from "./plan-version.orm";
import { TenantOrm } from "./tenant.orm";

@Entity("plans")
export class PlanOrm extends BaseOrm<PlanOrm> {
  @PrimaryColumn({ type: "varchar", length: 50 })
  code: string;

  @Column({ type: "varchar", length: 120 })
  name: string;

  @Column({ type: "text", nullable: true })
  description?: string | null;

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

  @OneToMany(() => PlanVersionOrm, (version) => version.plan)
  versions: PlanVersionOrm[];

  @OneToMany(() => TenantOrm, (tenant) => tenant.plan)
  tenants: TenantOrm[];
}
