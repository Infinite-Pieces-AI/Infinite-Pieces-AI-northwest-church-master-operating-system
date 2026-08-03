begin;

create table public.sermon_curriculum_drafts (
  id uuid primary key default extensions.gen_random_uuid(),
  weekly_lesson_id uuid not null references public.weekly_lessons(id) on delete cascade,
  ai_request_id uuid references public.ai_requests(id) on delete set null,
  source_document_ids uuid[] not null default '{}',
  curriculum jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'in_review', 'approved', 'rejected', 'published')),
  generated_by uuid references public.profiles(id) on delete set null,
  reviewed_by uuid references public.profiles(id) on delete set null,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (status not in ('approved', 'published') or (approved_by is not null and approved_at is not null))
);

create table public.image_prompt_drafts (
  id uuid primary key default extensions.gen_random_uuid(),
  weekly_lesson_id uuid references public.weekly_lessons(id) on delete set null,
  content_brief_id uuid references public.content_briefs(id) on delete set null,
  intended_use text not null check (intended_use in ('bible_tab', 'public_website', 'social_media', 'event', 'sermon_series')),
  prompt text not null,
  negative_prompt text,
  generated_people_are_fictional boolean not null default true check (generated_people_are_fictional = true),
  status text not null default 'draft' check (status in ('draft', 'in_review', 'approved', 'rejected', 'used')),
  created_by uuid not null references public.profiles(id) on delete restrict,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (status not in ('approved', 'used') or (approved_by is not null and approved_at is not null))
);

create table public.keyword_opportunities (
  id uuid primary key default extensions.gen_random_uuid(),
  snapshot_date date not null,
  query text not null,
  locality text not null default 'Lowell, Massachusetts',
  impressions integer not null default 0 check (impressions >= 0),
  clicks integer not null default 0 check (clicks >= 0),
  average_position numeric(8,3),
  existing_page_path text,
  opportunity_score numeric(12,4) not null default 0,
  recommended_action text not null check (recommended_action in ('improve_existing', 'create_people_first_page', 'monitor')),
  source text not null default 'search_console' check (source in ('search_console', 'approved_keyword_research')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  unique(snapshot_date, query, locality)
);

create table public.outreach_readiness_checks (
  id uuid primary key default extensions.gen_random_uuid(),
  program text not null check (program in ('google_business_profile', 'google_ad_grants')),
  check_key text not null,
  label text not null,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'complete', 'blocked', 'not_applicable')),
  evidence text,
  evidence_url text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(program, check_key)
);

create trigger sermon_curriculum_drafts_set_updated_at before update on public.sermon_curriculum_drafts for each row execute function public.set_updated_at();
create trigger image_prompt_drafts_set_updated_at before update on public.image_prompt_drafts for each row execute function public.set_updated_at();
create trigger outreach_readiness_checks_set_updated_at before update on public.outreach_readiness_checks for each row execute function public.set_updated_at();

alter table public.sermon_curriculum_drafts enable row level security;
alter table public.image_prompt_drafts enable row level security;
alter table public.keyword_opportunities enable row level security;
alter table public.outreach_readiness_checks enable row level security;

create policy sermon_curriculum_drafts_content_team
on public.sermon_curriculum_drafts for all to authenticated
using (
  public.is_privileged_actor(array['minister','super_admin'])
  or (status in ('draft','in_review','rejected') and public.is_privileged_actor(array['content_editor']))
)
with check (
  public.is_privileged_actor(array['minister','super_admin'])
  or (status in ('draft','in_review','rejected') and public.is_privileged_actor(array['content_editor']))
);

create policy image_prompt_drafts_content_team
on public.image_prompt_drafts for all to authenticated
using (public.is_privileged_actor(array['content_editor','minister','super_admin']))
with check (public.is_privileged_actor(array['content_editor','minister','super_admin']));

create policy keyword_opportunities_outreach
on public.keyword_opportunities for all to authenticated
using (public.is_privileged_actor(array['minister','super_admin']))
with check (public.is_privileged_actor(array['minister','super_admin']));

create policy outreach_readiness_checks_outreach
on public.outreach_readiness_checks for all to authenticated
using (public.is_privileged_actor(array['minister','technical_admin','super_admin']))
with check (public.is_privileged_actor(array['minister','technical_admin','super_admin']) and public.is_aal2());

revoke all on public.sermon_curriculum_drafts, public.image_prompt_drafts, public.keyword_opportunities, public.outreach_readiness_checks from anon;
grant select, insert, update, delete on public.sermon_curriculum_drafts, public.image_prompt_drafts, public.keyword_opportunities, public.outreach_readiness_checks to authenticated;

commit;
