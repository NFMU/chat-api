import { Entity } from "@xlr8-nest/core/ddd";
import { StatusCode } from "@xlr8-nest/core/constants";
import { UUID } from "crypto";
import { TenantMemberStatus } from "src/shared/enums";
import { TenantErrors } from "src/shared/errors/tenant.error";
import { BusinessException } from "src/shared/exceptions/business.exception";

export interface TenantMemberProps {
  id: number;
  tenantId: UUID;
  userId: UUID;
  invitedBy?: UUID | null;
  status: TenantMemberStatus;
  joinedAt?: Date | null;
  leftAt?: Date | null;
  removedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class TenantMember extends Entity<number> {
  private _tenantId: UUID;
  private _userId: UUID;
  private _invitedBy: UUID | null;
  private _status: TenantMemberStatus;
  private _joinedAt: Date | null;
  private _leftAt: Date | null;
  private _removedAt: Date | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: TenantMemberProps) {
    super(props.id);
    this._tenantId = props.tenantId;
    this._userId = props.userId;
    this._invitedBy = props.invitedBy ?? null;
    this._status = props.status;
    this._joinedAt = props.joinedAt ?? null;
    this._leftAt = props.leftAt ?? null;
    this._removedAt = props.removedAt ?? null;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? this._createdAt;
  }

  /**
   * id = 0 is the sentinel for "not yet persisted" (auto-increment PK).
   */
  static create(
    tenantId: UUID,
    userId: UUID,
    invitedBy?: UUID | null,
    now: Date = new Date()
  ): TenantMember {
    return new TenantMember({
      id: 0,
      tenantId,
      userId,
      invitedBy: invitedBy ?? null,
      status: TenantMemberStatus.ACTIVE,
      joinedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: TenantMemberProps): TenantMember {
    return new TenantMember(props);
  }

  // --- Business operations ---

  isActive(): boolean {
    return this._status === TenantMemberStatus.ACTIVE;
  }

  leave(now: Date = new Date()): void {
    this.assertActive();
    this._status = TenantMemberStatus.LEFT;
    this._leftAt = now;
    this.touch();
  }

  remove(now: Date = new Date()): void {
    this.assertActive();
    this._status = TenantMemberStatus.REMOVED;
    this._removedAt = now;
    this.touch();
  }

  suspend(): void {
    this.assertActive();
    this._status = TenantMemberStatus.SUSPENDED;
    this.touch();
  }

  reinstate(): void {
    if (this._status !== TenantMemberStatus.SUSPENDED) {
      throw new BusinessException(
        StatusCode.BAD_REQUEST,
        TenantErrors.MEMBER_NOT_SUSPENDED
      );
    }
    this._status = TenantMemberStatus.ACTIVE;
    this.touch();
  }

  // --- Private helpers ---

  private assertActive(): void {
    if (this._status !== TenantMemberStatus.ACTIVE) {
      throw new BusinessException(
        StatusCode.BAD_REQUEST,
        TenantErrors.MEMBER_NOT_ACTIVE
      );
    }
  }

  private touch(): void {
    this._updatedAt = new Date();
  }

  // --- Getters ---

  getTenantId(): UUID {
    return this._tenantId;
  }
  getUserId(): UUID {
    return this._userId;
  }
  getInvitedBy(): UUID | null {
    return this._invitedBy;
  }
  getStatus(): TenantMemberStatus {
    return this._status;
  }
  getJoinedAt(): Date | null {
    return this._joinedAt;
  }
  getLeftAt(): Date | null {
    return this._leftAt;
  }
  getRemovedAt(): Date | null {
    return this._removedAt;
  }
  getCreatedAt(): Date {
    return this._createdAt;
  }
  getUpdatedAt(): Date {
    return this._updatedAt;
  }
}
