begin;

-- -----------------------------------------------------------------------------
-- Outreach Intelligence OS
-- Public and aggregate intelligence only. These tables intentionally do not
-- include a person identifier, inferred religious belief, private search history,
-- prayer content, child data, counseling, or Church Hub activity.
-- -----------------------------------------------------------------------------

create table public.outreach_source_connectors (
  id uuid primary key default extensions.gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  display_name text not null check (char_length(display_name) between 3 and 120),
  source_kind text not null check (
    source_kind in ('public_api','public_rss','public_web','public_forum','public_social','search_console','public_analytics','ai_visibility','meeting_provider','publishing_account')
  ),
  purpose text not null check (char_length(purpose) between 10 and 1000),
  base_url text check (base_url is null or base_url ~ '^https://'),
  allowed_hosts text[] not null default '{}',
  configuration jsonb not null default '{}'::jsonb,
  secret_reference text check (secret_reference is null or char_length(secret_reference) <= 300),
  publicly_accessible boolean not null default true,
  requires_login boolean not null default false,
  private_or_membership_only boolean not null default false,
  access_bypass_required boolean not null default false,
  automatic_contact boolean not null default false check (automatic_contact = false),
  automatic_reply boolean not null default false check (automatic_reply = false),
  automatic_publishing boolean not null default false check (automatic_publishing = false),
  retention_days integer not null default 90 check (retention_days between 1 and 365),
  status text not null default 'disabled' check (status in ('disabled','review','approved','suspended','retired')),
  accountable_owner_id uuid references public.profiles(id) on delete set null,
  terms_reviewed_by uuid references public.profiles(id) on delete set null,
  terms_reviewed_at timestamptz,
  last_run_at timestamptz,
  last_run_status text check (last_run_status is null or last_run_status in ('success','partial','failed','dry_run','disabled')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (jsonb_typeof(configuration) = 'object'),
  check (not private_or_membership_only),
  check (not access_bypass_required),
  check ((status <> 'approved') or (accountable_owner_id is not null and terms_reviewed_by is not null and terms_reviewed_at is not null)),
  check ((source_kind in ('search_console','public_analytics','meeting_provider','publishing_account')) or publicly_accessible),
  check ((not requires_login) or source_kind in ('search_console','public_analytics','meeting_provider','publishing_account'))
);
create index outreach_source_connectors_status_idx
  on public.outreach_source_connectors(status, source_kind);

create table public.public_conversation_signals (
  id uuid primary key default extensions.gen_random_uuid(),
  connector_id uuid references public.outreach_source_connectors(id) on delete set null,
  source_kind text not null check (source_kind in ('public_forum','public_comment','public_web','public_rss','public_social')),
  source_label text not null check (char_length(source_label) between 2 and 160),
  source_url text not null check (source_url ~ '^https://'),
  source_fingerprint text not null unique check (char_length(source_fingerprint) between 32 and 200),
  title text not null check (char_length(title) between 3 and 500),
  excerpt text not null check (char_length(excerpt) between 10 and 2000),
  published_at timestamptz,
  locality text not null default 'Unspecified' check (char_length(locality) between 2 and 160),
  themes text[] not null default '{}',
  explicit_church_request boolean not null default false,
  local_relevance integer not null check (local_relevance between 0 and 100),
  church_intent integer not null check (church_intent between 0 and 100),
  family_relevance integer not null check (family_relevance between 0 and 100),
  online_ministry_intent integer not null check (online_ministry_intent between 0 and 100),
  freshness integer not null check (freshness between 0 and 100),
  reply_opportunity integer not null check (reply_opportunity between 0 and 100),
  content_opportunity integer not null check (content_opportunity between 0 and 100),
  search_opportunity integer not null check (search_opportunity between 0 and 100),
  risk_sensitivity integer not null check (risk_sensitivity between 0 and 100),
  priority_score integer not null check (priority_score between 0 and 100),
  recommendation text check (recommendation is null or char_length(recommendation) <= 2000),
  status text not null default 'new' check (status in ('new','saved','response_drafted','content_queued','dismissed','expired','removed')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  expires_at timestamptz not null default (timezone('utc', now()) + interval '90 days'),
  ingested_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (expires_at > ingested_at)
);
create index public_conversation_signals_priority_idx
  on public.public_conversation_signals(status, priority_score desc, published_at desc);
create index public_conversation_signals_expiry_idx
  on public.public_conversation_signals(expires_at)
  where status not in ('expired','removed');
create index public_conversation_signals_connector_idx
  on public.public_conversation_signals(connector_id, ingested_at desc);

create table public.public_conversation_actions (
  id uuid primary key default extensions.gen_random_uuid(),
  signal_id uuid not null references public.public_conversation_signals(id) on delete cascade,
  action_type text not null check (action_type in ('save','dismiss','draft_response','content_brief','landing_page','social_draft','video_brief','event_brief')),
  rationale text check (rationale is null or char_length(rationale) <= 2000),
  disclosure_text text check (disclosure_text is null or char_length(disclosure_text) <= 1000),
  draft_text text check (draft_text is null or char_length(draft_text) <= 10000),
  approved_next_step_url text check (approved_next_step_url is null or approved_next_step_url ~ '^https://'),
  status text not null default 'draft' check (status in ('draft','in_review','approved','rejected','completed','cancelled')),
  requires_human_review boolean not null default true check (requires_human_review = true),
  publish_automatically boolean not null default false check (publish_automatically = false),
  created_by uuid not null references public.profiles(id) on delete restrict,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check ((status not in ('approved','completed')) or (reviewed_by is not null and reviewed_at is not null))
);
create index public_conversation_actions_signal_idx
  on public.public_conversation_actions(signal_id, created_at desc);
create index public_conversation_actions_queue_idx
  on public.public_conversation_actions(status, created_at)
  where status in ('draft','in_review','approved');

create table public.ai_visibility_runs (
  id uuid primary key default extensions.gen_random_uuid(),
  provider_key text not null check (provider_key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  locality text not null check (char_length(locality) between 2 and 160),
  prompt_count integer not null check (prompt_count between 1 and 500),
  status text not null default 'queued' check (status in ('queued','running','completed','partial','failed','cancelled')),
  dry_run boolean not null default true,
  requested_by uuid references public.profiles(id) on delete set null,
  started_at timestamptz,
  completed_at timestamptz,
  error_summary text check (error_summary is null or char_length(error_summary) <= 2000),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check ((status <> 'completed') or completed_at is not null)
);

create table public.ai_visibility_checks (
  id uuid primary key default extensions.gen_random_uuid(),
  run_id uuid not null references public.ai_visibility_runs(id) on delete cascade,
  prompt text not null check (char_length(prompt) between 3 and 1000),
  church_mentioned boolean,
  facts_accurate boolean,
  coverage_score integer not null check (coverage_score between 0 and 100),
  public_evidence_urls text[] not null default '{}',
  evidence_excerpt text check (evidence_excerpt is null or char_length(evidence_excerpt) <= 3000),
  content_gap text check (content_gap is null or char_length(content_gap) <= 2000),
  checked_at timestamptz not null default timezone('utc', now()),
  unique(run_id, prompt)
);
create index ai_visibility_checks_run_idx on public.ai_visibility_checks(run_id, coverage_score);

create table public.outreach_funnel_snapshots (
  id uuid primary key default extensions.gen_random_uuid(),
  snapshot_date date not null,
  funnel_key text not null check (funnel_key in ('local_visit','online_conversation','bible_study','public_event','general_contact')),
  stage_key text not null check (stage_key ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'),
  stage_label text not null check (char_length(stage_label) between 2 and 120),
  aggregate_value integer not null check (aggregate_value >= 0),
  source_system text not null check (char_length(source_system) between 2 and 120),
  created_at timestamptz not null default timezone('utc', now()),
  unique(snapshot_date, funnel_key, stage_key, source_system)
);
create index outreach_funnel_snapshots_date_idx
  on public.outreach_funnel_snapshots(snapshot_date desc, funnel_key);

create table public.outreach_channel_attribution (
  id uuid primary key default extensions.gen_random_uuid(),
  snapshot_date date not null,
  channel_key text not null check (channel_key ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'),
  channel_label text not null check (char_length(channel_label) between 2 and 120),
  aggregate_visits integer not null check (aggregate_visits >= 0),
  aggregate_conversions integer not null check (aggregate_conversions >= 0),
  source_system text not null check (char_length(source_system) between 2 and 120),
  created_at timestamptz not null default timezone('utc', now()),
  unique(snapshot_date, channel_key, source_system),
  check (aggregate_conversions <= aggregate_visits or aggregate_visits = 0)
);
create index outreach_channel_attribution_date_idx
  on public.outreach_channel_attribution(snapshot_date desc, channel_key);

create trigger outreach_source_connectors_set_updated_at
  before update on public.outreach_source_connectors
  for each row execute function public.set_updated_at();
create trigger public_conversation_signals_set_updated_at
  before update on public.public_conversation_signals
  for each row execute function public.set_updated_at();
create trigger public_conversation_actions_set_updated_at
  before update on public.public_conversation_actions
  for each row execute function public.set_updated_at();
create trigger ai_visibility_runs_set_updated_at
  before update on public.ai_visibility_runs
  for each row execute function public.set_updated_at();

create or replace function public.on_outreach_action_approved()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if new.status = 'approved'
    and (tg_op = 'INSERT' or old.status is distinct from 'approved') then
    perform public.enqueue_outbox_event(
      'public_conversation_action',
      new.id,
      'outreach.action.approved',
      jsonb_build_object(
        'action_id', new.id,
        'signal_id', new.signal_id,
        'action_type', new.action_type,
        'publish_automatically', false
      )
    );
  end if;
  return new;
end;
$$;

create trigger public_conversation_action_approved_outbox
  after insert or update on public.public_conversation_actions
  for each row execute function public.on_outreach_action_approved();

alter table public.outreach_source_connectors enable row level security;
alter table public.public_conversation_signals enable row level security;
alter table public.public_conversation_actions enable row level security;
alter table public.ai_visibility_runs enable row level security;
alter table public.ai_visibility_checks enable row level security;
alter table public.outreach_funnel_snapshots enable row level security;
alter table public.outreach_channel_attribution enable row level security;

create policy outreach_connectors_privileged_read
  on public.outreach_source_connectors for select to authenticated
  using (public.is_privileged_actor(array['minister','technical_admin','super_admin']));
create policy outreach_connectors_privileged_manage
  on public.outreach_source_connectors for all to authenticated
  using (public.is_privileged_actor(array['minister','technical_admin','super_admin']))
  with check (public.is_privileged_actor(array['minister','technical_admin','super_admin']));

create policy public_conversation_signals_outreach_read
  on public.public_conversation_signals for select to authenticated
  using (public.is_privileged_actor(array['minister','super_admin']));
create policy public_conversation_signals_outreach_update
  on public.public_conversation_signals for update to authenticated
  using (public.is_privileged_actor(array['minister','super_admin']))
  with check (public.is_privileged_actor(array['minister','super_admin']));

create policy public_conversation_actions_outreach_manage
  on public.public_conversation_actions for all to authenticated
  using (public.is_privileged_actor(array['minister','super_admin']))
  with check (public.is_privileged_actor(array['minister','super_admin']));

create policy ai_visibility_runs_outreach_read
  on public.ai_visibility_runs for select to authenticated
  using (public.is_privileged_actor(array['content_editor','minister','super_admin']));
create policy ai_visibility_runs_outreach_manage
  on public.ai_visibility_runs for all to authenticated
  using (public.is_privileged_actor(array['minister','super_admin']))
  with check (public.is_privileged_actor(array['minister','super_admin']));

create policy ai_visibility_checks_outreach_read
  on public.ai_visibility_checks for select to authenticated
  using (
    public.is_privileged_actor(array['content_editor','minister','super_admin'])
    and exists (select 1 from public.ai_visibility_runs avr where avr.id = run_id)
  );
create policy ai_visibility_checks_outreach_manage
  on public.ai_visibility_checks for all to authenticated
  using (public.is_privileged_actor(array['minister','super_admin']))
  with check (public.is_privileged_actor(array['minister','super_admin']));

create policy outreach_funnel_snapshots_outreach_read
  on public.outreach_funnel_snapshots for select to authenticated
  using (public.is_privileged_actor(array['minister','super_admin']));
create policy outreach_channel_attribution_outreach_read
  on public.outreach_channel_attribution for select to authenticated
  using (public.is_privileged_actor(array['minister','super_admin']));

revoke all on table public.outreach_source_connectors from anon;
revoke all on table public.public_conversation_signals from anon;
revoke all on table public.public_conversation_actions from anon;
revoke all on table public.ai_visibility_runs from anon;
revoke all on table public.ai_visibility_checks from anon;
revoke all on table public.outreach_funnel_snapshots from anon;
revoke all on table public.outreach_channel_attribution from anon;

grant select, insert, update, delete on table public.outreach_source_connectors to authenticated;
grant select, update on table public.public_conversation_signals to authenticated;
grant select, insert, update, delete on table public.public_conversation_actions to authenticated;
grant select, insert, update, delete on table public.ai_visibility_runs to authenticated;
grant select, insert, update, delete on table public.ai_visibility_checks to authenticated;
grant select on table public.outreach_funnel_snapshots to authenticated;
grant select on table public.outreach_channel_attribution to authenticated;

grant all on table public.outreach_source_connectors to service_role;
grant all on table public.public_conversation_signals to service_role;
grant all on table public.public_conversation_actions to service_role;
grant all on table public.ai_visibility_runs to service_role;
grant all on table public.ai_visibility_checks to service_role;
grant all on table public.outreach_funnel_snapshots to service_role;
grant all on table public.outreach_channel_attribution to service_role;

comment on table public.public_conversation_signals is
  'Time-bounded public conversation opportunities. This table intentionally excludes person identifiers, inferred religious beliefs, private search history, and private ministry data.';
comment on table public.public_conversation_actions is
  'Human-reviewed outreach actions. Automatic replies and publication are prohibited by constraint.';
comment on table public.outreach_funnel_snapshots is
  'Aggregate visitor funnel counts only; no private prayer, child, counseling, safeguarding, or Church Hub behavioral data.';

commit;
