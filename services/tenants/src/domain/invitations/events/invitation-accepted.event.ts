import { DomainEvent } from "@xlr8-nest/core/ddd";
import { UUID } from "crypto";
import { InvitationRoleScope } from "src/shared/enums";

export class InvitationAcceptedEvent implements DomainEvent {
  readonly eventName = "invitation.accepted";
  readonly occurredOn: Date;

  constructor(
    public readonly invitationId: UUID,
    public readonly tenantId: UUID,
    public readonly acceptedByUserId: UUID,
    public readonly roleCode: string,
    public readonly roleScope: InvitationRoleScope,
    public readonly channelId?: number
  ) {
    this.occurredOn = new Date();
  }
}
