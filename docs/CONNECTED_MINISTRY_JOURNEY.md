# Connected Ministry Journey

## North star

The three applications operate as one ministry journey rather than three disconnected products:

```text
Public question or local search
→ trustworthy Jesus-centered public answer
→ visit, question, teaching, service, or approved online option
→ voluntary human follow-up
→ approved Church Hub access
→ fellowship, Bible conversation, service, groups, and family tools
→ real-life relationships and spiritual growth
→ aggregate learning improves public information
```

The system supports people seeking Jesus, community, fellowship, and service. It does not manipulate spiritual vulnerability, infer a person's religious belief, or move private ministry content into marketing systems.

## Experience principles

### Autonomy

Visitors can browse Sunday details, directions, first-visit information, teaching, ministries, and service without submitting a form. Members may pause recommendations and the voluntary connection pathway.

### Competence

The product explains what will happen, who is responsible, what information is public, which details are private, and what each action will do.

### Relatedness

The Hub prioritizes embodied relationships: meals, walks, playdates, Bible conversations, groups, service shifts, and temporary purpose-specific threads rather than engagement-maximizing feeds.

## Public website

The primary hierarchy is:

```text
Primary: Plan your first Sunday
Secondary: Ask a question
Utility: Member sign in
```

Visit planning, general questions, and prayer use separate database tables, APIs, consent language, retention, analytics, and authorization boundaries. Prayer content is never copied into public analytics or the general visitor CRM.

New substantive public routes include:

- online Bible study;
- young adults in Lowell;
- serving Lowell;
- coming to church alone;
- what happens at a church service;
- starting to read the Bible;
- finding a healthy church community;
- questions about Jesus.

These pages must remain people-first. Nearby-town pages may not be generated without genuine local evidence and a useful answer.

## Church Hub

### Fellowship

The Fellowship interface is connected to RLS-protected Supabase tables and server routes for:

- creating a member invitation;
- church, ministry, or group visibility;
- interested, going, waitlisted, and cancelled responses;
- capacity enforcement;
- participant-only exact instructions;
- participant-only messages;
- calendar export;
- accessibility, food, cost, transportation, recurrence, and weather information;
- future co-hosts, polls, and post-event feedback.

### Connection Guide

Recommendations are based only on explicit member choices and authorized meetup attributes. Every recommendation displays why it was suggested. Members can request fewer similar suggestions, change preferences, or pause recommendations.

The guide may not read prayer, child, counseling, safeguarding, attendance, or private-message content and may not create a hidden loneliness or spirituality score.

### Service Marketplace

Service opportunities state the genuine need, expected impact, accountable partner, time, location, age and physical requirements, skills, accessibility, safeguarding, supplies, capacity, and family fit. Shift signups and waitlists are member-scoped.

Service is never gamified through holiness points, public rankings, or pressure streaks.

### Connection Path

The optional four-week path covers a first Sunday, low-pressure fellowship, a Bible conversation, and service. Members own the status and may skip, pause, restore, or complete steps. Progress cannot determine worth, leadership, eligibility, or pastoral status.

## Outreach Intelligence OS

The Morning Brief answers four questions:

1. What are people publicly asking?
2. Where is the church missing from search?
3. Which public facts or pages are weak?
4. What respectful human-approved action should happen next?

The scoring model evaluates topics, queries, and pages—not people:

```text
Church / visit intent       25%
Local relevance             20%
Observed demand or growth   15%
Ranking opportunity         15%
Content gap                 10%
Voluntary next-step fit     10%
Freshness                    5%
Sensitivity / policy risk   subtraction
```

Every assessment records source, date range, confidence, inputs, weighted contributions, risk deduction, explanation, recommendations, and leadership override fields.

### Search Console

The worker accepts aggregate date, query, page, country, device, search appearance, clicks, impressions, CTR, average position, and final/fresh state. It cannot identify a searcher.

### Site Quality

The first-party crawler is restricted to the church-owned public origin and sitemap. It checks response status, title, description, canonical, H1, JSON-LD, image alt text, image dimensions, duplicate titles, and same-origin broken links. Hub and Outreach routes are excluded.

### AI visibility

Approved public prompts record provider, mention status, factual accuracy, coverage, confidence, cited public page, other surfaced organizations, public evidence URLs, and the content gap. No provider can guarantee a recommendation.

### Google Business Profile

A rented school venue passes through an eligibility gate covering official identity, authorization to represent the venue, actual staffed public hours, signage evidence, two church-controlled recovery owners, and central leadership approval. The system never creates a profile automatically.

## Live integration boundary

The current product is fully reviewable with synthetic data. Live operation still requires church-owned and approved connections for:

- Supabase production;
- the deployed public origin;
- Google Search Console;
- privacy-minimized public analytics;
- any approved public discussion API or RSS source;
- AI visibility provider;
- Zoom or another meeting provider after a visitor requests an online conversation;
- church-owned social and local-profile accounts.

All public-source workers are dry-run or disabled by default. No reply, publication, meeting, audience, or budget change is automatic.

## Release gates

1. The public name, Sunday time, venue wording, parking, entrance, accessibility, Kids Kingdom, teens, and online offer are approved.
2. Prayer cannot enter analytics, advertising, or general CRM tables.
3. Visitors can access Sunday details and directions without a form.
4. Fellowship visibility, RSVP, private details, messages, and removal are verified through RLS tests.
5. Service shifts enforce capacity and member-only signup access.
6. Connection preferences and pathway progress are member-owned.
7. Outreach access requires an authorized role, AAL2, a recent session, and an audit event.
8. Search Console displays aggregate limitations and never implies searcher identity.
9. Site crawling is limited to the approved public origin.
10. Business Profile eligibility is reviewed rather than assumed.
11. Public replies, content, campaigns, meetings, and publication require a named human approval.
12. WCAG 2.2 AA and mobile Core Web Vitals are tested before production promotion.
