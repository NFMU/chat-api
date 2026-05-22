import { Injectable } from "@nestjs/common";
import { PlanVersion } from "src/domain/plans/entities/plan-version.entity";
import { PlanCode } from "src/domain/plans/value-objects/plan-code.vo";
import { PlanFeatures } from "src/domain/plans/value-objects/plan-features.vo";
import { PlanLimit } from "src/domain/plans/value-objects/plan-limit.vo";
import { PlanVersionOrm } from "../orms/plan-version.orm";

@Injectable()
export class PlanVersionAdapter {
  toDomain(orm: PlanVersionOrm): PlanVersion {
    return PlanVersion.reconstitute({
      id: orm.id,
      planCode: new PlanCode(orm.planCode),
      version: orm.version,
      limit: new PlanLimit({
        maxMembers: orm.maxMembers ?? null,
        maxChannels: orm.maxChannels ?? null,
        maxStorageGb: orm.maxStorageGb ?? null,
      }),
      features: new PlanFeatures({
        guestAccess: orm.featureGuestAccess,
        customBranding: orm.featureCustomBranding,
        sso: orm.featureSso,
        auditLog: orm.featureAuditLog,
      }),
      status: orm.status,
      publishedAt: orm.publishedAt ?? null,
      deprecatedAt: orm.deprecatedAt ?? null,
      createdAt: orm.createdAt,
    });
  }

  toOrm(domain: PlanVersion): PlanVersionOrm {
    const id = domain.getId();
    const limit = domain.getLimit();
    const features = domain.getFeatures();
    return new PlanVersionOrm({
      // id = 0 means not yet persisted; omit so the DB auto-assigns the PK.
      ...(id !== 0 && { id }),
      planCode: domain.getPlanCode().value,
      version: domain.getVersion(),
      maxMembers: limit.maxMembers,
      maxChannels: limit.maxChannels,
      maxStorageGb: limit.maxStorageGb,
      featureGuestAccess: features.guestAccess,
      featureCustomBranding: features.customBranding,
      featureSso: features.sso,
      featureAuditLog: features.auditLog,
      status: domain.getStatus(),
      publishedAt: domain.getPublishedAt(),
      deprecatedAt: domain.getDeprecatedAt(),
    });
  }
}
