# ai-jobs

Runs permission-filtered AI drafting against approved documents and leaves all publication decisions to humans.

## Safety defaults

- `WORKER_DRY_RUN` defaults to `true`.
- Service-role credentials are accepted only in a server worker environment.
- Jobs are claimed from the database outbox and completed idempotently.
- Human approval remains required for public, theological, safeguarding, and social actions.

## Local invocation

```bash
pnpm --filter @church/worker-ai-jobs start
```
