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
import {
  InvitationRoleScope,
  InvitationStatus,
  InvitationType,
} from "src/shared/enums";
import { TenantOrm } from "./tenant.orm";

@Entity("invitations")
@Index("idx_invitations_tenant_id", ["tenantId"])
@Index("idx_invitations_tenant_email", ["tenantId", "email"])
export class InvitationOrm {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Column({ name: "tenant_id", type: "integer" })
  tenantId: number;

  @Column({ name: "channel_id", type: "integer", nullable: true })
  channelId?: number | null;

  @Column({ name: "invited_by", type: "uuid" })
  invitedBy: string;

  @Column({ name: "accepted_by_user_id", type: "uuid", nullable: true })
  acceptedByUserId?: string | null;

  @Column({ type: "varchar", length: 255 })
  email: string;

  @Column({
    name: "invite_type",
    type: "enum",
    enum: InvitationType,
    default: InvitationType.EMAIL,
  })
  inviteType: InvitationType;

  @Index("uq_invitations_token", { unique: true })
  @Column({ type: "varchar", length: 255 })
  token: string;

  @Column({
    name: "role_scope",
    type: "enum",
    enum: InvitationRoleScope,
    default: InvitationRoleScope.TENANT,
  })
  roleScope: InvitationRoleScope;

  @Column({ name: "role_code", type: "varchar", length: 50 })
  roleCode: string;

  @Column({
    type: "enum",
    enum: InvitationStatus,
    default: InvitationStatus.PENDING,
  })
  status: InvitationStatus;

  @Column({ name: "expires_at", type: "timestamptz" })
  expiresAt: Date;

  @Column({ name: "accepted_at", type: "timestamptz", nullable: true })
  acceptedAt?: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @ManyToOne(() => TenantOrm, (tenant) => tenant.invitations, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "tenant_id" })
  tenant: TenantOrm;
}
