import { DomainEvent, Event } from "@xlr8-nest/core";

@Event()
export class UserCreatedEvent implements DomainEvent{
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly displayName: string,
  ) {
    this.eventName = "UserCreatedEvent";
    this.occurredOn = new Date();
  }
  eventName: string;
  occurredOn: Date;
}