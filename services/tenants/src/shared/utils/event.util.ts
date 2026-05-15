import { AggregateRoot, EventBus } from "@xlr8-nest/core/ddd";

export const pushDomainEvents = (eventBus: EventBus, agg: AggregateRoot<any>) => {
  const events = agg.pullEvents();
  events.forEach((event) => eventBus.publish(event));
};