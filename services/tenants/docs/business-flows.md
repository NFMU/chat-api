# Tenants Service — Business Flows

> Describes every business operation in plain language: who triggers it, what the system does step by step, what rules must hold, and what events are published as a result.

---

## Table of Contents

1. [Bounded Context](#1-bounded-context)
2. [Create a New Tenant](#2-create-a-new-tenant)
3. [Suspend a Tenant](#3-suspend-a-tenant)
4. [Re-activate a Tenant](#4-re-activate-a-tenant)
5. [Change a Tenant's Plan](#5-change-a-tenants-plan)
6. [Create a New Plan Version (Draft)](#6-create-a-new-plan-version-draft)
7. [Publish a Plan Version](#7-publish-a-plan-version)
8. [Deprecate a Plan Version](#8-deprecate-a-plan-version)
9. [Send an Invitation](#9-send-an-invitation)
10. [Accept an Invitation](#10-accept-an-invitation)
11. [Revoke an Invitation](#11-revoke-an-invitation)
12. [Expire Stale Invitations (Scheduled)](#12-expire-stale-invitations-scheduled)
13. [Domain Events Reference](#13-domain-events-reference)

---

## 1. Bounded Context

The **Tenants** service is the authoritative source of truth for:

| Concept | Ownership |
|---|---|
| Tenant identity and lifecycle | Full owner |
| Plan catalog and versioning | Full owner |
| Tenant subscription history | Full owner |
| Member roster (who belongs to which tenant) | Full owner |
| Invitation lifecycle | Full owner |

It does **not** own:

| Concept | Owned by |
|---|---|
| User authentication and profiles | Users / Auth service |
| Channel management | Channels service |
| Role assignments | RBAC service |
| Billing and payment | Billing service |
| Message delivery | Messaging service |
| Email notifications | Notifications service |

The Tenants service communicates with these via domain events. It does not make synchronous calls to them.

---

## 2. Create a New Tenant

**Trigger:** A user completes the onboarding signup, or an admin provisions a tenant via the management API.

### Pre-conditions

- The `planCode` must exist in the plans catalog and have `ACTIVE` status.
- A `PUBLISHED` plan version must exist for that plan.
- The `slug` must be globally unique across all tenants (generated from the name if not supplied).
- If a `domain` is provided, it must be globally unique across all tenants.
- The `ownerUserId` must refer to a verified user (validated by the caller, e.g., API gateway).

### Steps

1. Validate the incoming request (slug format, domain format, plan code format).
2. Look up the plan by `planCode`. Fail if not found or not `ACTIVE`.
3. Load the current `PUBLISHED` plan version for that plan. Fail if none exists.
4. Auto-generate a URL-safe `slug` from the tenant name if not provided; retry with a numeric suffix on collision.
5. Create the `Tenant` aggregate:
   - Status starts as `ACTIVE`.
   - `activatedAt` is set to the current timestamp.
   - `planCode` and `currentPlanVersionId` are stored on the aggregate.
6. Inside the `Tenant` aggregate, open the first `TenantSubscription` entity:
   - Status: `ACTIVE`, `startedAt` = now.
7. Persist the tenant and its initial subscription in a single transaction.
8. Publish `TenantCreatedEvent`.

### Post-conditions

- A tenant record exists with status `ACTIVE`.
- One active subscription record exists, pointing to the initial plan version.
- The domain event is dispatched for downstream consumers.

### Emitted Events

| Event | Consumers |
|---|---|
| `tenant.created` | Billing, RBAC, Channels, Messaging (see §13) |

---

## 3. Suspend a Tenant

**Trigger:** Billing service detects a payment failure after exhausting retry attempts, or an administrator manually suspends the tenant.

### Pre-conditions

- Tenant must be `ACTIVE`.
- Tenant must not be `DELETED`.

### Steps

1. Load tenant by ID.
2. Call `tenant.suspend(reason?)` on the aggregate.
   - Status transitions to `SUSPENDED`.
   - `suspendedAt` is recorded.
3. Persist the tenant.
4. Publish `TenantSuspendedEvent`.

### Business Rules

- Suspending an already-`SUSPENDED` tenant is a no-op (idempotent).
- A `DELETED` tenant cannot be suspended — raise an error.
- The tenant's existing `TenantSubscription` stays `ACTIVE`; suspension does not close the subscription (billing may still be tracking it).

### Emitted Events

| Event | Consumers |
|---|---|
| `tenant.suspended` | Channels (block messaging), Messaging (reject delivery), Billing (note suspension) |

---

## 4. Re-activate a Tenant

**Trigger:** Billing service confirms payment recovery, or an admin manually lifts the suspension.

### Pre-conditions

- Tenant must be `SUSPENDED`.
- Tenant must not be `DELETED`.

### Steps

1. Load tenant by ID.
2. Call `tenant.activate()` on the aggregate.
   - Status transitions to `ACTIVE`.
   - `activatedAt` is updated.
   - `suspendedAt` is cleared.
3. Persist the tenant.
4. Publish `TenantActivatedEvent`.

### Business Rules

- Activating an already-`ACTIVE` tenant throws an error (not idempotent — the caller should guard against this).
- A `DELETED` tenant cannot be re-activated.

### Emitted Events

| Event | Consumers |
|---|---|
| `tenant.activated` | Channels (restore channels), Messaging (resume delivery), Billing (resume cycle) |

---

## 5. Change a Tenant's Plan

**Trigger:** A tenant admin requests an upgrade or downgrade, or the Billing service triggers a forced downgrade.

### Pre-conditions

- Tenant must be `ACTIVE`.
- The new `planCode` must exist and be `ACTIVE`.
- A `PUBLISHED` plan version must exist for the new plan.
- The new plan version must differ from the tenant's current `currentPlanVersionId`.

### Steps

1. Load the tenant by ID.
2. Load the new plan by code. Fail if not found or not `ACTIVE`.
3. Load the current `PUBLISHED` plan version for the new plan.
4. Determine the direction: **upgrade** (moving to a higher tier) or **downgrade** (moving to a lower tier).
   - This determination is the caller's responsibility and is passed to the aggregate.
5. Inside the `Tenant` aggregate:
   a. Find the current active `TenantSubscription`.
   b. Call `subscription.upgrade(reason?)` or `subscription.downgrade(reason?)` on it — status becomes `UPGRADED`/`DOWNGRADED`, `endedAt` is recorded.
   c. Create a new `TenantSubscription` entity — status `ACTIVE`, `startedAt` = now.
   d. Update `_planCode` and `_currentPlanVersionId` on the aggregate.
6. Persist the tenant (including both the closed and new subscription).
7. Publish `TenantPlanChangedEvent`.

### Business Rules

- Switching to the same plan version is a no-op.
- The old subscription record is never deleted — it becomes part of the immutable subscription history.
- Features and limits enforced going forward are taken from the new plan version, not the old one.

### Emitted Events

| Event | Consumers |
|---|---|
| `tenant.plan_changed` | Billing (adjust charge schedule), Channels (enforce new limits), RBAC/Messaging (apply new feature flags) |

---

## 6. Create a New Plan Version (Draft)

**Trigger:** A product admin wants to revise limits or feature flags for an existing plan without affecting current subscribers.

### Pre-conditions

- The plan must exist and be `ACTIVE`.

### Steps

1. Load the plan by code.
2. Retrieve the next version number:
   - Query `MAX(version)` from the `plan_versions` table for this plan code.
   - Next version = MAX + 1 (or 1 if no versions exist yet).
3. Construct a new `PlanVersion` entity with:
   - Status: `DRAFT`
   - The supplied limits (`maxMembers`, `maxChannels`, `maxStorageGb`) and feature flags.
4. Persist the new `PlanVersion`.

### Business Rules

- A `DRAFT` version has no effect on any tenant. It is invisible to new subscribers.
- Multiple draft versions may exist simultaneously (one per iteration of review).
- Limits or feature flags may be changed while the version is still `DRAFT` by replacing the draft entirely.

### Emitted Events

_None at this stage._

---

## 7. Publish a Plan Version

**Trigger:** A product admin approves a draft and makes it the active specification for new subscriptions.

### Pre-conditions

- The target `PlanVersion` must be in `DRAFT` status.

### Steps

1. Load the `PlanVersion` by plan code and version number.
2. Call `planVersion.publish()`:
   - Status transitions to `PUBLISHED`.
   - `publishedAt` is recorded.
3. Persist the `PlanVersion`.
4. Publish `PlanVersionPublishedEvent`.

### Business Rules

- Only one version needs to be published at a time, but the system does not technically enforce a single-published-version constraint. The latest `PUBLISHED` version is used for new subscriptions (by convention: highest version number among `PUBLISHED` versions).
- **Existing subscribers are not affected.** They remain bound to the plan version they subscribed to.
- Publishing does not deprecate the previous published version automatically — that is a separate operation.

### Emitted Events

| Event | Consumers |
|---|---|
| `plan_version.published` | Billing (update plan catalog for new pricing), Channels (optional: notify admins of plan changes) |

---

## 8. Deprecate a Plan Version

**Trigger:** A product admin retires an older published version after migrating all or most subscribers to a newer one.

### Pre-conditions

- The `PlanVersion` must be in `PUBLISHED` status.

### Steps

1. Load the `PlanVersion` by plan code and version number.
2. Call `planVersion.deprecate()`:
   - Status transitions to `DEPRECATED`.
   - `deprecatedAt` is recorded.
3. Persist the `PlanVersion`.
4. Publish `PlanVersionDeprecatedEvent`.

### Business Rules

- Deprecating a version does **not** force-migrate existing subscribers. Tenants on a deprecated version continue to use it until a plan change is triggered.
- A background migration job may iterate over tenants still on the deprecated version and move them to the latest published version (each triggering a `TenantPlanChangedEvent`).
- Once deprecated, a version cannot be published again.

### Emitted Events

| Event | Consumers |
|---|---|
| `plan_version.deprecated` | Billing (flag outdated plan configurations) |

---

## 9. Send an Invitation

**Trigger:** A tenant admin invites someone to join the tenant (or a specific channel within it).

### Pre-conditions

- The tenant must be `ACTIVE`.
- The inviting user must be a member of the tenant.
- No `PENDING` invitation for the same email address and tenant should already exist (deduplication check).
- For channel-scoped invitations: the channel must exist in the Channels service (validated by the caller).

### Steps

1. Load the tenant by ID. Verify it is `ACTIVE`.
2. Check for an existing `PENDING` invitation for `(tenantId, email)`. Fail if one exists.
3. Generate a secure, unique `InvitationToken` (cryptographic random).
4. Create an `Invitation` aggregate:
   - Set `expiredAt` = now + configured TTL (e.g., 7 days).
   - Set `inviteType` (`EMAIL` or `LINK`).
   - Set `roleScope` (`TENANT` or `CHANNEL`) and `channelId` if channel-scoped.
   - Set `roleCode` to the role being offered.
5. Persist the invitation.
6. Publish `InvitationSentEvent`.

### Business Rules

- Link-type invitations (`LINK`) are not tied to a specific email — anyone with the link can use them (no email deduplication applies).
- An invitation is a promise that, when accepted, will provision the role `roleCode` at `roleScope` for the accepting user.

### Emitted Events

| Event | Consumers |
|---|---|
| `invitation.sent` | Notifications (send invitation email with link and sender context) |

---

## 10. Accept an Invitation

**Trigger:** An invited user opens the invitation link and confirms acceptance.

### Pre-conditions

- The invitation must be found by its token.
- The invitation must have `PENDING` status.
- The invitation must not have passed its `expiredAt` timestamp.

### Steps

1. Load the invitation by token.
2. Check that status is `PENDING`. Fail with "invitation is no longer pending" otherwise.
3. Check that `now < expiredAt`. If expired: call `invitation.markExpired()` first to persist the correct state, then fail with "invitation has expired".
4. Call `invitation.accept(userId)`:
   - Status transitions to `ACCEPTED`.
   - `acceptedAt` and `acceptedByUserId` are recorded.
5. Persist the invitation.
6. Publish `InvitationAcceptedEvent`.

### Business Rules

- Acceptance is a one-time operation. An already-accepted or revoked invitation cannot be accepted.
- The act of accepting does **not** directly create a `TenantMember` record in this service. That happens via the `invitation.accepted` event handler inside this service (see §13).
- Role provisioning is handled by the RBAC service listening to `invitation.accepted`.

### Emitted Events

| Event | Consumers |
|---|---|
| `invitation.accepted` | RBAC (provision role), Tenants service itself (create `TenantMember` record), Channels (add to channel if channel-scoped), Notifications (notify the inviter) |

---

## 11. Revoke an Invitation

**Trigger:** A tenant admin cancels an outstanding invitation before it is accepted.

### Pre-conditions

- The invitation must be in `PENDING` status.

### Steps

1. Load the invitation by ID.
2. Call `invitation.revoke()`:
   - Status transitions to `REVOKED`.
3. Persist the invitation.
4. Publish `InvitationRevokedEvent`.

### Business Rules

- A revoked invitation token immediately becomes invalid. Even if the invitee clicks the link after revocation, the token lookup will yield a non-PENDING invitation and the accept flow will fail.
- Revoking an already non-PENDING invitation throws an error.

### Emitted Events

| Event | Consumers |
|---|---|
| `invitation.revoked` | Notifications (optionally inform the invitee) |

---

## 12. Expire Stale Invitations (Scheduled)

**Trigger:** A scheduled background job runs periodically (recommended: hourly).

### Pre-conditions

- None — this is a maintenance sweep.

### Steps

1. Query all `PENDING` invitations where `expires_at <= now()`.
2. For each found invitation:
   a. Call `invitation.markExpired()` — status transitions to `EXPIRED`.
   b. Persist the invitation.
   c. Publish `InvitationExpiredEvent`.

### Business Rules

- `markExpired()` is idempotent if the invitation is already non-PENDING — it silently skips.
- The expiry sweep is the only mechanism that officially sets `EXPIRED` status on invitations that were never acted on. The `accept()` path now only throws after detecting expiry, without mutating state (state mutation happens here via `markExpired()`).

### Emitted Events

| Event | Consumers |
|---|---|
| `invitation.expired` | Notifications (optionally tell the invitee the link has expired) |

---

## 13. Domain Events Reference

### Events Published by This Service

| Event Name | Payload | Published By |
|---|---|---|
| `tenant.created` | `tenantId`, `ownerUserId`, `planCode`, `planVersionId`, `slug` | `Tenant.create()` |
| `tenant.activated` | `tenantId` | `Tenant.activate()` |
| `tenant.suspended` | `tenantId`, `reason?` | `Tenant.suspend()` |
| `tenant.plan_changed` | `tenantId`, `previousPlanCode`, `newPlanCode`, `newPlanVersionId` | `Tenant.changePlan()` |
| `plan_version.published` | `planCode`, `version`, `planVersionId` | `PlanVersion.publish()` |
| `plan_version.deprecated` | `planCode`, `version`, `planVersionId` | `PlanVersion.deprecate()` |
| `invitation.sent` | `invitationId`, `tenantId`, `email`, `invitedBy`, `roleCode`, `roleScope` | `Invitation.create()` |
| `invitation.accepted` | `invitationId`, `tenantId`, `acceptedByUserId`, `roleCode`, `roleScope`, `channelId?` | `Invitation.accept()` |
| `invitation.revoked` | `invitationId`, `tenantId` | `Invitation.revoke()` |
| `invitation.expired` | `invitationId`, `tenantId` | `Invitation.markExpired()` |

---

### Events Consumed by This Service (from Other Services)

| Event Name | From Service | Action in This Service |
|---|---|---|
| `billing.payment_failed` | Billing | Suspend the tenant; set `reason = "payment_failed"` |
| `billing.payment_recovered` | Billing | Re-activate the tenant |
| `billing.plan_downgraded` | Billing | Call `tenant.changePlan()` with the downgraded plan version |
| `invitation.accepted` _(internal)_ | Self | Create a `TenantMember` record for the accepting user with the invitation's role |

> **Note:** The `invitation.accepted` event is both published _and_ consumed internally by this service. The internal handler creates the `TenantMember` record. Keeping this as an event (rather than inline logic in the accept handler) ensures the member creation is decoupled from the invitation state transition and can be retried independently.
