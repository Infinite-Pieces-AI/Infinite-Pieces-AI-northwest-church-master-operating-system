begin;

-- =============================================================================
-- Connected Ministry Journey
-- Public curiosity -> consented human follow-up -> member fellowship and service
-- -> aggregate learning. Private spiritual content is kept outside marketing data.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Public guest requests. These records begin only after a visitor voluntarily
-- submits a form and explicitly consents to the selected follow-up method.
-- -----------------------------------------------------------------------------
create table public.public_guest_requests (
  id uuid primary key default extensions.gen_random_uuid(),
  request_type text not null check (
    request_type in ('plan_visit','general_question','bible_study','online_conversation','public_event')
  ),
  first_name text not null check (char_length(first_name) between 1 and 80),
  preferred_contact text not null check (preferred_contact in ('email','phone')),
  email text check (email is null or char_length(email) <= 254),
  phone text check (phone is null or char_length(phone) <= 40),
  party_size integer not null default 1 check (party_size between 1 and 20),
  children_attending text not null default 'prefer_not_to_say' check (
    children_attending in ('yes','no','prefer_not_to_say')
  ),
  topic text check (
    topic is null or topic in (
      'first_visit','beliefs','bible_study','kids_teens','accessibility',
      'online_participation','service','other'
    )
  ),
  practical_note text check (practical_note is null or char_length(practical_note) <= 1500),
  source_path text not null default '/' check (char_length(source_path) between 1 and 500),
  source_campaign text check (source_campaign is null or char_length(source_campaign) <= 200),
  consent_text_version text not null check (char_length(consent_text_version) between 3 and 80),
  communication_consent boolean not null check (communication_consent = true),
  request_fingerprint text not null check (char_length(request_fingerprint) between 32 and 128),
  status text not null default 'new' check (
    status in ('new','assigned','contacted','scheduled','completed','opted_out','closed')
  ),
  assigned_to uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz,
  last_contact_at timestamptz,
  outcome text check (outcome is null or char_length(outcome) <= 500),
  retention_expires_at timestamptz not null default (timezone('utc', now()) + interval '18 months'),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (
    (preferred_contact = 'email' and email is not null)
    or (preferred_contact = 'phone' and phone is not null)
  ),
  check (retention_expires_at > created_at)
);
create index public_guest_requests_queue_idx
  on public.public_guest_requests(status, created_at)
  where status in ('new','assigned','contacted','scheduled');
create index public_guest_requests_fingerprint_idx
  on public.public_guest_requests(request_fingerprint, created_at desc);
create index public_guest_requests_retention_idx
  on public.public_guest_requests(retention_expires_at);
create trigger public_guest_requests_set_updated_at
  before update on public.public_guest_requests
  for each row execute function public.set_updated_at();

-- Prayer is intentionally separate from general visitor and outreach records.
create table public.restricted_prayer_requests (
  id uuid primary key default extensions.gen_random_uuid(),
  first_name text not null check (char_length(first_name) between 1 and 80),
  prayer_request text not null check (char_length(prayer_request) between 1 and 4000),
  follow_up_requested boolean not null default false,
  preferred_contact text check (preferred_contact is null or preferred_contact in ('email','phone')),
  email text check (email is null or char_length(email) <= 254),
  phone text check (phone is null or char_length(phone) <= 40),
  urgency_acknowledged boolean not null check (urgency_acknowledged = true),
  prayer_routing_consent boolean not null check (prayer_routing_consent = true),
  consent_text_version text not null check (char_length(consent_text_version) between 3 and 80),
  request_fingerprint text not null check (char_length(request_fingerprint) between 32 and 128),
  source_path text not null default '/prayer-request' check (char_length(source_path) between 1 and 500),
  status text not null default 'new' check (
    status in ('new','assigned','acknowledged','follow_up_requested','completed','closed')
  ),
  assigned_to uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz,
  completed_at timestamptz,
  retention_expires_at timestamptz not null default (timezone('utc', now()) + interval '12 months'),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (
    not follow_up_requested
    or (preferred_contact = 'email' and email is not null)
    or (preferred_contact = 'phone' and phone is not null)
  ),
  check (retention_expires_at > created_at)
);
create index restricted_prayer_requests_queue_idx
  on public.restricted_prayer_requests(status, created_at)
  where status in ('new','assigned','follow_up_requested');
create index restricted_prayer_requests_fingerprint_idx
  on public.restricted_prayer_requests(request_fingerprint, created_at desc);
create index restricted_prayer_requests_retention_idx
  on public.restricted_prayer_requests(retention_expires_at);
create trigger restricted_prayer_requests_set_updated_at
  before update on public.restricted_prayer_requests
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- One approved public truth record for website, schema, social, events, and local
-- presence. Sensitive or internal facts must never be marked public_safe.
-- -----------------------------------------------------------------------------
create table public.canonical_public_facts (
  id uuid primary key default extensions.gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'),
  label text not null check (char_length(label) between 2 and 120),
  value jsonb not null,
  public_safe boolean not null default false,
  status text not null default 'draft' check (status in ('draft','review','approved','retired')),
  evidence_note text check (evidence_note is null or char_length(evidence_note) <= 2000),
  source_owner text check (source_owner is null or char_length(source_owner) <= 160),
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  effective_from timestamptz,
  effective_until timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (jsonb_typeof(value) in ('string','number','boolean','object','array')),
  check ((status <> 'approved') or (approved_by is not null and approved_at is not null)),
  check (effective_until is null or effective_from is null or effective_until > effective_from)
);
create trigger canonical_public_facts_set_updated_at
  before update on public.canonical_public_facts
  for each row execute function public.set_updated_at();

create or replace view public.published_public_facts
with (security_invoker = true)
as
select key, label, value, effective_from, effective_until, updated_at
from public.canonical_public_facts
where status = 'approved'
  and public_safe
  and (effective_from is null or effective_from <= timezone('utc', now()))
  and (effective_until is null or effective_until > timezone('utc', now()));

-- -----------------------------------------------------------------------------
-- Fellowship 2.0 extensions.
-- -----------------------------------------------------------------------------
alter table public.fellowship_meetups
  add column if not exists accessibility_note text check (
    accessibility_note is null or char_length(accessibility_note) <= 1000
  ),
  add column if not exists cost_note text check (cost_note is null or char_length(cost_note) <= 500),
  add column if not exists weather_plan text check (weather_plan is null or char_length(weather_plan) <= 1000),
  add column if not exists recurring_template_id uuid,
  add column if not exists cancellation_reason text check (
    cancellation_reason is null or char_length(cancellation_reason) <= 1000
  ),
  add column if not exists attendance_confirmed_at timestamptz;

create table public.fellowship_recurring_templates (
  id uuid primary key default extensions.gen_random_uuid(),
  creator_profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 100),
  category text not null check (
    category in ('prayer','families','outdoors','food','service','sports','young-adults','whole-church')
  ),
  recurrence_rule text not null check (char_length(recurrence_rule) between 3 and 500),
  timezone text not null default 'America/New_York',
  default_duration_minutes integer not null check (default_duration_minutes between 15 and 720),
  visibility text not null default 'church' check (visibility in ('church','ministry','group')),
  ministry_id uuid references public.ministries(id) on delete set null,
  group_id uuid references public.groups(id) on delete set null,
  status text not null default 'active' check (status in ('active','paused','retired')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (
    (visibility = 'church' and ministry_id is null and group_id is null)
    or (visibility = 'ministry' and ministry_id is not null and group_id is null)
    or (visibility = 'group' and group_id is not null)
  )
);
create trigger fellowship_recurring_templates_set_updated_at
  before update on public.fellowship_recurring_templates
  for each row execute function public.set_updated_at();

alter table public.fellowship_meetups
  add constraint fellowship_meetups_recurring_template_fk
  foreign key (recurring_template_id)
  references public.fellowship_recurring_templates(id)
  on delete set null;

create table public.fellowship_meetup_cohosts (
  meetup_id uuid not null references public.fellowship_meetups(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  invited_by uuid not null references public.profiles(id) on delete restrict,
  accepted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (meetup_id, profile_id)
);

create table public.fellowship_availability_polls (
  id uuid primary key default extensions.gen_random_uuid(),
  meetup_id uuid not null references public.fellowship_meetups(id) on delete cascade,
  question text not null check (char_length(question) between 3 and 300),
  closes_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete restrict,
  status text not null default 'open' check (status in ('open','closed','cancelled')),
  created_at timestamptz not null default timezone('utc', now())
);

create table public.fellowship_availability_options (
  id uuid primary key default extensions.gen_random_uuid(),
  poll_id uuid not null references public.fellowship_availability_polls(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  label text check (label is null or char_length(label) <= 120),
  unique(poll_id, starts_at, ends_at),
  check (ends_at > starts_at)
);

create table public.fellowship_availability_votes (
  option_id uuid not null references public.fellowship_availability_options(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  response text not null check (response in ('available','maybe','unavailable')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (option_id, profile_id)
);
create trigger fellowship_availability_votes_set_updated_at
  before update on public.fellowship_availability_votes
  for each row execute function public.set_updated_at();

create table public.fellowship_meetup_reminders (
  meetup_id uuid not null references public.fellowship_meetups(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  reminder_minutes integer not null check (reminder_minutes in (15,30,60,120,1440,2880)),
  channel text not null check (channel in ('in_app','push','email')),
  enabled boolean not null default true,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (meetup_id, profile_id, reminder_minutes, channel)
);

create table public.fellowship_meetup_feedback (
  id uuid primary key default extensions.gen_random_uuid(),
  meetup_id uuid not null references public.fellowship_meetups(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  happened boolean,
  would_join_similar boolean,
  connection_quality smallint check (connection_quality between 1 and 5),
  safety_concern boolean not null default false,
  private_comment text check (private_comment is null or char_length(private_comment) <= 2000),
  created_at timestamptz not null default timezone('utc', now()),
  unique(meetup_id, profile_id)
);

create table public.fellowship_recommendation_feedback (
  id uuid primary key default extensions.gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  meetup_id uuid references public.fellowship_meetups(id) on delete cascade,
  feedback text not null check (feedback in ('helpful','less_like_this','not_available','not_interested')),
  explanation_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  check (jsonb_typeof(explanation_snapshot) = 'object')
);

-- -----------------------------------------------------------------------------
-- Service Marketplace.
-- -----------------------------------------------------------------------------
create table public.service_opportunities (
  id uuid primary key default extensions.gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 140),
  summary text not null check (char_length(summary) between 20 and 1200),
  need_statement text not null check (char_length(need_statement) between 20 and 2000),
  impact_description text check (impact_description is null or char_length(impact_description) <= 2000),
  partner_name text check (partner_name is null or char_length(partner_name) <= 160),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null default 'America/New_York',
  general_location_name text not null check (char_length(general_location_name) between 2 and 160),
  general_area text not null check (char_length(general_area) between 2 and 120),
  exact_instructions text check (exact_instructions is null or char_length(exact_instructions) <= 2000),
  minimum_age integer check (minimum_age is null or minimum_age between 0 and 100),
  family_friendly boolean not null default false,
  capacity integer check (capacity is null or capacity between 1 and 1000),
  allow_waitlist boolean not null default true,
  physical_requirements text check (physical_requirements is null or char_length(physical_requirements) <= 1500),
  skills_needed text[] not null default '{}',
  accessibility_note text check (accessibility_note is null or char_length(accessibility_note) <= 1500),
  supplies_note text check (supplies_note is null or char_length(supplies_note) <= 1500),
  transportation_note text check (transportation_note is null or char_length(transportation_note) <= 1500),
  safeguarding_requirements text check (safeguarding_requirements is null or char_length(safeguarding_requirements) <= 2000),
  visibility text not null default 'members' check (visibility in ('public','members','ministry','group')),
  ministry_id uuid references public.ministries(id) on delete set null,
  group_id uuid references public.groups(id) on delete set null,
  status text not null default 'draft' check (status in ('draft','review','published','full','cancelled','completed','retired')),
  created_by uuid not null references public.profiles(id) on delete restrict,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (ends_at > starts_at),
  check ((status <> 'published') or (approved_by is not null and approved_at is not null)),
  check (
    (visibility in ('public','members') and ministry_id is null and group_id is null)
    or (visibility = 'ministry' and ministry_id is not null and group_id is null)
    or (visibility = 'group' and group_id is not null)
  )
);
create index service_opportunities_upcoming_idx
  on public.service_opportunities(starts_at)
  where status in ('published','full');
create trigger service_opportunities_set_updated_at
  before update on public.service_opportunities
  for each row execute function public.set_updated_at();

create table public.service_opportunity_signups (
  id uuid primary key default extensions.gen_random_uuid(),
  opportunity_id uuid not null references public.service_opportunities(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'going' check (
    status in ('interested','going','waitlisted','cancelled','attended','no_show')
  ),
  party_size integer not null default 1 check (party_size between 1 and 25),
  transportation_help_requested boolean not null default false,
  accessibility_note text check (accessibility_note is null or char_length(accessibility_note) <= 1000),
  signed_up_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(opportunity_id, profile_id)
);
create index service_opportunity_signups_active_idx
  on public.service_opportunity_signups(opportunity_id, status)
  where status in ('interested','going','waitlisted');
create trigger service_opportunity_signups_set_updated_at
  before update on public.service_opportunity_signups
  for each row execute function public.set_updated_at();

create table public.service_opportunity_messages (
  id uuid primary key default extensions.gen_random_uuid(),
  opportunity_id uuid not null references public.service_opportunities(id) on delete cascade,
  author_profile_id uuid not null references public.profiles(id) on delete restrict,
  body text not null check (char_length(body) between 1 and 2000),
  pinned boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);
create index service_opportunity_messages_thread_idx
  on public.service_opportunity_messages(opportunity_id, created_at);

-- Voluntary thirty-day connection pathway. Completion is never a spiritual score.
create table public.member_connection_pathways (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active','paused','completed','dismissed')),
  started_at timestamptz not null default timezone('utc', now()),
  paused_until timestamptz,
  completed_at timestamptz,
  preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now()),
  check (jsonb_typeof(preferences) = 'object')
);
create trigger member_connection_pathways_set_updated_at
  before update on public.member_connection_pathways
  for each row execute function public.set_updated_at();

create table public.member_connection_steps (
  id uuid primary key default extensions.gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  step_key text not null check (
    step_key in ('plan_sunday','meet_welcome_person','join_fellowship','explore_bible','discover_group','serve')
  ),
  week_number integer not null check (week_number between 1 and 4),
  status text not null default 'available' check (status in ('available','started','completed','skipped')),
  related_entity_type text check (related_entity_type is null or related_entity_type in ('event','meetup','group','lesson','service_opportunity')),
  related_entity_id uuid,
  completed_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now()),
  unique(profile_id, step_key)
);
create trigger member_connection_steps_set_updated_at
  before update on public.member_connection_steps
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Outreach data plane: finalized Search Console dimensions, site-quality crawl,
-- canonical fact checks, prompt library, and rented-venue local-profile gate.
-- -----------------------------------------------------------------------------
create table public.search_console_dimension_snapshots (
  id uuid primary key default extensions.gen_random_uuid(),
  snapshot_date date not null,
  query text not null default '',
  page_path text not null default '',
  country text not null default '',
  device text not null default '',
  search_appearance text not null default '',
  clicks integer not null check (clicks >= 0),
  impressions integer not null check (impressions >= 0),
  ctr numeric(8,6) not null check (ctr >= 0 and ctr <= 1),
  average_position numeric(10,4) not null check (average_position >= 0),
  data_state text not null default 'final' check (data_state in ('fresh','final','all')),
  source_property text not null check (char_length(source_property) between 3 and 500),
  imported_at timestamptz not null default timezone('utc', now()),
  unique(
    snapshot_date, query, page_path, country, device, search_appearance, data_state, source_property
  )
);
create index search_console_dimension_snapshots_query_idx
  on public.search_console_dimension_snapshots(snapshot_date desc, query);
create index search_console_dimension_snapshots_page_idx
  on public.search_console_dimension_snapshots(snapshot_date desc, page_path);

create table public.site_crawl_runs (
  id uuid primary key default extensions.gen_random_uuid(),
  base_url text not null check (base_url ~ '^https://'),
  status text not null default 'queued' check (status in ('queued','running','completed','partial','failed','cancelled')),
  page_limit integer not null default 500 check (page_limit between 1 and 5000),
  pages_crawled integer not null default 0 check (pages_crawled >= 0),
  requested_by uuid references public.profiles(id) on delete set null,
  started_at timestamptz,
  completed_at timestamptz,
  error_summary text check (error_summary is null or char_length(error_summary) <= 2000),
  created_at timestamptz not null default timezone('utc', now())
);

create table public.site_crawl_findings (
  id uuid primary key default extensions.gen_random_uuid(),
  run_id uuid not null references public.site_crawl_runs(id) on delete cascade,
  page_url text not null check (page_url ~ '^https://'),
  finding_type text not null check (
    finding_type in (
      'broken_link','missing_title','missing_description','duplicate_title','canonical_conflict',
      'orphan_page','redirect_chain','missing_structured_data','image_missing_dimensions',
      'image_missing_alt','stale_fact','thin_page','query_cannibalization','slow_response',
      'indexability_conflict'
    )
  ),
  severity text not null check (severity in ('info','warning','high','critical')),
  summary text not null check (char_length(summary) between 3 and 1000),
  evidence jsonb not null default '{}'::jsonb,
  status text not null default 'open' check (status in ('open','accepted','fixed','dismissed')),
  assigned_to uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  check (jsonb_typeof(evidence) = 'object')
);
create index site_crawl_findings_queue_idx
  on public.site_crawl_findings(status, severity, finding_type);

create table public.ai_visibility_prompt_library (
  id uuid primary key default extensions.gen_random_uuid(),
  prompt text not null unique check (char_length(prompt) between 3 and 1000),
  intent text not null check (char_length(intent) between 2 and 120),
  locality text not null default 'Lowell, Massachusetts',
  active boolean not null default true,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check ((not active) or (approved_by is not null and approved_at is not null))
);
create trigger ai_visibility_prompt_library_set_updated_at
  before update on public.ai_visibility_prompt_library
  for each row execute function public.set_updated_at();

create table public.google_business_profile_eligibility_reviews (
  id uuid primary key default extensions.gen_random_uuid(),
  venue_name text not null check (char_length(venue_name) between 2 and 160),
  venue_relationship text not null check (venue_relationship in ('owned','leased','rented_event_space','other')),
  address_authorized boolean not null default false,
  representatives_present_during_hours boolean not null default false,
  signage_verified boolean not null default false,
  central_identity_approved boolean not null default false,
  recovery_owners_documented boolean not null default false,
  evidence jsonb not null default '{}'::jsonb,
  decision text not null default 'pending' check (decision in ('pending','eligible','not_eligible','legal_review')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (jsonb_typeof(evidence) = 'object'),
  check ((decision = 'pending') or (reviewed_by is not null and reviewed_at is not null)),
  check (
    decision <> 'eligible'
    or (
      address_authorized
      and representatives_present_during_hours
      and signage_verified
      and central_identity_approved
      and recovery_owners_documented
    )
  )
);
create trigger google_business_profile_eligibility_reviews_set_updated_at
  before update on public.google_business_profile_eligibility_reviews
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- RLS and privileges.
-- -----------------------------------------------------------------------------
alter table public.public_guest_requests enable row level security;
alter table public.restricted_prayer_requests enable row level security;
alter table public.canonical_public_facts enable row level security;
alter table public.fellowship_recurring_templates enable row level security;
alter table public.fellowship_meetup_cohosts enable row level security;
alter table public.fellowship_availability_polls enable row level security;
alter table public.fellowship_availability_options enable row level security;
alter table public.fellowship_availability_votes enable row level security;
alter table public.fellowship_meetup_reminders enable row level security;
alter table public.fellowship_meetup_feedback enable row level security;
alter table public.fellowship_recommendation_feedback enable row level security;
alter table public.service_opportunities enable row level security;
alter table public.service_opportunity_signups enable row level security;
alter table public.service_opportunity_messages enable row level security;
alter table public.member_connection_pathways enable row level security;
alter table public.member_connection_steps enable row level security;
alter table public.search_console_dimension_snapshots enable row level security;
alter table public.site_crawl_runs enable row level security;
alter table public.site_crawl_findings enable row level security;
alter table public.ai_visibility_prompt_library enable row level security;
alter table public.google_business_profile_eligibility_reviews enable row level security;

create policy public_guest_requests_outreach_read
  on public.public_guest_requests for select to authenticated
  using (public.has_outreach_mfa_role(array['minister','super_admin']));
create policy public_guest_requests_outreach_update
  on public.public_guest_requests for update to authenticated
  using (public.has_outreach_mfa_role(array['minister','super_admin']))
  with check (public.has_outreach_mfa_role(array['minister','super_admin']));

create policy restricted_prayer_requests_minister_read
  on public.restricted_prayer_requests for select to authenticated
  using (public.has_outreach_mfa_role(array['minister','super_admin']));
create policy restricted_prayer_requests_minister_update
  on public.restricted_prayer_requests for update to authenticated
  using (public.has_outreach_mfa_role(array['minister','super_admin']))
  with check (public.has_outreach_mfa_role(array['minister','super_admin']));

create policy canonical_public_facts_editor_read
  on public.canonical_public_facts for select to authenticated
  using (public.is_privileged_actor(array['content_editor','minister','technical_admin','super_admin']));
create policy canonical_public_facts_editor_manage
  on public.canonical_public_facts for all to authenticated
  using (public.is_privileged_actor(array['content_editor','minister','super_admin']))
  with check (public.is_privileged_actor(array['content_editor','minister','super_admin']));

create policy fellowship_recurring_templates_creator_manage
  on public.fellowship_recurring_templates for all to authenticated
  using (
    creator_profile_id = auth.uid()
    or public.is_privileged_actor(array['minister','moderator','super_admin'])
  )
  with check (
    (creator_profile_id = auth.uid() and public.is_active_member())
    or public.is_privileged_actor(array['minister','moderator','super_admin'])
  );

create policy fellowship_cohosts_thread_read
  on public.fellowship_meetup_cohosts for select to authenticated
  using (public.can_access_fellowship_thread(meetup_id));
create policy fellowship_cohosts_host_manage
  on public.fellowship_meetup_cohosts for all to authenticated
  using (
    exists (
      select 1 from public.fellowship_meetups fm
      where fm.id = meetup_id and fm.creator_profile_id = auth.uid()
    )
    or public.is_privileged_actor(array['minister','moderator','super_admin'])
  )
  with check (
    exists (
      select 1 from public.fellowship_meetups fm
      where fm.id = meetup_id and fm.creator_profile_id = auth.uid()
    )
    or public.is_privileged_actor(array['minister','moderator','super_admin'])
  );

create policy fellowship_polls_participant_read
  on public.fellowship_availability_polls for select to authenticated
  using (public.can_access_fellowship_thread(meetup_id));
create policy fellowship_polls_host_manage
  on public.fellowship_availability_polls for all to authenticated
  using (
    exists (select 1 from public.fellowship_meetups fm where fm.id = meetup_id and fm.creator_profile_id = auth.uid())
    or public.is_privileged_actor(array['minister','moderator','super_admin'])
  )
  with check (
    exists (select 1 from public.fellowship_meetups fm where fm.id = meetup_id and fm.creator_profile_id = auth.uid())
    or public.is_privileged_actor(array['minister','moderator','super_admin'])
  );

create policy fellowship_poll_options_participant_read
  on public.fellowship_availability_options for select to authenticated
  using (
    exists (
      select 1 from public.fellowship_availability_polls p
      where p.id = poll_id and public.can_access_fellowship_thread(p.meetup_id)
    )
  );
create policy fellowship_poll_options_host_manage
  on public.fellowship_availability_options for all to authenticated
  using (
    exists (
      select 1
      from public.fellowship_availability_polls p
      join public.fellowship_meetups fm on fm.id = p.meetup_id
      where p.id = poll_id
        and (fm.creator_profile_id = auth.uid() or public.is_privileged_actor(array['minister','moderator','super_admin']))
    )
  )
  with check (
    exists (
      select 1
      from public.fellowship_availability_polls p
      join public.fellowship_meetups fm on fm.id = p.meetup_id
      where p.id = poll_id
        and (fm.creator_profile_id = auth.uid() or public.is_privileged_actor(array['minister','moderator','super_admin']))
    )
  );

create policy fellowship_votes_self
  on public.fellowship_availability_votes for all to authenticated
  using (profile_id = auth.uid())
  with check (
    profile_id = auth.uid()
    and exists (
      select 1
      from public.fellowship_availability_options o
      join public.fellowship_availability_polls p on p.id = o.poll_id
      where o.id = option_id and public.can_access_fellowship_thread(p.meetup_id)
    )
  );

create policy fellowship_reminders_self
  on public.fellowship_meetup_reminders for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid() and public.can_access_fellowship_thread(meetup_id));

create policy fellowship_feedback_self
  on public.fellowship_meetup_feedback for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid() and public.can_access_fellowship_thread(meetup_id));

create policy fellowship_recommendation_feedback_self
  on public.fellowship_recommendation_feedback for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy service_opportunities_member_read
  on public.service_opportunities for select to authenticated
  using (
    status in ('published','full','cancelled','completed')
    and public.is_active_member()
    and (
      visibility in ('public','members')
      or (visibility = 'ministry' and public.is_ministry_member(ministry_id))
      or (visibility = 'group' and public.is_group_member(group_id))
    )
  );
create policy service_opportunities_leader_manage
  on public.service_opportunities for all to authenticated
  using (public.is_privileged_actor(array['group_leader','minister','content_editor','super_admin']))
  with check (public.is_privileged_actor(array['group_leader','minister','content_editor','super_admin']));

create policy service_signups_participant_read
  on public.service_opportunity_signups for select to authenticated
  using (
    profile_id = auth.uid()
    or exists (
      select 1 from public.service_opportunities so
      where so.id = opportunity_id and so.created_by = auth.uid()
    )
    or public.is_privileged_actor(array['minister','moderator','super_admin'])
  );
create policy service_signups_self_insert
  on public.service_opportunity_signups for insert to authenticated
  with check (
    profile_id = auth.uid()
    and public.is_active_member()
    and status in ('interested','going','waitlisted')
    and exists (
      select 1 from public.service_opportunities so
      where so.id = opportunity_id and so.status in ('published','full')
    )
  );
create policy service_signups_self_update
  on public.service_opportunity_signups for update to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid() and status in ('interested','going','waitlisted','cancelled'));

create policy service_messages_participant_read
  on public.service_opportunity_messages for select to authenticated
  using (
    exists (
      select 1 from public.service_opportunity_signups sos
      where sos.opportunity_id = service_opportunity_messages.opportunity_id
        and sos.profile_id = auth.uid()
        and sos.status in ('going','waitlisted','attended')
    )
    or exists (
      select 1 from public.service_opportunities so
      where so.id = service_opportunity_messages.opportunity_id and so.created_by = auth.uid()
    )
    or public.is_privileged_actor(array['minister','moderator','super_admin'])
  );
create policy service_messages_participant_create
  on public.service_opportunity_messages for insert to authenticated
  with check (
    author_profile_id = auth.uid()
    and exists (
      select 1 from public.service_opportunity_signups sos
      where sos.opportunity_id = service_opportunity_messages.opportunity_id
        and sos.profile_id = auth.uid()
        and sos.status in ('going','waitlisted','attended')
    )
  );

create policy member_connection_pathways_self
  on public.member_connection_pathways for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());
create policy member_connection_steps_self
  on public.member_connection_steps for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy search_console_dimensions_outreach_read
  on public.search_console_dimension_snapshots for select to authenticated
  using (public.has_outreach_mfa_role(array['minister','content_editor','super_admin']));
create policy site_crawl_runs_outreach_manage
  on public.site_crawl_runs for all to authenticated
  using (public.has_outreach_mfa_role(array['minister','technical_admin','super_admin']))
  with check (public.has_outreach_mfa_role(array['minister','technical_admin','super_admin']));
create policy site_crawl_findings_outreach_manage
  on public.site_crawl_findings for all to authenticated
  using (public.has_outreach_mfa_role(array['minister','content_editor','technical_admin','super_admin']))
  with check (public.has_outreach_mfa_role(array['minister','content_editor','technical_admin','super_admin']));
create policy ai_visibility_prompt_library_outreach_manage
  on public.ai_visibility_prompt_library for all to authenticated
  using (public.has_outreach_mfa_role(array['minister','content_editor','super_admin']))
  with check (public.has_outreach_mfa_role(array['minister','content_editor','super_admin']));
create policy google_business_profile_reviews_outreach_manage
  on public.google_business_profile_eligibility_reviews for all to authenticated
  using (public.has_outreach_mfa_role(array['minister','technical_admin','super_admin']))
  with check (public.has_outreach_mfa_role(array['minister','technical_admin','super_admin']));

revoke all on table public.public_guest_requests from anon, authenticated;
revoke all on table public.restricted_prayer_requests from anon, authenticated;
grant select, update on table public.public_guest_requests to authenticated;
grant select, update on table public.restricted_prayer_requests to authenticated;
grant all on table public.public_guest_requests to service_role;
grant all on table public.restricted_prayer_requests to service_role;

grant select, insert, update, delete on table public.canonical_public_facts to authenticated;
grant select on table public.published_public_facts to anon, authenticated;
grant all on table public.canonical_public_facts to service_role;

grant select, insert, update, delete on table public.fellowship_recurring_templates to authenticated;
grant select, insert, update, delete on table public.fellowship_meetup_cohosts to authenticated;
grant select, insert, update, delete on table public.fellowship_availability_polls to authenticated;
grant select, insert, update, delete on table public.fellowship_availability_options to authenticated;
grant select, insert, update, delete on table public.fellowship_availability_votes to authenticated;
grant select, insert, update, delete on table public.fellowship_meetup_reminders to authenticated;
grant select, insert, update, delete on table public.fellowship_meetup_feedback to authenticated;
grant select, insert, update, delete on table public.fellowship_recommendation_feedback to authenticated;
grant select, insert, update, delete on table public.service_opportunities to authenticated;
grant select, insert, update, delete on table public.service_opportunity_signups to authenticated;
grant select, insert, update, delete on table public.service_opportunity_messages to authenticated;
grant select, insert, update, delete on table public.member_connection_pathways to authenticated;
grant select, insert, update, delete on table public.member_connection_steps to authenticated;

grant all on table public.fellowship_recurring_templates to service_role;
grant all on table public.fellowship_meetup_cohosts to service_role;
grant all on table public.fellowship_availability_polls to service_role;
grant all on table public.fellowship_availability_options to service_role;
grant all on table public.fellowship_availability_votes to service_role;
grant all on table public.fellowship_meetup_reminders to service_role;
grant all on table public.fellowship_meetup_feedback to service_role;
grant all on table public.fellowship_recommendation_feedback to service_role;
grant all on table public.service_opportunities to service_role;
grant all on table public.service_opportunity_signups to service_role;
grant all on table public.service_opportunity_messages to service_role;
grant all on table public.member_connection_pathways to service_role;
grant all on table public.member_connection_steps to service_role;

grant select on table public.search_console_dimension_snapshots to authenticated;
grant select, insert, update, delete on table public.site_crawl_runs to authenticated;
grant select, insert, update, delete on table public.site_crawl_findings to authenticated;
grant select, insert, update, delete on table public.ai_visibility_prompt_library to authenticated;
grant select, insert, update, delete on table public.google_business_profile_eligibility_reviews to authenticated;
grant all on table public.search_console_dimension_snapshots to service_role;
grant all on table public.site_crawl_runs to service_role;
grant all on table public.site_crawl_findings to service_role;
grant all on table public.ai_visibility_prompt_library to service_role;
grant all on table public.google_business_profile_eligibility_reviews to service_role;

comment on table public.public_guest_requests is
  'Consented public next-step requests. Prayer text and private ministry data are prohibited.';
comment on table public.restricted_prayer_requests is
  'Restricted prayer workflow kept separate from public analytics, advertising, and general visitor CRM records.';
comment on table public.member_connection_pathways is
  'Voluntary connection guide. Completion must never be treated as spiritual worth, eligibility, or a marketing signal.';
comment on table public.search_console_dimension_snapshots is
  'Aggregate Search Console dimensions only. No individual searcher identity exists in this table.';
comment on table public.google_business_profile_eligibility_reviews is
  'Governance gate for representing a rented or shared venue in local business systems.';

commit;
