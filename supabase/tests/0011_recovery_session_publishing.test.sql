begin;

select plan(4);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-4000-8000-000000000481',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'publishing.minister@example.invalid', '', now(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"Publishing Minister"}', now(), now()
);

update public.profiles
set membership_status = 'active',
    accepted_privacy_at = now(),
    accepted_community_guidelines_at = now()
where id = '00000000-0000-4000-8000-000000000481';

insert into public.role_assignments (user_id, role_id, scope_type, reason)
select
  '00000000-0000-4000-8000-000000000481',
  id,
  'church',
  'Synthetic recovery publishing authorization test'
from public.roles
where key = 'minister';

insert into public.recovery_programs (
  id,
  display_name,
  program_type,
  official_program_confirmation,
  public_summary,
  status,
  created_by
) values (
  '27900000-0000-4000-8000-000000000001',
  'Publishing Test Recovery Ministry',
  'custom',
  false,
  'A fictional private recovery program used only to test transactional leader-session publishing.',
  'active',
  '00000000-0000-4000-8000-000000000481'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000000481',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000000481","role":"authenticated","aal":"aal1"}',
  true
);

select throws_ok(
  $$select public.publish_recovery_session(
      '27900000-0000-4000-8000-000000000001',
      'recovery_journey',
      1,
      'Welcome and safety',
      'A fictional participant summary used only for database authorization testing.',
      array['Psalm 34:18','Galatians 6:2'],
      null,
      now(),
      'A fictional facilitator agenda used only for authorization testing.',
      'Review emergency and referral boundaries.'
    )$$,
  null,
  null,
  'A recovery leader cannot publish without AAL2 MFA'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000000481","role":"authenticated","aal":"aal2"}',
  true
);

select lives_ok(
  $$select public.publish_recovery_session(
      '27900000-0000-4000-8000-000000000001',
      'recovery_journey',
      1,
      'Welcome and safety',
      'A fictional participant summary used only for database authorization testing.',
      array['Psalm 34:18','Galatians 6:2'],
      null,
      now(),
      'A fictional facilitator agenda used only for authorization testing.',
      'Review emergency and referral boundaries.'
    )$$,
  'An MFA-verified recovery leader can publish a participant guide and facilitator agenda'
);
select is(
  (
    select count(*)::integer
    from public.recovery_sessions
    where program_id = '27900000-0000-4000-8000-000000000001'
      and week_number = 1
      and status = 'published'
  ),
  1,
  'The participant session is published'
);
select is(
  (
    select count(*)::integer
    from public.recovery_session_guides rsg
    join public.recovery_sessions rs on rs.id = rsg.session_id
    where rs.program_id = '27900000-0000-4000-8000-000000000001'
      and rsg.leader_agenda like 'A fictional facilitator agenda%'
  ),
  1,
  'The restricted facilitator agenda is stored with the session'
);

reset role;
select * from finish();
rollback;
