# Identity Service Context
_Last synced: 2026-05-26_

## Responsibility
Handles user identity: account creation, email verification, JWT-based session management (access + refresh tokens), password reset flows, and multi-session tracking. Does not use DDD — follows a layered service + repository pattern. Does not publish integration events to the outbox currently; cross-service user identity is conveyed via `ownerUserId` (UUID) embedded in payloads from other services (e.g. `tenant.provisioned.v1`).

---

## Domain Model

The identity service uses plain TypeORM entities (not DDD aggregates).

### Core Entity: `User`

**Table:** `users`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK, auto-generated |
| `email` | varchar | UNIQUE, normalized |
| `passwordHash` | varchar | bcrypt hash |
| `isEmailVerified` | boolean | Set by email verification flow |
| `status` | enum | `ACTIVE`, `INACTIVE`, `BLOCKED` |
| `lastLoginAt` | timestamp | Updated on each login |
| `created_at` / `updated_at` | timestamp | Auto-managed |
| `deleted_at` | timestamp | Soft delete |

**Relations:**
- OneToOne → `Profile`, `Settings`
- OneToMany → `Session[]`, `PasswordReset[]`

---

## Application Layer

The identity service uses NestJS modules (not CQRS). Business logic lives in service classes.

### Modules

| Module | Controllers | Services |
|--------|------------|---------|
| `AuthModule` | `AuthController`, `EmailVerificationController`, `PasswordController`, `SessionController` | `AuthService`, `AuthTokenService`, `PasswordService`, `SessionService`, `SignupService` |
| `ProfileModule` | — | — |
| `SettingsModule` | — | — |
| `ReferenceModule` | — | — |
| `MailModule` | — | — |

### AuthService (Facade)

Delegates to specialized services:

| Method | Delegates To | Description |
|--------|-------------|-------------|
| `login()` | `SessionService` | Validate credentials, issue access + refresh tokens, record session |
| `signup()` | `SignupService` | Create user, send email verification |
| `verifyEmail()` | `SignupService` | Mark email as verified |
| `refresh()` | `SessionService` | Rotate refresh token, issue new access token |
| `logout()` | `SessionService` | Revoke session |
| `listSessions()` | `SessionService` | Return active sessions for user |
| `revokeSession()` | `SessionService` | Revoke a specific session |
| `requestPasswordReset()` | `PasswordService` | Generate reset token, send email |
| `confirmPasswordReset()` | `PasswordService` | Validate token, update password hash |
| `changePassword()` | `PasswordService` | Validate current password, update hash |

---

## Integration Events

None currently published. The identity service does not use the transactional outbox.

---

## Infrastructure

| Concern | Technology | Notes |
|---------|-----------|-------|
| Database | PostgreSQL via TypeORM | `DatabaseModule` (service-local, not `@xlr8-nest/core/database`) |
| Auth tokens | JWT via `@nestjs/jwt` | `JWT_SECRET` from env; globally registered `JwtModule` |
| Email | Nodemailer via `@nestjs-modules/mailer` | SMTP config from env; used for signup verification + password reset |
| Auth guard | `JwtAuthGuard` | Applied to protected routes (e.g. `POST /auth/logout`) |
| Event bus | `EventModule.forRoot({ maxListeners: 20 })` from `@xlr8-nest/core/ddd` | Internal domain-event bus for signup verification and password reset email notifications |

---

## API Surface

### `/auth`

| Method | Path | Guard | Description |
|--------|------|-------|-------------|
| `POST` | `/auth/login` | — | Login with credentials → `{ accessToken, refreshToken }` |
| `POST` | `/auth/signup` | — | Register new user → sends email verification |
| `POST` | `/auth/refresh` | — | Rotate refresh token → new `{ accessToken, refreshToken }` |
| `POST` | `/auth/logout` | JwtAuthGuard | Revoke current session |

### Email Verification (`EmailVerificationController`)
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/email/verify` | Verify email via token from email link |
| `POST` | `/auth/email/resend` | Resend verification email |

### Password (`PasswordController`)
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/password/reset` | Request password reset (sends email) |
| `POST` | `/auth/password/reset/confirm` | Confirm reset with token + new password |
| `PATCH` | `/auth/password` | Change password (authenticated) |

### Sessions (`SessionController`)
| Method | Path | Guard | Description |
|--------|------|-------|-------------|
| `GET` | `/auth/sessions` | JwtAuthGuard | List active sessions |
| `DELETE` | `/auth/sessions/:id` | JwtAuthGuard | Revoke a specific session |

---

## Key Architectural Decisions

- **No DDD / CQRS** — The identity service predates or intentionally avoids the DDD pattern used in `tenants`. It uses a direct service-layer approach which is appropriate for auth flows that are predominantly infrastructure-heavy (token signing, hashing, email sending) rather than domain-logic-heavy.
- **No outbox / integration events** — User identity is shared by UUID reference (`ownerUserId`), not by event. If the system evolves to need `user.created` or `user.deleted` cross-service events, the outbox pattern from `@xlr8-nest/core/messaging` can be adopted.
- **JWT is globally registered** — `JwtModule.register({ global: true })` means any module in the service can inject `JwtService` without re-importing the module.
- **Soft deletes on `users`** — `deleted_at` column allows recovery and audit without permanently removing records.
