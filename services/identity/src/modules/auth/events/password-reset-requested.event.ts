import { DomainEvent, Event } from "@xlr8-nest/core/ddd";

@Event()
export class PasswordResetRequestedEvent implements DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly displayName: string,
    public readonly token: string,
  ) {
    this.eventName = "PasswordResetRequestedEvent";
    this.occurredOn = new Date();
  }

  eventName: string;
  occurredOn: Date;
}
