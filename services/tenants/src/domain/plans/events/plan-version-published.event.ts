import { DomainEvent } from "@xlr8-nest/core/ddd";

export class PlanVersionPublishedEvent implements DomainEvent {
  readonly eventName = "plan_version.published";
  readonly occurredOn: Date;

  constructor(
    public readonly planVersionId: number,
    public readonly planCode: string,
    public readonly version: number,
    public readonly publishedAt: Date
  ) {
    this.occurredOn = new Date();
  }
}
