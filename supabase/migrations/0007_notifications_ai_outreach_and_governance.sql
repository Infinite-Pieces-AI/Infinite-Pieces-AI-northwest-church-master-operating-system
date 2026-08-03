begin;

create table public.notification_preferences (
  id uuid primary key default extensions.gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  channel public.notification_channel not null,
  topic text not null,
  enabled boolean not null default true,
  quiet_hours_start time,
  quiet_hours_end time,
  timezone text not null default 'America/New_York',
  updated_at timestamptz not null default timezone('utc', now()),
  unique(profile_id, channel, topic)
);

create table public.notification_jobs (
  id uuid primary key default extensions.gen_random_uuid(),
  source_event_id uuid,
  profile_id uuid references public.profiles(id) on delete cascade,
  channel public.notification_channel not null,
  audience_key text,
  template_key text not null,
  payload jsonb not null default '{}'::jsonb,
  status public.job_status not null default 'pending',
  attempts integer not null default 0,
  scheduled_for timestamptz not null default timezone('utc', now()),
  locked_at timestamptz,
  locked_by text,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (profile_id is not null or audience_key is not null)
);
create index notification_jobs_claim_idx on public.notification_jobs(status, scheduled_for) where status = 'pending';

create table public.delivery_receipts (
  id uuid primary key default extensions.gen_random_uuid(),
  notification_job_id uuid not null references public.notification_jobs(id) on delete cascade,
  provider text not null,
  provider_message_id text,
  status text not null check (status in ('accepted', 'delivered', 'bounced', 'complained', 'opened', 'clicked', 'failed')),
  occurred_at timestamptz not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.approved_documents (
  id uuid primary key default extensions.gen_random_uuid(),
  title text not null,
  document_type text not null check (document_type in ('belief_document', 'sermon_transcript', 'weekly_lesson', 'study_resource', 'scripture_reference', 'ministry_faq')),
  source_url text,
  storage_path text,
  content text,
  access_scope text not null default 'members' check (access_scope in ('public', 'members', 'leaders')),
  publication_status public.publication_status not null default 'draft',
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  checksum text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (source_url is not null or storage_path is not null or content is not null),
  check (publication_status <> 'published' or approved_at is not null)
);

create table public.document_chunks (
  id uuid primary key default extensions.gen_random_uuid(),
  approved_document_id uuid not null references public.approved_documents(id) on delete cascade,
  position integer not null,
  heading text,
  content text not null,
  token_count integer,
  search_vector tsvector generated always as (to_tsvector('english', coalesce(heading, '') || ' ' || content)) stored,
  embedding extensions.vector,
  created_at timestamptz not null default timezone('utc', now()),
  unique(approved_document_id, position)
);
create index document_chunks_search_idx on public.document_chunks using gin(search_vector);

create table public.ai_requests (
  id uuid primary key default extensions.gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  request_type text not null check (request_type in ('bible_question', 'sermon_summary', 'discussion_questions', 'event_draft', 'social_caption', 'translation', 'moderation_assist')),
  prompt text not null,
  approved_document_ids uuid[] not null default '{}',
  status public.ai_request_status not null default 'queued',
  model_provider text,
  model_name text,
  prompt_version text,
  response_draft text,
  safety_flags text[] not null default '{}',
  input_tokens integer,
  output_tokens integer,
  estimated_cost_usd numeric(10,6),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.ai_citations (
  id uuid primary key default extensions.gen_random_uuid(),
  ai_request_id uuid not null references public.ai_requests(id) on delete cascade,
  approved_document_id uuid not null references public.approved_documents(id) on delete restrict,
  document_chunk_id uuid references public.document_chunks(id) on delete set null,
  label text not null,
  excerpt text,
  position integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.ai_feedback (
  id uuid primary key default extensions.gen_random_uuid(),
  ai_request_id uuid not null references public.ai_requests(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint check (rating between 1 and 5),
  helpful boolean,
  feedback text,
  created_at timestamptz not null default timezone('utc', now()),
  unique(ai_request_id, profile_id)
);

create table public.campaigns (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null,
  objective text not null,
  geography text[] not null default array['Lowell, Massachusetts']::text[],
  landing_page_path text not null,
  budget_usd numeric(12,2),
  starts_on date,
  ends_on date,
  status text not null default 'draft' check (status in ('draft', 'in_review', 'approved', 'active', 'paused', 'completed', 'archived')),
  created_by uuid not null references public.profiles(id) on delete restrict,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.content_briefs (
  id uuid primary key default extensions.gen_random_uuid(),
  title text not null,
  content_type text not null check (content_type in ('local_page', 'event', 'sermon_summary', 'social', 'email', 'video_script', 'image_prompt', 'alt_text', 'translation')),
  intended_audience text,
  approved_facts jsonb not null default '{}'::jsonb,
  draft_body text,
  status public.publication_status not null default 'draft',
  campaign_id uuid references public.campaigns(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  reviewed_by uuid references public.profiles(id) on delete set null,
  approved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.social_drafts (
  id uuid primary key default extensions.gen_random_uuid(),
  content_brief_id uuid references public.content_briefs(id) on delete set null,
  platform text not null check (platform in ('facebook', 'instagram', 'linkedin', 'youtube', 'google_business_profile')),
  body text not null,
  media_asset_id uuid references public.media_assets(id) on delete set null,
  status public.social_draft_status not null default 'draft',
  created_by uuid not null references public.profiles(id) on delete restrict,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  scheduled_for timestamptz,
  published_at timestamptz,
  external_post_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (status not in ('approved', 'scheduled', 'published') or (approved_by is not null and approved_at is not null))
);

create table public.visit_requests (
  id uuid primary key default extensions.gen_random_uuid(),
  first_name text not null,
  last_name text,
  email extensions.citext not null,
  phone text,
  party_size integer not null default 1 check (party_size between 1 and 25),
  children_attending boolean not null default false,
  requested_next_step text check (requested_next_step in ('plan_visit', 'bible_study', 'family_group', 'prayer', 'general_question')),
  message text,
  consent_to_contact boolean not null,
  source_path text,
  source_campaign text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  status text not null default 'new' check (status in ('new', 'contact_attempted', 'connected', 'visit_scheduled', 'attended', 'bible_study_requested', 'family_group_requested', 'member_access_requested', 'closed', 'opted_out')),
  assigned_to uuid references public.profiles(id) on delete set null,
  source_ip_hash text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index visit_requests_status_created_idx on public.visit_requests(status, created_at desc);

create table public.conversion_events (
  id uuid primary key default extensions.gen_random_uuid(),
  event_name text not null check (event_name in ('plan_visit_started', 'plan_visit_submitted', 'directions_clicked', 'event_viewed', 'event_registered', 'bible_study_requested', 'member_access_requested')),
  anonymous_session_id text,
  visit_request_id uuid references public.visit_requests(id) on delete set null,
  source_path text,
  campaign_id uuid references public.campaigns(id) on delete set null,
  properties jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default timezone('utc', now())
);

create table public.search_performance_snapshots (
  id uuid primary key default extensions.gen_random_uuid(),
  snapshot_date date not null,
  query text,
  page_path text,
  country_code text,
  device text,
  clicks integer not null default 0,
  impressions integer not null default 0,
  average_position numeric(8,3),
  click_through_rate numeric(8,6),
  created_at timestamptz not null default timezone('utc', now()),
  unique(snapshot_date, query, page_path, country_code, device)
);

create table public.audit_events (
  id uuid primary key default extensions.gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  actor_type text not null default 'user' check (actor_type in ('user', 'worker', 'service', 'anonymous')),
  action text not null,
  resource_type text not null,
  resource_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  ip_hash text,
  occurred_at timestamptz not null default timezone('utc', now())
);
create index audit_events_resource_idx on public.audit_events(resource_type, resource_id, occurred_at desc);
create index audit_events_actor_idx on public.audit_events(actor_id, occurred_at desc);

create table public.access_reviews (
  id uuid primary key default extensions.gen_random_uuid(),
  review_period_start date not null,
  review_period_end date not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'complete')),
  opened_by uuid not null references public.profiles(id) on delete restrict,
  completed_by uuid references public.profiles(id) on delete set null,
  findings jsonb not null default '[]'::jsonb,
  opened_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  check (review_period_end >= review_period_start)
);

create table public.deletion_requests (
  id uuid primary key default extensions.gen_random_uuid(),
  requester_id uuid references public.profiles(id) on delete set null,
  subject_profile_id uuid references public.profiles(id) on delete set null,
  subject_household_id uuid references public.households(id) on delete set null,
  request_scope text not null,
  status text not null default 'received' check (status in ('received', 'identity_verified', 'in_review', 'completed', 'denied')),
  legal_hold boolean not null default false,
  assigned_to uuid references public.profiles(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.security_incidents (
  id uuid primary key default extensions.gen_random_uuid(),
  title text not null,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  status public.incident_status not null default 'open',
  summary text not null,
  sensitive_details text,
  detected_at timestamptz not null,
  reported_by uuid references public.profiles(id) on delete set null,
  incident_lead uuid references public.profiles(id) on delete set null,
  contained_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.safeguarding_reports (
  id uuid primary key default extensions.gen_random_uuid(),
  reporter_id uuid references public.profiles(id) on delete set null,
  status public.safeguarding_status not null default 'received',
  immediate_danger boolean not null default false,
  summary text not null,
  restricted_details text,
  external_report_reference text,
  escalated_to uuid references public.profiles(id) on delete set null,
  received_at timestamptz not null default timezone('utc', now()),
  escalated_at timestamptz,
  closed_at timestamptz
);

create table public.vendor_accounts (
  id uuid primary key default extensions.gen_random_uuid(),
  vendor_name text not null,
  purpose text not null,
  account_owner text not null,
  primary_recovery_owner text not null,
  secondary_recovery_owner text not null,
  secret_location_reference text,
  last_access_review_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.backup_restore_tests (
  id uuid primary key default extensions.gen_random_uuid(),
  backup_type text not null check (backup_type in ('database', 'media', 'configuration')),
  started_at timestamptz not null,
  completed_at timestamptz,
  status text not null check (status in ('planned', 'running', 'passed', 'failed')),
  recovery_point_at timestamptz,
  recovery_time_minutes integer,
  evidence_location text,
  tested_by uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.release_gate_results (
  id uuid primary key default extensions.gen_random_uuid(),
  gate_key text not null,
  environment text not null check (environment in ('staging', 'production')),
  status text not null check (status in ('not_started', 'in_progress', 'passed', 'failed', 'waived')),
  evidence_location text,
  notes text,
  verified_by uuid references public.profiles(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(gate_key, environment)
);

create table public.outbox_events (
  id uuid primary key default extensions.gen_random_uuid(),
  aggregate_type text not null,
  aggregate_id uuid,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  status public.job_status not null default 'pending',
  attempts integer not null default 0,
  available_at timestamptz not null default timezone('utc', now()),
  locked_at timestamptz,
  locked_by text,
  completed_at timestamptz,
  last_error text,
  created_at timestamptz not null default timezone('utc', now())
);
create index outbox_events_claim_idx on public.outbox_events(status, available_at) where status = 'pending';

create table public.webhook_receipts (
  id uuid primary key default extensions.gen_random_uuid(),
  provider text not null,
  external_event_id text not null,
  signature_valid boolean not null,
  event_type text,
  payload_hash text not null,
  processed_at timestamptz,
  processing_error text,
  received_at timestamptz not null default timezone('utc', now()),
  unique(provider, external_event_id)
);

create trigger notification_preferences_set_updated_at before update on public.notification_preferences for each row execute function public.set_updated_at();
create trigger notification_jobs_set_updated_at before update on public.notification_jobs for each row execute function public.set_updated_at();
create trigger approved_documents_set_updated_at before update on public.approved_documents for each row execute function public.set_updated_at();
create trigger ai_requests_set_updated_at before update on public.ai_requests for each row execute function public.set_updated_at();
create trigger campaigns_set_updated_at before update on public.campaigns for each row execute function public.set_updated_at();
create trigger content_briefs_set_updated_at before update on public.content_briefs for each row execute function public.set_updated_at();
create trigger social_drafts_set_updated_at before update on public.social_drafts for each row execute function public.set_updated_at();
create trigger visit_requests_set_updated_at before update on public.visit_requests for each row execute function public.set_updated_at();
create trigger deletion_requests_set_updated_at before update on public.deletion_requests for each row execute function public.set_updated_at();
create trigger security_incidents_set_updated_at before update on public.security_incidents for each row execute function public.set_updated_at();
create trigger vendor_accounts_set_updated_at before update on public.vendor_accounts for each row execute function public.set_updated_at();
create trigger release_gate_results_set_updated_at before update on public.release_gate_results for each row execute function public.set_updated_at();

commit;
