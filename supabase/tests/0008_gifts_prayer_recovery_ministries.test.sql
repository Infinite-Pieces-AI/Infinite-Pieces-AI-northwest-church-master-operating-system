begin;

select plan(29);

select has_table('public', 'gift_assessments', 'Gift assessments table exists');
select has_table('public', 'gift_posts', 'Gift marketplace table exists');
select has_table('public', 'prayer_requests', 'Prayer Well table exists');
select has_table('public', 'prayer_request_owners', 'Prayer ownership is stored separately');
select has_table('public', 'recovery_programs', 'Recovery programs table exists');
select has_table('public', 'recovery_access_requests', 'Recovery access request table exists');
select has_table('public', 'public_recovery_inquiries', 'Voluntary public recovery inquiry table exists');
select has_table('public', 'recovery_public_topics', 'Aggregate/public recovery topic table exists');

select is(
  (
    select count(*)::integer
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in (
        'gift_assessments','gift_strengths','gift_posts','gift_post_responses',
        'prayer_requests','prayer_request_owners','prayer_interactions',
        'recovery_programs','recovery_memberships','recovery_sessions',
        'recovery_session_guides','recovery_progress','recovery_posts',
        'recovery_post_comments','recovery_access_requests','public_recovery_inquiries',
        'recovery_public_topics','recovery_outreach_partners','recovery_partner_actions'
      )
      and c.relkind = 'r'
      and not c.relrowsecurity
  ),
  0,
  'Every gifts, prayer, and recovery table has RLS enabled'
);

select is(
  (
    select count(*)::integer
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'public_recovery_inquiries'
      and column_name in ('diagnosis','substance','sobriety_date','medication','treatment_history','relapse_history')
  ),
  0,
  'Public recovery inquiries do not contain clinical or substance-history dossier columns'
);
select is(
  (
    select count(*)::integer
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'recovery_public_topics'
      and column_name in ('person_identifier','inferred_addiction','vulnerability_score','private_search_history')
  ),
  0,
  'Recovery public topics do not contain individual profiling columns'
);
select is(
  (
    select count(*)::integer
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'prayer_requests'
      and column_name = 'profile_id'
  ),
  0,
  'Prayer request ownership is not exposed in the member-visible prayer table'
);

select is(
  (select count(*)::integer from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'recovery_memberships' and policyname = 'recovery_memberships_private_read'),
  1,
  'Recovery membership has a private read policy'
);
select is(
  (select count(*)::integer from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'recovery_memberships' and policyname = 'recovery_memberships_leader_insert'),
  1,
  'Recovery membership insertion is leader controlled'
);
select is(
  (select count(*)::integer from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'prayer_request_owners' and policyname = 'prayer_owners_read'),
  1,
  'Prayer ownership has a restricted read policy'
);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-4000-8000-000000000401', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ministry.member@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Ministry Member"}', now(), now()),
  ('00000000-0000-4000-8000-000000000402', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ministry.other@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Other Member"}', now(), now()),
  ('00000000-0000-4000-8000-000000000403', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ministry.leader@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Recovery Leader"}', now(), now());

update public.profiles
set membership_status = 'active', accepted_privacy_at = now(), accepted_community_guidelines_at = now()
where id in (
  '00000000-0000-4000-8000-000000000401',
  '00000000-0000-4000-8000-000000000402',
  '00000000-0000-4000-8000-000000000403'
);

insert into public.role_assignments (user_id, role_id, scope_type, reason)
select user_id, r.id, 'church', 'Synthetic gifts prayer recovery authorization test'
from (
  values
    ('00000000-0000-4000-8000-000000000401'::uuid, 'member'::text),
    ('00000000-0000-4000-8000-000000000402'::uuid, 'member'::text),
    ('00000000-0000-4000-8000-000000000403'::uuid, 'minister'::text)
) as assignments(user_id, role_key)
join public.roles r on r.key = assignments.role_key;

insert into public.recovery_programs (
  id, display_name, program_type, official_program_confirmation, public_summary,
  meeting_day, general_location, status, accepting_access_requests,
  public_interest_enabled, created_by
) values (
  '27000000-0000-4000-8000-000000000001',
  'Authorization Test Recovery Ministry',
  'custom', false,
  'A fictional private recovery program used only for database authorization testing.',
  'Sunday', 'Lowell general area', 'active', true, true,
  '00000000-0000-4000-8000-000000000403'
);

insert into public.recovery_memberships (
  program_id, profile_id, membership_role, display_mode, consented_at, joined_at
) values (
  '27000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000403',
  'admin', 'first_name', now(), now()
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000401', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000401","role":"authenticated","aal":"aal1"}', true);

select is(
  (select count(*)::integer from public.recovery_programs),
  0,
  'Ordinary members cannot directly read private recovery program records before membership'
);
select is(
  (select count(*)::integer from public.list_recovery_access_options()),
  1,
  'An active member can see the minimal program access option through the secure RPC'
);
select lives_ok(
  $$select public.request_recovery_access(
      '27000000-0000-4000-8000-000000000001',
      'I would like to understand the confidentiality expectations.'
    )$$,
  'A member can submit a private recovery access request'
);
select is(
  (select count(*)::integer from public.recovery_access_requests where profile_id = auth.uid() and status = 'pending'),
  1,
  'The member can see their own pending recovery access request'
);
select throws_ok(
  $$insert into public.recovery_memberships (
      program_id, profile_id, membership_role, display_mode, consented_at, joined_at
    ) values (
      '27000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000401',
      'participant', 'first_name', now(), now()
    )$$,
  '42501',
  null,
  'An ordinary member cannot self-enroll directly in recovery membership'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000402', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000402","role":"authenticated","aal":"aal1"}', true);
select is(
  (select count(*)::integer from public.recovery_access_requests),
  0,
  'Another ordinary member cannot see someone else’s recovery access request'
);
select is(
  (select count(*)::integer from public.recovery_memberships),
  0,
  'Another ordinary member cannot see the recovery roster'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000403', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000403","role":"authenticated","aal":"aal2"}', true);
select lives_ok(
  $$select public.review_recovery_access_request(
      (select id from public.recovery_access_requests where profile_id = '00000000-0000-4000-8000-000000000401'),
      'approved',
      'Authorization test approval.'
    )$$,
  'An authorized recovery leader can approve a private access request'
);
select is(
  (select count(*)::integer from public.recovery_memberships where profile_id = '00000000-0000-4000-8000-000000000401' and ended_at is null),
  1,
  'Approval creates the private recovery participant membership'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000401', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000401","role":"authenticated","aal":"aal1"}', true);

insert into public.gift_posts (
  created_by, post_type, title, description, gift_tags, skill_tags,
  visibility, exchange_type, price_note, status, moderation_status
) values (
  auth.uid(), 'offer', 'Paid home repair offer',
  'I can provide paid plumbing and home-access help for church members.',
  array['Service'], array['Plumbing','Home access'], 'church', 'paid',
  'Contact me for cash payment.', 'open', 'approved'
);
select is(
  (select moderation_status from public.gift_posts where created_by = auth.uid() limit 1),
  'pending',
  'Ordinary member gift posts are forced into moderation even when approved is requested'
);
select is(
  (select risk_level from public.gift_posts where created_by = auth.uid() limit 1),
  'review',
  'Paid home-access and professional-service language is classified for review'
);

select lives_ok(
  $$select public.submit_member_prayer_request(
      'Anonymous church prayer',
      'Please pray for wisdom and peace this week.',
      true,
      'church',
      null,
      null,
      'general',
      'normal',
      true,
      true
    )$$,
  'A member can add an anonymous normal prayer request'
);
select is(
  (select count(*)::integer from public.prayer_requests where display_anonymous),
  1,
  'The anonymous prayer request is visible through the member prayer policy'
);
select is(
  (select count(*)::integer from public.prayer_request_owners where profile_id = auth.uid()),
  1,
  'The owner can see their separate prayer ownership record'
);

select lives_ok(
  $$select public.submit_member_prayer_request(
      'Restricted pastoral prayer',
      'A fictional sensitive request used only for authorization testing.',
      false,
      'church',
      null,
      null,
      'family',
      'pastoral',
      false,
      false
    )$$,
  'A pastoral request can be submitted through restricted routing'
);
select is(
  (select count(*)::integer from public.prayer_requests where sensitivity = 'pastoral' and visibility = 'leaders_only'),
  1,
  'Pastoral requests are forced to leaders-only visibility'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000402', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000402","role":"authenticated","aal":"aal1"}', true);
select is(
  (select count(*)::integer from public.prayer_requests where sensitivity = 'pastoral'),
  0,
  'Another ordinary member cannot see a restricted pastoral request'
);
select is(
  (select count(*)::integer from public.prayer_request_owners),
  0,
  'Another ordinary member cannot see prayer ownership mappings'
);
reset role;

select * from finish();
rollback;
