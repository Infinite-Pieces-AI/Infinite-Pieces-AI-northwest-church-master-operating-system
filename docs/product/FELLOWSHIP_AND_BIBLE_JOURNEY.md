# Fellowship and Whole-Bible Journey

## Product north star

The Church Hub should make it easier for a member to take one healthy next step toward God and another person. It is not designed to maximize scrolling, expose private lives, or replace embodied church relationships. The central product question is:

> What could help this person worship, learn, serve, or spend meaningful time with another member this week?

The first implementation adds two mutually reinforcing systems:

1. **Fellowship** turns ordinary plans into visible, low-pressure invitations.
2. **The Story of God** gives the congregation a shared 52-week path from Genesis to Revelation.

Together, they move the app from information delivery toward a rhythm of Scripture, prayer, shared life, and service.

---

## Fellowship

### Core user journey

A member may already be planning to:

- walk and pray at a public park;
- take children to a playground;
- get coffee after work;
- eat lunch after worship;
- play basketball;
- pack community-service supplies;
- study the weekly lesson;
- attend a public activity or museum;
- invite a larger ministry or the whole church to an outing.

The member opens **Fellowship**, creates a clear invitation in about one minute, and selects its visibility:

```text
Church-wide
Ministry
Assigned group
```

Other authorized members can discover the card, express interest or join, and then use a meetup-specific group thread. They do not need to exchange phone numbers or create an unrestricted direct-message relationship.

### Invitation card

A discoverable card contains only what is appropriate for the selected member audience:

- title;
- category;
- host display identity;
- date and time window;
- general public meeting place;
- general area;
- short description;
- intended audience;
- family fit;
- accessibility notes;
- capacity and waitlist status;
- number of people joining.

Exact instructions, virtual links, or a host contact note live in a separate protected record and unlock only to authorized participants.

### Categories

The initial taxonomy is intentionally understandable rather than overly granular:

- Prayer
- Families
- Outdoors
- Coffee and meals
- Service
- Sports
- Young adults
- Whole church

Filters prioritize **Today**, **Families**, **Prayer**, **Serve together**, and **Active** because the product should help a member find a real next step quickly.

### Member responses

```text
Interested
Going
Waitlisted
Declined
Cancelled
```

A host is automatically attached to a newly created invitation. Capacity enforcement moves an over-capacity response to the waitlist when the host permits one.

### Connection Guide

The demo includes a decision-support surface that begins with a need rather than a feature menu:

- I could use company.
- What is happening today?
- Help me invite people.
- Where can I serve?
- Help me reconnect with God.

In production, recommendations may use only explicit member preferences and authorized public/member content. They must not infer loneliness, spiritual condition, risk, family status, or pastoral need from private messages, prayer requests, counseling, attendance, child records, or safeguarding information.

### Safety and privacy rules

- No home address, child school, recurring child schedule, custody information, or precise live location belongs in a discoverable invitation.
- Exact meeting instructions remain separate and access-controlled.
- Minors participate under the church's approved teen and guardian policies.
- Adult-to-teen unrestricted direct messages remain disabled.
- A meetup thread is a participant group channel, not a private one-to-one channel.
- Members can report an invitation or a meetup message.
- Moderators can pause or remove an invitation without granting technical administrators blanket access to pastoral records.
- Push notifications use generic lock-screen text and do not expose exact location or sensitive purpose.
- Meeting hosts and participants remain responsible for ordinary judgment, transportation, supervision, and emergency procedures.
- The app does not represent a member-created outing as an official church event unless an authorized leader promotes it through the event workflow.

### Data model

```text
fellowship_meetups
├── general member-visible invitation
├── visibility: church | ministry | group
├── time, category, general public place
└── status and capacity

fellowship_meetup_private_details
├── exact instructions
├── virtual link
└── host note

fellowship_meetup_members
├── host
├── interested
├── going
└── waitlisted

fellowship_meetup_messages
└── participant-only thread

fellowship_preferences
└── explicit, member-owned recommendation preferences
```

The migration uses database-enforced Row Level Security, not hidden buttons, to separate visible cards, participant threads, and exact instructions.

---

## The Story of God: 52-week whole-Bible journey

### Purpose

The Bible area should not feel like a single disconnected sermon archive. It should help the entire region understand where the current week belongs in the whole biblical story.

The initial journey begins in Genesis and moves through:

```text
Creation
→ Fall and covenant
→ Exodus and Torah
→ Kingdom
→ Prophets, exile, and return
→ Wisdom and expectation
→ Jesus
→ Cross and resurrection
→ Spirit and church
→ New creation
```

Week 1 is **Created for God and One Another**, covering Genesis 1-2. Week 52 is **God Makes All Things New**, covering Revelation 21-22.

The sequence is a proposed formation framework. Ministers must review, revise, schedule, and publish each lesson. The software does not establish doctrine independently.

### Each weekly lesson contains

- week number and era;
- title;
- approved Scripture references;
- big idea;
- summary;
- story movements;
- practice prompts;
- licensed reader links;
- sermon audio/video/transcript when available;
- personal, couple, family, teen, and group tracks;
- visible source attribution;
- member-owned progress.

### Five-movement weekly rhythm

```text
Read
Notice
Pray
Practice
Share
```

This is deliberately relational. Completion is not a measure of spiritual worth, eligibility, leadership potential, or attendance compliance. A member's notes and progress are private and must never be used for advertising or spiritual-status scoring.

### Approved-source AI Bible companion

The AI interface visually separates:

```text
SCRIPTURE REFERENCES
CHURCH TEACHING
AI EXPLANATION
```

Appropriate functions include:

- show where this week fits in the whole Bible;
- explain an approved lesson in plainer language;
- generate a prayer framework;
- create a discussion question for a selected track;
- suggest one concrete practice;
- summarize an approved sermon with citations;
- prepare a minister-review draft for the next week;
- translate approved public information for human review;
- connect a Bible lesson to a relevant Fellowship invitation or service opportunity.

The assistant may not:

- replace Scripture, a minister, or pastoral care;
- publish doctrine automatically;
- access private prayer, counseling, safeguarding, child, custody, medical, or attendance records;
- privately communicate with minors;
- make abuse-reporting or emergency decisions;
- score someone's spirituality;
- promise divine, clinical, legal, or medical outcomes;
- invent a quotation or present generated explanation as licensed Bible text.

### Licensed Scripture boundary

The repository stores references and approved formation content. It does not bundle a copyrighted Bible translation. Production passage text must come through an approved licensed provider such as the provider selected by church leadership.

---

## Connection loop

The two modules should reinforce each other without becoming manipulative:

```text
This week's Bible story
→ one personal or shared practice
→ relevant Fellowship invitation
→ embodied conversation, prayer, service, or meal
→ optional reflection shared with a group
→ next week's story
```

Examples:

- Genesis 1-2 may suggest a creation-care walk, family park prayer, or dignity-centered service project.
- Acts 2 may suggest open lunch tables, shared prayer, hospitality, or care-supply packing.
- Luke 10 may suggest a neighborhood service activity and a discussion on neighbor love.
- John 13 may suggest a practical service gathering rather than merely another content post.

Recommendations remain optional, explainable, and based on approved content plus explicit preferences.

---

## Delivery phases

### Phase 1 — Product demo and design review

Implemented in the current feature branch:

- Fellowship navigation and page;
- filterable synthetic invitation board;
- browser-session join interactions;
- one-minute synthetic host form;
- Connection Guide;
- meetup preview on This Week;
- 52-week whole-Bible map;
- weekly rhythm and audience tracks;
- approved-source AI interaction demo;
- richer Community connections;
- responsive futuristic visual system;
- production-oriented database migration and RLS design.

No real member data or precise locations are required to review this phase.

### Phase 2 — Supabase persistence

After the church creates and approves the Supabase environment:

- apply migrations `0017`–`0019` for Fellowship and Bible Journey;
- generate schema-derived TypeScript types;
- replace browser-session actions with server actions/API handlers;
- load authorized meetups by RLS;
- implement RSVP, capacity, waitlist, participant thread, reports, and host controls;
- publish minister-reviewed Bible journey records;
- store private member progress;
- add RLS/pgTAP tests for every new boundary.

### Phase 3 — Realtime and notifications

- private meetup Realtime topics;
- participant-only presence;
- generic web-push reminders;
- cancellation and time-change alerts;
- optional “starting soon” notices;
- no exact location in lock-screen notifications.

### Phase 4 — Approved AI and connection intelligence

- retrieval from licensed references and minister-approved material;
- explainable Fellowship recommendations;
- host invitation-writing assistant;
- accessibility and transportation preference matching where explicitly supplied;
- group-leader connection-gap dashboard using aggregate, content-free signals;
- red-team testing and ministerial approval before activation.

### Phase 5 — Operational learning

Success metrics should measure healthy next steps rather than addictive engagement:

- members who found at least one relevant invitation;
- first-time hosts;
- invitations with at least one additional participant;
- percentage of meetups that happened versus were cancelled;
- new cross-group connections, measured only in aggregate;
- lesson opens and voluntary rhythm completion;
- members who moved from a lesson into prayer, service, discussion, or fellowship;
- safety reports and response time;
- opt-outs, notification burden, and deletion requests.

Do not optimize for time in app, endless-feed depth, private-message volume, or inferred religious intensity.

---

## Release gates

Before real member use:

1. A member outside a selected group or ministry cannot view its invitation.
2. A non-participant cannot read a meetup thread or exact meeting instructions.
3. Joining does not expose a home address, child schedule, or private phone number.
4. Capacity and waitlist rules behave correctly under concurrent responses.
5. A host cannot write moderation fields or bypass a removal decision.
6. Reports reach trained moderators.
7. Membership removal revokes meetup and thread access immediately.
8. Notifications omit exact locations and sensitive purposes.
9. Bible drafts are invisible to ordinary members until approved and published.
10. Member Bible progress and notes are visible only to that member.
11. AI answers cite approved sources and cannot access prohibited data.
12. Mobile navigation, keyboard use, screen readers, contrast, and reduced motion meet the WCAG 2.2 AA target.
