import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { UUID } from "crypto";
import { TenantMemberStatus } from "src/shared/enums";
import { BaseOrm } from "@xlr8-nest/core/database";
import { TenantOrm } from "./tenant.orm";

@Entity("tenant_members")
@Index("uq_tenant_members_tenant_user", ["tenantId", "userId"], {
  unique: true,
  where: `"status" = 'active'`,
})
@Index("idx_tenant_members_tenant_id", ["tenantId"])
@Index("idx_tenant_members_user_id", ["userId"])
export class TenantMemberOrm extends BaseOrm<TenantMemberOrm> {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId: UUID;

  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @Column({ name: "invited_by", type: "uuid", nullable: true })
  invitedBy?: string | null;

  @Column({
    type: "enum",
    enum: TenantMemberStatus,
    default: TenantMemberStatus.ACTIVE,
  })
  status: TenantMemberStatus;

  @Column({ name: "joined_at", type: "timestamptz", nullable: true })
  joinedAt?: Date | null;

  @Column({ name: "left_at", type: "timestamptz", nullable: true })
  leftAt?: Date | null;

  @Column({ name: "removed_at", type: "timestamptz", nullable: true })
  removedAt?: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @ManyToOne(() => TenantOrm, (tenant) => tenant.members, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "tenant_id", referencedColumnName: "uuid" })
  tenant: TenantOrm;
}
