# System Architecture
_Last synced: 2026-05-26_

## Services

| Service | Responsibility | Aggregates Owned | Architecture Style |
|---------|---------------|-----------------|-------------------|
| **tenants** | Multi-tenancy lifecycle — tenant provisioning, plan management, subscriptions, member invitations | `Tenant`, `Plan`, `Invitation` | DDD + CQRS + Transactional Outbox |
| **identity** | User authentication, sessions, email verification, password management | `User` (ORM entity) | Layered (Service + Repository) |

---

## Inter-Service Contracts

### Integration Events (Outbox — published by `tenants`)

| Event | Trigger | Payload | Known Consumers |
|-------|---------|---------|----------------|
| `tenant.provisioned.v1` | New tenant created | `tenantId`, `ownerUserId`, `planCode`, `planVersionId`, `slug` | Billing, RBAC, Channels, Messaging |
| `tenant.activated.v1` | Tenant status → ACTIVE | `tenantId` | Channels, Messaging, Billing |
| `tenant.plan_changed.v1` | Plan subscription upgraded/downgraded | `tenantId`, `previousPlanCode`, `newPlanCode`, `newPlanVersionId` | Billing, Channels, Messaging |
| `tenant.suspended.v1` | Tenant suspended | `tenantId`, `reason?` | Channels, Messaging, Billing |

> The `identity` service does not currently publish integration events. Cross-service user identity is referenced by `ownerUserId` (UUID) passed in tenant creation payloads.

---

## Shared Libraries

| Library | Entry Points | Provides |
|---------|-------------|---------|
| `@xlr8-nest/core/ddd` | `@xlr8-nest/core/ddd` | `AggregateRoot`, `Entity`, `ValueObject`, `DomainEvent`, `CommandBus`, `QueryBus`, `EventBus`, `CqrsModule`, `EventModule`, `ICommandHandler` |
| `@xlr8-nest/core/constants` | `@xlr8-nest/core/constants` | `StatusCode`, `CommonErrors` |
| `@xlr8-nest/core/types` | `@xlr8-nest/core/types` | `ErrorType`, response envelope types, shared identity types |
| `@xlr8-nest/core/openapi` / `@xlr8-nest/core/validator` / `@xlr8-nest/core/response` | explicit feature subpaths | OpenAPI decorators, Zod validation decorators, response builders |
| `@xlr8-nest/core/database` | `@xlr8-nest/core/database` | `DatabaseExtensionModule`, `IUnitOfWork`, `IUnitOfWorkToken`, `TypeOrmClient` |
| `@xlr8-nest/core/messaging` | `@xlr8-nest/core/messaging` | `IntegrationEvent`, `IDomainEventTranslator`, `DomainEventTranslatorRegistry`, `OutboxPublisher`, `MessagingModule`, `OutboxWorkerService` |

> `@xlr8-nest/core` root imports are no longer used for feature symbols. Import feature modules from their explicit entry point so optional peer dependencies stay isolated.

---

## System-Wide Patterns

### Domain-Driven Design (DDD)
- **Aggregates** enforce all invariants internally; external code only calls aggregate methods.
- **Value Objects** are immutable and self-validating on construction — invalid state is never created.
- **Domain Events** are raised inside aggregates via `addEvent()` and drained by handlers via `pullEvents()`.
- **Domain Services** coordinate cross-aggregate logic (e.g. `PlanSubscriptionService`, `InvitationDomainService`) with no direct coupling to infrastructure.

### CQRS
- Commands and queries are dispatched via `CommandBus` / `QueryBus` from `@xlr8-nest/core/ddd`.
- Handlers are auto-discovered via `@CommandHandler` / `@QueryHandler` decorators.
- `EventBus` dispatches `DomainEvent`s in-process; sagas can subscribe and emit commands reactively.

### Transactional Outbox
- Integration events are written to the `outbox` table **inside the same database transaction** as the aggregate write — atomicity is guaranteed.
- `OutboxWorkerService` (from `@xlr8-nest/core/messaging`) polls the outbox and forwards events to the message broker.
- `OutboxPublisher.publishEvents(domainEvents)` translates `DomainEvent[]` → `IntegrationEvent[]` via registered `IDomainEventTranslator` implementations.

### Layer Provider Registry
Each service registers providers in three separate arrays composed in `AppModule`:

| Array | Contents |
|-------|---------|
| `DomainProvider` | Domain services only (no infrastructure deps) |
| `ApplicationProvider` | Command/query handlers only |
| `InfrastructureProvider` | Repository implementations + external adapters |

### Event Dispatch Convention
Inside every `uow.transaction()` callback:
```typescript
const domainEvents = aggregate.pullEvents();          // 1. drain aggregate
await this.eventBus.publishAll(domainEvents);          // 2. domain events first (in-process)
await this.outbox.publishEvents(domainEvents);         // 3. integration events second (to outbox)
```
**Rationale**: Domain events represent what happened inside the domain (internal). Integration events are the external consequence. Both commit atomically with the aggregate write; ordering ensures in-process subscribers see events before the transaction closes.

### Unit of Work
- `IUnitOfWork.transaction(callback)` propagates a shared `EntityManager` (via `AsyncLocalStorage`) to all repositories inside the callback.
- Repositories use `TypeOrmClient` to resolve the ambient `EntityManager` — no explicit passing required.

---

## Database

| Service | DB | ORM | Notes |
|---------|-----|-----|-------|
| tenants | PostgreSQL | TypeORM | Auto-run migrations + seeders (non-prod) configurable via env |
| identity | PostgreSQL | TypeORM | Soft deletes on `users` table |

---

## Per-Service Context Files

- [Tenants Service](services/tenants/CONTEXT.md)
- [Identity Service](services/identity/CONTEXT.md)
