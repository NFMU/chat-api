# Tenants Service Context
_Last synced: 2026-05-26_

## Responsibility
Owns the multi-tenancy lifecycle: provisioning tenants, managing billing plans and their versioned feature sets, tracking plan subscriptions per tenant, and handling member invitation flows. All cross-service notifications about tenant state changes are published via the transactional outbox.

---

## Domain Model

### Aggregates

| Aggregate | Identity Type | Owns | Key Invariants |
|-----------|-------------|------|----------------|
| `Tenant` | `UUID` | `TenantSubscription[]`, `TenantMember[]` | One ACTIVE subscription at all times; status-aware mutations (can't rename a DELETED tenant) |
| `Plan` | `PlanCode` (string PK) | `PlanVersion[]` | Only ACTIVE plans can receive new versions; versions are immutable once PUBLISHED |
| `Invitation` | `UUID` | — (leaf aggregate) | Only PENDING invitations can be accepted; expiry check before accept; one PENDING per (tenant, email) |

### Tenant Aggregate — Factory Methods & Business Methods
```
Tenant.create(props)         → raises TenantCreatedEvent
Tenant.reconstitute(props)   → no events (load from DB)
tenant.rename(name)
tenant.rebrand(branding)
tenant.updateSettings(settings)
tenant.changeDomain(domain)
tenant.changePlan(planCode, planVersionId)   → raises TenantPlanChangedEvent
tenant.activate()            → raises TenantActivatedEvent
tenant.suspend(reason?)      → raises TenantSuspendedEvent
tenant.pullSubscriptionChanges()  → drains subscription entity changes for repo to persist
```

### Plan Aggregate — Factory Methods & Business Methods
```
Plan.create(props)           → raises no event directly (PlanCreationService handles version)
Plan.reconstitute(props)
plan.draftNewVersion(limit, features)
plan.publishVersion(versionId, now)   → raises PlanVersionPublishedEvent
plan.deprecateVersion(versionId, now) → raises PlanVersionDeprecatedEvent
plan.getLatestPublishedVersion()      → PlanVersion | null
plan.isAvailable()                    → status === ACTIVE
```

### Invitation Aggregate — Factory Methods & Business Methods
```
Invitation.create(props)     → raises InvitationSentEvent
invitation.accept(userId, now)    → raises InvitationAcceptedEvent
invitation.revoke()          → raises InvitationRevokedEvent
invitation.markExpired()     → raises InvitationExpiredEvent
invitation.isExpired(now)    → boolean (no mutation)
```

### Value Objects

| Name | Location | Validates |
|------|---------|-----------|
| `TenantSlug` | `domain/tenants/value-objects/` | `/^[a-z0-9](?:[a-z0-9-]{1,98}[a-z0-9])?$/`, 3–100 chars, lowercased |
| `TenantDomain` | `domain/tenants/value-objects/` | Valid FQDN regex, lowercased |
| `TenantBranding` | `domain/tenants/value-objects/` | `logoUrl` URL, `color` hex, `theme` enum; defaults: `#1a73e8` / `"light"` |
| `TenantSetting` | `domain/tenants/value-objects/` | `messageRetentionDays` int≥0\|null, booleans, `ssoProvider` non-empty string\|null |
| `PlanCode` | `domain/plans/value-objects/` | `/^PLAN-[A-Z0-9]+$/`; factory `PlanCode.generate(suffix)` |
| `PlanLimit` | `domain/plans/value-objects/` | ints\|null for members/channels, decimal string\|null for storage; `PlanLimit.unlimited()` |
| `PlanFeatures` | `domain/plans/value-objects/` | `guestAccess`, `customBranding`, `sso`, `auditLog` — all boolean, default false |
| `Email` | `domain/invitations/value-objects/` | `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`, ≤254 chars, lowercased |
| `InvitationToken` | `domain/invitations/value-objects/` | `/^[A-Za-z0-9_-]{32,128}$/` (base64url) |

### Domain Services

| Service | Responsibility |
|---------|---------------|
| `PlanCreationService` | Creates a `Plan` (ACTIVE status) and auto-drafts an initial `PlanVersion` in one call. Stateless — no repository dependencies. |
| `PlanSubscriptionService` | Resolves the latest published plan version and delegates `changePlan()` to the `Tenant` aggregate. Infers upgrade/downgrade direction from plan code comparison. |
| `TenantSlugGeneratorService` | Derives a URL slug from a tenant name and ensures uniqueness via `ITenantRepository.existsBySlug()` (appends suffix on collision). |
| `InvitationDomainService` | Enforces the one-PENDING-per-(tenant, email) invariant before creating a new invitation. |

---

## Application Layer

### Commands & Handlers

| Command | Handler | Key Steps |
|---------|---------|-----------|
| `CreateTenantCommand` | `CreateTenantHandler` | 1. Load plan + validate availability → 2. Get latest published version → 3. Generate/validate slug → 4. Build VOs → 5. `Tenant.create()` → 6. `uow.transaction`: save tenant + subscriptions, `eventBus.publishAll`, `outbox.publishEvents` |
| `CreatePlanCommand` | `CreatePlanHandler` | 1. Build VOs (PlanCode, PlanLimit, PlanFeatures) → 2. Uniqueness guard via `planRepo.findByCode` → 3. `planCreationService.createPlan()` → 4. `uow.transaction`: save plan, `eventBus.publishAll`, `outbox.publishEvents` |

### Input DTOs (Zod Schemas)

| DTO | Required Fields | Notable Validation |
|-----|----------------|-------------------|
| `CreateTenantInput` | `planCode`, `ownerUserId` (UUID), `name`, `timezoneId`, `languageId` | `slug` optional; `domain`, `branding`, `tenantSetting` optional |
| `CreatePlanInput` | `code` (`PLAN-*` format), `name`, `description` | `code` regex `/^PLAN-[A-Z0-9]+$/`; `limit.maxStorageGb` as decimal string |

---

## Integration Events (Outbox)

Translated by `TenantEventTranslator` (`DomainEvent → IntegrationEvent`):

| Domain Event | Integration Event | Key Payload Fields | Consumers |
|-------------|------------------|-------------------|-----------|
| `TenantCreatedEvent` | `tenant.provisioned.v1` | `tenantId`, `ownerUserId`, `planCode`, `planVersionId`, `slug` | Billing, RBAC, Channels, Messaging |
| `TenantActivatedEvent` | `tenant.activated.v1` | `tenantId` | Channels, Messaging, Billing |
| `TenantSuspendedEvent` | `tenant.suspended.v1` | `tenantId`, `reason?` | Channels, Messaging, Billing |
| `TenantPlanChangedEvent` | `tenant.plan_changed.v1` | `tenantId`, `previousPlanCode`, `newPlanCode`, `newPlanVersionId` | Billing, Channels, Messaging |

> `PlanVersionPublishedEvent` and `PlanVersionDeprecatedEvent` are raised but have no registered translator — they are internal domain events only (not yet published cross-service).

---

## Infrastructure

| Concern | Technology | Notes |
|---------|-----------|-------|
| Database | PostgreSQL via TypeORM | `DatabaseExtensionModule` from `@xlr8-nest/core/database` |
| Unit of Work | `AsyncLocalStorage` + `EntityManager` | `IUnitOfWork.transaction()` propagates context to all repos |
| ORM entities | TypeORM decorators | Tables: `tenants`, `tenant_subscriptions`, `plans`, `plan_versions` |
| Adapters | `TenantAdapter`, `PlanVersionAdapter` | Bidirectional mapping between domain aggregates/entities and ORM rows |
| Outbox | `outbox` table via `@xlr8-nest/core/messaging` | `OutboxWorkerService` polls and forwards to broker |
| Migrations | TypeORM migration runner | Auto-run if `AUTO_RUN_MIGRATIONS=true` |
| Seeders | TypeORM seeder runner | Auto-run if `AUTO_RUN_SEEDS=true` (non-prod guard) |

### Database Schema (Key Tables)

**`tenants`** — `uuid` PK, `slug` UNIQUE, `domain` UNIQUE (partial), `plan_code` FK, `current_plan_version_id` FK nullable, `status` enum, branding/settings columns denormalized, soft-delete `deleted_at`.

**`tenant_subscriptions`** — `id` UUID PK, `tenant_id` FK, `plan_code`, `plan_version_id` FK, `status` enum, `started_at`, `ended_at`, `reason`.

**`plans`** — `code` varchar(50) PK, `name`, `description`, `status` enum.

**`plan_versions`** — `id` auto-increment PK, UNIQUE (`plan_code`, `version`), limit columns (`max_members`, `max_channels`, `max_storage_gb` decimal 10,2), feature bool columns, `status` enum, `published_at`, `deprecated_at`.

### Repository Tokens

| Token | Implementation |
|-------|--------------|
| `TenantRepositoryToken` | `TenantRepository` |
| `PlanRepositoryToken` | `PlanRepository` (inferred — wired in `InfrastructureProvider`) |
| `IUnitOfWorkToken` | Provided by `DatabaseExtensionModule` |
| `OutboxRepositoryToken` | Provided by `MessagingModule` |

---

## API Surface

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/tenants` | Create a new tenant (validates with `CreateTenantInputSchema`) |
| `GET` | `/plans` | List plans (stub) |
| `GET` | `/plans/:id` | Get plan by id (stub) |
| `POST` | `/plans` | Create plan (stub) |
| `PATCH` | `/plans/:id` | Update plan (stub) |
| `DELETE` | `/plans/:id` | Deprecate plan (stub) |

---

## Key Architectural Decisions

- **`Plan` uses `PlanCode` as aggregate identity** (string PK) rather than UUID — plan codes are human-readable service-wide identifiers (e.g. `PLAN-PREMIUM`) and must be stable references for cross-service subscriptions.
- **`PlanVersion` is immutable after DRAFT** — limits and features are never changed once published, ensuring active tenant subscriptions always resolve to a consistent snapshot.
- **`TenantSubscription` is owned by `Tenant`** but persisted separately — the aggregate drains subscription changes via `pullSubscriptionChanges()` which the repository persists atomically alongside the tenant row.
- **`Invitation` expiry is a two-step operation** — `isExpired(now)` checks without mutating; `markExpired()` persists the state change. This prevents the aggregate from silently transitioning state during a read-only check.
- **`OutboxPublisher` has single responsibility** — it only translates `DomainEvent[]` → `IntegrationEvent[]` and writes to the outbox. It has no knowledge of `EventBus`. Handlers own the full three-step dispatch sequence.
- **Domain events dispatch before integration events** inside `uow.transaction()` — in-process subscribers see the event before the transaction closes; the outbox write is the external consequence.
