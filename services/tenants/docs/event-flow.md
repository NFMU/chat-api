# Event Flow — Domain Events, Integration Events, and the Outbox

> How state changes inside this service get reliably delivered to other services.

---

## TL;DR

Two distinct event types serve two distinct purposes:

| | **Domain Event** | **Integration Event** |
|---|---|---|
| Where defined | `src/domain/*/events/` | `src/applications/*/integration-events/` |
| Raised by | Aggregate roots, internally | Translators, from domain events |
| Audience | This service only (in-process) | Other services (message bus) |
| Lifetime | In-memory; lost on crash | Persisted in outbox; guaranteed delivery |
| Name shape | Domain language: `tenant.plan_changed` | Versioned contract: `tenant.plan_changed.v1` |
| Payload | Domain types (PlanCode, UUID) | Serializable primitives only |
| Failure handling | Best-effort fire-and-forget | Outbox + exponential backoff retry |

The **outbox pattern** guarantees that aggregate state changes and the corresponding integration events are committed atomically. A background worker then publishes outbox entries to the message bus, retrying on failure.

---

## The Flow

```
┌───────────────────────────────────────────────────────────────────────────┐
│                       Application Command Handler                         │
│                                                                           │
│   await uow.run(async () => {                                             │
│     await tenantRepo.create(tenant);          // 1. persist aggregate    │
│     domainEvents = await outbox.publishFrom(tenant);                      │
│                                               // 2. pull domain events   │
│                                               // 3. translate            │
│                                               // 4. insert into outbox   │
│   });                                          // ← single DB transaction │
│                                                                           │
│   for (e of domainEvents) eventBus.publish(e); // 5. in-process notify   │
└────────────────────────────────────┬──────────────────────────────────────┘
                                     │ DB commit
                                     ▼
                       ┌────────────────────────┐
                       │  outbox_events table   │
                       │  status = PENDING      │
                       │  next_attempt_at = now │
                       └───────────┬────────────┘
                                   │ polled every 2s
                                   ▼
                       ┌──────────────────────────────────────┐
                       │  OutboxWorker (background)           │
                       │  SELECT ... FOR UPDATE SKIP LOCKED   │
                       │  → publish via MessagePublisher      │
                       │  ├─ success → status = PUBLISHED     │
                       │  └─ failure → retry with backoff     │
                       │     30s → 60s → 2m → 4m → ... → 1h   │
                       │     after 10 retries → status=FAILED │
                       └────────────────┬─────────────────────┘
                                        ▼
                                ┌──────────────┐
                                │ Message Bus  │ → consumers
                                │ (Kafka/RMQ)  │
                                └──────────────┘
```

---

## Atomicity guarantee

The outbox pattern's whole point: **the aggregate state and the integration events are committed in the same transaction.** Either both land, or neither does.

This is achieved by the `UnitOfWork` service, which propagates a TypeORM `EntityManager` through `AsyncLocalStorage`. Any repository inside a `uow.run(...)` block reuses the active `EntityManager`, joining the same transaction.

```typescript
await this.uow.run(async () => {
  await this.tenantRepo.create(tenant);              // joins the transaction
  await this.outbox.publishFrom(tenant);             // joins the transaction
});
// If anything throws here, the transaction rolls back —
// no orphaned tenant rows, no orphaned outbox events.
```

If the process crashes between commit and the in-process `eventBus.publish()`, only in-process listeners (logging, metrics) miss the event. Cross-service delivery is unaffected because the integration event is already durably in the outbox.

---

## The translator layer

`DomainEvent` → `IntegrationEvent` is a deliberate translation step, not a 1:1 mapping. Reasons:

1. **Decoupling**: domain events use rich types (`PlanCode`, `UUID`). Integration events use primitives that serialize cleanly. Consumers should not depend on this service's domain model.
2. **Versioning**: integration event names carry a version suffix (`.v1`). When the contract changes, a new translator emits both `.v1` and `.v2` until consumers migrate.
3. **Fan-out**: one domain event can become multiple integration events. Example: `invitation.accepted` could fan out to `tenant.member_added.v1` (for RBAC) AND `notification.invitation_accepted.v1` (for the inviter's email).
4. **Filter**: not every domain event needs to leave the service. Some are purely internal (e.g., a metric event); the translator simply returns `[]`.

Translators implement `IDomainEventTranslator`:

```typescript
class TenantEventTranslator implements IDomainEventTranslator {
  supports(eventName: string): boolean { /* ... */ }
  translate(event: DomainEvent): IntegrationEvent[] { /* ... */ }
}
```

Register each translator in the `TRANSLATORS_TOKEN` factory inside `application-shared.provider.ts`. The `DomainEventTranslatorRegistry` dispatches each domain event to the first translator that `supports()` it.

---

## Retry strategy

Exponential backoff, base 30 seconds, capped at 1 hour:

| Retry # | Delay before next attempt |
|---|---|
| 0 (first failure) | 30 seconds |
| 1 | 60 seconds |
| 2 | 2 minutes |
| 3 | 4 minutes |
| 4 | 8 minutes |
| 5 | 16 minutes |
| 6 | 32 minutes |
| 7+ | 1 hour (capped) |
| 10 | → status `FAILED`, no further retries |

`FAILED` rows are not picked up by the worker — they surface for operator inspection (typically via a dashboard query on `WHERE status = 'failed'`).

---

## Concurrency

Multiple workers / multiple service instances can run in parallel. The repository's `fetchDueBatch()` uses:

```sql
SELECT ... FROM outbox_events
WHERE status = 'pending' AND next_attempt_at <= now()
ORDER BY next_attempt_at ASC
LIMIT $batchSize
FOR UPDATE SKIP LOCKED
```

`SKIP LOCKED` ensures concurrent workers do not contend on the same rows; each takes a different slice of the queue.

---

## Plugging in a real broker

The `MessagePublisher` interface is the seam:

```typescript
export interface IMessagePublisher {
  publish(record: OutboxEventRecord): Promise<void>;
}
```

`ConsoleMessagePublisher` is the default — it logs to stdout. Replace it in `infrastructure-provider.ts`:

```typescript
{
  provide: MessagePublisherToken,
  useClass: KafkaMessagePublisher,  // or RabbitMqMessagePublisher, etc.
}
```

Implementation requirements:
- `publish()` must resolve **only** when the broker has acknowledged the message.
- Throw on any failure so the worker records it and schedules a retry.
- Use `record.id` as the idempotency / dedupe key on the broker side if supported (it's stable across retries).

---

## Adding a new integration event

1. Create the integration event class in `applications/<context>/integration-events/`. Extend `IntegrationEvent`, set a versioned `eventName`, declare `aggregateType` and `aggregateId`, expose payload fields as constructor params.
2. Add a `case` to the relevant translator (or create a new translator for a new context).
3. If a new translator was created, register it in `TRANSLATORS_TOKEN` in `application-shared.provider.ts`.
4. No changes to handlers, outbox, or worker — the rest is automatic.

---

## What lives where

| Concern | Layer | Location |
|---|---|---|
| Domain events | Domain | `domain/<context>/events/` |
| Integration events | Application | `applications/<context>/integration-events/` |
| Translators | Application | `applications/<context>/translators/` |
| Translator registry | Application | `applications/_shared/events/domain-event-translator.registry.ts` |
| `OutboxPublisher` (translates + writes to outbox) | Application | `applications/_shared/outbox/outbox-publisher.service.ts` |
| `IOutboxRepository` interface | Application | `applications/_shared/outbox/outbox.repository.ts` |
| `OutboxRepository` implementation | Infrastructure | `infrastructure/repositories/outbox.repository.ts` |
| `OutboxEventOrm` | Infrastructure | `infrastructure/database/orms/outbox-event.orm.ts` |
| `UnitOfWork` | Infrastructure | `infrastructure/persistence/unit-of-work.ts` |
| `OutboxWorker` (background poller) | Infrastructure | `infrastructure/messaging/outbox-worker.service.ts` |
| `IMessagePublisher` + console impl | Infrastructure | `infrastructure/messaging/` |
