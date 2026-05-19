import { Injectable } from "@nestjs/common";
import { PlanVersion } from "src/domain/plans/entities/plan-version.entity";
import { PlanCode } from "src/domain/plans/value-objects/plan-code.vo";
import { PlanFeatures } from "src/domain/plans/value-objects/plan-features.vo";
import { PlanVersionOrm } from "../orms/plan-version.orm";

@Injectable()
export class PlanVersionAdapter {
  toDomain(orm: PlanVersionOrm): PlanVersion {
    return PlanVersion.reconstitute({
      id: orm.id,
      planCode: new PlanCode(orm.planCode),
      version: orm.version,
      limits: {
        maxMembers: orm.maxMembers ?? null,
        maxChannels: orm.maxChannels ?? null,
        maxStorageGb: orm.maxStorageGb ?? null,
      },
      features: new PlanFeatures(orm.featuresJson),
      status: orm.status,
      publishedAt: orm.publishedAt ?? null,
      deprecatedAt: orm.deprecatedAt ?? null,
      createdAt: orm.createdAt,
    });
  }

  toOrm(domain: PlanVersion): PlanVersionOrm {
    const id = domain.getId();
    return new PlanVersionOrm({
      // id = 0 means not yet persisted; omit so the DB auto-assigns the PK.
      ...(id !== 0 && { id }),
      planCode: domain.getPlanCode().value,
      version: domain.getVersion(),
      maxMembers: domain.getMaxMembers(),
      maxChannels: domain.getMaxChannels(),
      maxStorageGb: domain.getMaxStorageGb(),
      featuresJson: {
        guestAccess: domain.getFeatures().guestAccess,
        customBranding: domain.getFeatures().customBranding,
        sso: domain.getFeatures().sso,
        auditLog: domain.getFeatures().auditLog,
      },
      status: domain.getStatus(),
      publishedAt: domain.getPublishedAt(),
      deprecatedAt: domain.getDeprecatedAt(),
    });
  }
}
