# Boston Church Lowell / Northwest Master Operating System

A church-owned digital ministry platform composed of three distinct applications and one shared server control plane:

1. **Public Website** — authoritative service information, Plan a Visit, ministries, sermons, events, local discovery, and voluntary visitor requests.
2. **Private Church Hub PWA** — weekly teaching, licensed Scripture references, approved Bible companion architecture, Fellowship meetups, announcements, private realtime channels, events, households, Kids Kingdom status, family tools, offline-safe snapshots, and web push.
3. **Outreach Intelligence OS** — private public-source radar, aggregate search intelligence, SEO/AIO briefs, growth funnels, local-presence readiness, campaigns, consented visitor CRM, and connector controls.
4. **Server Control Plane** — PostgreSQL/RLS, private object storage, durable outbox workers, Planning Center/current ChMS adapters, VAPID delivery, aggregate Search Console ingestion, approved public-source adapters, approval-controlled social publishing, and protected production promotion.

The architecture keeps safe defaults: synthetic data, deny-by-default database policies, no automatic social publishing or replies, no private-group crawling, no individual religious dossiers, no independent under-13 accounts, no unrestricted adult-to-teen messaging, no broad offline caching of private content, no AI access to child/prayer/counseling data, and no custom child release before an approved safety gate.

## Repository layout

```text
apps/public-web        Public Next.js website (port 3000 / Vercel project 1)
apps/church-hub        Invite-only member PWA and administration (port 3001 / Vercel project 2)
apps/outreach-command  Outreach Intelligence OS (port 3002 / Vercel project 3)
apps/workers           Scheduled and event-driven integration workers
packages               Shared UI, auth, RLS policy, PWA, realtime, Kids, outreach, AI, and domain logic
supabase               PostgreSQL schema, RLS, functions, seed data, and pgTAP policy tests
docs                   Architecture, governance, privacy, safeguarding, and runbooks
tests                  Unit, integration, authorization, accessibility, and end-to-end tests
```

## Outreach Intelligence OS

The third application is a purpose-built command center rather than a hidden Church Hub page. Its main workspaces are:

```text
Command Radar
Search Intelligence
Growth Intelligence
Content Command
Local Presence
Campaign Command
Visitor CRM
Source Control
```

It can ingest only approved public or aggregate information such as official APIs, approved RSS feeds, publicly accessible pages, Search Console metrics, public-site analytics, and church-owned social accounts. It cannot reveal private Google searchers, crawl private groups or chats, bypass logins/paywalls/anti-bot controls, create individual religious profiles, contact people automatically, or publish without human approval.

See `docs/OUTREACH_INTELLIGENCE_OS.md` for the complete architecture and release gates.

## Connection and formation experience

- **Fellowship** member meetup board for prayer walks, park playdates, coffee, meals, service, sports, young adults, and whole-church outings;
- one-minute member invitation builder with audience, public meeting place, time window, family fit, capacity, and waitlist concepts;
- participant-only meetup threads and separate protected exact-location records;
- an explainable Connection Guide based on explicit needs and preferences—not private prayer, child, counseling, attendance, or message content;
- **The Story of God**, a proposed 52-week formation path from Genesis through Revelation;
- personal, couple, family, teen, and group Bible tracks plus a Read–Notice–Pray–Practice–Share rhythm;
- approved-source AI Bible companion demo with visible Scripture references, church-teaching boundaries, and generated-explanation labels.

## Prerequisites

- Node.js 22+
- `pnpm` 10.14.0
- Docker Desktop or compatible Docker runtime for local Supabase when backend testing begins
- Supabase CLI, installed as a development dependency after `pnpm install`

## Local demo setup

```bash
corepack enable
cp .env.example .env.local
pnpm install
pnpm dev
```

`pnpm dev` now starts only the three user-facing applications:

- Public website: `http://localhost:3000`
- Member hub: `http://localhost:3001`
- Outreach Intelligence OS: `http://localhost:3002`

You may also run three separate terminals:

```bash
pnpm dev:public
pnpm dev:hub
pnpm dev:outreach
```

Run all background workers only when their server-side environment is configured:

```bash
pnpm dev:all
```

For local Supabase and full validation:

```bash
pnpm supabase:start
pnpm supabase:reset
pnpm supabase:types
pnpm check
pnpm test:e2e
```

`generated.types.ts` is a bootstrap placeholder until local migrations are applied and `pnpm supabase:types` generates schema-derived contracts.

## Vercel deployment

Create three Vercel projects from this repository:

| Project                  | Root directory          | Suggested domain                                       |
| ------------------------ | ----------------------- | ------------------------------------------------------ |
| Public website           | `apps/public-web`       | approved canonical Boston Church Lowell path/subdomain |
| Member hub               | `apps/church-hub`       | approved authenticated hub subdomain                   |
| Outreach Intelligence OS | `apps/outreach-command` | private authorized outreach subdomain                  |

The Outreach project must be no-index, authenticated, protected by role and MFA, and separated from public analytics pixels.

Never expose `SUPABASE_SERVICE_ROLE_KEY`, invitation peppers, webhook secrets, VAPID private keys, pickup-signing secrets, public-listening proxy tokens, or provider secrets to browser variables.

## Production boundary

This is an engineering and governance scaffold—not a declaration that real-data production use is approved. Do not import real members, guardians, teens, children, prayer, counseling, safeguarding, pastoral information, visitor contact data, or public-conversation source data until the applicable gates pass and accountable church owners approve privacy, safeguarding, outreach-source policy, moderation, retention, incident response, vendor ownership, backups, and Sunday fallback.

## Common commands

```bash
pnpm dev                 # run the three user-facing applications
pnpm dev:all             # run applications and configured workers
pnpm dev:public          # public site only
pnpm dev:hub             # member Hub only
pnpm dev:outreach        # Outreach Intelligence OS only
pnpm build               # build all workspaces
pnpm lint                # lint all workspaces
pnpm typecheck           # TypeScript checks
pnpm test:unit           # unit and integration tests
pnpm test:e2e            # Playwright browser tests
pnpm supabase:test       # database and RLS tests
pnpm verify:structure    # check required architecture files
pnpm verify:no-real-data # block obvious real-data files, secrets, and unsafe flags
pnpm verify:sql-static   # verify migration numbering, SQL delimiters, RLS, and definer safety
pnpm verify:workspace    # verify workspace dependencies, aliases, and Next transpilation boundaries
```

## Start here

- `docs/MASTER_OPERATING_SYSTEM.md`
- `docs/OUTREACH_INTELLIGENCE_OS.md`
- `docs/product/FELLOWSHIP_AND_BIBLE_JOURNEY.md`
- `docs/ARCHITECTURE.md`
- `docs/PWA_OFFLINE_AND_PUSH.md`
- `docs/REALTIME_AND_PRESENCE.md`
- `docs/KIDS_KINGDOM_KIOSK.md`
- `docs/GROUP_ROTATION_GRAPH_MODEL.md`
- `docs/SEO_AI_AND_AD_GRANTS.md`
- `docs/RELEASE_GATES.md`
- `docs/privacy/role-access-matrix.md`
- `docs/safeguarding/child-and-teen-online-safety-template.md`
- `docs/incident-response/incident-response-plan.md`
- `SECURITY.md`
