# Release Checklist: Gifts, Prayer Well, and Recovery Ministry

## Product

- [ ] Gifts of the Church appears in desktop and mobile navigation.
- [ ] Members can enter or update only their own gift summaries.
- [ ] Member posts enter moderation before broader visibility.
- [ ] Private gift responses are visible only to the responder, post owner, and authorized moderators.
- [ ] Prayer Well group/ministry selectors show only authorized memberships.
- [ ] Anonymous requests do not expose ownership to ordinary members.
- [ ] Pastoral and safeguarding requests never enter the ordinary member feed.
- [ ] Recovery participants cannot self-enroll.
- [ ] Recovery access approval creates private membership.
- [ ] Nonparticipants cannot read program records, membership, progress, posts, comments, or exact location.
- [ ] Recovery leaders can create the program and publish participant guides.
- [ ] Public recovery page and voluntary request work without collecting clinical history.
- [ ] Recovery Outreach uses public/aggregate sources only.

## Church showcase readiness

The local-preview build is intentionally capable of demonstrating the complete intended workflows before live member records or provider credentials are connected. Preview state is browser-local and must remain visibly separated from production operations.

- [x] Gifts of the Church has an interactive member board, gift profile, strengths/assessment entry, offers, needs, church needs, item sharing, replies, matching, fulfillment, and moderation showcase.
- [x] Gift moderation is interactive in preview mode, including elevated-risk review, approve/reject/remove decisions, and browser-local persistence.
- [x] Prayer Well has interactive request creation, visibility choices, anonymous display, prayer acknowledgements, encouragement, Scripture replies, updates, answered-prayer summaries, archive/withdraw actions, filtering, and search.
- [x] Restricted prayer leadership routing has an interactive preview queue for pastoral and safeguarding follow-up without putting sensitive requests into the ordinary member feed.
- [x] Recovery Ministry has a private-participant experience with weekly sessions, Scripture references, resources, progress, announcements, discussion, access requests, leader planning, and member journey tools.
- [x] Recovery administration has interactive preview flows for programs, private access approval, program status, and curriculum/program-name governance.
- [x] Public recovery support and Outreach OS recovery intelligence are connected to voluntary inquiries and public/aggregate research rather than inferred individual addiction status.
- [x] Family and Kids Kingdom remain available as the existing interactive showcase, including household, check-in, pickup, consent, and parent-community workflows.
- [x] Local preview requires explicit development flags and does not silently activate in production.

Recommended church-demo routes:

```text
Hub:      /this-week /gifts /prayer /recovery /family /serve /admin
Admin:    /admin/gifts /admin/prayer /admin/recovery
Public:   / /recovery-support-lowell
Outreach: /recovery-outreach
```

## Safety and privacy

- [ ] Gifts moderation owner and backup are named.
- [ ] Prayer moderation, pastoral, and safeguarding owners are named.
- [ ] Recovery leader and backup are named.
- [ ] Emergency and mandated-reporting instructions are approved.
- [ ] Official recovery-program naming and curriculum rights are documented.
- [ ] Treatment-resource links have an update owner and review date.
- [ ] Prayer and recovery data are excluded from analytics, advertising, and default AI.
- [ ] Public recovery inquiries are excluded from enhanced conversions and audience creation.
- [ ] Data retention and deletion rules are approved.
- [ ] Incident response can disable forms, connectors, and private modules.

## Engineering

- [ ] `pnpm verify:structure`
- [ ] `pnpm verify:no-real-data`
- [ ] `pnpm verify:sql-static`
- [ ] `pnpm verify:workspace`
- [ ] `pnpm format:check`
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test:unit`
- [ ] `pnpm build`
- [ ] `pnpm supabase:start`
- [ ] `pnpm supabase:reset`
- [ ] `pnpm supabase:test`
- [ ] `pnpm supabase:types`
- [ ] `pnpm test:e2e`
- [ ] CodeQL passes
- [ ] Accessibility review passes
- [ ] Production preview-mode flags are false

## Production configuration

```env
NEXT_PUBLIC_ENABLE_DEMO=false
ALLOW_LOCAL_PREVIEW_MODE=false
ALLOW_AI_PRIVATE_DATA_ACCESS=false
NEXT_PUBLIC_SPIRITUAL_GIFTS_ASSESSMENT_URL=
NEXT_PUBLIC_RECOVERY_MINISTRY_NAME=Recovery Ministry
RECOVERY_OFFICIAL_PROGRAM_CONFIRMED=false
NEXT_PUBLIC_RECOVERY_MEETING_DAY=Sunday
NEXT_PUBLIC_RECOVERY_MEETING_TIME=
NEXT_PUBLIC_RECOVERY_PUBLIC_LOCATION=Lowell, Massachusetts
```

Set `RECOVERY_OFFICIAL_PROGRAM_CONFIRMED=true` only after leadership documents the official program relationship, name permission, curriculum permission, and publication rules.
