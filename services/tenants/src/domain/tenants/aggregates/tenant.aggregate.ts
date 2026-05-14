import { AggregateRoot, StatusCode } from "@xlr8-nest/core";
import { UUID } from "crypto";
import { v4 as uuidv4 } from "uuid";
import { PlanCode } from "src/domain/plans/value-objects/plan-code.vo";
import { TenantStatus } from "src/shared/enums";
import { TenantErrors } from "src/shared/errors/tenant.error";
import { BusinessException } from "src/shared/exceptions/business.exception";
import { TenantActivatedEvent } from "../events/tenant-activated.event";
import { TenantCreatedEvent } from "../events/tenant-created.event";
import { TenantPlanChangedEvent } from "../events/tenant-plan-changed.event";
import { TenantSuspendedEvent } from "../events/tenant-suspended.event";
import { TenantBranding } from "../value-objects/tenant-branding.vo";
import { TenantDomain } from "../value-objects/tenant-domain.vo";
import { TenantSetting } from "../value-objects/tenant-setting.vo";
import { TenantSlug } from "../value-objects/tenant-slug.vo";

export interface TenantProps {
  idSeq?: number;
  uuid: UUID;
  ownerUserId: UUID;
  planCode: PlanCode;
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
  private _idSeq?: number;
  private _planCode: PlanCode;
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
    this._idSeq = props.idSeq;
    this._planCode = props.planCode;
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
      | "idSeq"
      | "status"
      | "activatedAt"
      | "suspendedAt"
      | "createdAt"
      | "updatedAt"
    >
  ): Tenant {
    const now = new Date();
    const tenant = new Tenant({
      ...props,
      uuid: uuidv4() as UUID,
      status: TenantStatus.ACTIVE,
      activatedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    tenant.addEvent(
      new TenantCreatedEvent(
        tenant.id,
        tenant._ownerUserId,
        tenant._planCode,
        tenant._slug.value
      )
    );
    return tenant;
  }

  static reconstitute(props: TenantProps): Tenant {
    return new Tenant(props);
  }

  getIdSeq(): number | undefined {
    return this._idSeq;
  }
  getPlanCode(): PlanCode {
    return this._planCode;
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

  rename(name: string): void {
    this._name = name;
    this.touch();
  }

  rebrand(branding: TenantBranding): void {
    this._branding = branding;
    this.touch();
  }

  updateSettings(settings: TenantSetting): void {
    this._settings = settings;
    this.touch();
  }

  changeDomain(domain: TenantDomain | null): void {
    this.assertNotDeleted();
    this._domain = domain;
    this.touch();
  }

  changePlan(planCode: PlanCode): void {
    this.assertNotDeleted();
    if (this._planCode.equals(planCode)) return;
    const previous = this._planCode;
    this._planCode = planCode;
    this.touch();
    this.addEvent(new TenantPlanChangedEvent(this.id, previous, planCode));
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
    this.addEvent(new TenantActivatedEvent(this.id));
  }

  suspend(reason?: string, now: Date = new Date()): void {
    this.assertNotDeleted();
    if (this._status === TenantStatus.SUSPENDED) return;
    this._status = TenantStatus.SUSPENDED;
    this._suspendedAt = now;
    this.touch();
    this.addEvent(new TenantSuspendedEvent(this.id, reason));
  }

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
}
