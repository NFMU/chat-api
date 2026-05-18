import { Entity } from "@xlr8-nest/core/ddd";
import { StatusCode } from "@xlr8-nest/core";
import { PlanVersionStatus } from "src/shared/enums";
import { TenantErrors } from "src/shared/errors/tenant.error";
import { BusinessException } from "src/shared/exceptions/business.exception";
import { PlanCode } from "../value-objects/plan-code.vo";
import { PlanFeatures } from "../value-objects/plan-features.vo";
import { PlanLimits } from "./plan.entity";

export interface PlanVersionProps {
  id: number;
  planCode: PlanCode;
  version: number;
  features: PlanFeatures;
  limits?: PlanLimits;
  status: PlanVersionStatus;
  publishedAt?: Date | null;
  deprecatedAt?: Date | null;
  createdAt?: Date;
}

export class PlanVersion extends Entity<number> {
  private _planCode: PlanCode;
  private _version: number;
  private _maxMembers: number | null;
  private _maxChannels: number | null;
  private _maxStorageGb: string | null;
  private _features: PlanFeatures;
  private _status: PlanVersionStatus;
  private _publishedAt: Date | null;
  private _deprecatedAt: Date | null;
  private _createdAt: Date;

  private constructor(props: PlanVersionProps) {
    super(props.id);
    this._planCode = props.planCode;
    this._version = props.version;
    this._maxMembers = props.limits?.maxMembers ?? null;
    this._maxChannels = props.limits?.maxChannels ?? null;
    this._maxStorageGb = props.limits?.maxStorageGb ?? null;
    this._features = props.features;
    this._status = props.status;
    this._publishedAt = props.publishedAt ?? null;
    this._deprecatedAt = props.deprecatedAt ?? null;
    this._createdAt = props.createdAt ?? new Date();
  }

  /**
   * Creates a new DRAFT version. id = 0 indicates it is not yet persisted (auto-increment).
   */
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

  // --- Business operations ---

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
  getMaxMembers(): number | null {
    return this._maxMembers;
  }
  getMaxChannels(): number | null {
    return this._maxChannels;
  }
  getMaxStorageGb(): string | null {
    return this._maxStorageGb;
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
