# Database authorization tests

These pgTAP tests validate schema invariants and representative Row Level Security boundaries.
Run them only against the local Supabase stack with synthetic identities:

```bash
pnpm supabase:start
pnpm supabase:reset
pnpm supabase:test
```

Production member or child records must never be copied into the test database.
