# Implementation Conventions

Use these rules for identity API work before adding new endpoints or changing
shared auth behavior.

## File Boundaries

- Keep controllers thin. Controllers should route, validate, call one service
  method, and wrap the success response.
- Split controllers by API area when a controller grows beyond one workflow.
  Examples: `AuthController`, `PasswordController`, `SessionController`.
- Keep reusable helpers in `src/core/utils`. Do not hide reusable request,
  token, date, or password logic inside a module service.
- Keep module-specific policy in module constants, such as
  `src/modules/auth/auth.constants.ts`.
- Keep DTOs one resource per file. Inputs live in `inputs/`, outputs live in
  `outputs/`, and each folder has a barrel `index.ts`.
- Keep domain actions in small services by workflow. Use a facade only for
  compatibility or orchestration, and keep it delegation-only.

## Service Rules

- A service method should own one business action.
- Split a service when methods stop sharing the same workflow or dependencies.
- Do not mix token creation, password validation, email verification, and
  session lifecycle logic in one class.
- Repositories should perform persistence only. Business rules, token policy,
  and email/event decisions belong in services.
- Store opaque token hashes only. Raw refresh, verification, and reset tokens
  should only exist long enough to return or publish them.

## API Rules

- Public auth responses must use the documented success envelope and DTO shape.
- Access-token payloads must include `userId`, `sessionId`, and
  `type: "access"`.
- Authenticated routes must use `JwtAuthGuard` and `@CurrentAuth()`.
- Error additions must be registered in `src/core/errors/auth.error.ts` and
  covered by service or controller tests.

## Test Rules

- Put tests next to the service boundary they verify.
- Use reusable test helpers under `src/modules/<module>/testing` when mocks or
  fixtures are shared.
- Add controller or e2e coverage when changing response envelopes, route paths,
  guards, or validation behavior.
- Run `npm run build` and `npm test` before handing off identity API changes.
