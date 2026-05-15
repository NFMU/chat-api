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
import {
  InvitationRoleScope,
  InvitationStatus,
  InvitationType,
} from "src/shared/enums";
import { BaseOrm } from "./base.orm";
import { TenantOrm } from "./tenant.orm";

@Entity("invitations")
@Index("idx_invitations_tenant_id", ["tenantId"])
@Index("idx_invitations_tenant_email", ["tenantId", "email"])
export class InvitationOrm extends BaseOrm<InvitationOrm> {
  @PrimaryColumn({ type: "uuid" })
  uuid: UUID;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId: UUID;

  @Column({ name: "channel_id", type: "integer", nullable: true })
  channelId?: number | null;

  @Column({ name: "invited_by", type: "uuid" })
  invitedBy: UUID;

  @Column({ name: "accepted_by_user_id", type: "uuid", nullable: true })
  acceptedByUserId?: UUID | null;

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
  @JoinColumn({ name: "tenant_id", referencedColumnName: "uuid" })
  tenant: TenantOrm;
}
