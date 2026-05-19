# Tenants Service — Design Review

> A layer-by-layer analysis of the current domain and infrastructure implementation. Each issue is classified, explained, and paired with a concrete recommendation.

---

## Table of Contents

1. [Aggregate Boundary Issues](#1-aggregate-boundary-issues)
2. [Domain Model Issues](#2-domain-model-issues)
3. [Domain Events Issues](#3-domain-events-issues)
4. [Missing Domain Services](#4-missing-domain-services)
5. [Application Layer Issues](#5-application-layer-issues)
6. [Infrastructure Layer Issues](#6-infrastructure-layer-issues)
7. [Naming & Consistency Issues](#7-naming--consistency-issues)
8. [Summary Table](#8-summary-table)

---

## 1. Aggregate Boundary Issues

### 1.1 `TenantSubscription` is Outside the `Tenant` Aggregate

**Severity:** High

**Problem:**  
`TenantSubscription` was created as a standalone entity with its own ORM and adapter, placed alongside the `Tenant` aggregate rather than inside it. This violates the DDD rule that an aggregate root must be the single entry point for all state changes within its consistency boundary.

The invariant **"a tenant can only have one ACTIVE subscription at a time"** spans both the `Tenant` state and its subscription records. Because they are separate aggregates today, that invariant cannot be enforced atomically — it requires external coordination in the application layer, which is fragile.

**Correct design:**  
`TenantSubscription` is an entity owned by the `Tenant` aggregate. The `Tenant` aggregate root holds:
- `_activeSubscription: TenantSubscription | null` — the current open subscription.
- `_subscriptionHistory: TenantSubscription[]` — closed (historical) subscriptions. This collection can be lazy-loaded since it is read-only once a subscription closes.

`changePlan()` then enforces the invariant internally:

```typescript
changePlan(planCode: PlanCode, planVersionId: number, direction: 'upgrade' | 'downgrade', reason?: string): void {
  this.assertNotDeleted();
  const now = new Date();

  // Close the current subscription within the aggregate boundary
  if (this._activeSubscription) {
    direction === 'upgrade'
      ? this._activeSubscription.upgrade(reason, now)
      : this._activeSubscription.downgrade(reason, now);
    this._subscriptionHistory.push(this._activeSubscription);
  }

  // Open a new subscription — still inside the aggregate
  const next = TenantSubscription.create(this.getId(), planCode, planVersionId, now);
  this._activeSubscription = next;
  this._planCode = planCode;
  this._currentPlanVersionId = planVersionId;
  this.touch();
  this.addEvent(new TenantPlanChangedEvent(this.getId(), previous, planCode, planVersionId));
}
```

The `tenant_subscriptions` DB table and the `TenantSubscriptionOrm` remain as infrastructure concerns, but the domain treats them as aggregate-owned entities.

---

### 1.2 `TenantMember` Has No Domain Representation

**Severity:** High

**Problem:**  
`TenantMemberOrm` exists in the database schema and is referenced from `TenantOrm`, but there is no `TenantMember` domain entity anywhere in the domain layer. Membership management (joining via invitation, leaving, being removed, being suspended) is a first-class domain concept with its own lifecycle and business rules.

Without a domain entity, the business rules for member state transitions live nowhere — they either end up scattered in application handlers or are completely absent.

**Recommendation:**  
Create a `TenantMember` entity inside the `Tenant` aggregate with its own state machine:

```
ACTIVE → LEFT      (member voluntarily leaves)
ACTIVE → REMOVED   (admin removes member)
ACTIVE → SUSPENDED (admin suspends member)
SUSPENDED → ACTIVE (suspension lifted)
```

The `Tenant` aggregate root should expose:
- `addMember(userId, roleCode, invitedBy?)` — called when an invitation is accepted
- `removeMember(userId)` — called by an admin
- `suspendMember(userId)` / `reinstateMember(userId)`

---

### 1.3 `Plan.nextVersion` Creates Cross-Entity Coupling

**Severity:** Medium

**Problem:**  
The `nextVersion` counter on the `Plan` entity was added to assign sequential version numbers to new `PlanVersion` entities. This creates an operational coupling: every time you create a new `PlanVersion`, you must also save the `Plan` in the same transaction to persist the incremented counter. If these two writes are not atomic, the counter drifts.

**Recommendation:**  
Remove `nextVersion` from the `Plan` entity. Determine the next version number from the repository:

```typescript
// PlanVersionRepository
findNextVersionFor(planCode: PlanCode): Promise<number>
// → SELECT COALESCE(MAX(version), 0) + 1 FROM plan_versions WHERE plan_code = $1
```

The `Plan` entity then has no awareness of versioning at all — it is purely a catalog record (name, description, status). This eliminates the transactional coupling and the spurious `Plan` save on every version creation.

---

## 2. Domain Model Issues

### 2.1 `Invitation.accept()` Mutates State Before Throwing

**Severity:** High

**Problem:**  
Inside `accept()`, when expiry is detected, the aggregate mutates `_status` to `EXPIRED`, appends a domain event, and *then* throws an exception:

```typescript
if (this.isExpired(now)) {
  this._status = InvitationStatus.EXPIRED;  // ← state mutation
  this.touch();
  this.addEvent(new InvitationExpiredEvent(...));  // ← event queued
  throw new BusinessException(...);           // ← caller catches and never saves
}
```

The exception causes the application handler to abort. The in-memory aggregate was mutated, but since the exception propagates before the `save()` call, the mutation and event are silently discarded. The database never records the `EXPIRED` transition. The next `accept()` call on the same invitation will hit the same code path again.

**Correct design:**  
`accept()` should only throw without mutating state when the invitation is expired. Expiry transition (`PENDING → EXPIRED`) should happen through a separate operation:

```typescript
accept(userId: UUID, now: Date = new Date()): void {
  if (this._status !== InvitationStatus.PENDING) {
    throw new BusinessException(StatusCode.BAD_REQUEST, TenantErrors.INVITATION_NOT_PENDING);
  }
  if (this.isExpired(now)) {
    // Do NOT mutate state here — just reject
    throw new BusinessException(StatusCode.BAD_REQUEST, TenantErrors.INVITATION_EXPIRED);
  }
  this._status = InvitationStatus.ACCEPTED;
  this._acceptedAt = now;
  this._acceptedByUserId = userId;
  this.touch();
  this.addEvent(new InvitationAcceptedEvent(...));
}
```

The application handler for `AcceptInvitation` should call `invitation.markExpired()` explicitly when it catches the expiry error and wants to persist that transition.

---

### 2.2 `PlanVersion` and `TenantSubscription` Entities Are Not Wired Into the ORM Layer

**Severity:** High

**Problem:**  
Both `PlanVersion` and `TenantSubscription` were designed in the domain layer during a recent refactor, but:
- `PlanVersionOrm` does not exist in `src/infrastructure/database/orms/`.
- `TenantSubscriptionOrm` does not exist.
- Neither has an adapter (`PlanVersionAdapter`, `TenantSubscriptionAdapter`).
- Neither has a repository implementation.
- The migration for the corresponding tables has not been written.

The domain entities are effectively floating — they cannot be persisted.

**Recommendation:**  
Complete the infrastructure layer for both entities (ORM, adapter, repository, migration) before any application-layer use cases that depend on them are implemented.

---

### 2.3 `Invitation` Carries Channel Scope but Has No Channel Validation

**Severity:** Medium

**Problem:**  
`Invitation` supports channel-scoped invitations (`roleScope: CHANNEL`, `channelId: number`). However, the Tenants service has no knowledge of whether a given `channelId` is valid or belongs to the correct tenant. The `Invitation` aggregate accepts any integer as `channelId` with no validation.

**Recommendation:**  
Channel existence must be validated at the application layer before creating the `Invitation`. The application handler for "send invitation" should call the Channels service (or read from a local read model) to confirm that `channelId` belongs to `tenantId`. The domain aggregate itself should not perform cross-service lookups.

---

## 3. Domain Events Issues

### 3.1 `InvitationAcceptedEvent` Is Missing Role Information

**Severity:** High

**Problem:**  
The RBAC service must provision a role for the accepting user. The event currently carries:

```
{ invitationId, tenantId, acceptedByUserId }
```

The RBAC service would need to query back to the Tenants service to find `roleCode` and `roleScope` — creating a synchronous dependency from the event consumer back to the producer, which defeats the purpose of event-driven decoupling.

**Recommendation:**  
Include all role-provisioning context in the event payload:

```
{ invitationId, tenantId, acceptedByUserId, roleCode, roleScope, channelId? }
```

---

### 3.2 `InvitationSentEvent` Is Missing Sender Context

**Severity:** Medium

**Problem:**  
The Notifications service needs to send an email on behalf of the inviter (e.g., "Alice invited you to join Acme Corp"). The current payload only carries:

```
{ invitationId, tenantId, email }
```

The sender identity (`invitedBy`) is stored on the `Invitation` aggregate but not included in the event.

**Recommendation:**  
Add `invitedBy` (and optionally `roleCode` for the email body) to `InvitationSentEvent`.

---

### 3.3 `TenantCreatedEvent` Should Include `planVersionId`

**Severity:** Medium

**Problem:**  
The Billing service needs to know which exact plan version the tenant started on to set up correct pricing. Currently the event only carries `planCode`, which maps to the plan catalog entry, not the specific version with its limits and pricing data.

**Recommendation:**  
Add `planVersionId: number` to `TenantCreatedEvent`.

---

### 3.4 `PlanVersionPublishedEvent` and `PlanVersionDeprecatedEvent` Do Not Exist

**Severity:** Medium

**Problem:**  
The Billing service maintains its own internal plan/pricing catalog. When a new plan version is published or deprecated, Billing needs to update accordingly. Without these events, Billing must be manually notified or poll for changes.

**Recommendation:**  
Emit `plan_version.published` from `PlanVersion.publish()` and `plan_version.deprecated` from `PlanVersion.deprecate()`. Both should carry `planCode`, `version`, `planVersionId`, and the relevant timestamp.

---

## 4. Missing Domain Services

Domain services encapsulate business logic that spans multiple aggregates or requires external data but does not naturally belong to a single aggregate. None currently exist in this service.

### 4.1 `InvitationDomainService` (Required)

**Responsibility:**  
Enforces the business rule "no duplicate PENDING invitation for the same (tenantId, email) pair" before a new invitation is created. This rule requires querying the invitation repository — a side effect that cannot live inside the aggregate's constructor.

```typescript
class InvitationDomainService {
  async assertNoDuplicatePendingInvitation(tenantId: UUID, email: Email): Promise<void>
}
```

---

### 4.2 `PlanSubscriptionService` (Required)

**Responsibility:**  
Coordinates the plan change workflow across `Tenant`, `TenantSubscription`, and `PlanVersion`. Specifically:
1. Loads the target plan and its latest published version.
2. Determines upgrade vs. downgrade direction.
3. Calls `tenant.changePlan()` with the full context.

This logic currently has no home — it would be duplicated in every application handler that changes a plan.

```typescript
class PlanSubscriptionService {
  async changeSubscription(
    tenant: Tenant,
    newPlanCode: PlanCode,
    reason?: string
  ): Promise<void>
}
```

---

### 4.3 `TenantSlugGeneratorService` (Required)

**Responsibility:**  
Generates a unique, URL-safe `TenantSlug` from a given tenant name. This requires querying the repository for slug collisions and applying a suffix strategy — it cannot live inside the aggregate.

```typescript
class TenantSlugGeneratorService {
  async generateUnique(baseName: string): Promise<TenantSlug>
  // Strategy: "acme-corp" → "acme-corp-2" → "acme-corp-3" on collision
}
```

---

## 5. Application Layer Issues

### 5.1 `CreateTenantHandler` Passes `currentPlanVersionId: null`

**Severity:** Critical

**Problem:**  
The only implemented use case handler contains:

```typescript
const tenant = Tenant.create({
  ...
  currentPlanVersionId: null, // ← explicitly null
});
```

This creates a tenant with no plan version reference, breaking the core premise of the versioning design. Any downstream feature that reads `currentPlanVersionId` will fail or return incorrect data.

**Fix:**  
The handler must:
1. Look up the plan by `planCode`. Throw if not found or not `ACTIVE`.
2. Look up the latest `PUBLISHED` version for that plan. Throw if none.
3. Pass the version's ID to `Tenant.create()`.

---

### 5.2 `CreateTenantHandler` Does Not Null-Guard Optional Fields

**Severity:** High

**Problem:**  
```typescript
domain: new TenantDomain(input.domain),      // input.domain can be null/undefined
slug: new TenantSlug(input.slug),            // input.slug is optional in the DTO
branding: new TenantBranding(input.branding), // input.branding is optional
settings: new TenantSetting(input.tenantSetting), // input.tenantSetting is optional
```

Passing `undefined` or `null` into value object constructors that expect strings will either throw with cryptic errors or silently store invalid state.

**Fix:**
- `domain`: pass `input.domain ? new TenantDomain(input.domain) : null`.
- `slug`: call `TenantSlugGeneratorService.generateUnique(input.name)` when `input.slug` is not provided.
- `branding` and `settings`: pass empty objects `{}` as defaults when not provided.

---

### 5.3 No Use Cases Beyond Create Tenant

**Severity:** High

**Problem:**  
The application layer has only one handler: `CreateTenantHandler`. The following use cases are missing entirely:

**Tenant use cases (no handlers):**
- Suspend / Activate tenant
- Change plan (upgrade / downgrade)
- Update tenant settings / branding / domain

**Plan use cases (no handlers):**
- Create plan
- Draft / Publish / Deprecate plan version

**Invitation use cases (no handlers):**
- Send invitation
- Accept invitation
- Revoke invitation

**Member use cases (no handlers):**
- Add member (triggered by invitation acceptance)
- Remove member
- Suspend / Reinstate member

**`PlansController`** is currently a set of empty stubs — none of its route methods dispatch commands.

---

### 5.4 No Query Side (Read Model)

**Severity:** Medium

**Problem:**  
The application layer contains only commands. There are no queries, query handlers, or read models. Controllers that need to return data (e.g., `GET /plans`, `GET /tenants/:id`) have no mechanism to do so.

**Recommendation:**  
Implement the read side using either:
- Direct repository reads (simple queries via TypeORM)
- A separate read model with denormalized projections (if high read performance is required)

---

## 6. Infrastructure Layer Issues

### 6.1 `TenantRepository` Is a Stub

**Severity:** Critical

**Problem:**  
```typescript
async create(tenant: Tenant): Promise<void> {
  console.log("Creating tenant:", tenant); // ← not connected to DB
}
```

The only repository implementation in the entire service does nothing but log. No data is persisted.

**Fix:**  
Implement the repository using TypeORM's `DataSource` or `Repository<TenantOrm>`, calling `TenantAdapter.toOrm()` and performing the actual insert.

---

### 6.2 No Repository Implementations Exist for Plan, PlanVersion, Invitation, or TenantMember

**Severity:** High

**Problem:**  
Domain repository interfaces (`IPlanRepository`, `IInvitationRepository`) exist but have no infrastructure implementations. They are also not registered in `InfrastructureProvider`.

---

### 6.3 `PlanVersionOrm` and `TenantSubscriptionOrm` Are Not Created

**Severity:** High

**Problem:**  
These were designed in the domain layer but the corresponding ORM entities, adapters, and migration are missing. The `DatabaseModule` discovers entities via glob (`orms/**/*.orm.{ts,js}`), so they will not be picked up until the files exist.

---

### 6.4 `ITenantRepository` Interface Is Incomplete

**Severity:** High

**Problem:**  
```typescript
export interface ITenantRepository {
  create(tenant: Tenant): Promise<void>;
  // findById(id: string): Promise<Tenant | null>;   ← commented out
  // update(tenant: Tenant): Promise<void>;          ← commented out
  // delete(id: string): Promise<void>;              ← commented out
}
```

Most methods are commented out. Handlers that need to load, update, or delete tenants cannot do so through the repository contract.

**Fix:**  
Uncomment and implement: `findById`, `update`, `findBySlug`, and `findByDomain`.

---

### 6.5 `InvitationOrm` Has a Field Name Mismatch

**Severity:** Low

**Problem:**  
The ORM column is named `expiresAt` (matching the database column `expires_at`), but the domain property is named `expiredAt`. The adapter bridges them correctly, but the inconsistency creates confusion when reading either layer.

**Fix:**  
Standardize on one name. Since "the invitation expires at [time]" is grammatically natural, prefer `expiresAt` in both the domain and the ORM. Update `InvitationProps`, the domain getter, and the adapter accordingly.

---

## 7. Naming & Consistency Issues

| Location | Issue | Recommendation |
|---|---|---|
| `application-provider.ts` | `ApplicatinonProvider` — typo | Rename to `ApplicationProvider` |
| `Invitation` domain | `expiredAt` | Rename to `expiresAt` for consistency with the ORM and plain English |
| `CreateTenantInput` | `tenantSetting` (singular) | Rename to `tenantSettings` (plural, matches `TenantSettingsJson`) |
| `CreateTenantInputSchema` | Uses `z.uuid()` but `CreateTenantInput` class uses `UUID` type without runtime validation | Either trust Zod schema as the runtime guard (and simplify the class type to `string`) or keep both in sync |
| `plans/entities/` | `plan.entity.ts` and `plan-version.entity.ts` are in the same folder | Consistent — no change needed |
| `tenants/entities/` | `tenant-subscription.entity.ts` lives outside the `Tenant` aggregate folder | Once `TenantSubscription` is brought inside the aggregate, this file should move to `tenants/aggregates/` or become an inner class |

---

## 8. Summary Table

| # | Issue | Severity | Layer |
|---|---|---|---|
| 1.1 | `TenantSubscription` outside `Tenant` aggregate | High | Domain |
| 1.2 | `TenantMember` has no domain model | High | Domain |
| 1.3 | `Plan.nextVersion` creates transactional coupling | Medium | Domain |
| 2.1 | `Invitation.accept()` mutates state before throwing | High | Domain |
| 2.2 | `PlanVersion` and `TenantSubscription` not wired to ORM | High | Infrastructure |
| 2.3 | Channel scope in Invitation not validated | Medium | Domain |
| 3.1 | `InvitationAcceptedEvent` missing role info | High | Domain Events |
| 3.2 | `InvitationSentEvent` missing sender context | Medium | Domain Events |
| 3.3 | `TenantCreatedEvent` missing `planVersionId` | Medium | Domain Events |
| 3.4 | `PlanVersionPublishedEvent` / `DeprecatedEvent` missing | Medium | Domain Events |
| 4.1 | `InvitationDomainService` missing | Medium | Domain Services |
| 4.2 | `PlanSubscriptionService` missing | Medium | Domain Services |
| 4.3 | `TenantSlugGeneratorService` missing | Medium | Domain Services |
| 5.1 | `CreateTenantHandler` passes `currentPlanVersionId: null` | Critical | Application |
| 5.2 | Handler does not null-guard optional DTO fields | High | Application |
| 5.3 | No use cases beyond Create Tenant | High | Application |
| 5.4 | No query side (read model) | Medium | Application |
| 6.1 | `TenantRepository.create()` is a stub | Critical | Infrastructure |
| 6.2 | No repository implementations for Plan, Invitation, etc. | High | Infrastructure |
| 6.3 | `PlanVersionOrm` and `TenantSubscriptionOrm` missing | High | Infrastructure |
| 6.4 | `ITenantRepository` interface mostly commented out | High | Infrastructure |
| 6.5 | `InvitationOrm.expiresAt` vs domain `expiredAt` mismatch | Low | Infrastructure |
| 7.x | Various naming inconsistencies | Low | All layers |
