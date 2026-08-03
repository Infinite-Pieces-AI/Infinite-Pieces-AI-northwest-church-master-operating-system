# planning-center-sync

Mirrors approved Planning Center operational records without replacing the safety-critical source of truth.

## Safety defaults

- `WORKER_DRY_RUN` defaults to `true`.
- Service-role credentials are accepted only in a server worker environment.
- Jobs are claimed from the database outbox and completed idempotently.
- Human approval remains required for public, theological, safeguarding, and social actions.

## Local invocation

```bash
pnpm --filter @church/worker-planning-center-sync start
```
