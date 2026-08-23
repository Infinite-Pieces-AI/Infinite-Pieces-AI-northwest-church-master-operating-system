begin;

select plan(9);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-4000-8000-000000000501', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'identity.owner@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Identity Owner"}', now(), now()),
  ('00000000-0000-4000-8000-000000000502', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'identity.helper@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Identity Helper"}', now(), now()),
  ('00000000-0000-4000-8000-000000000503', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'identity.minister@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Identity Minister"}', now(), now());

update public.profiles
set membership_status = 'active',
    accepted_privacy_at = now(),
    accepted_community_guidelines_at = now()
where id in (
  '00000000-0000-4000-8000-000000000501',
  '00000000-0000-4000-8000-000000000502',
  '00000000-0000-4000-8000-000000000503'
);

insert into public.role_assignments (user_id, role_id, scope_type, reason)
select assignment.user_id, role_record.id, 'church', 'Synthetic ministry interaction identity test'
from (
  values
    ('00000000-0000-4000-8000-000000000501'::uuid, 'member'::text),
    ('00000000-0000-4000-8000-000000000502'::uuid, 'member'::text),
    ('00000000-0000-4000-8000-000000000503'::uuid, 'minister'::text)
) as assignment(user_id, role_key)
join public.roles role_record on role_record.key = assignment.role_key;

insert into public.recovery_programs (
  id, display_name, program_type, official_program_confirmation,
  public_summary, status, created_by
) values
  (
    '28400000-0000-4000-8000-000000000001',
    'Identity Recovery Program One',
    'custom', false,
    'A fictional private program used only to test record identity and update authorization.',
    'active',
    '00000000-0000-4000-8000-000000000503'
  ),
  (
    '28400000-0000-4000-8000-000000000002',
    'Identity Recovery Program Two',
    'custom', false,
    'A second fictional private program used only to test cross-program update protection.',
    'active',
    '00000000-0000-4000-8000-000000000503'
  );

insert into public.recovery_memberships (
  program_id, profile_id, membership_role, display_mode, consented_at, joined_at
) values
  ('28400000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000502', 'participant', 'first_name', now(), now()),
  ('28400000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000503', 'leader', 'first_name', now(), now()),
  ('28400000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000503', 'leader', 'first_name', now(), now());

insert into public.recovery_posts (
  id, program_id, created_by, post_type, title, body, leader_only, status
) values
  (
    '28500000-0000-4000-8000-000000000001',
    '28400000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000503',
    'announcement',
    'Leader-only identity test post',
    'A fictional leader-only post used only to verify comment identity protection.',
    true,
    'active'
  );

-- Gift posts and response fixture.
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000501', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000501","role":"authenticated","aal":"aal1"}', true);
insert into public.gift_posts (
  id, created_by, post_type, title, description, visibility,
  exchange_type, status, moderation_status
) values (
  '28600000-0000-4000-8000-000000000001',
  auth.uid(),
  'offer',
  'Owner identity gift post',
  'A fictional gift post used only to test response record identity.',
  'church',
  'free',
  'open',
  'pending'
);
reset role;
update public.gift_posts
set moderation_status = 'approved',
    reviewed_by = '00000000-0000-4000-8000-000000000503',
    reviewed_at = now()
where id = '28600000-0000-4000-8000-000000000001';

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000502', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000502","role":"authenticated","aal":"aal1"}', true);
insert into public.gift_posts (
  id, created_by, post_type, title, description, visibility,
  exchange_type, status, moderation_status
) values (
  '28600000-0000-4000-8000-000000000002',
  auth.uid(),
  'offer',
  'Helper-owned identity gift post',
  'A second fictional gift post used only to test response post-ID swapping.',
  'church',
  'free',
  'open',
  'pending'
);
reset role;
update public.gift_posts
set moderation_status = 'approved',
    reviewed_by = '00000000-0000-4000-8000-000000000503',
    reviewed_at = now()
where id = '28600000-0000-4000-8000-000000000002';

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000502', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000502","role":"authenticated","aal":"aal1"}', true);
insert into public.gift_post_responses (
  id, post_id, profile_id, message, status
) values (
  '28700000-0000-4000-8000-000000000001',
  '28600000-0000-4000-8000-000000000001',
  auth.uid(),
  'Original fictional helper response.',
  'interested'
);
select throws_ok(
  $$update public.gift_post_responses
    set post_id = '28600000-0000-4000-8000-000000000002',
        status = 'accepted'
    where id = '28700000-0000-4000-8000-000000000001'$$,
  null,
  null,
  'A responder cannot swap to a post they own and self-accept'
);
select is(
  (select post_id from public.gift_post_responses where id = '28700000-0000-4000-8000-000000000001'),
  '28600000-0000-4000-8000-000000000001'::uuid,
  'The gift response remains attached to its original post'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000501', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000501","role":"authenticated","aal":"aal1"}', true);
select lives_ok(
  $$update public.gift_post_responses
    set status = 'accepted',
        message = 'The post owner must not rewrite this response.'
    where id = '28700000-0000-4000-8000-000000000001'$$,
  'The post owner may accept the response'
);
select is(
  (select message from public.gift_post_responses where id = '28700000-0000-4000-8000-000000000001'),
  'Original fictional helper response.',
  'The post owner cannot rewrite the responder message'
);

-- Prayer interaction identity fixture.
select lives_ok(
  $$select public.submit_member_prayer_request(
      'Prayer identity request',
      'A fictional prayer request used only to test interaction identity.',
      false,
      'church',
      null,
      null,
      'general',
      'normal',
      true,
      true
    )$$,
  'The prayer owner can create the interaction-identity fixture'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000502', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000502","role":"authenticated","aal":"aal1"}', true);
insert into public.prayer_interactions (
  id, request_id, created_by, interaction_type, body
) select
  '28800000-0000-4000-8000-000000000001',
  id,
  auth.uid(),
  'encouragement',
  'Original fictional encouragement.'
from public.prayer_requests
where title = 'Prayer identity request';
select lives_ok(
  $$update public.prayer_interactions
    set interaction_type = 'update',
        body = 'A helper must not convert this into an owner update.'
    where id = '28800000-0000-4000-8000-000000000001'$$,
  'The helper edit is constrained to the original interaction type'
);
select is(
  (select interaction_type from public.prayer_interactions where id = '28800000-0000-4000-8000-000000000001'),
  'encouragement',
  'A prayer encouragement cannot be converted into an owner update'
);

-- Recovery post/comment identity fixtures.
insert into public.recovery_posts (
  id, program_id, created_by, post_type, title, body, leader_only, status
) values (
  '28500000-0000-4000-8000-000000000002',
  '28400000-0000-4000-8000-000000000001',
  auth.uid(),
  'discussion',
  'Participant identity test post',
  'A fictional participant post used only to test cross-program update protection.',
  false,
  'active'
);
select lives_ok(
  $$update public.recovery_posts
    set program_id = '28400000-0000-4000-8000-000000000002',
        title = 'Updated participant title'
    where id = '28500000-0000-4000-8000-000000000002'$$,
  'A participant may edit their post but cannot move it to another program'
);
select is(
  (select program_id from public.recovery_posts where id = '28500000-0000-4000-8000-000000000002'),
  '28400000-0000-4000-8000-000000000001'::uuid,
  'The recovery post remains attached to its original program'
);

insert into public.recovery_post_comments (
  id, post_id, created_by, body, status
) values (
  '28900000-0000-4000-8000-000000000001',
  '28500000-0000-4000-8000-000000000002',
  auth.uid(),
  'Original fictional participant comment.',
  'active'
);
select lives_ok(
  $$update public.recovery_post_comments
    set post_id = '28500000-0000-4000-8000-000000000001',
        body = 'Edited comment that must remain on the original participant post.'
    where id = '28900000-0000-4000-8000-000000000001'$$,
  'A participant may edit their comment but cannot move it to a leader-only post'
);
select is(
  (select post_id from public.recovery_post_comments where id = '28900000-0000-4000-8000-000000000001'),
  '28500000-0000-4000-8000-000000000002'::uuid,
  'The recovery comment remains attached to its original post'
);
reset role;

select * from finish();
rollback;
