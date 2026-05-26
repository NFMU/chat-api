Retrieve detailed implementation context for the microservice named: $ARGUMENTS

If no service name is provided, list available services under `services/` and ask which one to inspect.

## Steps

1. Navigate to `services/$ARGUMENTS/src/` and confirm the service exists. If it does not exist, stop and report available services.

2. Check if `services/$ARGUMENTS/CONTEXT.md` exists. If it does and was recently updated, summarise its contents. Otherwise proceed with a full scan below.

3. **Domain Layer** — read files under `src/domain/`:
   - Aggregates: read each aggregate class, note its identity type, owned entities, invariants, and domain events it raises
   - Value Objects: list them with their validation rules
   - Domain Services: read each, note what cross-aggregate coordination they perform
   - Domain Events: list all event classes and their payload fields
   - Repository interfaces: note the contract each repository defines

4. **Application Layer** — read files under `src/applications/`:
   - Commands: list each command and its input fields
   - Queries: list each query and its output shape
   - Handlers: for each handler, describe the full execution flow — validations, domain calls, persistence, event dispatch
   - DTOs / Input validators: note Zod schemas or class-validator rules

5. **Infrastructure Layer** — read files under `src/infrastructure/`:
   - Repository implementations: note the ORM/DB used, any custom query logic
   - External adapters: list external systems integrated and the adapter pattern used
   - Module wiring: read the infrastructure module to see how repositories are bound to tokens

6. **Presentation Layer** — read files under `src/presentation/`:
   - Controllers: list all endpoints (method + path), their request/response shapes, and guards applied

7. **Module Wiring** — read `src/app.module.ts`:
   - List all imported modules, registered providers, and how layers are composed

8. Produce a structured reference card:

   ### Service: $ARGUMENTS
   **Responsibility:** one-sentence description

   ### Domain Model
   | Aggregate | Identity | Owns | Events Emitted |
   |-----------|----------|------|----------------|

   ### Commands & Handlers
   | Command | Handler | Key Steps |
   |---------|---------|-----------|

   ### Queries & Handlers
   | Query | Handler | Returns |
   |-------|---------|---------|

   ### Integration Events Published
   List events written to the outbox and their payload shape.

   ### Infrastructure
   | Concern | Implementation | Notes |
   |---------|---------------|-------|

   ### API Endpoints
   | Method | Path | Auth | Description |
   |--------|------|------|-------------|

   ### Key Architectural Decisions
   Bullet list of non-obvious design choices found in the code.
