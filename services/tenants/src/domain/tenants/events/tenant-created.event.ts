import { DomainEvent } from "@xlr8-nest/core/ddd";
import { UUID } from "crypto";
import { PlanCode } from "src/domain/plans/value-objects/plan-code.vo";

export class TenantCreatedEvent implements DomainEvent {
  readonly eventName = "tenant.created";
  readonly occurredOn: Date;

  constructor(
    public readonly tenantId: UUID,
    public readonly ownerUserId: UUID,
    public readonly planCode: PlanCode,
    public readonly planVersionId: number,
    public readonly slug: string
  ) {
    this.occurredOn = new Date();
  }
}
