import { Injectable } from "@nestjs/common";
import { Plan } from "src/domain/plans/entities/plan.entity";
import { PlanCode } from "src/domain/plans/value-objects/plan-code.vo";
import { PlanFeatures } from "src/domain/plans/value-objects/plan-features.vo";
import { PlanOrm } from "../orms/plan.orm";

@Injectable()
export class PlanAdapter {
  toDomain(orm: PlanOrm): Plan {
    return Plan.reconstitute({
      code: new PlanCode(orm.code),
      name: orm.name,
      description: orm.description ?? "",
      features: new PlanFeatures(orm.featuresJson),
      status: orm.status,
      limits: {
        maxMembers: orm.maxMembers ?? null,
        maxChannels: orm.maxChannels ?? null,
        maxStorageGb: orm.maxStorageGb ?? null,
      },
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  toOrm(domain: Plan): PlanOrm {
    return new PlanOrm({
      code: domain.code.value,
      name: domain.getName(),
      description: domain.getDescription(),
      featuresJson: {
        guestAccess: domain.getFeatures().guestAccess,
        customBranding: domain.getFeatures().customBranding,
        sso: domain.getFeatures().sso,
        auditLog: domain.getFeatures().auditLog,
      },
      status: domain.getStatus(),
      maxMembers: domain.getMaxMembers(),
      maxChannels: domain.getMaxChannels(),
      maxStorageGb: domain.getMaxStorageGb(),
      createdAt: domain.getCreatedAt(),
      updatedAt: domain.getUpdatedAt(),
    });
  }
}
