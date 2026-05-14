import { AggregateRoot, StatusCode } from "@xlr8-nest/core";
import { UUID } from "crypto";
import { v4 as uuidv4 } from "uuid";
import {
  InvitationRoleScope,
  InvitationStatus,
  InvitationType,
} from "src/shared/enums";
import { TenantErrors } from "src/shared/errors/tenant.error";
import { BusinessException } from "src/shared/exceptions/business.exception";
import { InvitationAcceptedEvent } from "../events/invitation-accepted.event";
import { InvitationExpiredEvent } from "../events/invitation-expired.event";
import { InvitationRevokedEvent } from "../events/invitation-revoked.event";
import { InvitationSentEvent } from "../events/invitation-sent.event";
import { Email } from "../value-objects/email.vo";
import { InvitationToken } from "../value-objects/invitation-token.vo";

export interface InvitationProps {
  idSeq?: number;
  uuid: UUID;
  tenantId: number;
  channelId?: number | null;
  email: Email;
  inviteType: InvitationType;
  token: InvitationToken;
  roleScope: InvitationRoleScope;
  roleCode: string;
  invitedBy: UUID;
  status?: InvitationStatus;
  expiredAt: Date;
  acceptedAt?: Date | null;
  acceptedByUserId?: UUID | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Invitation extends AggregateRoot<UUID> {
  private _idSeq?: number;
  private _tenantId: number;
  private _channelId: number | null;
  private _email: Email;
  private _inviteType: InvitationType;
  private _token: InvitationToken;
  private _roleScope: InvitationRoleScope;
  private _roleCode: string;
  private _invitedBy: UUID;
  private _status: InvitationStatus;
  private _expiredAt: Date;
  private _acceptedAt: Date | null;
  private _acceptedByUserId: UUID | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: InvitationProps) {
    super(props.uuid);
    this._idSeq = props.idSeq;
    this._tenantId = props.tenantId;
    this._channelId = props.channelId ?? null;
    this._email = props.email;
    this._inviteType = props.inviteType;
    this._token = props.token;
    this._roleScope = props.roleScope;
    this._roleCode = props.roleCode;
    this._invitedBy = props.invitedBy;
    this._status = props.status ?? InvitationStatus.PENDING;
    this._expiredAt = props.expiredAt;
    this._acceptedAt = props.acceptedAt ?? null;
    this._acceptedByUserId = props.acceptedByUserId ?? null;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? this._createdAt;
  }

  static create(
    props: Omit<
      InvitationProps,
      | "uuid"
      | "idSeq"
      | "status"
      | "acceptedAt"
      | "acceptedByUserId"
      | "createdAt"
      | "updatedAt"
    >
  ): Invitation {
    const invitation = new Invitation({ ...props, uuid: uuidv4() as UUID });
    invitation.addEvent(
      new InvitationSentEvent(
        invitation.id,
        invitation._tenantId,
        invitation._email.value
      )
    );
    return invitation;
  }

  static reconstitute(props: InvitationProps): Invitation {
    return new Invitation(props);
  }

  getIdSeq(): number | undefined {
    return this._idSeq;
  }
  getTenantId(): number {
    return this._tenantId;
  }
  getChannelId(): number | null {
    return this._channelId;
  }
  getEmail(): Email {
    return this._email;
  }
  getInviteType(): InvitationType {
    return this._inviteType;
  }
  getToken(): InvitationToken {
    return this._token;
  }
  getRoleScope(): InvitationRoleScope {
    return this._roleScope;
  }
  getRoleCode(): string {
    return this._roleCode;
  }
  getInvitedBy(): UUID {
    return this._invitedBy;
  }
  getStatus(): InvitationStatus {
    return this._status;
  }
  getExpiredAt(): Date {
    return this._expiredAt;
  }
  getAcceptedAt(): Date | null {
    return this._acceptedAt;
  }
  getAcceptedByUserId(): UUID | null {
    return this._acceptedByUserId;
  }
  getCreatedAt(): Date {
    return this._createdAt;
  }
  getUpdatedAt(): Date {
    return this._updatedAt;
  }

  isExpired(now: Date = new Date()): boolean {
    return this._expiredAt.getTime() <= now.getTime();
  }

  accept(userId: UUID, now: Date = new Date()): void {
    if (this._status !== InvitationStatus.PENDING) {
      throw new BusinessException(
        StatusCode.BAD_REQUEST,
        TenantErrors.INVITATION_NOT_PENDING
      );
    }
    if (this.isExpired(now)) {
      this._status = InvitationStatus.EXPIRED;
      this.touch();
      this.addEvent(new InvitationExpiredEvent(this.id, this._tenantId));
      throw new BusinessException(
        StatusCode.BAD_REQUEST,
        TenantErrors.INVITATION_EXPIRED
      );
    }
    this._status = InvitationStatus.ACCEPTED;
    this._acceptedAt = now;
    this._acceptedByUserId = userId;
    this.touch();
    this.addEvent(
      new InvitationAcceptedEvent(this.id, this._tenantId, userId)
    );
  }

  revoke(): void {
    if (this._status !== InvitationStatus.PENDING) {
      throw new BusinessException(
        StatusCode.BAD_REQUEST,
        TenantErrors.INVITATION_NOT_PENDING
      );
    }
    this._status = InvitationStatus.REVOKED;
    this.touch();
    this.addEvent(new InvitationRevokedEvent(this.id, this._tenantId));
  }

  markExpired(): void {
    if (this._status !== InvitationStatus.PENDING) return;
    this._status = InvitationStatus.EXPIRED;
    this.touch();
    this.addEvent(new InvitationExpiredEvent(this.id, this._tenantId));
  }

  private touch(): void {
    this._updatedAt = new Date();
  }
}
