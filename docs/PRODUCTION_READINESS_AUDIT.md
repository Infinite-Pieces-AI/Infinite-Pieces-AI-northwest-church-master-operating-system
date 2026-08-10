# Production Readiness Audit

## Purpose

This document records the platform’s production boundary after the removal of runtime sample, synthetic, mock, simulation, and automatic demo behavior from the three user-facing applications.

The platform is designed as one ministry journey:

```text
Public discovery
→ a transparent, Jesus-centered answer
→ visit, question, online conversation, or Hub-access request
→ voluntary human follow-up
→ approved Church Hub access
→ Scripture, fellowship, service, groups, and family workflows
→ aggregate operational learning in Outreach Intelligence
```

## What “production-ready” means here

Code is considered production-oriented when it:

- reads real authorized records from Supabase rather than manufacturing people or activity;
- shows an honest empty or configuration-required state when data or a provider is unavailable;
- sends an AI request only through a server-side provider boundary;
- limits AI navigation to an approved route catalog;
- records real access requests, visitor requests, search data, campaign records, and operational evidence;
- enforces authentication, role checks, RLS, MFA where privileged, and no-index/private response controls;
- has no clickable control that silently does nothing;
- does not represent unverified church facts, integrations, check-in status, traffic, rankings, messages, or AI results as live.

It does **not** mean that external services are already connected or that church leadership has approved real sensitive data use. Operational launch still requires the gates below.

## Application audit

### Public website

Implemented production-oriented behavior:

- canonical Sunday and location data from the church-content package;
- a server-rendered, guest-first homepage;
- a public Ministry Navigator that uses approved destinations and optional Gemini routing;
- clear Church Hub explanation, member sign-in, and access-request pathway;
- Plan a Visit, Ask a Question, online Bible conversation, and restricted prayer pathways;
- real public analytics events with no prayer text, child information, or private ministry content;
- honest empty states when events, sermons, or media have not been published.

Required before public launch:

- leadership confirmation of the official public name, current venue wording, service time, parking, entrance, accessibility, Kids Kingdom, teens, contact details, and online ministry offer;
- real, consented photography and video;
- privacy/contact/prayer routing review;
- domain, Search Console, analytics, structured-data, accessibility, and Core Web Vitals verification.

### Church Hub

Implemented production-oriented behavior:

- preview mode is explicit, local-only, and impossible in production;
- real Supabase authentication, role assignment, and RLS boundaries;
- real household, member, child, guardian, pickup, class, check-in, media-consent, parent-connection, and playdate reads;
- real household, pickup, and media-consent mutations with guardian authorization;
- real Fellowship persistence, RSVP, waitlist, private details, calendar, participant thread, reporting, and preferences from existing migrations and routes;
- a global Church Hub navigator for Scripture, fellowship, service, groups, family, events, preferences, notifications, and profile;
- Gemini Bible context only when the provider is configured; otherwise the UI states that the service is unavailable rather than generating a fake answer.

Required before member launch:

- apply all migrations to a church-owned Supabase project and generate current TypeScript database types;
- configure approved email, invite, MFA, web-push, storage, backup, retention, moderation, and incident-response systems;
- verify every RLS policy with pgTAP and end-to-end authorization tests;
- connect Planning Center or an approved ChMS before relying on check-in status;
- leadership approval before sending member messages, rosters, or community text to an AI provider;
- safeguarding, child/teen online-safety, media-consent, Sunday fallback, and offboarding drills.

### Outreach Intelligence OS

Implemented production-oriented behavior:

- preview mode is explicit, local-only, and impossible in production;
- AAL2 MFA, recent-session checks, role authorization, and access logging;
- live Supabase queries for public conversation signals, Search Console snapshots, keyword opportunities, visitor funnels, content queues, campaigns, visitor CRM, source connectors, site-quality scans, release gates, and Hub access requests;
- a Member Access workspace that lets authorized outreach/admin users see submitted Hub requests and related voluntary visitor pathways;
- honest empty and “connect provider” states instead of fictional traffic, rankings, people, campaigns, or public posts;
- source-control and campaign boundaries that prohibit private-group crawling, individual religious profiles, automatic personal contact, and automatic publishing.

Required before intelligence launch:

- deploy the public website;
- connect church-owned Search Console and aggregate analytics;
- approve every public-source API/feed and its platform terms, retention, accountable owner, and emergency shutoff;
- configure the first-party site crawler and approved AI-visibility provider;
- verify that visitor CRM records begin only after a voluntary form submission;
- prohibit member lists, prayer data, child data, private Hub activity, counseling, and inferred religious beliefs from advertising or outreach profiling.

## AI navigation standard

The public and member navigators:

- begin with an explicit question supplied by the user;
- route only to destinations in the approved catalog;
- provide an explanation for the recommendation;
- retain a deterministic fallback when Gemini is unavailable;
- do not read private prayer, counseling, child, safeguarding, or private-message content;
- do not infer loneliness, spiritual worth, vulnerability, or beliefs;
- never make emergency, pastoral, safeguarding, access-control, or doctrinal decisions.

## Runtime-data rule

Production runtime code must never fabricate:

- people, households, children, visitors, requests, attendance, messages, RSVPs, schedules, or check-ins;
- traffic, rankings, keyword demand, campaign results, AI visibility, or public conversations;
- AI answers, moderation decisions, volunteer assignments, or theological conclusions;
- integration status or provider success.

Tests may use isolated fictional fixtures, but those fixtures must not be imported by production routes or protected pages.

## Launch gates

The production environment must keep:

```env
NEXT_PUBLIC_ENABLE_DEMO=false
ALLOW_LOCAL_PREVIEW_MODE=false
ALLOW_LOCAL_INVITE_TOKEN_RETURN=false
OUTREACH_AUTO_REPLY_ENABLED=false
OUTREACH_AUTOMATIC_CONTACT=false
OUTREACH_AUTOMATIC_PUBLISHING=false
ALLOW_AUTOMATIC_SOCIAL_PUBLISHING=false
ALLOW_AI_PRIVATE_DATA_ACCESS=false
```

`ALLOW_AI_PRIVATE_DATA_ACCESS` may change only after documented church leadership, privacy, vendor, retention, and data-boundary approval.

No real child, guardian, prayer, counseling, safeguarding, pastoral, visitor, or member-community information should be imported until the relevant governance and security gates pass.
