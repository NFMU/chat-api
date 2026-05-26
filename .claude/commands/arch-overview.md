Provide a high-level overview of the entire microservice architecture in this repository.

## Steps

1. List all directories under `services/` to discover all microservices.

2. For each service found, read the following files (if they exist):
   - `services/<name>/src/app.module.ts` — understand registered modules, providers, and imports
   - `services/<name>/src/domain/` — list subdirectories and key files to identify aggregates, domain events, and domain services
   - `services/<name>/src/presentation/` — list controllers to understand the public API surface
   - `services/<name>/src/applications/` — list handler directories to identify commands and queries
   - `services/<name>/CONTEXT.md` — if it exists, use it as a cached summary instead of re-reading all files

3. Look for shared types or integration event contracts between services (check `src/shared/` or `src/domain/events/` in each service).

4. Produce a structured overview with these sections:

   ### System Map
   List every service with a one-line responsibility description.

   ### Bounded Contexts
   For each service: the aggregate(s) it owns, the invariants it enforces, and the domain events it emits.

   ### API Surface
   For each service: the REST controllers and the key endpoints exposed.

   ### Inter-Service Contracts
   Integration events published and consumed across services. Any shared DTOs or types.

   ### Architectural Patterns
   Identify patterns in use across the system (e.g. DDD, CQRS, transactional outbox, UoW, hexagonal architecture).

   ### Library Dependencies
   List shared libraries (e.g. `@xlr8-nest/core`) and what each provides to the services.

Keep the output scannable — use tables or bullet lists rather than prose paragraphs.
