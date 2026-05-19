import { Injectable } from "@nestjs/common";
import { UUID } from "crypto";
import { TenantSubscription } from "src/domain/tenants/entities/tenant-subscription.entity";
import { PlanCode } from "src/domain/plans/value-objects/plan-code.vo";
import { TenantSubscriptionOrm } from "../orms/tenant-subscription.orm";

@Injectable()
export class TenantSubscriptionAdapter {
  toDomain(orm: TenantSubscriptionOrm): TenantSubscription {
    return TenantSubscription.reconstitute({
      id: orm.id as UUID,
      tenantId: orm.tenantId as UUID,
      planCode: new PlanCode(orm.planCode),
      planVersionId: orm.planVersionId,
      status: orm.status,
      startedAt: orm.startedAt,
      endedAt: orm.endedAt ?? null,
      reason: orm.reason ?? null,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  toOrm(domain: TenantSubscription): TenantSubscriptionOrm {
    return new TenantSubscriptionOrm({
      id: domain.getId() as UUID,
      tenantId: domain.getTenantId(),
      planCode: domain.getPlanCode().value,
      planVersionId: domain.getPlanVersionId(),
      status: domain.getStatus(),
      startedAt: domain.getStartedAt(),
      endedAt: domain.getEndedAt(),
      reason: domain.getReason(),
    });
  }
}
