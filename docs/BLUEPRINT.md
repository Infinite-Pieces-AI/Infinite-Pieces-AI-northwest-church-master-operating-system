# Boston Church Lowell / Northwest Digital Platform Blueprint

> **Merged master edition:** This baseline blueprint is implemented together with the additional digital-ministry ecosystem proposal. `MASTER_OPERATING_SYSTEM.md` is the controlling product map, and `SOURCE_INTEGRATION_NOTES.md` records which added capabilities were integrated directly and which were adapted for child safety, privacy, browser correctness, responsible outreach, or human approval.

## Executive recommendation

Build one church-owned platform with three connected experiences:

| Experience                      | Audience                                                                                                                 | Purpose                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Public website                  | Visitors, seekers, local families, search engines                                                                        | Explain the church, publish one accurate schedule, promote public events, support local discovery, and collect voluntary visit requests. |
| Private member hub              | Approved members, guardians, teens, and group leaders                                                                    | Weekly lessons, Scripture references, announcements, ministry channels, events, group membership, and family tools.                      |
| Ministry administration console | Ministers, Kids Kingdom leaders, moderators, communications leaders, safety administrators, and technical administrators | Publish, approve access, manage groups, operate safety workflows, moderate community spaces, and oversee responsible outreach.           |

The platform is a single private monorepo deployed as two Vercel projects, backed by one PostgreSQL/Supabase project and server-side workers. It integrates proven systems for safety-critical check-in, licensed Bible content, transactional messaging, and other vendor-owned capabilities rather than rebuilding them prematurely.

## Non-negotiable product principles

1. **The church owns every production account.** No individual volunteer owns the domain, source repository, database, billing, analytics, or recovery credentials.
2. **One fact has one owner.** Service schedule, location, event, lesson, and ministry records are authored once and reused across the website, hub, structured data, and approved notifications.
3. **Private membership is invitation-only.** A shared congregation code is prohibited.
4. **Database authorization is authoritative.** React visibility is convenience; PostgreSQL RLS is enforcement.
5. **Children are guardian-managed.** There are no independent under-13 accounts and no public child directory.
6. **Integrate before replacing check-in.** Planning Center or the current ChMS remains the safety-critical system of record until a separate, reviewed project proves replacement is justified.
7. **AI drafts; humans decide.** AI never publishes doctrine, contacts minors, makes safeguarding decisions, changes access, or reads prohibited private domains.
8. **Outreach is consent-based.** The system improves public discoverability and follows up only with people who voluntarily submit information.
9. **The member hub is calm by design.** Chronological or ministry-prioritized information replaces engagement-maximizing ranking.
10. **Production is blocked by release gates.** Real member or child data is not imported until authorization, privacy, safeguarding, accessibility, backup, and operational tests pass.

## Product surfaces

### Public website

- Home
- Plan a Visit
- What to Expect
- About and Beliefs
- Ministries
- Kids Kingdom
- Teens
- Family Groups
- Events
- Sermons and Lessons
- Bible Studies
- Lowell Community
- Contact and Prayer
- Privacy and Safety
- Accessibility
- Member Login

### Member hub

The mobile-first primary navigation is:

```text
This Week
Bible
Community
Events
Family
```

`This Week` answers: “What is happening this week, and what should I know or do?” It combines the next service, current lesson, Scripture of the week, minister announcement, upcoming events, assigned groups, volunteer assignments, and Kids Kingdom status.

### Administration console

Administrative workspaces are separated by responsibility:

- Content and schedule publishing
- Access requests and invitations
- Groups and rotation proposals
- Kids Kingdom operations
- Moderation
- Outreach Studio
- Governance and release gates
- Technical system health

A technical administrator does not automatically receive pastoral, prayer, child, or safeguarding content.

## Build versus integrate

| Capability                          | Decision                               |
| ----------------------------------- | -------------------------------------- |
| Public website                      | Build                                  |
| Member dashboard                    | Build                                  |
| Weekly lesson companion             | Build                                  |
| Moderated channels and feed         | Build                                  |
| Constraint-based rotation proposals | Build                                  |
| Parent connection experience        | Build carefully                        |
| Outreach dashboard                  | Build                                  |
| People/household master record      | Integrate current ChMS where practical |
| Child check-in and release          | Integrate first                        |
| Bible translation text              | Licensed provider                      |
| Giving                              | Link existing official system          |
| Transactional email                 | Integrate provider                     |
| SMS                                 | Defer unless operationally necessary   |
| Push                                | PWA/Web Push first                     |
| Video                               | Existing official hosting              |
| Native mobile apps                  | Defer                                  |
| Facial recognition                  | Do not build                           |
| Autonomous pastoral decisions       | Do not build                           |
| Religious-interest profiling        | Do not build                           |

## Canonical schedule model

The database contains:

- `locations`
- `service_templates`
- `service_occurrences`
- `service_overrides`
- `publication_status`

An approved update emits `service_occurrence.updated`. Workers then revalidate approved public pages and create notification/social drafts. The system never silently publishes social content.

## Identity model

1. Visitor submits an access request.
2. A known member or authorized leader verifies the request.
3. A leader selects the intended household and allowable roles.
4. The system creates a random token and stores only its SHA-256 hash plus a server pepper.
5. Supabase sends an authenticated invite to the intended email.
6. The invite expires after 1–7 days, is single-use, and can be revoked.
7. The user accepts the privacy notice and community guidelines.
8. PostgreSQL activates only the roles listed in the invitation.

Privileged operations require `aal2` MFA in addition to a role.

## Group rotation

Households are atomic units. Hard constraints are enforced before scoring:

- household integrity
- capacity
- leadership coverage
- safeguarding restrictions
- compatible availability
- required accessibility support

Soft penalties include recent repeated pairings, imbalance, travel, newcomer clustering, and life-stage concentration. The algorithm is deterministic for a given cycle and seed, outputs a fingerprint, and produces a proposal only. Leadership reviews, adjusts, approves, and audits before notifications are generated.

## Kids Kingdom

The hub provides a parent-friendly view while the established check-in system remains authoritative. Guardians manage child profiles, pickups, class links, and media consent. Volunteers receive a narrow, time-limited class roster projection. Full child rows, custody details, and unrelated classes are not exposed.

Media scopes are separate permissions:

- private household
- private class
- private parent community
- internal presentation
- public website
- official social media
- promotional advertising

An image cannot be approved unless malware scanning is clean, image metadata is removed, a reviewer and scope are recorded, and every identified child has active guardian permission for that exact scope.

## Bible and AI

The database stores references and provider identifiers separately from copyrighted Bible text. A licensed provider supplies the translation text.

AI retrieval uses only an explicit allowlist of approved documents. The UI separates Scripture, church teaching, and generated explanation. Every answer stores citations. Private child, prayer, counseling, attendance, safeguarding, and direct-message content is excluded by default and by policy.

## Outreach

Outreach Studio supports:

- aggregate Search Console metrics
- original local page briefs
- sermon and event drafts
- reviewed social drafts
- image-generation prompts
- contextual campaigns
- UTM governance
- voluntary visitor CRM
- aggregate conversion events

It does not identify private searchers, upload member lists to advertising systems, infer religious belief, or retarget sensitive spiritual activity.

## Definition of success

The project succeeds when it reduces confusion and helps real relationships—not when it maximizes scrolling. Suggested measures:

- schedule accuracy and override propagation
- Plan-a-Visit completion
- event response completion
- announcement reach
- weekly lesson opens
- group participation
- access-request turnaround
- moderator response time
- check-in integration reliability
- guardian consent accuracy
- backup/restore test success
- accessibility defects
- AI citation and review quality
