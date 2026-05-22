import { UUID } from "crypto";
import { IntegrationEvent } from "@xlr8-nest/core/messaging";

/**
 * Emitted when a tenant switches to a different plan version (upgrade or downgrade).
 * Consumers: Billing (proration / new charge schedule), Channels (apply new limits),
 * Messaging (apply new feature flags).
 */
export class TenantPlanChangedIntegrationEvent extends IntegrationEvent {
  readonly eventName = "tenant.plan_changed.v1";
  readonly aggregateType = "tenant";
  readonly aggregateId: string;

  constructor(
    public readonly tenantId: UUID,
    public readonly previousPlanCode: string,
    public readonly newPlanCode: string,
    public readonly newPlanVersionId: number
  ) {
    super();
    this.aggregateId = tenantId;
  }
}
