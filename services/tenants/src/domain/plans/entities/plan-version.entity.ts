import { Entity } from "@xlr8-nest/core/ddd";
import { StatusCode } from "@xlr8-nest/core";
import { PlanVersionStatus } from "src/shared/enums";
import { TenantErrors } from "src/shared/errors/tenant.error";
import { BusinessException } from "src/shared/exceptions/business.exception";
import { PlanCode } from "../value-objects/plan-code.vo";
import { PlanFeatures } from "../value-objects/plan-features.vo";
import { PlanLimit } from "../value-objects/plan-limit.vo";

export interface PlanVersionProps {
  id: number;
  planCode: PlanCode;
  version: number;
  limit: PlanLimit;
  features: PlanFeatures;
  status: PlanVersionStatus;
  publishedAt?: Date | null;
  deprecatedAt?: Date | null;
  createdAt?: Date;
}

/**
 * Immutable snapshot of a plan's limits and feature flags at a specific version.
 * Owned by the Plan aggregate — never mutated from outside the Plan boundary.
 * State transitions (publish, deprecate) are invoked by Plan methods, which also
 * emit the corresponding domain events.
 */
export class PlanVersion extends Entity<number> {
  private _planCode: PlanCode;
  private _version: number;
  private _limit: PlanLimit;
  private _features: PlanFeatures;
  private _status: PlanVersionStatus;
  private _publishedAt: Date | null;
  private _deprecatedAt: Date | null;
  private _createdAt: Date;

  private constructor(props: PlanVersionProps) {
    super(props.id);
    this._planCode = props.planCode;
    this._version = props.version;
    this._limit = props.limit;
    this._features = props.features;
    this._status = props.status;
    this._publishedAt = props.publishedAt ?? null;
    this._deprecatedAt = props.deprecatedAt ?? null;
    this._createdAt = props.createdAt ?? new Date();
  }

  /** Called by Plan.draftNewVersion(). id = 0 is the sentinel for "not yet persisted". */
  static create(
    props: Omit<PlanVersionProps, "id" | "status" | "publishedAt" | "deprecatedAt" | "createdAt">
  ): PlanVersion {
    return new PlanVersion({
      ...props,
      id: 0,
      status: PlanVersionStatus.DRAFT,
    });
  }

  static reconstitute(props: PlanVersionProps): PlanVersion {
    return new PlanVersion(props);
  }

  // --- State transitions (called by Plan aggregate, which emits the events) ---

  publish(now: Date = new Date()): void {
    if (this._status !== PlanVersionStatus.DRAFT) {
      throw new BusinessException(StatusCode.BAD_REQUEST, TenantErrors.PLAN_VERSION_NOT_DRAFT);
    }
    this._status = PlanVersionStatus.PUBLISHED;
    this._publishedAt = now;
  }

  deprecate(now: Date = new Date()): void {
    if (this._status !== PlanVersionStatus.PUBLISHED) {
      throw new BusinessException(StatusCode.BAD_REQUEST, TenantErrors.PLAN_VERSION_NOT_PUBLISHED);
    }
    this._status = PlanVersionStatus.DEPRECATED;
    this._deprecatedAt = now;
  }

  isPublished(): boolean {
    return this._status === PlanVersionStatus.PUBLISHED;
  }

  // --- Getters ---

  getPlanCode(): PlanCode {
    return this._planCode;
  }
  getVersion(): number {
    return this._version;
  }
  getLimit(): PlanLimit {
    return this._limit;
  }
  getFeatures(): PlanFeatures {
    return this._features;
  }
  getStatus(): PlanVersionStatus {
    return this._status;
  }
  getPublishedAt(): Date | null {
    return this._publishedAt;
  }
  getDeprecatedAt(): Date | null {
    return this._deprecatedAt;
  }
  getCreatedAt(): Date {
    return this._createdAt;
  }
}
