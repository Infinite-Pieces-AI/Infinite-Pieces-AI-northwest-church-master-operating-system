begin;

alter table public.search_performance_snapshots add column if not exists search_appearance text;
alter table public.search_performance_snapshots add column if not exists data_state text not null default 'final';
alter table public.search_performance_snapshots drop constraint if exists search_performance_snapshots_data_state_check;
alter table public.search_performance_snapshots add constraint search_performance_snapshots_data_state_check check (data_state in ('final','fresh','all'));

alter table public.ai_visibility_checks add column if not exists provider_name text;
alter table public.ai_visibility_checks add column if not exists cited_page_path text;
alter table public.ai_visibility_checks add column if not exists other_organizations jsonb not null default '[]'::jsonb;
alter table public.ai_visibility_checks add column if not exists confidence_score integer not null default 0;
alter table public.ai_visibility_checks add constraint ai_visibility_other_organizations_check check (jsonb_typeof(other_organizations) = 'array');
alter table public.ai_visibility_checks add constraint ai_visibility_confidence_score_check check (confidence_score between 0 and 100);

create table public.outreach_opportunity_assessments (
  id uuid primary key default extensions.gen_random_uuid(),
  topic text not null check (char_length(topic) between 3 and 1000),
  priority_score integer not null check (priority_score between 0 and 100),
  weighted_base numeric(6,2) not null,
  risk_penalty numeric(6,2) not null default 0,
  confidence_score integer not null check (confidence_score between 0 and 100),
  source_label text not null check (char_length(source_label) between 3 and 300),
  date_range_start date not null,
  date_range_end date not null,
  score_inputs jsonb not null,
  explanation text[] not null default '{}',
  recommended_actions text[] not null default '{}',
  overridden_priority integer check (overridden_priority is null or overridden_priority between 0 and 100),
  override_reason text,
  overridden_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  check (date_range_end >= date_range_start),
  check (jsonb_typeof(score_inputs) = 'object')
);
create index outreach_opportunity_assessments_priority_idx on public.outreach_opportunity_assessments(priority_score desc, created_at desc);

create table public.site_quality_crawl_runs (
  id uuid primary key default extensions.gen_random_uuid(),
  base_url text not null check (base_url ~ '^https://|^http://localhost|^http://127\\.0\\.0\\.1'),
  status text not null default 'running' check (status in ('queued','running','completed','partial','failed','cancelled')),
  pages_checked integer not null default 0 check (pages_checked >= 0),
  links_checked integer not null default 0 check (links_checked >= 0),
  finding_count integer not null default 0 check (finding_count >= 0),
  dry_run boolean not null default true,
  requested_by uuid references public.profiles(id) on delete set null,
  started_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  error_summary text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.site_quality_findings (
  id uuid primary key default extensions.gen_random_uuid(),
  crawl_run_id uuid not null references public.site_quality_crawl_runs(id) on delete cascade,
  page_url text not null check (char_length(page_url) between 3 and 2000),
  rule_key text not null check (rule_key ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'),
  severity text not null check (severity in ('critical','high','medium','low')),
  detail text not null check (char_length(detail) between 3 and 3000),
  evidence jsonb not null default '{}'::jsonb,
  status text not null default 'open' check (status in ('open','assigned','resolved','accepted_risk','false_positive')),
  assigned_to uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  check (jsonb_typeof(evidence) = 'object')
);
create index site_quality_findings_run_severity_idx on public.site_quality_findings(crawl_run_id, severity, status);

create table public.canonical_public_facts (
  key text primary key check (key ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'),
  value text not null check (char_length(value) between 1 and 3000),
  fact_scope text not null default 'public' check (fact_scope in ('public','internal_review')),
  source_evidence text,
  verification_status text not null default 'unverified' check (verification_status in ('unverified','in_review','verified','blocked','retired')),
  verified_by uuid references public.profiles(id) on delete set null,
  verified_at timestamptz,
  valid_from timestamptz,
  valid_until timestamptz,
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.business_profile_eligibility_reviews (
  id uuid primary key default extensions.gen_random_uuid(),
  official_identity_approved boolean not null default false,
  venue_representation_authorized boolean not null default false,
  representatives_present_during_hours boolean not null default false,
  service_hours_verified boolean not null default false,
  signage_evidence_available boolean not null default false,
  church_owned_recovery_access boolean not null default false,
  central_leadership_approved boolean not null default false,
  status text not null default 'blocked' check (status in ('blocked','review_required','eligible_for_submission_review','retired')),
  evidence jsonb not null default '{}'::jsonb,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  check (jsonb_typeof(evidence) = 'object')
);

create trigger canonical_public_facts_set_updated_at before update on public.canonical_public_facts for each row execute function public.set_updated_at();

alter table public.outreach_opportunity_assessments enable row level security;
alter table public.site_quality_crawl_runs enable row level security;
alter table public.site_quality_findings enable row level security;
alter table public.canonical_public_facts enable row level security;
alter table public.business_profile_eligibility_reviews enable row level security;

create policy outreach_assessments_mfa_manage on public.outreach_opportunity_assessments for all to authenticated using (public.has_outreach_mfa_role(array['minister','super_admin'])) with check (public.has_outreach_mfa_role(array['minister','super_admin']));
create policy site_quality_runs_mfa_read on public.site_quality_crawl_runs for select to authenticated using (public.has_outreach_mfa_role(array['content_editor','minister','technical_admin','super_admin']));
create policy site_quality_runs_mfa_manage on public.site_quality_crawl_runs for all to authenticated using (public.has_outreach_mfa_role(array['minister','technical_admin','super_admin'])) with check (public.has_outreach_mfa_role(array['minister','technical_admin','super_admin']));
create policy site_quality_findings_mfa_read on public.site_quality_findings for select to authenticated using (public.has_outreach_mfa_role(array['content_editor','minister','technical_admin','super_admin']));
create policy site_quality_findings_mfa_manage on public.site_quality_findings for all to authenticated using (public.has_outreach_mfa_role(array['minister','technical_admin','super_admin'])) with check (public.has_outreach_mfa_role(array['minister','technical_admin','super_admin']));
create policy canonical_public_facts_mfa_read on public.canonical_public_facts for select to authenticated using (public.has_outreach_mfa_role(array['content_editor','minister','technical_admin','super_admin']));
create policy canonical_public_facts_mfa_manage on public.canonical_public_facts for all to authenticated using (public.has_outreach_mfa_role(array['minister','super_admin'])) with check (public.has_outreach_mfa_role(array['minister','super_admin']));
create policy business_profile_reviews_mfa_manage on public.business_profile_eligibility_reviews for all to authenticated using (public.has_outreach_mfa_role(array['minister','technical_admin','super_admin'])) with check (public.has_outreach_mfa_role(array['minister','technical_admin','super_admin']));

revoke all on table public.outreach_opportunity_assessments, public.site_quality_crawl_runs, public.site_quality_findings, public.canonical_public_facts, public.business_profile_eligibility_reviews from anon;
grant select, insert, update, delete on table public.outreach_opportunity_assessments, public.site_quality_crawl_runs, public.site_quality_findings, public.canonical_public_facts, public.business_profile_eligibility_reviews to authenticated;
grant all on table public.outreach_opportunity_assessments, public.site_quality_crawl_runs, public.site_quality_findings, public.canonical_public_facts, public.business_profile_eligibility_reviews to service_role;

comment on table public.outreach_opportunity_assessments is 'Explainable scores for topics, queries, pages, and public content opportunities. People and inferred religious beliefs are never scored.';
comment on table public.site_quality_findings is 'First-party public-site findings only. Private Hub and Outreach routes are outside crawler scope.';
comment on table public.business_profile_eligibility_reviews is 'Governance gate for a rented venue; eligibility is reviewed rather than assumed.';

commit;
