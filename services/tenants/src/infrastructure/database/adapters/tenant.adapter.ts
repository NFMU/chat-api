import { Injectable } from "@nestjs/common";
import { UUID } from "crypto";
import { Tenant } from "src/domain/tenants/aggregates/tenant.aggregate";
import { PlanCode } from "src/domain/plans/value-objects/plan-code.vo";
import { TenantBranding } from "src/domain/tenants/value-objects/tenant-branding.vo";
import { TenantDomain } from "src/domain/tenants/value-objects/tenant-domain.vo";
import { TenantSetting } from "src/domain/tenants/value-objects/tenant-setting.vo";
import { TenantSlug } from "src/domain/tenants/value-objects/tenant-slug.vo";
import { TenantOrm } from "../orms/tenant.orm";

@Injectable()
export class TenantAdapter {
  toDomain(orm: TenantOrm): Tenant {
    return Tenant.reconstitute({
      uuid: orm.uuid as UUID,
      planCode: new PlanCode(orm.planCode),
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
      createdAt: domain.getCreatedAt(),
      updatedAt: domain.getUpdatedAt(),
    });
  }
}
