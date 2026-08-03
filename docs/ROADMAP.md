# Delivery Roadmap

## Phase 0 — Governance and discovery (2–4 weeks)

- appoint product, privacy, safety, technical, content, moderation, and Sunday operations owners
- confirm central church sponsorship, public name, canonical domain, schedule owner, and account ownership
- inventory current website, Member Hub, ChMS, check-in, calendars, email, giving, video, social, and analytics
- approve data classification, retention, safeguarding, teen messaging, photo consent, and incident response
- approve initial user journeys and wireframes

**Gate:** leadership approves scope, accounts, ownership, and safety model.

## Phase 1 — Foundation and public website (4–6 weeks)

- monorepo, CI, environments, design system
- canonical schedule and overrides
- public navigation, Plan a Visit, ministries, events, sermons, contact
- sitemap, robots, JSON-LD, Search Console, aggregate analytics
- accessibility baseline and mobile performance

**Gate:** location, schedule, content, forms, structured data, and mobile accessibility are verified.

## Phase 2 — Member essentials (6–10 weeks)

- access requests, single-use invitations, auth, MFA policy
- households, roles, RLS, audit
- This Week, weekly lessons, Scripture references, announcements
- events, registrations, notification preferences, PWA

**Gate:** cross-household and cross-ministry authorization tests pass.

## Phase 3 — Community and groups (6–8 weeks)

- channels, posts, messages, comments, reactions
- reporting and moderation
- group privacy and notification settings
- rotation input cleanup, deterministic proposal engine, review and override

**Gate:** membership removal revokes access immediately and moderation/rotation evidence is auditable.

## Phase 4 — Kids Kingdom integration (4–8 weeks)

- guardian-managed child profiles
- ChMS/check-in integration
- mirrored operational status
- classes, volunteers, consent, private albums
- parent connections and Sunday fallback drill

**Gate:** children’s leadership, privacy owner, and Sunday operations approve the workflow.

## Phase 5 — AI and outreach (4–8 weeks)

- approved-document library and citations
- Bible companion and minister copilot
- Search Console dashboard and content briefs
- social drafts, image prompts, visitor CRM, UTM governance
- red-team testing and human publication gates

**Gate:** prohibited data cannot enter AI; all theological/public outputs require recorded approval.

## Phase 6 — Operational maturity (ongoing)

- quarterly restore tests and access reviews
- annual incident simulation
- independent security and accessibility assessments
- retention automation, localization, deeper integrations
- native-app evaluation only after proven demand

## First 30 days

### Week 1 — Authority and inventory

- name owners
- confirm central approval, public identity, schedule, and account ownership
- inventory systems and vendors

### Week 2 — Rules before code

- data map and role boundaries
- child/teen/media/messaging drafts
- system-of-record decisions
- Bible provider shortlist
- navigation approval

### Week 3 — Technical foundation

- church-owned GitHub, Vercel, and Supabase organizations
- local/staging/production separation
- CI and synthetic seed data
- design system, public home, This Week prototype

### Week 4 — First workflow

- schedule/override publication
- Plan-a-Visit
- access request and invitation
- RLS test matrix
- weekly lesson prototype
- usability review with ministers, parents, older members, teen leaders, and Kids volunteers

Do not import real children’s data during this period.

## Master ecosystem workstreams

These workstreams refine the phase sequence rather than creating a separate product:

### PWA and communications

- offline-safe schedule and lesson snapshots;
- installability and cache clearing;
- web-push subscription preferences;
- safe payload evaluation and delivery retry;
- private realtime broadcast and presence authorization.

### Fellowship intelligence

- relationship-signal governance and content-free attestation;
- historical-pairing import;
- deterministic graph-aware proposal generation;
- leader comparison, warnings, manual adjustment, and approval;
- post-cycle review without member engagement scoring.

### Kids Kingdom operations

- select and contract the authoritative check-in provider;
- synthetic integration and webhook replay;
- kiosk device registry and printer bridge prototype;
- guardian/pre-check UX;
- private media and consent review;
- release evidence and manual fallback drill;
- no custom release pilot until the dedicated gate passes.

### Ministry content and outreach

- AI curriculum and image-prompt drafts;
- citation-based approved-document retrieval;
- Search Console opportunity pipeline;
- people-first brief and local-profile readiness;
- campaign and visitor CRM workflow;
- approval-controlled social publishing and measurement.
