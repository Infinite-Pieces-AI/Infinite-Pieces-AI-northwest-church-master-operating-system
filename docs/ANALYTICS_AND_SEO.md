# Responsible SEO, Analytics, and Outreach

## Local discovery strategy

Publish a small number of original pages that answer real visitor questions: church in Lowell, Sunday service, what to expect, families, kids, teens, Bible study, family groups, sermons, events, beliefs, and community service. Do not mass-generate near-duplicate ZIP-code pages.

## Structured data

Generate accurate `WebSite`, `Organization`, applicable place-of-worship, `Event`, `Article`, `VideoObject`, and breadcrumb data from the canonical records. One public event has one dedicated URL.

## Public analytics allowlist

- `plan_visit_started`
- `plan_visit_submitted`
- `directions_clicked`
- `event_viewed`
- `event_registered`
- `bible_study_requested`
- `member_access_requested`

Forbidden analytics properties include names, email, phone, prayer text, child/member/household IDs, religious-belief labels, private messages, and care information.

## Environment separation

- Public website: aggregate source, campaign, page, direction click, visit/event conversions.
- Member hub: minimal reliability/adoption telemetry.
- Kids Kingdom: operational check-in reliability only.
- Prayer/pastoral: no advertising pixels.
- Private channels: no content-based marketing profiles.
- AI: cost, safety, citation, and feedback metrics without unnecessary prompt retention.

## Publication flow

```text
Approved facts → AI draft → communications review → ministerial review when theological
→ approval → schedule → publish → measure → revise
```

Social automation is disabled by default. The worker refuses a draft without recorded human approval and has no production platform adapter until leadership approves one.

## Aggregate opportunity scoring

The Search Console worker imports aggregate rows only, normalizes page paths, and stores impressions, clicks, click-through rate, and position. `@church/outreach` scores whether leadership should improve an existing page, consider a substantive new page, or monitor the query. The score is a prioritization aid, not proof of a person’s intent.

## Local presence and grants readiness

The administration console tracks evidence for official identity, truthful rented-venue representation, actual staffed hours, signage, category review, account ownership, organizational eligibility, substantive content, conversion measurement, keyword review, and sensitive-audience policy. Requirements and provider rules must be verified against current official guidance before action.
