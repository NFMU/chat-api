import { DomainEvent } from "@xlr8-nest/core/ddd";
import { UUID } from "crypto";

export class InvitationSentEvent implements DomainEvent {
  readonly eventName = "invitation.sent";
  readonly occurredOn: Date;

  constructor(
    public readonly invitationId: UUID,
    public readonly tenantId: UUID,
    public readonly email: string
  ) {
    this.occurredOn = new Date();
  }
}
