begin;

select plan(28);

select has_table('public', 'public_questions', 'General public questions have a dedicated table');
select has_table('public', 'public_prayer_requests', 'Public prayer intake has a restricted dedicated table');
select has_table('public', 'ministry_journey_events', 'Connected ministry journey stages exist');
select has_table('public', 'fellowship_meetup_cohosts', 'Fellowship co-hosts exist');
select has_table('public', 'service_opportunities', 'Service opportunity table exists');
select has_table('public', 'service_shifts', 'Service shift table exists');
select has_table('public', 'service_shift_signups', 'Service signup table exists');
select has_table('public', 'connection_pathway_enrollments', 'Voluntary pathway enrollment exists');
select has_table('public', 'connection_pathway_steps', 'Member-owned pathway steps exist');
select has_table('public', 'outreach_opportunity_assessments', 'Explainable opportunity assessments exist');
select has_table('public', 'site_quality_crawl_runs', 'First-party crawl runs exist');
select has_table('public', 'site_quality_findings', 'Site quality findings exist');
select has_table('public', 'canonical_public_facts', 'Canonical public facts exist');
select has_table('public', 'business_profile_eligibility_reviews', 'Business Profile eligibility reviews exist');
select has_table('public', 'outreach_access_events', 'Outreach AAL2 access events exist');

select has_function('public', 'submit_plan_visit_request', array['text','text','text','text','text','integer','boolean','text','boolean','text','text','text'], 'Consent-first visit RPC exists');
select has_function('public', 'submit_public_question', array['text','text','text','text','text','text','boolean','text','text'], 'General question RPC exists');
select has_function('public', 'submit_prayer_request', array['text','text','boolean','text','text','text','boolean','text','text'], 'Restricted prayer RPC exists');
select has_function('public', 'record_public_conversion_event', array['text','text','text','jsonb'], 'Privacy-minimized public analytics RPC exists');
select has_function('public', 'service_shift_signup_count', array['uuid'], 'Aggregate service shift count exists');
select has_function('public', 'record_outreach_access', array['text','timestamp with time zone'], 'AAL2 Outreach access audit function exists');

select is(
  (
    select count(*)::integer
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in (
        'public_questions','public_prayer_requests','ministry_journey_events','fellowship_meetup_cohosts',
        'service_opportunities','service_shifts','service_shift_signups','connection_pathway_enrollments',
        'connection_pathway_steps','outreach_opportunity_assessments','site_quality_crawl_runs',
        'site_quality_findings','canonical_public_facts','business_profile_eligibility_reviews',
        'outreach_access_events'
      )
      and c.relkind = 'r'
      and not c.relrowsecurity
  ),
  0,
  'Every connected-journey table has RLS enabled'
);

select is((select count(*)::integer from information_schema.columns where table_schema = 'public' and table_name = 'visit_requests' and column_name = 'prayer_text'), 0, 'Visit records cannot contain prayer text');
select is((select count(*)::integer from information_schema.columns where table_schema = 'public' and table_name = 'public_prayer_requests' and column_name = 'prayer_text'), 1, 'Public prayer text exists only in the restricted public prayer table');

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-4000-8000-000000000401', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'journey.member.a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Journey Member A"}', now(), now()),
  ('00000000-0000-4000-8000-000000000402', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'journey.member.b@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Journey Member B"}', now(), now());

update public.profiles set membership_status = 'active', accepted_privacy_at = now(), accepted_community_guidelines_at = now()
where id in ('00000000-0000-4000-8000-000000000401','00000000-0000-4000-8000-000000000402');

insert into public.role_assignments(user_id, role_id, scope_type, reason)
select '00000000-0000-4000-8000-000000000401', id, 'church', 'Connected journey RLS test' from public.roles where key = 'member';
insert into public.role_assignments(user_id, role_id, scope_type, reason)
select '00000000-0000-4000-8000-000000000402', id, 'church', 'Connected journey RLS test' from public.roles where key = 'member';

insert into public.public_questions(first_name, contact_method, email, topic, message, consent_to_contact)
values ('Synthetic', 'email', 'question@example.invalid', 'first_visit', 'A synthetic general question for authorization testing.', true);
insert into public.public_prayer_requests(prayer_text, response_requested, consent_to_contact)
values ('Synthetic restricted public prayer text.', false, false);
insert into public.service_opportunities(
  id, title, need_statement, impact_statement, partner_name, general_location,
  publication_status, published_by, published_at
) values (
  '31000000-0000-4000-8000-000000000001', 'Synthetic service opportunity',
  'A synthetic community need used only for authorization testing.',
  'A synthetic impact statement used only for authorization testing.',
  'Synthetic Partner', 'Synthetic public site', 'published',
  '00000000-0000-4000-8000-000000000402', now()
);
insert into public.service_shifts(id, opportunity_id, starts_at, ends_at, capacity)
values ('32000000-0000-4000-8000-000000000001','31000000-0000-4000-8000-000000000001',now() + interval '1 day',now() + interval '1 day 2 hours',20);
insert into public.connection_pathway_enrollments(profile_id) values
  ('00000000-0000-4000-8000-000000000401'),
  ('00000000-0000-4000-8000-000000000402');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000401', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000401","role":"authenticated","aal":"aal1"}', true);
select is((select count(*)::integer from public.public_questions), 0, 'An ordinary member cannot read public-question CRM content');
select is((select count(*)::integer from public.public_prayer_requests), 0, 'An ordinary member cannot read restricted public prayer content');
select is((select count(*)::integer from public.service_opportunities), 1, 'An active member can read published service opportunities');
select is((select count(*)::integer from public.connection_pathway_enrollments), 1, 'A member sees only their own voluntary connection pathway');
reset role;

select * from finish();
rollback;
