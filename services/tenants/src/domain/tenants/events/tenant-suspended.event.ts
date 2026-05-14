import { DomainEvent } from "@xlr8-nest/core/ddd";
import { UUID } from "crypto";

export class TenantSuspendedEvent implements DomainEvent {
  readonly eventName = "tenant.suspended";
  readonly occurredOn: Date;

  constructor(
    public readonly tenantId: UUID,
    public readonly reason?: string
  ) {
    this.occurredOn = new Date();
  }
}
