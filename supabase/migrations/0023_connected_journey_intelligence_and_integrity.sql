begin;

-- =============================================================================
-- Connected Journey integrity and aggregate intelligence.
-- =============================================================================

-- Public analytics stores only an approved event name, public path, broad source,
-- and sanitized scalar properties. No IP address, cookie identifier, prayer text,
-- child information, form message, or inferred religious belief is stored.
create table public.public_analytics_events (
  id uuid primary key default extensions.gen_random_uuid(),
  event_name text not null check (
    event_name in (
      'sunday_details_viewed','directions_clicked','calendar_added',
      'plan_visit_cta_clicked','question_cta_clicked','plan_visit_started',
      'plan_visit_submitted','question_submitted','bible_study_requested',
      'online_conversation_requested','event_registered','member_access_requested',
      'visitor_pathway_selected','visitor_pathway_opened'
    )
  ),
  path text not null check (char_length(path) between 1 and 500),
  source_channel text not null default 'direct' check (char_length(source_channel) between 1 and 80),
  properties jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default timezone('utc', now()),
  retention_expires_at timestamptz not null default (timezone('utc', now()) + interval '90 days'),
  check (jsonb_typeof(properties) = 'object'),
  check (retention_expires_at > occurred_at)
);
create index public_analytics_events_date_idx
  on public.public_analytics_events(occurred_at desc, event_name);
create index public_analytics_events_retention_idx
  on public.public_analytics_events(retention_expires_at);

create or replace view public.public_analytics_daily_rollups
with (security_invoker = true)
as
select
  (occurred_at at time zone 'America/New_York')::date as event_date,
  event_name,
  path,
  source_channel,
  count(*)::bigint as event_count
from public.public_analytics_events
group by 1, 2, 3, 4;

-- Explainable opportunity assessments score a query, topic, page, or public
-- conversation. They never score a person.
create table public.outreach_opportunity_assessments (
  id uuid primary key default extensions.gen_random_uuid(),
  opportunity_kind text not null check (
    opportunity_kind in ('search_query','public_topic','public_page','ai_visibility_gap','local_presence_gap')
  ),
  opportunity_key text not null check (char_length(opportunity_key) between 3 and 500),
  title text not null check (char_length(title) between 3 and 500),
  source_system text not null check (char_length(source_system) between 2 and 120),
  source_date_start date,
  source_date_end date,
  church_visit_intent integer not null check (church_visit_intent between 0 and 100),
  local_relevance integer not null check (local_relevance between 0 and 100),
  observed_demand_growth integer not null check (observed_demand_growth between 0 and 100),
  ranking_opportunity integer not null check (ranking_opportunity between 0 and 100),
  content_gap integer not null check (content_gap between 0 and 100),
  conversion_fit integer not null check (conversion_fit between 0 and 100),
  freshness integer not null check (freshness between 0 and 100),
  sensitivity_policy_risk integer not null check (sensitivity_policy_risk between 0 and 100),
  confidence integer not null check (confidence between 0 and 100),
  priority_score integer not null check (priority_score between 0 and 100),
  explanation jsonb not null default '[]'::jsonb,
  recommended_actions jsonb not null default '[]'::jsonb,
  status text not null default 'new' check (status in ('new','saved','in_review','approved','dismissed','completed')),
  overridden_priority integer check (overridden_priority is null or overridden_priority between 0 and 100),
  override_reason text check (override_reason is null or char_length(override_reason) <= 2000),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(opportunity_kind, opportunity_key, source_system, source_date_start, source_date_end),
  check (jsonb_typeof(explanation) = 'array'),
  check (jsonb_typeof(recommended_actions) = 'array')
);
create index outreach_opportunity_assessments_priority_idx
  on public.outreach_opportunity_assessments(status, priority_score desc, created_at desc);
create trigger outreach_opportunity_assessments_set_updated_at
  before update on public.outreach_opportunity_assessments
  for each row execute function public.set_updated_at();

create table public.outreach_morning_briefs (
  id uuid primary key default extensions.gen_random_uuid(),
  brief_date date not null unique,
  public_questions jsonb not null default '[]'::jsonb,
  search_absences jsonb not null default '[]'::jsonb,
  fact_and_page_gaps jsonb not null default '[]'::jsonb,
  approval_actions jsonb not null default '[]'::jsonb,
  source_freshness jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','review','approved','archived')),
  generated_at timestamptz not null default timezone('utc', now()),
  generated_by text not null default 'connected-journey-intelligence',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  check (jsonb_typeof(public_questions) = 'array'),
  check (jsonb_typeof(search_absences) = 'array'),
  check (jsonb_typeof(fact_and_page_gaps) = 'array'),
  check (jsonb_typeof(approval_actions) = 'array'),
  check (jsonb_typeof(source_freshness) = 'object'),
  check ((status <> 'approved') or (reviewed_by is not null and reviewed_at is not null))
);

-- Capacity is enforced in the database so concurrent signup requests cannot
-- silently overfill a service opportunity.
create or replace function public.validate_service_signup_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  opportunity_record record;
  active_party_size integer;
begin
  if new.status not in ('interested','going','waitlisted') then
    return new;
  end if;

  select so.capacity, so.allow_waitlist, so.status, so.ends_at
  into opportunity_record
  from public.service_opportunities so
  where so.id = new.opportunity_id
  for update;

  if opportunity_record is null then
    raise exception 'Service opportunity not found';
  end if;
  if opportunity_record.status not in ('published','full') then
    raise exception 'Service opportunity is not accepting signups';
  end if;
  if opportunity_record.ends_at <= timezone('utc', now()) then
    raise exception 'Service opportunity has ended';
  end if;

  if new.status = 'going' and opportunity_record.capacity is not null then
    select coalesce(sum(sos.party_size), 0)::integer
    into active_party_size
    from public.service_opportunity_signups sos
    where sos.opportunity_id = new.opportunity_id
      and sos.status in ('going','attended')
      and (tg_op = 'INSERT' or sos.id <> new.id);

    if active_party_size + new.party_size > opportunity_record.capacity then
      if opportunity_record.allow_waitlist then
        new.status := 'waitlisted';
      else
        raise exception 'Service opportunity capacity has been reached';
      end if;
    end if;
  end if;

  return new;
end;
$$;

create trigger service_signup_capacity_guard
  before insert or update on public.service_opportunity_signups
  for each row execute function public.validate_service_signup_capacity();

create or replace function public.promote_service_waitlist()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  opportunity_record record;
  active_party_size integer;
  candidate record;
begin
  if tg_op <> 'UPDATE'
    or old.status not in ('going','attended')
    or new.status not in ('cancelled','no_show') then
    return new;
  end if;

  select capacity, allow_waitlist
  into opportunity_record
  from public.service_opportunities
  where id = new.opportunity_id
  for update;

  if opportunity_record.capacity is null or not opportunity_record.allow_waitlist then
    return new;
  end if;

  select coalesce(sum(party_size), 0)::integer
  into active_party_size
  from public.service_opportunity_signups
  where opportunity_id = new.opportunity_id
    and status in ('going','attended');

  for candidate in
    select id, party_size
    from public.service_opportunity_signups
    where opportunity_id = new.opportunity_id
      and status = 'waitlisted'
    order by signed_up_at
    for update skip locked
  loop
    exit when active_party_size + candidate.party_size > opportunity_record.capacity;
    update public.service_opportunity_signups
      set status = 'going'
      where id = candidate.id;
    active_party_size := active_party_size + candidate.party_size;
  end loop;

  return new;
end;
$$;

create trigger service_signup_waitlist_promotion
  after update on public.service_opportunity_signups
  for each row execute function public.promote_service_waitlist();

-- Public-safe canonical facts may be read anonymously. Draft or internal facts
-- remain protected by RLS.
create policy canonical_public_facts_public_read
  on public.canonical_public_facts for select to anon
  using (
    status = 'approved'
    and public_safe
    and (effective_from is null or effective_from <= timezone('utc', now()))
    and (effective_until is null or effective_until > timezone('utc', now()))
  );

-- Prayer is not an Outreach permission. It requires the separately assigned
-- restricted safety/pastoral role or emergency super-admin access.
drop policy if exists restricted_prayer_requests_minister_read on public.restricted_prayer_requests;
drop policy if exists restricted_prayer_requests_minister_update on public.restricted_prayer_requests;
create policy restricted_prayer_requests_restricted_read
  on public.restricted_prayer_requests for select to authenticated
  using (public.has_outreach_mfa_role(array['safety_admin','super_admin']));
create policy restricted_prayer_requests_restricted_update
  on public.restricted_prayer_requests for update to authenticated
  using (public.has_outreach_mfa_role(array['safety_admin','super_admin']))
  with check (public.has_outreach_mfa_role(array['safety_admin','super_admin']));

alter table public.public_analytics_events enable row level security;
alter table public.outreach_opportunity_assessments enable row level security;
alter table public.outreach_morning_briefs enable row level security;

create policy public_analytics_events_outreach_read
  on public.public_analytics_events for select to authenticated
  using (public.has_outreach_mfa_role(array['minister','content_editor','super_admin']));
create policy outreach_opportunity_assessments_manage
  on public.outreach_opportunity_assessments for all to authenticated
  using (public.has_outreach_mfa_role(array['minister','content_editor','super_admin']))
  with check (public.has_outreach_mfa_role(array['minister','content_editor','super_admin']));
create policy outreach_morning_briefs_manage
  on public.outreach_morning_briefs for all to authenticated
  using (public.has_outreach_mfa_role(array['minister','content_editor','super_admin']))
  with check (public.has_outreach_mfa_role(array['minister','content_editor','super_admin']));

revoke all on table public.public_analytics_events from anon, authenticated;
grant select on table public.public_analytics_events to authenticated;
grant select on table public.public_analytics_daily_rollups to authenticated;
grant all on table public.public_analytics_events to service_role;
grant select on table public.public_analytics_daily_rollups to service_role;

grant select, insert, update, delete on table public.outreach_opportunity_assessments to authenticated;
grant select, insert, update, delete on table public.outreach_morning_briefs to authenticated;
grant all on table public.outreach_opportunity_assessments to service_role;
grant all on table public.outreach_morning_briefs to service_role;

comment on table public.public_analytics_events is
  'Approved aggregate public events with no IP, cookie identity, prayer text, child information, form message, or inferred belief.';
comment on table public.outreach_opportunity_assessments is
  'Explainable scoring for a query, public topic, page, or fact gap. It must never describe or score a person.';
comment on table public.outreach_morning_briefs is
  'Four-question daily intelligence brief with explicit source freshness and human approval actions.';

commit;
