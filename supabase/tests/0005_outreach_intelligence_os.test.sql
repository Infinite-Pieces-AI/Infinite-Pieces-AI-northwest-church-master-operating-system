begin;

select plan(19);

select has_table('public', 'outreach_source_connectors', 'Outreach source connector table exists');
select has_table('public', 'public_conversation_signals', 'Public conversation signal table exists');
select has_table('public', 'public_conversation_actions', 'Human-reviewed public response action table exists');
select has_table('public', 'ai_visibility_runs', 'AI visibility run table exists');
select has_table('public', 'ai_visibility_checks', 'AI visibility check table exists');
select has_table('public', 'outreach_funnel_snapshots', 'Aggregate funnel table exists');
select has_table('public', 'outreach_channel_attribution', 'Aggregate channel attribution table exists');

select is(
  (
    select count(*)::integer
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in (
        'outreach_source_connectors',
        'public_conversation_signals',
        'public_conversation_actions',
        'ai_visibility_runs',
        'ai_visibility_checks',
        'outreach_funnel_snapshots',
        'outreach_channel_attribution'
      )
      and c.relkind = 'r'
      and not c.relrowsecurity
  ),
  0,
  'Every Outreach Intelligence table has RLS enabled'
);

select is(
  (select count(*)::integer from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'public_conversation_signals' and policyname = 'public_conversation_signals_outreach_read'),
  1,
  'Public conversation signals have an outreach-role read policy'
);
select is(
  (select count(*)::integer from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'outreach_source_connectors' and policyname = 'outreach_connectors_privileged_manage'),
  1,
  'Connector management is role restricted'
);
select is(
  (
    select count(*)::integer
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'public_conversation_signals'
      and column_name = 'person_identifier'
  ),
  0,
  'Signals do not store a person identifier'
);
select is(
  (
    select count(*)::integer
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'public_conversation_signals'
      and column_name = 'inferred_religious_belief'
  ),
  0,
  'Signals do not store inferred religious belief'
);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-4000-8000-000000000301', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'outreach.member@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Outreach Member"}', now(), now()),
  ('00000000-0000-4000-8000-000000000302', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'outreach.minister@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Outreach Minister"}', now(), now());

update public.profiles
set membership_status = 'active', accepted_privacy_at = now(), accepted_community_guidelines_at = now()
where id in ('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000302');

insert into public.role_assignments (user_id, role_id, scope_type, reason)
select '00000000-0000-4000-8000-000000000301', id, 'church', 'Synthetic Outreach RLS test'
from public.roles where key = 'member';
insert into public.role_assignments (user_id, role_id, scope_type, reason)
select '00000000-0000-4000-8000-000000000302', id, 'church', 'Synthetic Outreach RLS test'
from public.roles where key = 'minister';

insert into public.outreach_source_connectors (
  id, key, display_name, source_kind, purpose, base_url, publicly_accessible,
  status, accountable_owner_id, terms_reviewed_by, terms_reviewed_at
) values (
  '21000000-0000-4000-8000-000000000001',
  'synthetic-public-feed',
  'Synthetic Public Feed',
  'public_rss',
  'Synthetic public-source connector used only for database authorization testing.',
  'https://example.invalid/public-feed',
  true,
  'approved',
  '00000000-0000-4000-8000-000000000302',
  '00000000-0000-4000-8000-000000000302',
  now()
);

insert into public.public_conversation_signals (
  id, connector_id, source_kind, source_label, source_url, source_fingerprint,
  title, excerpt, published_at, locality, themes, explicit_church_request,
  local_relevance, church_intent, family_relevance, online_ministry_intent,
  freshness, reply_opportunity, content_opportunity, search_opportunity,
  risk_sensitivity, priority_score, recommendation
) values (
  '22000000-0000-4000-8000-000000000001',
  '21000000-0000-4000-8000-000000000001',
  'public_rss',
  'Synthetic public feed',
  'https://example.invalid/public-feed/item-1',
  'synthetic-public-signal-fingerprint-000000000001',
  'Synthetic public question about a church in Lowell',
  'A synthetic public excerpt used only to verify the Outreach Intelligence authorization boundary.',
  now(),
  'Lowell, Massachusetts',
  array['Lowell','Church'],
  true,
  100, 100, 20, 10, 90, 85, 80, 82, 5, 88,
  'Prepare a transparent response draft for human review.'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000301', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000301","role":"authenticated","aal":"aal1"}', true);
select is(
  (select count(*)::integer from public.public_conversation_signals),
  0,
  'An ordinary member cannot read Outreach Intelligence signals'
);
select is(
  (select count(*)::integer from public.outreach_source_connectors),
  0,
  'An ordinary member cannot read connector configuration'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000302', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000302","role":"authenticated","aal":"aal2"}', true);
select is(
  (select count(*)::integer from public.public_conversation_signals),
  1,
  'An MFA-verified minister can read public conversation signals'
);

insert into public.public_conversation_actions (
  signal_id, action_type, rationale, disclosure_text, draft_text,
  approved_next_step_url, created_by
) values (
  '22000000-0000-4000-8000-000000000001',
  'draft_response',
  'Synthetic transparent response test.',
  'I am part of Boston Church Lowell and want to be transparent about my connection.',
  'Synthetic response draft requiring human review.',
  'https://example.invalid/plan-a-visit',
  '00000000-0000-4000-8000-000000000302'
);
select is(
  (select count(*)::integer from public.public_conversation_actions),
  1,
  'An MFA-verified minister can create a human-review response draft'
);
select is(
  (select requires_human_review from public.public_conversation_actions limit 1),
  true,
  'Every public response action requires human review'
);
select is(
  (select publish_automatically from public.public_conversation_actions limit 1),
  false,
  'Automatic publication remains disabled'
);
reset role;

select throws_ok(
  $$insert into public.outreach_source_connectors (
      key, display_name, source_kind, purpose, base_url, private_or_membership_only
    ) values (
      'synthetic-private-group', 'Synthetic Private Group', 'public_forum',
      'This deliberately invalid connector verifies the private-source guardrail.',
      'https://example.invalid/private-group', true
    )$$,
  '23514',
  null,
  'Database constraints reject private or membership-only source connectors'
);

select * from finish();
rollback;
