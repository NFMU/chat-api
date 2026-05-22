import { UUID } from "crypto";
import { IntegrationEvent } from "@xlr8-nest/core/messaging";

/**
 * Emitted when a SUSPENDED tenant is re-activated.
 * Consumers: Channels (restore channels), Messaging (resume delivery),
 * Billing (resume cycle).
 */
export class TenantActivatedIntegrationEvent extends IntegrationEvent {
  readonly eventName = "tenant.activated.v1";
  readonly aggregateType = "tenant";
  readonly aggregateId: string;

  constructor(public readonly tenantId: UUID) {
    super();
    this.aggregateId = tenantId;
  }
}
