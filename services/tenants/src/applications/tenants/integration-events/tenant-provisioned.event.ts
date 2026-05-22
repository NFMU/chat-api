import { UUID } from "crypto";
import { IntegrationEvent } from "@xlr8-nest/core/messaging";

/**
 * Emitted after a tenant has been created and its initial subscription opened.
 * Consumers: Billing (create customer), RBAC (seed default roles),
 * Channels (create default channels), Messaging (initialize config).
 */
export class TenantProvisionedIntegrationEvent extends IntegrationEvent {
  readonly eventName = "tenant.provisioned.v1";
  readonly aggregateType = "tenant";
  readonly aggregateId: string;

  constructor(
    public readonly tenantId: UUID,
    public readonly ownerUserId: UUID,
    public readonly planCode: string,
    public readonly planVersionId: number,
    public readonly slug: string
  ) {
    super();
    this.aggregateId = tenantId;
  }
}
