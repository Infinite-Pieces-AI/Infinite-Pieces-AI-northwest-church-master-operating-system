# Local Development

## Bootstrap

```bash
corepack enable
cp .env.example .env.local
pnpm install
pnpm supabase:start
pnpm supabase:reset
pnpm dev
```

The public site runs on port 3000 and the hub on 3001.

## Safety rules

- Use only `example.invalid` identities and fictional households/children.
- Keep `NEXT_PUBLIC_ENABLE_DEMO=true` only outside production.
- Keep workers in dry-run mode.
- Do not paste exported church databases, screenshots, prayer lists, or check-in reports into the repository.
- Do not put a service-role key in a `NEXT_PUBLIC_` variable.

## Database workflow

1. Add a numbered migration.
2. Reset locally.
3. Add/modify RLS tests.
4. Generate TypeScript types.
5. Review query plans for high-volume policies.
6. Commit migration, tests, and types together.

## Validation

```bash
pnpm verify:structure
pnpm verify:no-real-data
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm supabase:test
pnpm test:e2e
```
