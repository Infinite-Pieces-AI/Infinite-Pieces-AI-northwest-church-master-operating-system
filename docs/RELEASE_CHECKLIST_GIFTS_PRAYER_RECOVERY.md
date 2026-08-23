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
