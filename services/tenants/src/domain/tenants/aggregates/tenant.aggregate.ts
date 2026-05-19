import { AggregateRoot, StatusCode } from "@xlr8-nest/core";
import { UUID } from "crypto";
import { v7 as uuidv7 } from "uuid";
import { PlanCode } from "src/domain/plans/value-objects/plan-code.vo";
import { TenantStatus } from "src/shared/enums";
import { TenantErrors } from "src/shared/errors/tenant.error";
import { BusinessException } from "src/shared/exceptions/business.exception";
import { TenantSubscription } from "../entities/tenant-subscription.entity";
import { TenantActivatedEvent } from "../events/tenant-activated.event";
import { TenantCreatedEvent } from "../events/tenant-created.event";
import { TenantPlanChangedEvent } from "../events/tenant-plan-changed.event";
import { TenantSuspendedEvent } from "../events/tenant-suspended.event";
import { TenantBranding } from "../value-objects/tenant-branding.vo";
import { TenantDomain } from "../value-objects/tenant-domain.vo";
import { TenantSetting } from "../value-objects/tenant-setting.vo";
import { TenantSlug } from "../value-objects/tenant-slug.vo";

export interface TenantProps {
  uuid: UUID;
  ownerUserId: UUID;
  planCode: PlanCode;
  currentPlanVersionId: number;
  /**
   * The currently active subscription. Always populated after reconstitution.
   * On first create() it is generated internally and should not be passed.
   */
  activeSubscription?: TenantSubscription | null;
  name: string;
  slug: TenantSlug;
  domain?: TenantDomain | null;
  status: TenantStatus;
  timezoneId: UUID;
  languageId: UUID;
  branding: TenantBranding;
  settings: TenantSetting;
  activatedAt?: Date | null;
  suspendedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Tenant extends AggregateRoot<UUID> {
  private _planCode: PlanCode;
  private _currentPlanVersionId: number;
  private _activeSubscription: TenantSubscription | null;
  /**
   * Subscriptions that were created or closed during the current operation.
   * The repository drains this list (via pullSubscriptionChanges()) and persists them.
   */
  private _subscriptionChanges: TenantSubscription[] = [];
  private _ownerUserId: UUID;
  private _name: string;
  private _slug: TenantSlug;
  private _domain: TenantDomain | null;
  private _status: TenantStatus;
  private _timezoneId: UUID;
  private _languageId: UUID;
  private _branding: TenantBranding;
  private _settings: TenantSetting;
  private _activatedAt: Date | null;
  private _suspendedAt: Date | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: TenantProps) {
    super(props.uuid);
    this._planCode = props.planCode;
    this._currentPlanVersionId = props.currentPlanVersionId;
    this._activeSubscription = props.activeSubscription ?? null;
    this._ownerUserId = props.ownerUserId;
    this._name = props.name;
    this._slug = props.slug;
    this._domain = props.domain ?? null;
    this._status = props.status;
    this._timezoneId = props.timezoneId;
    this._languageId = props.languageId;
    this._branding = props.branding;
    this._settings = props.settings;
    this._activatedAt = props.activatedAt ?? null;
    this._suspendedAt = props.suspendedAt ?? null;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? this._createdAt;
  }

  static create(
    props: Omit<
      TenantProps,
      | "uuid"
      | "status"
      | "activatedAt"
      | "suspendedAt"
      | "createdAt"
      | "updatedAt"
      | "activeSubscription"
    >
  ): Tenant {
    const now = new Date();
    const uuid = uuidv7() as UUID;

    // Open the first subscription inside the aggregate boundary.
    const initialSubscription = TenantSubscription.create(
      uuid,
      props.planCode,
      props.currentPlanVersionId,
      now
    );

    const tenant = new Tenant({
      ...props,
      uuid,
      status: TenantStatus.ACTIVE,
      activatedAt: now,
      activeSubscription: initialSubscription,
      createdAt: now,
      updatedAt: now,
    });

    // Mark the initial subscription as needing persistence.
    tenant._subscriptionChanges.push(initialSubscription);

    tenant.addEvent(
      new TenantCreatedEvent(
        uuid,
        tenant._ownerUserId,
        tenant._planCode,
        tenant._currentPlanVersionId,
        tenant._slug.value
      )
    );
    return tenant;
  }

  static reconstitute(props: TenantProps): Tenant {
    return new Tenant(props);
  }

  // --- Business operations ---

  rename(name: string): void {
    this.assertNotDeleted();
    this._name = name;
    this.touch();
  }

  rebrand(branding: TenantBranding): void {
    this.assertNotDeleted();
    this._branding = branding;
    this.touch();
  }

  updateSettings(settings: TenantSetting): void {
    this.assertNotDeleted();
    this._settings = settings;
    this.touch();
  }

  changeDomain(domain: TenantDomain | null): void {
    this.assertNotDeleted();
    this._domain = domain;
    this.touch();
  }

  /**
   * Switches the tenant to a new plan version.
   * Closes the current active subscription and opens a new one atomically within
   * the aggregate boundary, enforcing the "one active subscription at a time" invariant.
   */
  changePlan(
    planCode: PlanCode,
    planVersionId: number,
    direction: "upgrade" | "downgrade",
    reason?: string
  ): void {
    this.assertNotDeleted();
    if (this._planCode.equals(planCode) && this._currentPlanVersionId === planVersionId) return;

    const now = new Date();
    const previous = this._planCode;

    // Close the current subscription.
    if (this._activeSubscription) {
      if (direction === "upgrade") {
        this._activeSubscription.upgrade(reason, now);
      } else {
        this._activeSubscription.downgrade(reason, now);
      }
      this._subscriptionChanges.push(this._activeSubscription);
    }

    // Open the new subscription.
    const next = TenantSubscription.create(this.getId(), planCode, planVersionId, now);
    this._activeSubscription = next;
    this._subscriptionChanges.push(next);

    this._planCode = planCode;
    this._currentPlanVersionId = planVersionId;
    this.touch();
    this.addEvent(
      new TenantPlanChangedEvent(this.getId(), previous, planCode, planVersionId)
    );
  }

  activate(now: Date = new Date()): void {
    this.assertNotDeleted();
    if (this._status === TenantStatus.ACTIVE) {
      throw new BusinessException(
        StatusCode.BAD_REQUEST,
        TenantErrors.TENANT_ALREADY_ACTIVE
      );
    }
    this._status = TenantStatus.ACTIVE;
    this._activatedAt = now;
    this._suspendedAt = null;
    this.touch();
    this.addEvent(new TenantActivatedEvent(this.getId()));
  }

  suspend(reason?: string, now: Date = new Date()): void {
    this.assertNotDeleted();
    if (this._status === TenantStatus.SUSPENDED) return;
    this._status = TenantStatus.SUSPENDED;
    this._suspendedAt = now;
    this.touch();
    this.addEvent(new TenantSuspendedEvent(this.getId(), reason));
  }

  /**
   * Drains and returns all subscription entities that changed during this operation.
   * The repository must persist each one via upsert/save before clearing.
   */
  pullSubscriptionChanges(): TenantSubscription[] {
    const changes = [...this._subscriptionChanges];
    this._subscriptionChanges = [];
    return changes;
  }

  // --- Private helpers ---

  private assertNotDeleted(): void {
    if (this._status === TenantStatus.DELETED) {
      throw new BusinessException(
        StatusCode.BAD_REQUEST,
        TenantErrors.TENANT_DELETED
      );
    }
  }

  private touch(): void {
    this._updatedAt = new Date();
  }

  // --- Getters ---

  getPlanCode(): PlanCode {
    return this._planCode;
  }
  getCurrentPlanVersionId(): number {
    return this._currentPlanVersionId;
  }
  getActiveSubscription(): TenantSubscription | null {
    return this._activeSubscription;
  }
  getOwnerUserId(): UUID {
    return this._ownerUserId;
  }
  getName(): string {
    return this._name;
  }
  getSlug(): TenantSlug {
    return this._slug;
  }
  getDomain(): TenantDomain | null {
    return this._domain;
  }
  getStatus(): TenantStatus {
    return this._status;
  }
  getTimezoneId(): UUID {
    return this._timezoneId;
  }
  getLanguageId(): UUID {
    return this._languageId;
  }
  getBranding(): TenantBranding {
    return this._branding;
  }
  getSettings(): TenantSetting {
    return this._settings;
  }
  getActivatedAt(): Date | null {
    return this._activatedAt;
  }
  getSuspendedAt(): Date | null {
    return this._suspendedAt;
  }
  getCreatedAt(): Date {
    return this._createdAt;
  }
  getUpdatedAt(): Date {
    return this._updatedAt;
  }
}
