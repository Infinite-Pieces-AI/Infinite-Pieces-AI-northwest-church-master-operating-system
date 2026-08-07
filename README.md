# Boston Church Lowell / Northwest Master Operating System

A church-owned digital ministry platform composed of:

1. **Public Website** — authoritative service information, Plan a Visit, ministries, sermons, events, local discovery, and voluntary visitor requests.
2. **Private Church Hub PWA** — weekly teaching, licensed Scripture references, approved Bible companion architecture, announcements, private realtime channels, events, households, Kids Kingdom status, family tools, offline-safe snapshots, and web push.
3. **Ministry Administration Console** — access approval, content and AI drafts, group operations, Kids Kingdom safety workflows, moderation, outreach, analytics, governance, and system health.
4. **Server Control Plane** — PostgreSQL/RLS, private object storage, durable outbox workers, Planning Center/current ChMS adapters, VAPID delivery, aggregate Search Console ingestion, approval-controlled social publishing, and protected production promotion.

The merged architecture incorporates the strongest ideas from both supplied blueprints while keeping safe defaults: synthetic data, deny-by-default database policies, no automatic social publishing, no independent under-13 accounts, no unrestricted adult-to-teen messaging, no broad offline caching of private content, no AI access to child/prayer/counseling data, and no custom child release before an approved safety gate.

## Repository layout

```text
apps/public-web      Public Next.js website (Vercel project 1)
apps/church-hub      Invite-only member PWA and administration (Vercel project 2)
apps/workers         Scheduled and event-driven integration workers
packages             Shared UI, auth, RLS policy, PWA, realtime, Kids, outreach, AI, and domain logic
supabase             PostgreSQL schema, RLS, functions, seed data, and pgTAP policy tests
docs                 Architecture, governance, privacy, safeguarding, and runbooks
tests                Unit, integration, authorization, accessibility, and end-to-end tests
```

## Master features added in version 0.2

- privacy-aware service worker with offline-safe schedule and lesson snapshots only;
- VAPID web-push subscriptions, generic lock-screen payloads, delivery worker, and revocation handling;
- RLS-authorized private realtime topics and sparse presence;
- graph-aware, deterministic fellowship proposal engine with content-free relationship signals and local-swap refinement;
- provider-neutral Kids kiosk, QR credential, label printer, and release-evidence contracts behind safety gates;
- consent-scoped private media presentation with honest redistribution limitations;
- AI-assisted weekly curriculum and image-prompt draft contracts with human approval;
- aggregate Search Console opportunity scoring, people-first briefs, local-profile readiness, campaign controls, and Ad Grants evaluation;
- protected, manually approved production promotion for the two Vercel projects;
- corrected worker dry-run behavior that inspects without claiming or mutating queued work.

## Connection and formation experience added in version 0.3

- **Fellowship** member meetup board for prayer walks, park playdates, coffee, meals, service, sports, young adults, and whole-church outings;
- one-minute member invitation builder with audience, public meeting place, time window, family fit, capacity, and waitlist concepts;
- participant-only meetup threads and separate protected exact-location records in the production schema;
- an explainable Connection Guide that recommends a healthy next step from explicit member needs and preferences—not private prayer, child, counseling, attendance, or message content;
- **The Story of God**, a proposed 52-week formation path from Genesis through Revelation;
- personal, couple, family, teen, and group Bible tracks plus a Read–Notice–Pray–Practice–Share rhythm;
- approved-source AI Bible companion demo with visible Scripture references, church-teaching boundaries, and generated-explanation labels;
- richer This Week and Community surfaces that move members from information into embodied fellowship;
- migrations `0017`–`0019` for Fellowship and Bible Journey with RLS, private details, RSVP/capacity controls, reporting extensions, member-owned progress, and privacy-preserving outbox events.

The design and production boundaries are documented in `docs/product/FELLOWSHIP_AND_BIBLE_JOURNEY.md`.

## Prerequisites

- Node.js 22+
- Corepack-enabled `pnpm`
- Docker Desktop or compatible Docker runtime for local Supabase
- Supabase CLI, installed as a development dependency after `pnpm install`

## Local setup

```bash
corepack enable
cp .env.example .env.local
pnpm install
pnpm supabase:start
pnpm supabase:reset
pnpm supabase:types
pnpm check
pnpm test:e2e
pnpm dev
```

- Public website: `http://localhost:3000`
- Member hub: `http://localhost:3001`
- Supabase Studio: printed by `pnpm supabase:start`

`generated.types.ts` is a bootstrap placeholder until local migrations are applied and `pnpm supabase:types` generates schema-derived contracts.

## Vercel deployment

Create two Vercel projects from this repository:

| Project | Root directory | Suggested domain |
|---|---|---|
| Public website | `apps/public-web` | approved canonical Boston Church Lowell path/subdomain |
| Member hub | `apps/church-hub` | approved authenticated hub subdomain |

Pull requests use previews; the optional `staging` branch can host integrated staging. Automatic `main` deployments are disabled in the checked-in Vercel configuration. Production is promoted through the protected `.github/workflows/production-promotion.yml` workflow after full preflight and GitHub environment approval.

Never expose `SUPABASE_SERVICE_ROLE_KEY`, invitation peppers, webhook secrets, VAPID private keys, pickup-signing secrets, printer bridge credentials, or provider secrets to browser variables.

## Production boundary

This is an engineering and governance scaffold—not a declaration that real-data production use is approved. Do not import real members, guardians, teens, children, prayer, counseling, safeguarding, or pastoral information until the applicable gates in `docs/RELEASE_GATES.md` pass and accountable church owners approve privacy, safeguarding, media, retention, incident response, vendor ownership, backups, and Sunday fallback.

## Common commands

```bash
pnpm dev                 # run public web and hub
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
- `docs/product/FELLOWSHIP_AND_BIBLE_JOURNEY.md`
- `docs/SOURCE_INTEGRATION_NOTES.md`
- `docs/BLUEPRINT.md`
- `docs/ARCHITECTURE.md`
- `docs/PWA_OFFLINE_AND_PUSH.md`
- `docs/REALTIME_AND_PRESENCE.md`
- `docs/KIDS_KINGDOM_KIOSK.md`
- `docs/GROUP_ROTATION_GRAPH_MODEL.md`
- `docs/SEO_AI_AND_AD_GRANTS.md`
- `docs/RELEASE_GATES.md`
- `docs/VALIDATION_REPORT.md`
- `docs/privacy/role-access-matrix.md`
- `docs/safeguarding/child-and-teen-online-safety-template.md`
- `docs/incident-response/incident-response-plan.md`
- `SECURITY.md`
