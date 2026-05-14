import { DomainEvent } from "@xlr8-nest/core/ddd";
import { UUID } from "crypto";

export class TenantActivatedEvent implements DomainEvent {
  readonly eventName = "tenant.activated";
  readonly occurredOn: Date;

  constructor(public readonly tenantId: UUID) {
    this.occurredOn = new Date();
  }
}
