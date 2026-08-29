begin;

-- -----------------------------------------------------------------------------
-- Gifts of the Church, Prayer Well, and Recovery Ministry
--
-- These domains intentionally keep spiritual reflection, prayer, and recovery
-- participation out of advertising, public analytics, and general member search.
-- No table stores a sobriety score, a diagnosis, an inferred spiritual condition,
-- or an automated ranking of a person's worth or ministry suitability.
-- -----------------------------------------------------------------------------

create or replace function public.is_ministry_space_manager()
returns boolean
language sql
stable
security definer
set search_path = public, auth
set row_security = off
as $$
  select case
    when auth.role() = 'service_role' then true
    when auth.uid() is null then false
    else exists (
      select 1
      from public.role_assignments ra
      join public.roles r on r.id = ra.role_id
      join public.profiles p on p.id = ra.user_id
      where ra.user_id = auth.uid()
        and r.key in ('minister', 'moderator', 'super_admin')
        and p.membership_status = 'active'
        and ra.revoked_at is null
        and (ra.expires_at is null or ra.expires_at > timezone('utc', now()))
    )
  end;
$$;

revoke all on function public.is_ministry_space_manager() from public;
grant execute on function public.is_ministry_space_manager() to authenticated, service_role;

-- Gifts and strengths ----------------------------------------------------------

create table public.member_gift_profiles (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  headline text check (headline is null or char_length(headline) <= 160),
  service_summary text check (service_summary is null or char_length(service_summary) <= 1200),
  availability_notes text check (availability_notes is null or char_length(availability_notes) <= 500),
  contact_preference text not null default 'in_app'
    check (contact_preference in ('in_app', 'group_leader', 'email_after_match')),
  sharing_scope text not null default 'church'
    check (sharing_scope in ('private', 'leaders', 'church')),
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.member_gifts (
  id uuid primary key default extensions.gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  gift_name text not null check (char_length(gift_name) between 2 and 120),
  category text not null check (category in (
    'hospitality', 'teaching', 'encouragement', 'mercy', 'service', 'leadership',
    'administration', 'music', 'creative', 'technology', 'trades', 'caregiving',
    'language', 'transportation', 'professional', 'other'
  )),
  experience_level text not null default 'comfortable'
    check (experience_level in ('learning', 'comfortable', 'experienced', 'expert')),
  willing_to_serve boolean not null default true,
  willing_to_mentor boolean not null default false,
  willing_to_offer_paid_work boolean not null default false,
  notes text check (notes is null or char_length(notes) <= 700),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(profile_id, gift_name)
);

create table public.gift_assessments (
  id uuid primary key default extensions.gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  assessment_name text not null check (char_length(assessment_name) between 2 and 160),
  assessment_version text check (assessment_version is null or char_length(assessment_version) <= 80),
  completed_on date,
  strengths jsonb not null default '[]'::jsonb,
  growth_areas jsonb not null default '[]'::jsonb,
  reflection text check (reflection is null or char_length(reflection) <= 2000),
  sharing_scope text not null default 'private'
    check (sharing_scope in ('private', 'leaders', 'church')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (jsonb_typeof(strengths) = 'array'),
  check (jsonb_typeof(growth_areas) = 'array')
);

create table public.gift_opportunities (
  id uuid primary key default extensions.gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete restrict,
  opportunity_type text not null check (opportunity_type in (
    'church_need', 'member_need', 'service_offer', 'item_for_sale', 'item_free', 'barter'
  )),
  title text not null check (char_length(title) between 3 and 180),
  description text not null check (char_length(description) between 10 and 4000),
  category text not null check (char_length(category) between 2 and 100),
  compensation_type text not null default 'volunteer'
    check (compensation_type in ('volunteer', 'free', 'paid', 'barter')),
  price_cents integer check (price_cents is null or price_cents between 0 and 100000000),
  general_location text check (general_location is null or char_length(general_location) <= 180),
  schedule_summary text check (schedule_summary is null or char_length(schedule_summary) <= 300),
  needed_by timestamptz,
  visibility text not null default 'church'
    check (visibility in ('church', 'leaders')),
  status text not null default 'open'
    check (status in ('open', 'matched', 'fulfilled', 'closed', 'cancelled')),
  moderation_status text not null default 'approved'
    check (moderation_status in ('pending', 'approved', 'held', 'removed')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check ((compensation_type = 'paid' and price_cents is not null) or compensation_type <> 'paid')
);

create index gift_opportunities_open_idx
  on public.gift_opportunities(status, category, created_at desc)
  where status in ('open', 'matched') and moderation_status = 'approved';

create table public.gift_opportunity_responses (
  id uuid primary key default extensions.gen_random_uuid(),
  opportunity_id uuid not null references public.gift_opportunities(id) on delete cascade,
  responder_id uuid not null references public.profiles(id) on delete restrict,
  message text not null check (char_length(message) between 2 and 2000),
  response_type text not null default 'reply'
    check (response_type in ('reply', 'offer_help', 'request_item', 'question')),
  private_to_creator boolean not null default false,
  status text not null default 'active'
    check (status in ('active', 'accepted', 'declined', 'withdrawn', 'completed', 'removed')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Prayer Well -----------------------------------------------------------------

create table public.prayer_requests (
  id uuid primary key default extensions.gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete restrict,
  title text not null check (char_length(title) between 2 and 180),
  request_text text not null check (char_length(request_text) between 5 and 4000),
  display_mode text not null default 'first_name'
    check (display_mode in ('named', 'first_name', 'anonymous_to_members')),
  privacy_scope text not null default 'church'
    check (privacy_scope in ('church', 'leaders_only', 'requester_and_leaders')),
  status text not null default 'open'
    check (status in ('open', 'answered', 'archived', 'withdrawn')),
  allow_encouragement boolean not null default true,
  needs_pastoral_followup boolean not null default false,
  answered_at timestamptz,
  answer_testimony text check (answer_testimony is null or char_length(answer_testimony) <= 4000),
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check ((status = 'answered' and answered_at is not null) or status <> 'answered')
);

create index prayer_requests_church_idx
  on public.prayer_requests(status, created_at desc)
  where privacy_scope = 'church' and status in ('open', 'answered');

create table public.prayer_support_events (
  id uuid primary key default extensions.gen_random_uuid(),
  prayer_request_id uuid not null references public.prayer_requests(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  support_type text not null check (support_type in ('prayed', 'encouragement', 'update')),
  message text check (message is null or char_length(message) <= 2000),
  requester_only boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  check ((support_type = 'prayed') or (message is not null and char_length(message) >= 2))
);

create index prayer_support_request_idx
  on public.prayer_support_events(prayer_request_id, created_at desc);

-- Recovery ministry ------------------------------------------------------------

create table public.recovery_programs (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null check (char_length(name) between 3 and 160),
  description text not null check (char_length(description) between 10 and 2000),
  provider_name text check (provider_name is null or char_length(provider_name) <= 160),
  curriculum_status text not null default 'church_created'
    check (curriculum_status in ('church_created', 'licensed', 'reference_only', 'review_required')),
  license_reference text check (license_reference is null or char_length(license_reference) <= 500),
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.recovery_groups (
  id uuid primary key default extensions.gen_random_uuid(),
  program_id uuid not null references public.recovery_programs(id) on delete cascade,
  name text not null check (char_length(name) between 3 and 160),
  description text check (description is null or char_length(description) <= 2000),
  schedule_summary text check (schedule_summary is null or char_length(schedule_summary) <= 300),
  general_location text check (general_location is null or char_length(general_location) <= 180),
  visibility text not null default 'approved_participants'
    check (visibility in ('church_members', 'approved_participants')),
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.recovery_group_memberships (
  id uuid primary key default extensions.gen_random_uuid(),
  group_id uuid not null references public.recovery_groups(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  membership_role text not null default 'participant'
    check (membership_role in ('participant', 'peer_support', 'leader')),
  status text not null default 'active'
    check (status in ('pending', 'active', 'paused', 'ended')),
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(group_id, profile_id)
);

create or replace function public.is_recovery_group_member(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
set row_security = off
as $$
  select auth.role() = 'service_role' or exists (
    select 1
    from public.recovery_group_memberships rgm
    where rgm.group_id = target_group_id
      and rgm.profile_id = auth.uid()
      and rgm.status = 'active'
  );
$$;

create or replace function public.is_recovery_group_leader(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
set row_security = off
as $$
  select auth.role() = 'service_role'
    or public.is_ministry_space_manager()
    or exists (
      select 1
      from public.recovery_group_memberships rgm
      where rgm.group_id = target_group_id
        and rgm.profile_id = auth.uid()
        and rgm.membership_role = 'leader'
        and rgm.status = 'active'
    );
$$;

revoke all on function public.is_recovery_group_member(uuid) from public;
revoke all on function public.is_recovery_group_leader(uuid) from public;
grant execute on function public.is_recovery_group_member(uuid) to authenticated, service_role;
grant execute on function public.is_recovery_group_leader(uuid) to authenticated, service_role;

create table public.recovery_curriculum_units (
  id uuid primary key default extensions.gen_random_uuid(),
  program_id uuid not null references public.recovery_programs(id) on delete cascade,
  week_number integer not null check (week_number between 1 and 104),
  title text not null check (char_length(title) between 3 and 180),
  summary text not null check (char_length(summary) between 10 and 3000),
  scripture_references text[] not null default '{}',
  leader_outline text check (leader_outline is null or char_length(leader_outline) <= 12000),
  participant_reflection text check (participant_reflection is null or char_length(participant_reflection) <= 6000),
  source_kind text not null default 'church_created'
    check (source_kind in ('church_created', 'licensed_reference')),
  source_reference text check (source_reference is null or char_length(source_reference) <= 500),
  published boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(program_id, week_number)
);

create table public.recovery_meetings (
  id uuid primary key default extensions.gen_random_uuid(),
  group_id uuid not null references public.recovery_groups(id) on delete cascade,
  curriculum_unit_id uuid references public.recovery_curriculum_units(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'in_progress', 'completed', 'cancelled')),
  leader_notes text check (leader_notes is null or char_length(leader_notes) <= 8000),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (ends_at is null or ends_at > starts_at)
);

create table public.recovery_meeting_checkins (
  id uuid primary key default extensions.gen_random_uuid(),
  meeting_id uuid not null references public.recovery_meetings(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  attendance_state text not null default 'present'
    check (attendance_state in ('registered', 'present', 'absent', 'excused')),
  recorded_by uuid not null references public.profiles(id) on delete restrict,
  recorded_at timestamptz not null default timezone('utc', now()),
  unique(meeting_id, profile_id)
);

create table public.recovery_discussion_posts (
  id uuid primary key default extensions.gen_random_uuid(),
  group_id uuid not null references public.recovery_groups(id) on delete cascade,
  meeting_id uuid references public.recovery_meetings(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  post_type text not null default 'encouragement'
    check (post_type in ('announcement', 'reflection', 'encouragement', 'resource', 'question')),
  body text not null check (char_length(body) between 2 and 5000),
  status text not null default 'active'
    check (status in ('active', 'held', 'removed')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Approved public recovery resources and outreach intelligence -----------------

create table public.recovery_resource_organizations (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 200),
  resource_type text not null check (resource_type in (
    'treatment_locator', 'crisis_support', 'treatment_center', 'peer_support',
    'public_health', 'community_partner', 'church_ministry'
  )),
  website_url text not null check (website_url ~ '^https://'),
  public_phone text check (public_phone is null or char_length(public_phone) <= 50),
  locality text check (locality is null or char_length(locality) <= 160),
  summary text check (summary is null or char_length(summary) <= 2000),
  verification_status text not null default 'review'
    check (verification_status in ('review', 'approved', 'suspended', 'retired')),
  verified_by uuid references public.profiles(id) on delete set null,
  verified_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.recovery_outreach_opportunities (
  id uuid primary key default extensions.gen_random_uuid(),
  source_kind text not null check (source_kind in (
    'public_forum', 'public_web', 'public_event', 'treatment_partner', 'search_query', 'content_gap'
  )),
  source_title text not null check (char_length(source_title) between 3 and 300),
  public_url text check (public_url is null or public_url ~ '^https://'),
  locality text check (locality is null or char_length(locality) <= 160),
  summary text not null check (char_length(summary) between 10 and 3000),
  recovery_intent_score integer not null default 0 check (recovery_intent_score between 0 and 100),
  local_relevance_score integer not null default 0 check (local_relevance_score between 0 and 100),
  sensitivity_risk_score integer not null default 100 check (sensitivity_risk_score between 0 and 100),
  recommended_action text check (recommended_action is null or char_length(recommended_action) <= 2000),
  status text not null default 'new'
    check (status in ('new', 'review', 'resource_added', 'content_queued', 'dismissed', 'expired')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  expires_at timestamptz not null default (timezone('utc', now()) + interval '60 days'),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (expires_at > created_at)
);

create table public.recovery_support_inquiries (
  id uuid primary key default extensions.gen_random_uuid(),
  display_name text not null check (char_length(display_name) between 1 and 160),
  contact_method text not null check (contact_method in ('email', 'phone')),
  contact_value text not null check (char_length(contact_value) between 3 and 254),
  requested_next_step text not null check (requested_next_step in (
    'learn_about_group', 'speak_with_leader', 'find_treatment_resources', 'online_option'
  )),
  message text check (message is null or char_length(message) <= 2000),
  consent_to_contact boolean not null check (consent_to_contact = true),
  status text not null default 'new'
    check (status in ('new', 'assigned', 'contacted', 'scheduled', 'closed', 'opted_out')),
  assigned_to uuid references public.profiles(id) on delete set null,
  source_path text check (source_path is null or char_length(source_path) <= 500),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Updated-at triggers ----------------------------------------------------------

create trigger member_gift_profiles_set_updated_at
  before update on public.member_gift_profiles
  for each row execute function public.set_updated_at();
create trigger member_gifts_set_updated_at
  before update on public.member_gifts
  for each row execute function public.set_updated_at();
create trigger gift_assessments_set_updated_at
  before update on public.gift_assessments
  for each row execute function public.set_updated_at();
create trigger gift_opportunities_set_updated_at
  before update on public.gift_opportunities
  for each row execute function public.set_updated_at();
create trigger gift_opportunity_responses_set_updated_at
  before update on public.gift_opportunity_responses
  for each row execute function public.set_updated_at();
create trigger prayer_requests_set_updated_at
  before update on public.prayer_requests
  for each row execute function public.set_updated_at();
create trigger recovery_programs_set_updated_at
  before update on public.recovery_programs
  for each row execute function public.set_updated_at();
create trigger recovery_groups_set_updated_at
  before update on public.recovery_groups
  for each row execute function public.set_updated_at();
create trigger recovery_group_memberships_set_updated_at
  before update on public.recovery_group_memberships
  for each row execute function public.set_updated_at();
create trigger recovery_curriculum_units_set_updated_at
  before update on public.recovery_curriculum_units
  for each row execute function public.set_updated_at();
create trigger recovery_meetings_set_updated_at
  before update on public.recovery_meetings
  for each row execute function public.set_updated_at();
create trigger recovery_discussion_posts_set_updated_at
  before update on public.recovery_discussion_posts
  for each row execute function public.set_updated_at();
create trigger recovery_resource_organizations_set_updated_at
  before update on public.recovery_resource_organizations
  for each row execute function public.set_updated_at();
create trigger recovery_outreach_opportunities_set_updated_at
  before update on public.recovery_outreach_opportunities
  for each row execute function public.set_updated_at();
create trigger recovery_support_inquiries_set_updated_at
  before update on public.recovery_support_inquiries
  for each row execute function public.set_updated_at();

-- RLS -------------------------------------------------------------------------

alter table public.member_gift_profiles enable row level security;
alter table public.member_gifts enable row level security;
alter table public.gift_assessments enable row level security;
alter table public.gift_opportunities enable row level security;
alter table public.gift_opportunity_responses enable row level security;
alter table public.prayer_requests enable row level security;
alter table public.prayer_support_events enable row level security;
alter table public.recovery_programs enable row level security;
alter table public.recovery_groups enable row level security;
alter table public.recovery_group_memberships enable row level security;
alter table public.recovery_curriculum_units enable row level security;
alter table public.recovery_meetings enable row level security;
alter table public.recovery_meeting_checkins enable row level security;
alter table public.recovery_discussion_posts enable row level security;
alter table public.recovery_resource_organizations enable row level security;
alter table public.recovery_outreach_opportunities enable row level security;
alter table public.recovery_support_inquiries enable row level security;

create policy gift_profiles_read on public.member_gift_profiles
  for select to authenticated
  using (
    profile_id = auth.uid()
    or sharing_scope = 'church'
    or (sharing_scope = 'leaders' and public.is_ministry_space_manager())
  );
create policy gift_profiles_own_manage on public.member_gift_profiles
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy member_gifts_read on public.member_gifts
  for select to authenticated
  using (
    profile_id = auth.uid()
    or exists (
      select 1 from public.member_gift_profiles mgp
      where mgp.profile_id = member_gifts.profile_id
        and mgp.active
        and (mgp.sharing_scope = 'church'
          or (mgp.sharing_scope = 'leaders' and public.is_ministry_space_manager()))
    )
  );
create policy member_gifts_own_manage on public.member_gifts
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy gift_assessments_read on public.gift_assessments
  for select to authenticated
  using (
    profile_id = auth.uid()
    or sharing_scope = 'church'
    or (sharing_scope = 'leaders' and public.is_ministry_space_manager())
  );
create policy gift_assessments_own_manage on public.gift_assessments
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy gift_opportunities_read on public.gift_opportunities
  for select to authenticated
  using (
    created_by = auth.uid()
    or public.is_ministry_space_manager()
    or (visibility = 'church' and moderation_status = 'approved' and status <> 'cancelled')
  );
create policy gift_opportunities_create on public.gift_opportunities
  for insert to authenticated
  with check (created_by = auth.uid());
create policy gift_opportunities_update on public.gift_opportunities
  for update to authenticated
  using (created_by = auth.uid() or public.is_ministry_space_manager())
  with check (created_by = auth.uid() or public.is_ministry_space_manager());
create policy gift_opportunities_delete on public.gift_opportunities
  for delete to authenticated
  using (created_by = auth.uid() or public.is_ministry_space_manager());

create policy gift_responses_read on public.gift_opportunity_responses
  for select to authenticated
  using (
    responder_id = auth.uid()
    or not private_to_creator
    or public.is_ministry_space_manager()
    or exists (
      select 1 from public.gift_opportunities go
      where go.id = gift_opportunity_responses.opportunity_id
        and go.created_by = auth.uid()
    )
  );
create policy gift_responses_create on public.gift_opportunity_responses
  for insert to authenticated
  with check (responder_id = auth.uid());
create policy gift_responses_update on public.gift_opportunity_responses
  for update to authenticated
  using (
    responder_id = auth.uid()
    or public.is_ministry_space_manager()
    or exists (
      select 1 from public.gift_opportunities go
      where go.id = gift_opportunity_responses.opportunity_id
        and go.created_by = auth.uid()
    )
  );

create policy prayer_requests_read on public.prayer_requests
  for select to authenticated
  using (
    created_by = auth.uid()
    or public.is_ministry_space_manager()
    or (privacy_scope = 'church' and status in ('open', 'answered', 'archived'))
  );
create policy prayer_requests_create on public.prayer_requests
  for insert to authenticated
  with check (created_by = auth.uid());
create policy prayer_requests_update on public.prayer_requests
  for update to authenticated
  using (created_by = auth.uid() or public.is_ministry_space_manager())
  with check (created_by = auth.uid() or public.is_ministry_space_manager());
create policy prayer_requests_delete on public.prayer_requests
  for delete to authenticated
  using (created_by = auth.uid() or public.is_ministry_space_manager());

create policy prayer_support_read on public.prayer_support_events
  for select to authenticated
  using (
    profile_id = auth.uid()
    or public.is_ministry_space_manager()
    or exists (
      select 1 from public.prayer_requests pr
      where pr.id = prayer_support_events.prayer_request_id
        and (
          pr.created_by = auth.uid()
          or (pr.privacy_scope = 'church' and pr.status <> 'withdrawn')
        )
        and (not prayer_support_events.requester_only or pr.created_by = auth.uid())
    )
  );
create policy prayer_support_create on public.prayer_support_events
  for insert to authenticated
  with check (
    profile_id = auth.uid()
    and exists (
      select 1 from public.prayer_requests pr
      where pr.id = prayer_support_events.prayer_request_id
        and (pr.created_by = auth.uid() or pr.privacy_scope = 'church' or public.is_ministry_space_manager())
        and pr.status <> 'withdrawn'
    )
  );
create policy prayer_support_update on public.prayer_support_events
  for update to authenticated
  using (profile_id = auth.uid() or public.is_ministry_space_manager());

create policy recovery_programs_read on public.recovery_programs
  for select to authenticated using (active or public.is_ministry_space_manager());
create policy recovery_programs_manage on public.recovery_programs
  for all to authenticated
  using (public.is_ministry_space_manager())
  with check (public.is_ministry_space_manager());

create policy recovery_groups_read on public.recovery_groups
  for select to authenticated
  using (
    public.is_ministry_space_manager()
    or public.is_recovery_group_member(id)
    or (active and visibility = 'church_members')
  );
create policy recovery_groups_manage on public.recovery_groups
  for all to authenticated
  using (public.is_ministry_space_manager())
  with check (public.is_ministry_space_manager());

create policy recovery_memberships_read on public.recovery_group_memberships
  for select to authenticated
  using (
    profile_id = auth.uid()
    or public.is_recovery_group_leader(group_id)
  );
create policy recovery_memberships_manage on public.recovery_group_memberships
  for all to authenticated
  using (public.is_recovery_group_leader(group_id))
  with check (public.is_recovery_group_leader(group_id));

create policy recovery_curriculum_read on public.recovery_curriculum_units
  for select to authenticated
  using (published or public.is_ministry_space_manager());
create policy recovery_curriculum_manage on public.recovery_curriculum_units
  for all to authenticated
  using (public.is_ministry_space_manager())
  with check (public.is_ministry_space_manager());

create policy recovery_meetings_read on public.recovery_meetings
  for select to authenticated
  using (
    public.is_recovery_group_member(group_id)
    or public.is_recovery_group_leader(group_id)
    or exists (
      select 1 from public.recovery_groups rg
      where rg.id = recovery_meetings.group_id
        and rg.active and rg.visibility = 'church_members'
    )
  );
create policy recovery_meetings_manage on public.recovery_meetings
  for all to authenticated
  using (public.is_recovery_group_leader(group_id))
  with check (public.is_recovery_group_leader(group_id));

create policy recovery_checkins_read on public.recovery_meeting_checkins
  for select to authenticated
  using (
    profile_id = auth.uid()
    or exists (
      select 1 from public.recovery_meetings rm
      where rm.id = recovery_meeting_checkins.meeting_id
        and public.is_recovery_group_leader(rm.group_id)
    )
  );
create policy recovery_checkins_manage on public.recovery_meeting_checkins
  for all to authenticated
  using (
    exists (
      select 1 from public.recovery_meetings rm
      where rm.id = recovery_meeting_checkins.meeting_id
        and public.is_recovery_group_leader(rm.group_id)
    )
  )
  with check (
    exists (
      select 1 from public.recovery_meetings rm
      where rm.id = recovery_meeting_checkins.meeting_id
        and public.is_recovery_group_leader(rm.group_id)
    )
  );

create policy recovery_posts_read on public.recovery_discussion_posts
  for select to authenticated
  using (
    public.is_recovery_group_member(group_id)
    or public.is_recovery_group_leader(group_id)
  );
create policy recovery_posts_create on public.recovery_discussion_posts
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and public.is_recovery_group_member(group_id)
  );
create policy recovery_posts_update on public.recovery_discussion_posts
  for update to authenticated
  using (created_by = auth.uid() or public.is_recovery_group_leader(group_id))
  with check (created_by = auth.uid() or public.is_recovery_group_leader(group_id));

create policy recovery_resources_read on public.recovery_resource_organizations
  for select to authenticated
  using (active and verification_status = 'approved' or public.is_ministry_space_manager());
create policy recovery_resources_manage on public.recovery_resource_organizations
  for all to authenticated
  using (public.is_ministry_space_manager())
  with check (public.is_ministry_space_manager());

create policy recovery_outreach_read on public.recovery_outreach_opportunities
  for select to authenticated using (public.is_ministry_space_manager());
create policy recovery_outreach_manage on public.recovery_outreach_opportunities
  for all to authenticated
  using (public.is_ministry_space_manager())
  with check (public.is_ministry_space_manager());

create policy recovery_inquiries_read on public.recovery_support_inquiries
  for select to authenticated using (public.is_ministry_space_manager());
create policy recovery_inquiries_manage on public.recovery_support_inquiries
  for all to authenticated
  using (public.is_ministry_space_manager())
  with check (public.is_ministry_space_manager());

-- Grants. RLS remains authoritative. -------------------------------------------

grant select, insert, update, delete on public.member_gift_profiles to authenticated;
grant select, insert, update, delete on public.member_gifts to authenticated;
grant select, insert, update, delete on public.gift_assessments to authenticated;
grant select, insert, update, delete on public.gift_opportunities to authenticated;
grant select, insert, update on public.gift_opportunity_responses to authenticated;
grant select, insert, update, delete on public.prayer_requests to authenticated;
grant select, insert, update on public.prayer_support_events to authenticated;
grant select, insert, update, delete on public.recovery_programs to authenticated;
grant select, insert, update, delete on public.recovery_groups to authenticated;
grant select, insert, update, delete on public.recovery_group_memberships to authenticated;
grant select, insert, update, delete on public.recovery_curriculum_units to authenticated;
grant select, insert, update, delete on public.recovery_meetings to authenticated;
grant select, insert, update, delete on public.recovery_meeting_checkins to authenticated;
grant select, insert, update, delete on public.recovery_discussion_posts to authenticated;
grant select, insert, update, delete on public.recovery_resource_organizations to authenticated;
grant select, insert, update, delete on public.recovery_outreach_opportunities to authenticated;
grant select, insert, update, delete on public.recovery_support_inquiries to authenticated;

grant all on public.member_gift_profiles to service_role;
grant all on public.member_gifts to service_role;
grant all on public.gift_assessments to service_role;
grant all on public.gift_opportunities to service_role;
grant all on public.gift_opportunity_responses to service_role;
grant all on public.prayer_requests to service_role;
grant all on public.prayer_support_events to service_role;
grant all on public.recovery_programs to service_role;
grant all on public.recovery_groups to service_role;
grant all on public.recovery_group_memberships to service_role;
grant all on public.recovery_curriculum_units to service_role;
grant all on public.recovery_meetings to service_role;
grant all on public.recovery_meeting_checkins to service_role;
grant all on public.recovery_discussion_posts to service_role;
grant all on public.recovery_resource_organizations to service_role;
grant all on public.recovery_outreach_opportunities to service_role;
grant all on public.recovery_support_inquiries to service_role;

revoke all on public.member_gift_profiles from anon;
revoke all on public.member_gifts from anon;
revoke all on public.gift_assessments from anon;
revoke all on public.gift_opportunities from anon;
revoke all on public.gift_opportunity_responses from anon;
revoke all on public.prayer_requests from anon;
revoke all on public.prayer_support_events from anon;
revoke all on public.recovery_programs from anon;
revoke all on public.recovery_groups from anon;
revoke all on public.recovery_group_memberships from anon;
revoke all on public.recovery_curriculum_units from anon;
revoke all on public.recovery_meetings from anon;
revoke all on public.recovery_meeting_checkins from anon;
revoke all on public.recovery_discussion_posts from anon;
revoke all on public.recovery_resource_organizations from anon;
revoke all on public.recovery_outreach_opportunities from anon;
revoke all on public.recovery_support_inquiries from anon;

comment on table public.gift_assessments is
  'Voluntary self-reflection. Results must not be used as an automated spiritual-worth score or automatic ministry assignment.';
comment on table public.prayer_requests is
  'Sensitive prayer records excluded from advertising, public analytics, and AI processing by default.';
comment on table public.recovery_group_memberships is
  'Sensitive recovery-ministry participation. Technical access does not imply pastoral access.';
comment on table public.recovery_outreach_opportunities is
  'Topic and organization intelligence only. This table intentionally has no person identifier, diagnosis, sobriety status, or inferred vulnerability field.';

commit;
