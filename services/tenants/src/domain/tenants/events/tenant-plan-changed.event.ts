import { DomainEvent } from "@xlr8-nest/core/ddd";
import { UUID } from "crypto";
import { PlanCode } from "src/domain/plans/value-objects/plan-code.vo";

export class TenantPlanChangedEvent implements DomainEvent {
  readonly eventName = "tenant.plan_changed";
  readonly occurredOn: Date;

  constructor(
    public readonly tenantId: UUID,
    public readonly previousPlanCode: PlanCode,
    public readonly newPlanCode: PlanCode,
    public readonly newPlanVersionId: number
  ) {
    this.occurredOn = new Date();
  }
}
