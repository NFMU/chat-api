import { UUID } from "crypto";
import { IntegrationEvent } from "@xlr8-nest/core/messaging";

/**
 * Emitted when a tenant transitions to SUSPENDED.
 * Consumers: Channels (block tenant channels), Messaging (reject delivery),
 * Billing (note suspension).
 */
export class TenantSuspendedIntegrationEvent extends IntegrationEvent {
  readonly eventName = "tenant.suspended.v1";
  readonly aggregateType = "tenant";
  readonly aggregateId: string;

  constructor(
    public readonly tenantId: UUID,
    public readonly reason?: string
  ) {
    super();
    this.aggregateId = tenantId;
  }
}
