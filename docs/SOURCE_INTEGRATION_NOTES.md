# Additional Blueprint Integration Notes

## Purpose

This record explains how the additional “Architectural Blueprint and Logistics for Digital Ministry Ecosystem” was merged into the original Boston Church Lowell / Northwest platform rather than added as a disconnected application. It preserves the additional blueprint’s strongest product and engineering ideas while documenting the safety, privacy, and platform adjustments made during implementation.

## Integrated directly

| Additional blueprint capability          | Master operating-system implementation                                                                                                                                   |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| One Turborepo/Vercel monorepo            | One private workspace containing two Next.js applications, server workers, shared packages, Supabase migrations, tests, and governance documentation.                    |
| Public Next.js acquisition site          | Canonical schedule, Plan a Visit, ministry pages, public events, sermons, local discovery, JSON-LD, aggregate telemetry, and protected revalidation.                     |
| Invite-only internal PWA                 | Single-use email-bound invitations, Supabase Auth, MFA for privileged roles, installable member hub, privacy-aware service worker, and web push.                         |
| PostgreSQL Row Level Security            | Database-enforced access for channels, groups, households, guardians, children, media, administrators, push subscriptions, and realtime topics.                          |
| WebSocket chat and presence              | Private Supabase Realtime topics with server/database authorization and a sparse presence allowlist.                                                                     |
| Weekly Bible and minister-plan tabs      | Published lessons, Scripture references, approved resources, minister announcements, discussion prompts, and licensed-provider boundaries.                               |
| Fellowship novelty algorithm             | Deterministic household-level proposal engine using history and content-free relationship signals, with local-swap refinement and leader approval.                       |
| Kids Kingdom kiosk and labels            | Provider-neutral kiosk, signed short-lived credential, print-job, and release-evidence contracts integrated behind the existing ChMS and safety gates.                   |
| AI curriculum and creative support       | Approved-source weekly curriculum and image-prompt drafts with citations, theological/communications review, and no automatic publication.                               |
| Search-intent and local outreach tooling | Aggregate Search Console opportunity scoring, original people-first briefs, local-profile readiness, campaign controls, Ad Grants evaluation, and voluntary visitor CRM. |
| Push notifications                       | VAPID-ready user-owned subscriptions, generic lock-screen payloads, safe delivery worker, and endpoint revocation.                                                       |
| Staging and production control           | Preview/staging deployments plus a protected manual production-promotion workflow for the two Vercel projects.                                                           |

## Deliberate safety and correctness adaptations

### Offline content

The added blueprint proposed stale-while-revalidate caching for recent social posts and weekly lessons. The master system caches only the application shell, approved service schedule, and a limited lesson summary. Private conversations, prayer, child, counseling, safeguarding, attendance, profile, and personalized API responses remain network-only. Logout and device-reset workflows can clear the bounded cache.

### PWA background behavior

A PWA does not receive unlimited persistent background execution. The implementation uses capabilities that browsers actually permit: service-worker fetch handling, web push, notification click routing, and explicit cached snapshots. Server-side workers perform durable background operations.

### Realtime relationship signals

The additional graph model suggested deriving relationship strength from interaction frequency and shared Kids Kingdom activity. The master system does not inspect message text, prayer, pastoral records, child records, or private content to rank relationships. It accepts only purpose-limited, content-free signals with source attestation, retention, leadership review, and an auditable proposal run.

### Child check-in and release

The additional blueprint described custom QR kiosks, thermal labels, and digital checkout. Those capabilities are represented through provider-neutral contracts, but Planning Center or the church’s approved ChMS remains the safety-critical source of truth at launch. A signed QR credential identifies a check-in transaction; it is never, by itself, authority to release a child. Custom release remains disabled until a separate safeguarding review and pilot gate are approved.

### Child media

Web software cannot prevent screenshots or guarantee that an authorized viewer will never redistribute an image. The implementation uses exact consent scopes, private storage, short-lived access, metadata removal, malware checks, moderator approval, access logging, visible viewer watermarks, takedown controls, and clear policy language. Watermarks and disabled context menus are deterrents, not guarantees.

### AI output

The added blueprint envisioned automatic curriculum, Scripture suggestions, images, landing pages, and social assets. The master system produces drafts from approved inputs. Scripture, church teaching, and generated explanation are separated; citations are required; ministerial or communications approval is recorded; generated people cannot be represented as real congregants; and no AI job owns publication authority.

### SEO and programmatic publishing

The system does not automatically publish a new page whenever a keyword trend appears. It creates an opportunity record and an original content brief. A human must verify the need, official facts, venue details, usefulness, authorship, and publication decision. Mass near-duplicate local pages and inferred religious targeting are prohibited.

### Google Business Profile and Ad Grants

The administration console contains evidence and readiness checklists, not automated workarounds or promises of approval. Church leadership must verify current platform rules, organizational eligibility, official account ownership, venue representation, documentation, and continuing campaign compliance before launch.

### Analytics and visitor acquisition

The public site measures aggregate performance and voluntary conversions. The private hub uses minimal reliability and adoption telemetry. Advertising systems never receive member lists, child data, prayer content, counseling records, ministry assignment, private-channel content, or inferred religious beliefs.

## Result

The two supplied blueprints now resolve to one system of record, one authorization model, one deployment topology, one safety program, and one phased product roadmap. The additional blueprint’s ambitious engagement, PWA, realtime, graph, Kids, AI, SEO, and Ad Grants ideas are retained where they strengthen ministry operations, but they remain subordinate to child safety, privacy, human review, current provider rules, and church-owned governance.
