begin;

select plan(10);

select is(
  (
    select count(*)::integer
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename = 'gift_posts'
      and policyname = 'gift_posts_moderator_read'
  ),
  1,
  'Gift moderators have an explicit pending-post read policy'
);
select is(
  (
    select count(*)::integer
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename = 'recovery_programs'
      and policyname = 'recovery_programs_privileged_insert'
  ),
  1,
  'Recovery program creation has a privileged insert policy'
);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-4000-8000-000000000451', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'hardening.member@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Hardening Member"}', now(), now()),
  ('00000000-0000-4000-8000-000000000452', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'hardening.minister@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Hardening Minister"}', now(), now());

update public.profiles
set membership_status = 'active', accepted_privacy_at = now(), accepted_community_guidelines_at = now()
where id in (
  '00000000-0000-4000-8000-000000000451',
  '00000000-0000-4000-8000-000000000452'
);

insert into public.role_assignments (user_id, role_id, scope_type, reason)
select assignment.user_id, role_record.id, 'church', 'Synthetic ministry policy hardening test'
from (
  values
    ('00000000-0000-4000-8000-000000000451'::uuid, 'member'::text),
    ('00000000-0000-4000-8000-000000000452'::uuid, 'minister'::text)
) as assignment(user_id, role_key)
join public.roles role_record on role_record.key = assignment.role_key;

insert into public.recovery_programs (
  id, display_name, program_type, official_program_confirmation, public_summary,
  meeting_day, general_location, status, accepting_access_requests,
  public_interest_enabled, created_by
) values (
  '27500000-0000-4000-8000-000000000001',
  'Hardening Recovery Ministry',
  'custom', false,
  'A fictional private recovery program used only to verify participant posting policies.',
  'Sunday', 'Lowell general area', 'active', true, false,
  '00000000-0000-4000-8000-000000000452'
);
insert into public.recovery_memberships (
  program_id, profile_id, membership_role, display_mode, consented_at, joined_at
) values (
  '27500000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000451',
  'participant', 'first_name', now(), now()
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000451', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000451","role":"authenticated","aal":"aal1"}', true);
select throws_ok(
  $$insert into public.recovery_programs (
      display_name, program_type, official_program_confirmation, public_summary,
      status, created_by
    ) values (
      'Unauthorized Program', 'custom', false,
      'This ordinary-member program insertion must be rejected by row-level security.',
      'active', auth.uid()
    )$$,
  '42501',
  null,
  'An ordinary member cannot create a recovery program'
);

insert into public.gift_assessments (
  id, profile_id, provider_key, dominant_theme, completed_at,
  share_summary_with_leaders
) values (
  '27600000-0000-4000-8000-000000000001',
  auth.uid(), 'manual', 'relational', now(), false
);
insert into public.gift_strengths (
  assessment_id, gift_key, gift_label, score_percent, strength_band, theme
) values (
  '27600000-0000-4000-8000-000000000001',
  'hospitality', 'Hospitality', 90, 'dominant', 'relational'
);

select lives_ok(
  $$insert into public.recovery_posts (
      program_id, created_by, post_type, title, body, leader_only, status
    ) values (
      '27500000-0000-4000-8000-000000000001',
      auth.uid(), 'discussion', 'Participant discussion',
      'A fictional participant discussion used only for policy testing.', false, 'active'
    )$$,
  'A recovery participant may create a normal discussion post'
);
select throws_ok(
  $$insert into public.recovery_posts (
      program_id, created_by, post_type, title, body, leader_only, status
    ) values (
      '27500000-0000-4000-8000-000000000001',
      auth.uid(), 'announcement', 'Unauthorized announcement',
      'A participant must not publish an official recovery announcement.', false, 'active'
    )$$,
  '42501',
  null,
  'A recovery participant cannot publish an announcement'
);
select throws_ok(
  $$insert into public.recovery_posts (
      program_id, created_by, post_type, title, body, leader_only, status
    ) values (
      '27500000-0000-4000-8000-000000000001',
      auth.uid(), 'discussion', 'Unauthorized leader note',
      'A participant must not create a leader-only post.', true, 'active'
    )$$,
  '42501',
  null,
  'A recovery participant cannot create a leader-only post'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000452', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000452","role":"authenticated","aal":"aal2"}', true);
select is(
  (select count(*)::integer from public.gift_assessments where id = '27600000-0000-4000-8000-000000000001'),
  0,
  'A minister cannot read a gift assessment that the member has not shared'
);
select is(
  (select count(*)::integer from public.gift_strengths where assessment_id = '27600000-0000-4000-8000-000000000001'),
  0,
  'A minister cannot read unshared gift strengths'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000451', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000451","role":"authenticated","aal":"aal1"}', true);
update public.gift_assessments
set share_summary_with_leaders = true
where id = '27600000-0000-4000-8000-000000000001';
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000452', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000452","role":"authenticated","aal":"aal2"}', true);
select is(
  (select count(*)::integer from public.gift_assessments where id = '27600000-0000-4000-8000-000000000001'),
  1,
  'A minister can read a gift assessment after the member explicitly shares it'
);
select is(
  (select count(*)::integer from public.gift_strengths where assessment_id = '27600000-0000-4000-8000-000000000001'),
  1,
  'A minister can read shared gift strengths'
);
reset role;

select * from finish();
rollback;
