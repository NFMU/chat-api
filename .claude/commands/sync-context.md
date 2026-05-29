Scan for recent changes across all services in this repository and update the relevant CONTEXT.md files.

For each service directory under `services/`:
1. Read the current `CONTEXT.md` if it exists
2. Check recent git changes: `git log --oneline -20 -- services/<name>/`
3. Read any modified domain, application, or infrastructure files
4. Update CONTEXT.md sections that are now stale (aggregates, commands, events, API surface, schema)
5. Add a "Last synced" date at the top

Focus on changes to:
- Domain aggregates and value objects
- Command/query handlers
- Integration events
- Database migrations
- API controllers

Service to sync: $ARGUMENTS (if empty, sync all services)

After updating, output a summary of what changed in each CONTEXT.md.
