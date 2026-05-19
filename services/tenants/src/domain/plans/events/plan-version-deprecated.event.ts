import { DomainEvent } from "@xlr8-nest/core/ddd";

export class PlanVersionDeprecatedEvent implements DomainEvent {
  readonly eventName = "plan_version.deprecated";
  readonly occurredOn: Date;

  constructor(
    public readonly planVersionId: number,
    public readonly planCode: string,
    public readonly version: number,
    public readonly deprecatedAt: Date
  ) {
    this.occurredOn = new Date();
  }
}
