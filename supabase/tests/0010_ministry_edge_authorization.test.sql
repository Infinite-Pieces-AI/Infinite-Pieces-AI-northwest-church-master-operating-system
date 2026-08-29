begin;

select plan(6);

select is(
  (
    select count(*)::integer
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename = 'recovery_interest_requests'
      and policyname = 'recovery_interest_requests_minister_read'
  ),
  1,
  'Recovery inquiries have a minister-only read policy'
);
select is(
  (
    select count(*)::integer
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename = 'recovery_interest_requests'
      and policyname = 'recovery_interest_requests_minister_update'
  ),
  1,
  'Recovery inquiries have a minister-only update policy'
);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-4000-8000-000000000471', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'edge.member@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Edge Member"}', now(), now()),
  ('00000000-0000-4000-8000-000000000472', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'edge.content@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Edge Content Editor"}', now(), now()),
  ('00000000-0000-4000-8000-000000000473', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'edge.minister@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Edge Minister"}', now(), now());

update public.profiles
set membership_status = 'active',
    accepted_privacy_at = now(),
    accepted_community_guidelines_at = now()
where id in (
  '00000000-0000-4000-8000-000000000471',
  '00000000-0000-4000-8000-000000000472',
  '00000000-0000-4000-8000-000000000473'
);

insert into public.role_assignments (user_id, role_id, scope_type, reason)
select assignment.user_id, role_record.id, 'church', 'Synthetic ministry edge authorization test'
from (
  values
    ('00000000-0000-4000-8000-000000000471'::uuid, 'member'::text),
    ('00000000-0000-4000-8000-000000000472'::uuid, 'content_editor'::text),
    ('00000000-0000-4000-8000-000000000473'::uuid, 'minister'::text)
) as assignment(user_id, role_key)
join public.roles role_record on role_record.key = assignment.role_key;

insert into public.recovery_programs (
  id, display_name, program_type, official_program_confirmation,
  public_summary, status, accepting_access_requests, created_by
) values (
  '27800000-0000-4000-8000-000000000001',
  'Edge Authorization Recovery Ministry',
  'custom', false,
  'A fictional private program used only to test access-request and inquiry authorization edges.',
  'active', true,
  '00000000-0000-4000-8000-000000000473'
);
insert into public.recovery_memberships (
  program_id, profile_id, membership_role, display_mode, consented_at, joined_at
) values (
  '27800000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000471',
  'participant', 'first_name', now(), now()
);

insert into public.recovery_interest_requests (
  first_name, contact_method, email, interest_type,
  source_path, consent_to_contact, status
) values (
  'Voluntary Visitor', 'email', 'visitor@example.invalid', 'church_peer_support',
  '/recovery-support-lowell', true, 'new'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000471', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000471","role":"authenticated","aal":"aal1"}', true);

insert into public.gift_posts (
  created_by, post_type, title, description, visibility,
  exchange_type, status, moderation_status
) values (
  auth.uid(), 'offer', 'Ordinary member offer',
  'A fictional ordinary member offer used only to test role changes during update.',
  'church', 'free', 'open', 'pending'
);
select throws_ok(
  $$update public.gift_posts
    set post_type = 'church_need'
    where created_by = auth.uid()$$,
  null,
  null,
  'An ordinary member cannot convert a personal post into an official church need'
);
select throws_ok(
  $$select public.request_recovery_access(
      '27800000-0000-4000-8000-000000000001',
      'This duplicate request must be rejected because membership is already active.'
    )$$,
  null,
  null,
  'An active recovery participant cannot create a redundant pending access request'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000472', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000472","role":"authenticated","aal":"aal2"}', true);
select is(
  (select count(*)::integer from public.recovery_interest_requests),
  0,
  'A content editor cannot read voluntary recovery inquiries'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000473', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000473","role":"authenticated","aal":"aal2"}', true);
select is(
  (select count(*)::integer from public.recovery_interest_requests),
  1,
  'An MFA-verified minister can read the voluntary recovery inquiry queue'
);
reset role;

select * from finish();
rollback;
