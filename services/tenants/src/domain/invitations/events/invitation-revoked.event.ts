import { DomainEvent } from "@xlr8-nest/core/ddd";
import { UUID } from "crypto";

export class InvitationRevokedEvent implements DomainEvent {
  readonly eventName = "invitation.revoked";
  readonly occurredOn: Date;

  constructor(
    public readonly invitationId: UUID,
    public readonly tenantId: number
  ) {
    this.occurredOn = new Date();
  }
}
