import { Entity } from "@xlr8-nest/core/ddd";
import { StatusCode } from "@xlr8-nest/core";
import { UUID } from "crypto";
import { v7 as uuidv7 } from "uuid";
import { SubscriptionStatus } from "src/shared/enums";
import { TenantErrors } from "src/shared/errors/tenant.error";
import { BusinessException } from "src/shared/exceptions/business.exception";
import { PlanCode } from "src/domain/plans/value-objects/plan-code.vo";

export interface TenantSubscriptionProps {
  id: UUID;
  tenantId: UUID;
  planCode: PlanCode;
  planVersionId: number;
  status: SubscriptionStatus;
  startedAt: Date;
  endedAt?: Date | null;
  reason?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class TenantSubscription extends Entity<UUID> {
  private _tenantId: UUID;
  private _planCode: PlanCode;
  private _planVersionId: number;
  private _status: SubscriptionStatus;
  private _startedAt: Date;
  private _endedAt: Date | null;
  private _reason: string | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: TenantSubscriptionProps) {
    super(props.id);
    this._tenantId = props.tenantId;
    this._planCode = props.planCode;
    this._planVersionId = props.planVersionId;
    this._status = props.status;
    this._startedAt = props.startedAt;
    this._endedAt = props.endedAt ?? null;
    this._reason = props.reason ?? null;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? this._createdAt;
  }

  static create(
    tenantId: UUID,
    planCode: PlanCode,
    planVersionId: number,
    now: Date = new Date()
  ): TenantSubscription {
    return new TenantSubscription({
      id: uuidv7() as UUID,
      tenantId,
      planCode,
      planVersionId,
      status: SubscriptionStatus.ACTIVE,
      startedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: TenantSubscriptionProps): TenantSubscription {
    return new TenantSubscription(props);
  }

  // --- Business operations ---

  isActive(): boolean {
    return this._status === SubscriptionStatus.ACTIVE;
  }

  /**
   * Closes this subscription when the tenant upgrades to a higher-tier plan.
   */
  upgrade(reason?: string, now: Date = new Date()): void {
    this.assertActive();
    this._status = SubscriptionStatus.UPGRADED;
    this._endedAt = now;
    this._reason = reason ?? null;
    this.touch();
  }

  /**
   * Closes this subscription when the tenant downgrades to a lower-tier plan.
   */
  downgrade(reason?: string, now: Date = new Date()): void {
    this.assertActive();
    this._status = SubscriptionStatus.DOWNGRADED;
    this._endedAt = now;
    this._reason = reason ?? null;
    this.touch();
  }

  cancel(reason?: string, now: Date = new Date()): void {
    this.assertActive();
    this._status = SubscriptionStatus.CANCELLED;
    this._endedAt = now;
    this._reason = reason ?? null;
    this.touch();
  }

  expire(now: Date = new Date()): void {
    this.assertActive();
    this._status = SubscriptionStatus.EXPIRED;
    this._endedAt = now;
    this.touch();
  }

  // --- Private helpers ---

  private assertActive(): void {
    if (this._status !== SubscriptionStatus.ACTIVE) {
      throw new BusinessException(StatusCode.BAD_REQUEST, TenantErrors.SUBSCRIPTION_NOT_ACTIVE);
    }
  }

  private touch(): void {
    this._updatedAt = new Date();
  }

  // --- Getters ---

  getTenantId(): UUID {
    return this._tenantId;
  }
  getPlanCode(): PlanCode {
    return this._planCode;
  }
  getPlanVersionId(): number {
    return this._planVersionId;
  }
  getStatus(): SubscriptionStatus {
    return this._status;
  }
  getStartedAt(): Date {
    return this._startedAt;
  }
  getEndedAt(): Date | null {
    return this._endedAt;
  }
  getReason(): string | null {
    return this._reason;
  }
  getCreatedAt(): Date {
    return this._createdAt;
  }
  getUpdatedAt(): Date {
    return this._updatedAt;
  }
}
