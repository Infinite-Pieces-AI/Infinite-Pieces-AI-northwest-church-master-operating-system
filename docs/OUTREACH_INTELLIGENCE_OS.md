# Outreach Intelligence OS

## Purpose

The Outreach Intelligence OS is the third user-facing application in the Boston Church Lowell / Northwest monorepo. It runs independently from the public website and Church Hub while sharing the church-controlled identity, Supabase backend, approved facts, audit model, and server worker infrastructure.

```text
Public Website        localhost:3000
Church Hub            localhost:3001
Outreach Intelligence localhost:3002
```

Its purpose is to help authorized leaders understand public questions, improve discoverability, prepare useful content, measure voluntary visitor journeys, and coordinate respectful follow-up. It is not an individual religious-surveillance system.

## Core workspaces

### Command Radar

Radar ingests approved public conversation signals from official APIs, approved RSS feeds, or publicly accessible pages that do not require a login, membership, paywall, anti-bot bypass, or other access-control circumvention.

Every signal receives explainable 0–100 scores for:

- local relevance;
- explicit church intent;
- family relevance;
- online-ministry intent;
- freshness;
- reply opportunity;
- content opportunity;
- search opportunity;
- risk and sensitivity;
- overall priority.

The OS may retain a public URL, source type, title, short excerpt, publication time, general locality, themes, scores, and review status. It must not create a persistent dossier of a public author's beliefs, vulnerability, private search behavior, family records, or church membership.

A recommended response must disclose the responder's connection to Boston Church Lowell, answer the public question without pressure, and direct anyone who wants follow-up to a voluntary form. Replies are drafts only until a named human approves and posts them manually or through an approval-controlled provider workflow.

### Search Intelligence

Search Intelligence combines aggregate Search Console-style metrics with the public website's current page inventory:

- query;
- page;
- impressions;
- clicks;
- click-through rate;
- average position;
- country/device aggregates where appropriate;
- existing-page detection;
- local or online intent;
- opportunity score;
- improve/create/monitor recommendation.

Google does not provide the identities of ordinary searchers. The OS must never imply that an aggregate query is linked to a known person.

### AI answer visibility

The OS can run a reviewed set of public prompts such as:

```text
church near Lowell MA
family church in Lowell
church with kids program Lowell
teen ministry Lowell
Sunday church service Lowell
online Bible study Massachusetts
Zoom Bible study
```

A provider adapter may return whether the church was mentioned, whether surfaced public facts were accurate, source citations where available, and content gaps. These checks are evidence for content improvement, not a guarantee of recommendation and not a license to manipulate answer systems.

### Growth Intelligence

Growth measures aggregate public traffic and meaningful voluntary actions:

```text
Search or public source
→ public website
→ Plan a Visit / event / online ministry / Bible study / question form
→ consented request
→ assigned human follow-up
→ scheduled next step
```

Success metrics include directions clicks, visit requests, event registrations, online-conversation requests, Bible-study requests, assigned follow-up, and completed requested next steps. Private Hub engagement, prayer content, counseling, child records, safeguarding records, and inferred religious intensity are excluded from marketing analytics.

### Content Command

Content Command produces reviewable drafts from approved church facts and identified public needs:

- SEO/AIO landing pages;
- public forum responses;
- social captions;
- email announcements;
- short-video scripts;
- event campaigns;
- image-generation prompts;
- alt text and translations;
- online-ministry pathways.

The publication rail remains:

```text
Approved facts
→ AI or template draft
→ fact verification
→ communications review
→ ministerial review when theological
→ named approval
→ publication
→ aggregate measurement
```

No worker may publish or reply merely because a model produced a draft.

### Local Presence

Local Presence protects one canonical record for the official church name, meeting schedule, Butler Middle School venue, address, parking, entrance, accessibility, Kids Kingdom, teens, contact paths, and approved online options.

A rented venue must not be presented as permanently owned or staffed outside actual approved service operations. Google Business Profile or similar accounts must be church owned, accurate, recoverable by at least two authorized leaders, and approved by central church leadership.

### Campaign Command

Campaigns may use geographic service areas, contextual search keywords, public landing pages, aggregate traffic, and voluntary conversion events. They may not use:

- member lists;
- prayer history;
- private Bible questions;
- private Church Hub activity;
- pastoral counseling;
- child ministry records;
- inferred religious belief;
- inferred vulnerability;
- lookalikes derived from sensitive church data.

Budget, targeting, creative, and publication changes require human approval. The default environment flags disable automatic contact, replies, publishing, and budget changes.

### Visitor CRM

A visitor CRM record begins only after a person voluntarily submits a form and selects a contact method. Store only the submitted information, consent evidence, public source/campaign attribution, selected next step, assigned owner, status, and follow-up outcome.

Private prayer, counseling, child, medical, custody, safeguarding, and Church Hub information must remain in their own restricted workflows and never be copied into the outreach CRM or ad platforms.

### Source Control

Every connector has an accountable owner, purpose, platform terms review, source type, allowlist, enabled state, last-run evidence, retention rule, and incident shutoff. Credentials are server-only and referenced through environment secrets or a managed secret store; they are never stored in browser code or ordinary connector rows.

Allowed source classes:

- official public APIs;
- approved RSS/Atom feeds;
- public pages whose terms permit the use;
- aggregate Search Console;
- aggregate public-site analytics;
- church-owned social business accounts;
- church-approved AI visibility providers;
- Zoom or meeting provider after a visitor requests an online conversation.

Prohibited source classes:

- private Facebook or messaging groups;
- private chats or direct messages;
- membership-only forums;
- pages requiring login bypass;
- paywall or anti-bot bypass;
- breached, purchased, or scraped contact lists;
- private search histories;
- member/child/pastoral data;
- systems that require deceptive identity or undisclosed automated engagement.

## Application architecture

```text
apps/outreach-command
├── app/(auth)/login
├── app/(protected)/radar
├── app/(protected)/search-intelligence
├── app/(protected)/growth
├── app/(protected)/content-command
├── app/(protected)/local-presence
├── app/(protected)/campaigns
├── app/(protected)/visitor-crm
└── app/(protected)/source-control
```

Production access requires `outreach.manage` and AAL2 MFA. The application uses private no-store responses, no-index headers, no public advertising pixels, and no service-role key in the browser.

## Server workers

```text
public-web-listening
search-console-sync
seo-intelligence
ai-visibility-monitor
social-listening
campaign-intelligence
content-generation
social-publishing
```

Workers are dry-run by default. Provider calls use server-side proxy endpoints, allowlisted hosts, timeouts, bounded result counts, schema validation, and durable outbox events. A provider adapter must stop when its source is disabled or its approval expires.

## Database model

Migration `0020_outreach_intelligence_os.sql` adds:

- `outreach_source_connectors`;
- `public_conversation_signals`;
- `public_conversation_actions`;
- `ai_visibility_runs`;
- `ai_visibility_checks`;
- `outreach_funnel_snapshots`;
- `outreach_channel_attribution`.

The conversation table intentionally has no `person_identifier` or `inferred_religious_belief` field. Public-source data is time-bounded and reviewed, not accumulated into identity dossiers.

## Release gates

Before any live source is enabled:

1. The source is genuinely public and its platform terms permit the intended use.
2. No login, private-group membership, paywall, anti-bot, or access-control bypass is used.
3. Connector credentials are server-only and assigned to a church-owned account.
4. The allowlist, purpose, accountable owner, retention period, and emergency shutoff are documented.
5. The system cannot store private searcher identity, inferred religious belief, or vulnerability scoring.
6. A public response discloses the responder's church affiliation.
7. Replies, content, ads, budgets, Zoom invitations, and social publication require human approval.
8. Search Console and analytics remain aggregate.
9. Visitor records originate from voluntary forms with consent evidence.
10. Private ministry data cannot flow into outreach tables or advertising systems.
11. RLS and pgTAP tests prove ordinary members cannot access Outreach OS data.
12. MFA is required for authorized production operators.
13. Retention and deletion jobs are tested.
14. Incident response can disable every connector and worker quickly.
15. Leadership approves the public identity, venue representation, online-ministry offer, and response policy.
