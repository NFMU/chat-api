import { Injectable } from "@nestjs/common";
import { UUID } from "crypto";
import { Tenant } from "src/domain/tenants/aggregates/tenant.aggregate";
import { PlanCode } from "src/domain/plans/value-objects/plan-code.vo";
import { TenantBranding, TenantBrandingTheme } from "src/domain/tenants/value-objects/tenant-branding.vo";
import { TenantDomain } from "src/domain/tenants/value-objects/tenant-domain.vo";
import { TenantSetting } from "src/domain/tenants/value-objects/tenant-setting.vo";
import { TenantSlug } from "src/domain/tenants/value-objects/tenant-slug.vo";
import { SubscriptionStatus } from "src/shared/enums";
import { TenantSubscriptionAdapter } from "./tenant-subscription.adapter";
import { TenantOrm } from "../orms/tenant.orm";

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
      branding: new TenantBranding({
        logoUrl: orm.brandingLogoUrl ?? undefined,
        color: orm.brandingColor ?? undefined,
        theme: (orm.brandingTheme as TenantBrandingTheme) ?? undefined,
      }),
      settings: new TenantSetting({
        messageRetentionDays: orm.settingsMessageRetentionDays ?? null,
        guestAccess: orm.settingsGuestAccess,
        fileSharingEnabled: orm.settingsFileSharingEnabled,
        ssoProvider: orm.settingsSsoProvider ?? null,
      }),
      activatedAt: orm.activatedAt,
      suspendedAt: orm.suspendedAt,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  toOrm(domain: Tenant): TenantOrm {
    const branding = domain.getBranding();
    const settings = domain.getSettings();
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
      brandingLogoUrl: branding.logoUrl || null,
      brandingColor: branding.color,
      brandingTheme: branding.theme,
      settingsMessageRetentionDays: settings.messageRetentionDays,
      settingsGuestAccess: settings.guestAccess,
      settingsFileSharingEnabled: settings.fileSharingEnabled,
      settingsSsoProvider: settings.ssoProvider,
      activatedAt: domain.getActivatedAt(),
      suspendedAt: domain.getSuspendedAt(),
    });
  }
}
