import { DomainEvent, Event } from "@xlr8-nest/core";

@Event()
export class EmailVerificationRequestedEvent implements DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly displayName: string,
    public readonly token: string,
  ) {
    this.eventName = "EmailVerificationRequestedEvent";
    this.occurredOn = new Date();
  }

  eventName: string;
  occurredOn: Date;
}

