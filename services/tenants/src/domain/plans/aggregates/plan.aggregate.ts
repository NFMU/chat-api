import { AggregateRoot, StatusCode } from "@xlr8-nest/core";
import { PlanStatus } from "src/shared/enums";
import { TenantErrors } from "src/shared/errors/tenant.error";
import { BusinessException } from "src/shared/exceptions/business.exception";
import { PlanVersionPublishedEvent } from "../events/plan-version-published.event";
import { PlanVersionDeprecatedEvent } from "../events/plan-version-deprecated.event";
import { PlanVersion } from "../entities/plan-version.entity";
import { PlanCode } from "../value-objects/plan-code.vo";
import { PlanFeatures } from "../value-objects/plan-features.vo";
import { PlanLimit } from "../value-objects/plan-limit.vo";

export interface PlanProps {
  code: PlanCode;
  name: string;
  description: string;
  status: PlanStatus;
  versions?: PlanVersion[];
  latestVersionNumber?: number;
  aggregateVersion?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Plan extends AggregateRoot<PlanCode> {
  private _name: string;
  private _description: string;
  private _status: PlanStatus;
  private _availableVersions: PlanVersion[];
  /**
   * Highest version number ever assigned across all PlanVersions, including
   * deprecated ones. Persisted on the plans row so draftNewVersion() never
   * re-uses a number even when deprecated versions are excluded from the load.
   */
  private _latestVersionNumber: number;
  /**
   * Tracks PlanVersion entities that changed state during this operation.
   * The repository drains this via pullVersionChanges() and persists them.
   */
  private _versionChanges: PlanVersion[] = [];
  /** OCC counter managed by the repository layer (TypeORM @VersionColumn). */
  private _aggregateVersion: number;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: PlanProps) {
    super(props.code);
    this._name = props.name;
    this._description = props.description;
    this._status = props.status;
    this._availableVersions = props.versions ?? [];
    this._latestVersionNumber = props.latestVersionNumber ?? 0;
    this._aggregateVersion = props.aggregateVersion ?? 0;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? this._createdAt;
  }

  static create(props: Omit<PlanProps, "createdAt" | "updatedAt" | "versions">): Plan {
    return new Plan(props);
  }

  static reconstitute(props: PlanProps): Plan {
    return new Plan(props);
  }

  // --- Catalog operations (non-breaking — do not affect existing subscriptions) ---

  isAvailable(): boolean {
    return this._status === PlanStatus.ACTIVE;
  }

  rename(name: string): void {
    this._name = name;
    this.touch();
  }

  updateDescription(description: string): void {
    this._description = description;
    this.touch();
  }

  changeStatus(status: PlanStatus): void {
    this._status = status;
    this.touch();
  }

  // --- Version lifecycle (all invariants enforced here) ---

  /**
   * Creates a new DRAFT PlanVersion owned by this aggregate.
   * Version number is derived from the current in-memory collection — no repository call needed.
   * The plan must be ACTIVE to accept new versions.
   */
  draftNewVersion(limit: PlanLimit, features: PlanFeatures): PlanVersion {
    if (!this.isAvailable()) {
      throw new BusinessException(StatusCode.BAD_REQUEST, TenantErrors.PLAN_NOT_AVAILABLE);
    }
    const nextVersionNumber = this._latestVersionNumber + 1;
    this._latestVersionNumber = nextVersionNumber;

    const version = PlanVersion.create({
      planCode: this._id,
      version: nextVersionNumber,
      limit,
      features,
    });

    this._availableVersions.push(version);
    this._versionChanges.push(version);
    this.touch();
    return version;
  }

  /**
   * Publishes a DRAFT version by version number.
   * Emits PlanVersionPublishedEvent. The version must already be persisted (id > 0).
   */
  publishVersion(versionNumber: number, now: Date = new Date()): void {
    const version = this.requireVersion(versionNumber);
    version.publish(now);
    this._versionChanges.push(version);
    this.touch();
    this.addEvent(
      new PlanVersionPublishedEvent(version.getId(), this._id.value, versionNumber, now)
    );
  }

  /**
   * Deprecates a PUBLISHED version by version number.
   * Emits PlanVersionDeprecatedEvent.
   */
  deprecateVersion(versionNumber: number, now: Date = new Date()): void {
    const version = this.requireVersion(versionNumber);
    version.deprecate(now);
    this._versionChanges.push(version);
    this.touch();
    this.addEvent(
      new PlanVersionDeprecatedEvent(version.getId(), this._id.value, versionNumber, now)
    );
  }

  /**
   * Returns the highest-numbered PUBLISHED version, or null if none exists.
   * This is the version used for new tenant subscriptions.
   */
  getLatestPublishedVersion(): PlanVersion | null {
    const published = this._availableVersions.filter((v) => v.isPublished());
    if (published.length === 0) return null;
    return published.reduce((latest, v) =>
      v.getVersion() > latest.getVersion() ? v : latest
    );
  }

  getVersion(versionNumber: number): PlanVersion | null {
    return this._availableVersions.find((v) => v.getVersion() === versionNumber) ?? null;
  }

  getVersions(): PlanVersion[] {
    return [...this._availableVersions];
  }

  /**
   * Drains and returns PlanVersion entities that changed during this operation.
   * The repository must persist each one (insert or update) before clearing.
   */
  pullVersionChanges(): PlanVersion[] {
    const changes = [...this._versionChanges];
    this._versionChanges = [];
    return changes;
  }

  // --- Private helpers ---

  private requireVersion(versionNumber: number): PlanVersion {
    const version = this.getVersion(versionNumber);
    if (!version) {
      throw new BusinessException(StatusCode.NOT_FOUND, TenantErrors.PLAN_VERSION_NOT_FOUND);
    }
    return version;
  }

  private touch(): void {
    this._updatedAt = new Date();
  }

  // --- Getters ---

  get code(): PlanCode {
    return this._id;
  }

  getLatestVersionNumber(): number {
    return this._latestVersionNumber;
  }

  getAggregateVersion(): number {
    return this._aggregateVersion;
  }

  getName(): string {
    return this._name;
  }
  getDescription(): string {
    return this._description;
  }
  getStatus(): PlanStatus {
    return this._status;
  }
  getCreatedAt(): Date {
    return this._createdAt;
  }
  getUpdatedAt(): Date {
    return this._updatedAt;
  }
}
