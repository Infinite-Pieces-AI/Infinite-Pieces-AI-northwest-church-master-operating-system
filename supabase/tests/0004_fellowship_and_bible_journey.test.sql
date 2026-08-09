begin;

select plan(28);

select has_table('public', 'fellowship_meetups', 'Fellowship meetup table exists');
select has_table('public', 'fellowship_meetup_private_details', 'Exact meetup instructions are separated');
select has_table('public', 'fellowship_meetup_members', 'Meetup responses table exists');
select has_table('public', 'fellowship_meetup_messages', 'Participant meetup thread exists');
select has_table('public', 'fellowship_preferences', 'Explicit connection preferences table exists');
select has_table('public', 'bible_journeys', 'Whole-Bible journey table exists');
select has_table('public', 'bible_journey_weeks', 'Sequenced Bible journey week table exists');
select has_table('public', 'bible_journey_progress', 'Member-owned Bible progress table exists');

select has_function(
  'public',
  'can_view_fellowship_meetup',
  array['uuid', 'uuid'],
  'Meetup visibility helper exists'
);
select has_function(
  'public',
  'is_fellowship_participant',
  array['uuid', 'uuid'],
  'Meetup participant helper exists'
);
select has_function(
  'public',
  'can_access_fellowship_thread',
  array['uuid', 'uuid'],
  'Participant-thread authorization helper exists'
);
select has_function(
  'public',
  'fellowship_meetup_attendee_count',
  array['uuid'],
  'Privacy-preserving attendee count function exists'
);

select is(
  (
    select count(*)::integer
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in (
        'fellowship_meetups',
        'fellowship_meetup_private_details',
        'fellowship_meetup_members',
        'fellowship_meetup_messages',
        'fellowship_preferences',
        'bible_journeys',
        'bible_journey_weeks',
        'bible_journey_progress'
      )
      and c.relkind = 'r'
      and not c.relrowsecurity
  ),
  0,
  'Every Fellowship and Bible Journey table has RLS enabled'
);

select is(
  (
    select count(*)::integer
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename = 'fellowship_meetup_private_details'
      and policyname = 'fellowship_private_details_thread_read'
  ),
  1,
  'Exact meetup details require participant-thread access'
);

select is(
  (
    select count(*)::integer
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename = 'bible_journey_progress'
      and policyname = 'bible_journey_progress_self'
  ),
  1,
  'Bible Journey progress is protected by an own-user policy'
);

-- Synthetic identities only.
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-4000-8000-000000000201', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'fellowship.a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Fellowship A"}', now(), now()),
  ('00000000-0000-4000-8000-000000000202', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'fellowship.b@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Fellowship B"}', now(), now()),
  ('00000000-0000-4000-8000-000000000203', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'journey.minister@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Journey Minister"}', now(), now());

update public.profiles
set membership_status = 'active',
    accepted_privacy_at = now(),
    accepted_community_guidelines_at = now()
where id in (
  '00000000-0000-4000-8000-000000000201',
  '00000000-0000-4000-8000-000000000202',
  '00000000-0000-4000-8000-000000000203'
);

insert into public.role_assignments (user_id, role_id, scope_type, reason)
select '00000000-0000-4000-8000-000000000201', id, 'church', 'Synthetic Fellowship RLS test'
from public.roles where key = 'member';
insert into public.role_assignments (user_id, role_id, scope_type, reason)
select '00000000-0000-4000-8000-000000000202', id, 'church', 'Synthetic Fellowship RLS test'
from public.roles where key = 'member';
insert into public.role_assignments (user_id, role_id, scope_type, reason)
select '00000000-0000-4000-8000-000000000203', id, 'church', 'Synthetic Fellowship RLS test'
from public.roles where key = 'minister';

insert into public.groups (id, name, slug, kind, minimum_members, maximum_members, status)
values ('11000000-0000-4000-8000-000000000001', 'Fellowship Test Group', 'fellowship-test-group', 'family_group', 1, 20, 'active');
insert into public.group_memberships (group_id, profile_id, membership_type)
values ('11000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000201', 'member');

insert into public.fellowship_meetups (
  id, creator_profile_id, title, category, description, visibility, group_id,
  audience_label, starts_at, ends_at, general_location_name, general_area, capacity
) values (
  '12000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000201',
  'Synthetic group prayer walk',
  'prayer',
  'A synthetic invitation used only to verify group-scoped fellowship boundaries.',
  'group',
  '11000000-0000-4000-8000-000000000001',
  'Assigned group',
  now() + interval '1 day',
  now() + interval '1 day 1 hour',
  'Synthetic public park',
  'Lowell area',
  12
), (
  '12000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000201',
  'Synthetic church coffee',
  'food',
  'A synthetic church-wide invitation used to verify join and exact-detail boundaries.',
  'church',
  null,
  'Church members',
  now() + interval '2 days',
  now() + interval '2 days 1 hour',
  'Synthetic public coffee shop',
  'Lowell area',
  10
);

insert into public.fellowship_meetup_private_details (
  meetup_id, exact_meeting_instructions, host_contact_note, updated_by
) values
  ('12000000-0000-4000-8000-000000000001', 'Synthetic group-only instructions.', 'Use the meetup thread.', '00000000-0000-4000-8000-000000000201'),
  ('12000000-0000-4000-8000-000000000002', 'Synthetic participant-only table instructions.', 'Use the meetup thread.', '00000000-0000-4000-8000-000000000201');

-- A nonmember of the selected group cannot discover or probe its invitation.
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000202', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000202","role":"authenticated","aal":"aal1"}', true);
select is(
  (select count(*)::integer from public.fellowship_meetups where id = '12000000-0000-4000-8000-000000000001'),
  0,
  'A member outside the selected group cannot see its invitation'
);
select is(
  public.can_view_fellowship_meetup('12000000-0000-4000-8000-000000000001'),
  false,
  'The visibility helper denies a nonmember of the selected group'
);
reset role;

-- The group member and host can see the card and exact instructions.
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000201', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000201","role":"authenticated","aal":"aal1"}', true);
select is(
  (select count(*)::integer from public.fellowship_meetups where id = '12000000-0000-4000-8000-000000000001'),
  1,
  'A selected group member can see its invitation'
);
select is(
  (select count(*)::integer from public.fellowship_meetup_private_details where meetup_id = '12000000-0000-4000-8000-000000000001'),
  1,
  'The host can see exact meeting instructions'
);
reset role;

-- A church-wide card is discoverable, but exact details remain closed until joining.
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000202', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000202","role":"authenticated","aal":"aal1"}', true);
select is(
  (select count(*)::integer from public.fellowship_meetups where id = '12000000-0000-4000-8000-000000000002'),
  1,
  'An active member can discover a church-wide invitation'
);
select is(
  (select count(*)::integer from public.fellowship_meetup_private_details where meetup_id = '12000000-0000-4000-8000-000000000002'),
  0,
  'A nonparticipant cannot see exact meeting instructions'
);

insert into public.fellowship_meetup_members (meetup_id, profile_id, status, party_size)
values ('12000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000202', 'going', 1);

select is(
  (select count(*)::integer from public.fellowship_meetup_private_details where meetup_id = '12000000-0000-4000-8000-000000000002'),
  1,
  'Joining unlocks the separate participant-only instruction record'
);
select is(
  public.is_fellowship_participant('12000000-0000-4000-8000-000000000002'),
  true,
  'A joined member is recognized as an authorized participant'
);
select is(
  public.fellowship_meetup_attendee_count('12000000-0000-4000-8000-000000000002'),
  2,
  'The authorized count function includes host and joined member without exposing a public roster'
);

insert into public.reports (reporter_id, target_type, target_id, category, details)
values (
  '00000000-0000-4000-8000-000000000202',
  'fellowship_meetup',
  '12000000-0000-4000-8000-000000000002',
  'unsafe_meetup',
  'Synthetic report only.'
);
select is(
  (select count(*)::integer from public.reports where target_type = 'fellowship_meetup'),
  1,
  'Members can report a fellowship invitation through the existing moderation workflow'
);
reset role;

-- Published Bible journey content is visible; drafts are not.
insert into public.bible_journeys (
  id, key, title, subtitle, total_weeks, publication_status, created_by, reviewed_by,
  published_by, published_at
) values (
  '13000000-0000-4000-8000-000000000001',
  'synthetic-story-of-god',
  'Synthetic Story of God',
  'Synthetic test journey',
  52,
  'published',
  '00000000-0000-4000-8000-000000000203',
  '00000000-0000-4000-8000-000000000203',
  '00000000-0000-4000-8000-000000000203',
  now()
), (
  '13000000-0000-4000-8000-000000000002',
  'synthetic-draft-journey',
  'Synthetic Draft Journey',
  'Synthetic unpublished journey',
  4,
  'draft',
  '00000000-0000-4000-8000-000000000203',
  null,
  null,
  null
);

insert into public.bible_journey_weeks (
  id, journey_id, week_number, era, title, summary, big_idea, scripture_references,
  publication_status, created_by, reviewed_by, published_by, published_at
) values (
  '14000000-0000-4000-8000-000000000001',
  '13000000-0000-4000-8000-000000000001',
  1,
  'Creation',
  'Synthetic Genesis beginning',
  'A synthetic published week used only to verify member visibility and private progress.',
  'God creates people with purpose, dignity, and relationship.',
  array['Genesis 1-2'],
  'published',
  '00000000-0000-4000-8000-000000000203',
  '00000000-0000-4000-8000-000000000203',
  '00000000-0000-4000-8000-000000000203',
  now()
), (
  '14000000-0000-4000-8000-000000000002',
  '13000000-0000-4000-8000-000000000002',
  1,
  'Draft',
  'Synthetic hidden week',
  'A synthetic draft week that ordinary members must not see before ministerial publication.',
  'Draft content remains within the authorized review workflow.',
  array['Genesis 1'],
  'draft',
  '00000000-0000-4000-8000-000000000203',
  null,
  null,
  null
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000201', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000201","role":"authenticated","aal":"aal1"}', true);
select is(
  (select count(*)::integer from public.bible_journey_weeks),
  1,
  'An active member sees the published Bible week but not the draft'
);

insert into public.bible_journey_progress (
  journey_id, week_id, profile_id, rhythm_state, personal_notes
) values (
  '13000000-0000-4000-8000-000000000001',
  '14000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000201',
  '{"read":true,"notice":true,"pray":false,"practice":false,"share":false}'::jsonb,
  'Synthetic private formation note.'
);
select is(
  (select count(*)::integer from public.bible_journey_progress),
  1,
  'A member can save progress for an approved published week'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000202', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000202","role":"authenticated","aal":"aal1"}', true);
select is(
  (select count(*)::integer from public.bible_journey_progress),
  0,
  'Another member cannot read private Bible progress or notes'
);
reset role;

select * from finish();
rollback;
