begin;

select plan(20);

select has_table('public', 'push_subscriptions', 'Web-push subscriptions table exists');
select has_table('public', 'kids_kiosk_devices', 'Kids kiosk device registry exists');
select has_table('public', 'kids_checkin_credentials', 'Short-lived Kids check-in credentials table exists');
select has_table('public', 'kids_release_verifications', 'Child release verification evidence table exists');
select has_table('public', 'sermon_curriculum_drafts', 'AI curriculum draft table exists');
select has_table('public', 'keyword_opportunities', 'Aggregate search opportunity table exists');
select has_table('public', 'outreach_readiness_checks', 'Local outreach readiness table exists');
select has_table('public', 'relationship_signals', 'Content-free relationship graph table exists');

select has_function(
  'public',
  'can_access_realtime_topic',
  array['text', 'uuid'],
  'Database-authorized realtime topic helper exists'
);

select has_function(
  'public',
  'may_check_target_user',
  array['uuid'],
  'Target-user helper prevents authenticated membership-oracle queries'
);

select has_function(
  'public',
  'get_my_child_release_history',
  array['uuid', 'integer'],
  'Guardians use a redacted release-history function rather than raw release rows'
);

select is(
  (
    select count(*)::integer
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'claim_notification_jobs'
  ),
  1,
  'Concurrency-safe notification claim function exists'
);

select is(
  (
    select count(*)::integer
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename = 'push_subscriptions'
      and policyname = 'push_subscriptions_read_own'
  ),
  1,
  'Push subscriptions are readable only through an explicit own-user policy'
);

select is(
  (
    select count(*)::integer
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename = 'relationship_signals'
      and policyname = 'relationship_signals_leadership'
  ),
  1,
  'Relationship signals have an MFA-gated leadership policy'
);

select is(
  (
    select count(*)::integer
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename = 'sermon_curriculum_drafts'
      and policyname = 'sermon_curriculum_drafts_content_team'
  ),
  1,
  'Curriculum drafts have a content-team policy'
);

select is(
  (
    select count(*)::integer
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename = 'kids_checkin_credentials'
      and policyname = 'kids_checkin_credentials_safety_only'
  ),
  1,
  'Raw Kids check-in credential rows are restricted to MFA-gated safety roles'
);

select is(
  public.can_access_realtime_topic('channel:not-a-uuid', '00000000-0000-4000-8000-000000000999'),
  false,
  'Malformed realtime topics are denied'
);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-4000-8000-000000000999',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'realtime.member@example.invalid',
  '',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"Realtime Member"}',
  now(),
  now()
);

update public.profiles
set membership_status = 'active',
    accepted_privacy_at = now(),
    accepted_community_guidelines_at = now()
where id = '00000000-0000-4000-8000-000000000999';

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000999', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000999","role":"authenticated","aal":"aal1"}', true);

select is(
  public.can_access_realtime_topic('announcement:church'),
  true,
  'An active member may access the church announcement topic for their own identity'
);

select is(
  public.can_access_realtime_topic('announcement:church', '00000000-0000-4000-8000-000000000998'),
  false,
  'An authenticated member cannot inspect another user through a target-user helper'
);
reset role;

select is(
  (
    select count(*)::integer
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in (
        'push_subscriptions',
        'kids_kiosk_devices',
        'kids_checkin_credentials',
        'label_print_jobs',
        'kids_release_verifications',
        'sermon_curriculum_drafts',
        'image_prompt_drafts',
        'keyword_opportunities',
        'outreach_readiness_checks',
        'relationship_signals'
      )
      and c.relkind = 'r'
      and not c.relrowsecurity
  ),
  0,
  'Every master-ecosystem table has RLS enabled'
);

select * from finish();
rollback;
