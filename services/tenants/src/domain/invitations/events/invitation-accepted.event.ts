import { DomainEvent } from "@xlr8-nest/core/ddd";
import { UUID } from "crypto";

export class InvitationAcceptedEvent implements DomainEvent {
  readonly eventName = "invitation.accepted";
  readonly occurredOn: Date;

  constructor(
    public readonly invitationId: UUID,
    public readonly tenantId: UUID,
    public readonly acceptedByUserId: UUID
  ) {
    this.occurredOn = new Date();
  }
}
