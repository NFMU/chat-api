import { Injectable } from "@nestjs/common";
import { UUID } from "crypto";
import { Tenant } from "src/domain/tenants/aggregates/tenant.aggregate";
import { PlanCode } from "src/domain/plans/value-objects/plan-code.vo";
import { TenantBranding } from "src/domain/tenants/value-objects/tenant-branding.vo";
import { TenantDomain } from "src/domain/tenants/value-objects/tenant-domain.vo";
import { TenantSetting } from "src/domain/tenants/value-objects/tenant-setting.vo";
import { TenantSlug } from "src/domain/tenants/value-objects/tenant-slug.vo";
import { TenantSubscriptionAdapter } from "./tenant-subscription.adapter";
import { TenantOrm } from "../orms/tenant.orm";
import { SubscriptionStatus } from "src/shared/enums";

@Injectable()
export class TenantAdapter {
  constructor(
    private readonly subscriptionAdapter: TenantSubscriptionAdapter
  ) {}

  toDomain(orm: TenantOrm): Tenant {
    const activeSubscriptionOrm = orm.subscriptions?.find(
      (s) => s.status === SubscriptionStatus.ACTIVE
    ) ?? null;

    return Tenant.reconstitute({
      uuid: orm.uuid as UUID,
      planCode: new PlanCode(orm.planCode),
      currentPlanVersionId: orm.currentPlanVersionId ?? 0,
      activeSubscription: activeSubscriptionOrm
        ? this.subscriptionAdapter.toDomain(activeSubscriptionOrm)
        : null,
      ownerUserId: orm.ownerUserId as UUID,
      name: orm.name,
      slug: new TenantSlug(orm.slug),
      domain: orm.domain ? new TenantDomain(orm.domain) : null,
      status: orm.status,
      timezoneId: orm.timezoneId as UUID,
      languageId: orm.languageId as UUID,
      branding: new TenantBranding(orm.brandingJson),
      settings: new TenantSetting(orm.settingsJson),
      activatedAt: orm.activatedAt,
      suspendedAt: orm.suspendedAt,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  toOrm(domain: Tenant): TenantOrm {
    return new TenantOrm({
      uuid: domain.getId() as UUID,
      planCode: domain.getPlanCode().value,
      currentPlanVersionId: domain.getCurrentPlanVersionId() || null,
      ownerUserId: domain.getOwnerUserId(),
      name: domain.getName(),
      slug: domain.getSlug().value,
      domain: domain.getDomain()?.value ?? null,
      status: domain.getStatus(),
      timezoneId: domain.getTimezoneId(),
      languageId: domain.getLanguageId(),
      brandingJson: domain.getBranding(),
      settingsJson: domain.getSettings(),
      activatedAt: domain.getActivatedAt(),
      suspendedAt: domain.getSuspendedAt(),
    });
  }
}
