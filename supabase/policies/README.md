# Row-Level Security policy guide

Every application table has Row-Level Security enabled. A missing policy means **deny by default**.

## Design rules

1. The public site reads only published projections.
2. A browser never receives the service-role key.
3. Channel membership is checked in PostgreSQL, not only in React.
4. Guardians see only linked children.
5. Kids Kingdom volunteers receive a time-limited roster projection, not unrestricted child rows.
6. Technical administrators do not automatically receive pastoral, prayer, child, or safeguarding access.
7. Privileged operations require both an authorized role and an `aal2` Supabase session.
8. Service workers consume an outbox with server-only credentials.

Run the SQL authorization tests after every policy or schema change:

```bash
pnpm supabase:start
pnpm supabase:reset
pnpm supabase:test
```
