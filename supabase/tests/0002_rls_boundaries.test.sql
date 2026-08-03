begin;

select plan(14);

-- Synthetic identities only. The auth trigger creates pending profiles.
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-4000-8000-000000000101', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'member.a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Member A"}', now(), now()),
  ('00000000-0000-4000-8000-000000000102', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'member.b@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Member B"}', now(), now()),
  ('00000000-0000-4000-8000-000000000103', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'technical.admin@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Technical Admin"}', now(), now()),
  ('00000000-0000-4000-8000-000000000104', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'minister@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Minister"}', now(), now()),
  ('00000000-0000-4000-8000-000000000105', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'content.editor@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Content Editor"}', now(), now());

update public.profiles
set membership_status = 'active',
    accepted_privacy_at = now(),
    accepted_community_guidelines_at = now()
where id in (
  '00000000-0000-4000-8000-000000000101',
  '00000000-0000-4000-8000-000000000102',
  '00000000-0000-4000-8000-000000000103',
  '00000000-0000-4000-8000-000000000104',
  '00000000-0000-4000-8000-000000000105'
);

insert into public.role_assignments (user_id, role_id, scope_type, reason)
select '00000000-0000-4000-8000-000000000101', id, 'church', 'Synthetic RLS test' from public.roles where key = 'member';
insert into public.role_assignments (user_id, role_id, scope_type, reason)
select '00000000-0000-4000-8000-000000000102', id, 'church', 'Synthetic RLS test' from public.roles where key = 'member';
insert into public.role_assignments (user_id, role_id, scope_type, reason)
select '00000000-0000-4000-8000-000000000103', id, 'church', 'Synthetic RLS test' from public.roles where key = 'technical_admin';
insert into public.role_assignments (user_id, role_id, scope_type, reason)
select '00000000-0000-4000-8000-000000000104', id, 'church', 'Synthetic RLS test' from public.roles where key = 'minister';
insert into public.role_assignments (user_id, role_id, scope_type, reason)
select '00000000-0000-4000-8000-000000000105', id, 'church', 'Synthetic RLS test' from public.roles where key = 'content_editor';

insert into public.groups (id, name, slug, kind, minimum_members, maximum_members, meeting_slots, status)
values
  ('10000000-0000-4000-8000-000000000001', 'Synthetic Group A', 'synthetic-group-a', 'family_group', 1, 20, array['wednesday'], 'active'),
  ('10000000-0000-4000-8000-000000000002', 'Synthetic Group B', 'synthetic-group-b', 'family_group', 1, 20, array['thursday'], 'active');

insert into public.group_memberships (group_id, profile_id, membership_type)
values
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 'member'),
  ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000102', 'member');

insert into public.channels (id, name, slug, kind, group_id, posting_policy)
values
  ('20000000-0000-4000-8000-000000000001', 'Synthetic Channel A', 'synthetic-channel-a', 'group', '10000000-0000-4000-8000-000000000001', 'members'),
  ('20000000-0000-4000-8000-000000000002', 'Synthetic Channel B', 'synthetic-channel-b', 'group', '10000000-0000-4000-8000-000000000002', 'members');

insert into public.channel_members (channel_id, profile_id, membership_type)
values
  ('20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 'member'),
  ('20000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000102', 'member');

insert into public.messages (id, channel_id, author_id, body)
values
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 'Synthetic message A'),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000102', 'Synthetic message B');

insert into public.households (id, display_name)
values
  ('40000000-0000-4000-8000-000000000001', 'Synthetic Household A'),
  ('40000000-0000-4000-8000-000000000002', 'Synthetic Household B');

insert into public.household_members (household_id, profile_id, can_manage_household)
values
  ('40000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', true),
  ('40000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000102', true);

insert into public.children (id, household_id, preferred_name, created_by)
values
  ('50000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 'Synthetic Child A', '00000000-0000-4000-8000-000000000101'),
  ('50000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000002', 'Synthetic Child B', '00000000-0000-4000-8000-000000000102');

insert into public.guardian_links (child_id, guardian_profile_id, relationship_label, legal_guardian, can_manage_profile)
values
  ('50000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 'Guardian', true, true),
  ('50000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000102', 'Guardian', true, true);

insert into public.prayer_requests (id, author_id, visibility, body)
values ('60000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 'ministers_only', 'Synthetic private prayer request');

-- Member A receives only assigned-channel content and only linked child records.
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000101', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000101","role":"authenticated","aal":"aal1"}', true);

select is((select count(*)::integer from public.messages), 1, 'Member sees only messages in an active assigned channel');
select is((select min(body) from public.messages), 'Synthetic message A', 'Knowledge of another channel ID grants no read access');
select is((select count(*)::integer from public.children), 1, 'Guardian sees only a directly linked child');
select is((select min(preferred_name) from public.children), 'Synthetic Child A', 'Guardian cannot read a child from another household');
select is((select count(*)::integer from public.prayer_requests), 1, 'Author can still read their own ministers-only prayer request');
reset role;

-- Revocation must take effect without a new URL or application deployment.
update public.channel_members
set ended_at = now()
where channel_id = '20000000-0000-4000-8000-000000000001'
  and profile_id = '00000000-0000-4000-8000-000000000101';

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000101', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000101","role":"authenticated","aal":"aal1"}', true);
select is((select count(*)::integer from public.messages), 0, 'Ending channel membership immediately revokes message access');
reset role;

-- Ordinary Member B cannot read Household A's child.
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000102', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000102","role":"authenticated","aal":"aal1"}', true);
select is((select count(*)::integer from public.children where id = '50000000-0000-4000-8000-000000000001'), 0, 'Another member cannot read a child by guessing its identifier');
reset role;

-- Infrastructure administrators do not inherit pastoral visibility.
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000103', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000103","role":"authenticated","aal":"aal2"}', true);
select is((select count(*)::integer from public.prayer_requests), 0, 'Technical administrator has no blanket prayer-request access');
reset role;

-- Privileged operations require both the assigned role and AAL2.
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000104', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000104","role":"authenticated","aal":"aal1"}', true);
select is(public.is_privileged_actor(array['minister']), false, 'Minister role at AAL1 is not a privileged actor');
select is((select count(*)::integer from public.prayer_requests), 0, 'Minister at AAL1 cannot read restricted pastoral content');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000104","role":"authenticated","aal":"aal2"}', true);
select is(public.is_privileged_actor(array['minister']), true, 'Minister role becomes privileged only at AAL2');
reset role;

-- Content editors may draft and submit content for review, but only ministers
-- or super administrators may place content into a publishable state.
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000105', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000105","role":"authenticated","aal":"aal2"}', true);
select is(public.can_manage_publication_state('draft'), true, 'Content editor can manage draft publication state');
select is(public.can_manage_publication_state('published'), false, 'Content editor cannot publish directly');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000104', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000104","role":"authenticated","aal":"aal2"}', true);
select is(public.can_manage_publication_state('published'), true, 'MFA-authenticated minister can manage published state');
reset role;

select * from finish();
rollback;
