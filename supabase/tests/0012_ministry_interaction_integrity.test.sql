begin;

select plan(11);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-4000-8000-000000000491', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'interaction.owner@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Interaction Owner"}', now(), now()),
  ('00000000-0000-4000-8000-000000000492', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'interaction.helper@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Interaction Helper"}', now(), now()),
  ('00000000-0000-4000-8000-000000000493', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'interaction.minister@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Interaction Minister"}', now(), now());

update public.profiles
set membership_status = 'active',
    accepted_privacy_at = now(),
    accepted_community_guidelines_at = now()
where id in (
  '00000000-0000-4000-8000-000000000491',
  '00000000-0000-4000-8000-000000000492',
  '00000000-0000-4000-8000-000000000493'
);

insert into public.role_assignments (user_id, role_id, scope_type, reason)
select assignment.user_id, role_record.id, 'church', 'Synthetic ministry interaction integrity test'
from (
  values
    ('00000000-0000-4000-8000-000000000491'::uuid, 'member'::text),
    ('00000000-0000-4000-8000-000000000492'::uuid, 'member'::text),
    ('00000000-0000-4000-8000-000000000493'::uuid, 'minister'::text)
) as assignment(user_id, role_key)
join public.roles role_record on role_record.key = assignment.role_key;

insert into public.recovery_programs (
  id, display_name, program_type, official_program_confirmation,
  public_summary, status, created_by
) values (
  '28000000-0000-4000-8000-000000000001',
  'Interaction Integrity Recovery Ministry',
  'custom', false,
  'A fictional private recovery program used only to test post and comment integrity.',
  'active',
  '00000000-0000-4000-8000-000000000493'
);
insert into public.recovery_memberships (
  program_id, profile_id, membership_role, display_mode, consented_at, joined_at
) values
  ('28000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000492', 'participant', 'first_name', now(), now()),
  ('28000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000493', 'leader', 'first_name', now(), now());

insert into public.recovery_posts (
  id, program_id, created_by, post_type, title, body, leader_only, status
) values (
  '28100000-0000-4000-8000-000000000001',
  '28000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000493',
  'announcement',
  'Restricted leader announcement',
  'A fictional leader-only announcement used only for direct-record authorization testing.',
  true,
  'active'
);

-- Gift owner creates a moderated post.
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000491', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000491","role":"authenticated","aal":"aal1"}', true);
insert into public.gift_posts (
  id, created_by, post_type, title, description, visibility,
  exchange_type, status, moderation_status
) values (
  '28200000-0000-4000-8000-000000000001',
  auth.uid(),
  'offer',
  'Fictional hospitality offer',
  'A fictional gift offer used only to test response decision boundaries.',
  'church',
  'free',
  'open',
  'approved'
);
-- Approve directly for the test fixture after the member insert trigger forced pending.
reset role;
update public.gift_posts
set moderation_status = 'approved',
    reviewed_by = '00000000-0000-4000-8000-000000000493',
    reviewed_at = now()
where id = '28200000-0000-4000-8000-000000000001';

-- Helper responds and may withdraw, but cannot accept themselves.
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000492', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000492","role":"authenticated","aal":"aal1"}', true);
select lives_ok(
  $$insert into public.gift_post_responses (
      id, post_id, profile_id, message, status
    ) values (
      '28300000-0000-4000-8000-000000000001',
      '28200000-0000-4000-8000-000000000001',
      auth.uid(),
      'I may be able to help with this fictional hospitality need.',
      'interested'
    )$$,
  'A member may express interest in another member’s approved gift post'
);
select throws_ok(
  $$update public.gift_post_responses
    set status = 'accepted'
    where id = '28300000-0000-4000-8000-000000000001'$$,
  null,
  null,
  'A responder cannot mark their own gift response accepted'
);
select lives_ok(
  $$update public.gift_post_responses
    set status = 'withdrawn'
    where id = '28300000-0000-4000-8000-000000000001'$$,
  'A responder may withdraw their own interest'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000491', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000491","role":"authenticated","aal":"aal1"}', true);
select lives_ok(
  $$update public.gift_post_responses
    set status = 'accepted'
    where id = '28300000-0000-4000-8000-000000000001'$$,
  'The gift-post owner may accept a private response'
);
select is(
  (
    select status
    from public.gift_post_responses
    where id = '28300000-0000-4000-8000-000000000001'
  ),
  'accepted',
  'The accepted gift-response decision is retained'
);

-- Prayer owner submits a request.
select lives_ok(
  $$select public.submit_member_prayer_request(
      'Prayer interaction ownership',
      'A fictional request used only to verify owner-update and member-encouragement boundaries.',
      false,
      'church',
      null,
      null,
      'general',
      'normal',
      true,
      true
    )$$,
  'A member can submit a normal church-visible prayer request'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000492', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000492","role":"authenticated","aal":"aal1"}', true);
select lives_ok(
  $$insert into public.prayer_interactions (
      request_id, created_by, interaction_type, body
    ) select id, auth.uid(), 'encouragement',
      'A fictional encouragement used only for authorization testing.'
    from public.prayer_requests
    where title = 'Prayer interaction ownership'$$,
  'An authorized member may encourage a normal prayer request'
);
select throws_ok(
  $$insert into public.prayer_interactions (
      request_id, created_by, interaction_type, body
    ) select id, auth.uid(), 'update',
      'This non-owner update must be rejected.'
    from public.prayer_requests
    where title = 'Prayer interaction ownership'$$,
  '42501',
  null,
  'A non-owner cannot publish an owner update on another member’s prayer'
);

-- Recovery participant cannot target or transform leader-only content.
select throws_ok(
  $$insert into public.recovery_post_comments (
      post_id, created_by, body, status
    ) values (
      '28100000-0000-4000-8000-000000000001',
      auth.uid(),
      'This direct-ID comment must be rejected.',
      'active'
    )$$,
  null,
  null,
  'A recovery participant cannot comment on a leader-only post by record ID'
);
insert into public.recovery_posts (
  id, program_id, created_by, post_type, title, body, leader_only, status
) values (
  '28100000-0000-4000-8000-000000000002',
  '28000000-0000-4000-8000-000000000001',
  auth.uid(),
  'discussion',
  'Participant discussion post',
  'A fictional participant discussion used only for update-boundary testing.',
  false,
  'active'
);
select throws_ok(
  $$update public.recovery_posts
    set leader_only = true,
        post_type = 'announcement'
    where id = '28100000-0000-4000-8000-000000000002'$$,
  null,
  null,
  'A recovery participant cannot convert their post into leader-only official content'
);
select is(
  (
    select count(*)::integer
    from public.recovery_post_comments
    where post_id = '28100000-0000-4000-8000-000000000001'
  ),
  0,
  'No participant comment is stored on the leader-only recovery post'
);
reset role;

select * from finish();
rollback;
