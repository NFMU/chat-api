import { AggregateRoot, StatusCode } from "@xlr8-nest/core";
import { UUID } from "crypto";
import { v7 as uuidv7 } from "uuid";
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
  uuid: UUID;
  tenantId: UUID;
  channelId?: number | null;
  email: Email;
  inviteType: InvitationType;
  token: InvitationToken;
  roleScope: InvitationRoleScope;
  roleCode: string;
  invitedBy: UUID;
  status?: InvitationStatus;
  expiresAt: Date;
  acceptedAt?: Date | null;
  acceptedByUserId?: UUID | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Invitation extends AggregateRoot<UUID> {
  private _tenantId: UUID;
  private _channelId: number | null;
  private _email: Email;
  private _inviteType: InvitationType;
  private _token: InvitationToken;
  private _roleScope: InvitationRoleScope;
  private _roleCode: string;
  private _invitedBy: UUID;
  private _status: InvitationStatus;
  private _expiresAt: Date;
  private _acceptedAt: Date | null;
  private _acceptedByUserId: UUID | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: InvitationProps) {
    super(props.uuid);
    this._tenantId = props.tenantId;
    this._channelId = props.channelId ?? null;
    this._email = props.email;
    this._inviteType = props.inviteType;
    this._token = props.token;
    this._roleScope = props.roleScope;
    this._roleCode = props.roleCode;
    this._invitedBy = props.invitedBy;
    this._status = props.status ?? InvitationStatus.PENDING;
    this._expiresAt = props.expiresAt;
    this._acceptedAt = props.acceptedAt ?? null;
    this._acceptedByUserId = props.acceptedByUserId ?? null;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? this._createdAt;
  }

  static create(
    props: Omit<
      InvitationProps,
      "uuid" | "status" | "acceptedAt" | "acceptedByUserId" | "createdAt" | "updatedAt"
    >
  ): Invitation {
    const uuid = uuidv7() as UUID;
    const invitation = new Invitation({ ...props, uuid });
    invitation.addEvent(
      new InvitationSentEvent(
        uuid,
        invitation._tenantId,
        invitation._email.value,
        invitation._invitedBy,
        invitation._roleCode
      )
    );
    return invitation;
  }

  static reconstitute(props: InvitationProps): Invitation {
    return new Invitation(props);
  }

  // --- Business operations ---

  isExpired(now: Date = new Date()): boolean {
    return this._expiresAt.getTime() <= now.getTime();
  }

  /**
   * Accepts the invitation. Throws if not PENDING.
   * Throws if expired — without mutating state. The caller should call markExpired()
   * separately when it wants to persist the EXPIRED transition.
   */
  accept(userId: UUID, now: Date = new Date()): void {
    if (this._status !== InvitationStatus.PENDING) {
      throw new BusinessException(
        StatusCode.BAD_REQUEST,
        TenantErrors.INVITATION_NOT_PENDING
      );
    }
    if (this.isExpired(now)) {
      // Do not mutate state here — just signal the expiry to the caller.
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
      new InvitationAcceptedEvent(
        this.getId(),
        this._tenantId,
        userId,
        this._roleCode,
        this._roleScope,
        this._channelId ?? undefined
      )
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
    this.addEvent(new InvitationRevokedEvent(this.getId(), this._tenantId));
  }

  /**
   * Transitions a PENDING invitation to EXPIRED. Silently no-ops if already non-PENDING.
   * Called by the expiry sweep job, or by application handlers after catching INVITATION_EXPIRED.
   */
  markExpired(): void {
    if (this._status !== InvitationStatus.PENDING) return;
    this._status = InvitationStatus.EXPIRED;
    this.touch();
    this.addEvent(new InvitationExpiredEvent(this.getId(), this._tenantId));
  }

  // --- Private helpers ---

  private touch(): void {
    this._updatedAt = new Date();
  }

  // --- Getters ---

  getTenantId(): UUID {
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
  getExpiresAt(): Date {
    return this._expiresAt;
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
}
