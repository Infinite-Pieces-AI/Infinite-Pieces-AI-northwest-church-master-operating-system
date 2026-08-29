begin;

-- -----------------------------------------------------------------------------
-- Gifts of the Church, Prayer Well, and Recovery Ministry
-- -----------------------------------------------------------------------------
-- Design boundaries:
--   * Assessment answers and scores remain private unless the member explicitly
--     creates a gift offer.
--   * Prayer ownership is stored separately from the member-visible prayer feed
--     so an anonymous request does not leak the author's profile identifier.
--   * Recovery membership and discussion data are treated as highly sensitive.
--   * Outreach stores public organizations and aggregate/public topics only; it
--     must never become an individual addiction-status or vulnerability dossier.
--   * Licensed assessment and recovery curriculum text is referenced by URL and
--     provider metadata rather than copied into this database.

create table public.gift_assessments (
  id uuid primary key default extensions.gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  provider_key text not null default 'manual' check (provider_key in ('manual','truewiring','other')),
  provider_report_url text check (provider_report_url is null or provider_report_url ~ '^https://'),
  dominant_theme text check (dominant_theme is null or dominant_theme in ('directional','relational','insight','positional','other')),
  completed_at timestamptz,
  member_notes text check (member_notes is null or char_length(member_notes) <= 2000),
  share_summary_with_leaders boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(profile_id, provider_key)
);

create table public.gift_strengths (
  id uuid primary key default extensions.gen_random_uuid(),
  assessment_id uuid not null references public.gift_assessments(id) on delete cascade,
  gift_key text not null check (gift_key ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'),
  gift_label text not null check (char_length(gift_label) between 2 and 120),
  score_percent integer check (score_percent is null or score_percent between 0 and 100),
  strength_band text check (strength_band is null or strength_band in ('dominant','supporting','other')),
  theme text not null default 'other' check (theme in ('directional','relational','insight','positional','other')),
  source_note text check (source_note is null or char_length(source_note) <= 500),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(assessment_id, gift_key)
);

create table public.gift_posts (
  id uuid primary key default extensions.gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete restrict,
  post_type text not null check (post_type in ('offer','member_need','church_need','item_share')),
  title text not null check (char_length(title) between 3 and 180),
  description text not null check (char_length(description) between 10 and 5000),
  gift_tags text[] not null default '{}',
  skill_tags text[] not null default '{}',
  visibility text not null default 'church' check (visibility in ('church','ministry','group')),
  ministry_id uuid references public.ministries(id) on delete cascade,
  group_id uuid references public.groups(id) on delete cascade,
  exchange_type text not null default 'free' check (exchange_type in ('free','donation','borrow','exchange','paid')),
  price_note text check (price_note is null or char_length(price_note) <= 300),
  general_location text check (general_location is null or char_length(general_location) <= 200),
  availability_text text check (availability_text is null or char_length(availability_text) <= 500),
  capacity integer check (capacity is null or capacity between 1 and 500),
  status text not null default 'open' check (status in ('draft','open','matched','fulfilled','closed','removed')),
  moderation_status text not null default 'approved' check (moderation_status in ('pending','approved','rejected','removed')),
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check ((visibility = 'ministry' and ministry_id is not null and group_id is null)
      or (visibility = 'group' and group_id is not null and ministry_id is null)
      or (visibility = 'church' and ministry_id is null and group_id is null)),
  check (exchange_type = 'paid' or price_note is null)
);

create table public.gift_post_responses (
  id uuid primary key default extensions.gen_random_uuid(),
  post_id uuid not null references public.gift_posts(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  message text not null check (char_length(message) between 2 and 2000),
  status text not null default 'interested' check (status in ('interested','accepted','declined','completed','withdrawn')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(post_id, profile_id)
);

create table public.member_prayer_requests (
  id uuid primary key default extensions.gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 180),
  request_text text not null check (char_length(request_text) between 3 and 5000),
  submitted_by_display text check (submitted_by_display is null or char_length(submitted_by_display) <= 120),
  display_anonymous boolean not null default false,
  visibility text not null default 'church' check (visibility in ('church','ministry','group','leaders_only','private')),
  ministry_id uuid references public.ministries(id) on delete cascade,
  group_id uuid references public.groups(id) on delete cascade,
  category text not null default 'general' check (category in ('general','health','family','work','grief','faith','recovery','thanksgiving','other')),
  sensitivity text not null default 'normal' check (sensitivity in ('normal','pastoral','safeguarding')),
  allow_encouragement boolean not null default true,
  allow_prayed_events boolean not null default true,
  status text not null default 'open' check (status in ('open','answered','archived','withdrawn')),
  answered_summary text check (answered_summary is null or char_length(answered_summary) <= 3000),
  answered_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check ((visibility = 'ministry' and ministry_id is not null and group_id is null)
      or (visibility = 'group' and group_id is not null and ministry_id is null)
      or (visibility in ('church','leaders_only','private') and ministry_id is null and group_id is null)),
  check ((status = 'answered' and answered_at is not null)
      or (status <> 'answered'))
);

create table public.prayer_request_owners (
  request_id uuid primary key references public.member_prayer_requests(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.prayer_interactions (
  id uuid primary key default extensions.gen_random_uuid(),
  request_id uuid not null references public.member_prayer_requests(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  interaction_type text not null check (interaction_type in ('prayed','encouragement','scripture','update')),
  body text check (body is null or char_length(body) <= 2500),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check ((interaction_type = 'prayed' and body is null)
      or (interaction_type <> 'prayed' and body is not null))
);
create unique index prayer_interactions_daily_prayed_unique
  on public.prayer_interactions(request_id, created_by, ((created_at at time zone 'utc')::date))
  where interaction_type = 'prayed';

create table public.recovery_programs (
  id uuid primary key default extensions.gen_random_uuid(),
  display_name text not null check (char_length(display_name) between 3 and 160),
  program_type text not null default 'custom' check (program_type in ('custom','celebrate_recovery')),
  official_program_confirmation boolean not null default false,
  curriculum_provider text check (curriculum_provider is null or char_length(curriculum_provider) <= 160),
  curriculum_home_url text check (curriculum_home_url is null or curriculum_home_url ~ '^https://'),
  public_summary text not null check (char_length(public_summary) between 20 and 3000),
  meeting_day text check (meeting_day is null or char_length(meeting_day) <= 40),
  meeting_time time,
  general_location text check (general_location is null or char_length(general_location) <= 200),
  participant_age_minimum integer not null default 18 check (participant_age_minimum between 18 and 99),
  status text not null default 'draft' check (status in ('draft','active','paused','retired')),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (program_type <> 'celebrate_recovery' or official_program_confirmation)
);

create table public.recovery_memberships (
  id uuid primary key default extensions.gen_random_uuid(),
  program_id uuid not null references public.recovery_programs(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  membership_role text not null default 'participant' check (membership_role in ('participant','peer_support','leader','admin')),
  display_mode text not null default 'first_name' check (display_mode in ('first_name','initials','private')),
  consented_at timestamptz not null default timezone('utc', now()),
  joined_at timestamptz not null default timezone('utc', now()),
  ended_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(program_id, profile_id)
);

create table public.recovery_sessions (
  id uuid primary key default extensions.gen_random_uuid(),
  program_id uuid not null references public.recovery_programs(id) on delete cascade,
  series_key text not null check (series_key ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'),
  week_number integer not null check (week_number between 1 and 260),
  title text not null check (char_length(title) between 3 and 180),
  participant_summary text not null check (char_length(participant_summary) between 20 and 3000),
  scripture_references text[] not null default '{}',
  licensed_resource_url text check (licensed_resource_url is null or licensed_resource_url ~ '^https://'),
  scheduled_for timestamptz,
  status text not null default 'draft' check (status in ('draft','published','completed','cancelled')),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(program_id, series_key, week_number)
);

create table public.recovery_session_guides (
  session_id uuid primary key references public.recovery_sessions(id) on delete cascade,
  leader_agenda text not null check (char_length(leader_agenda) between 10 and 10000),
  safety_notes text check (safety_notes is null or char_length(safety_notes) <= 5000),
  updated_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.recovery_progress (
  id uuid primary key default extensions.gen_random_uuid(),
  session_id uuid not null references public.recovery_sessions(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  progress_status text not null default 'not_started' check (progress_status in ('not_started','in_progress','completed','skipped')),
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(session_id, profile_id),
  check ((progress_status = 'completed' and completed_at is not null)
      or (progress_status <> 'completed'))
);

create table public.recovery_posts (
  id uuid primary key default extensions.gen_random_uuid(),
  program_id uuid not null references public.recovery_programs(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  post_type text not null default 'discussion' check (post_type in ('announcement','discussion','encouragement','resource','meeting_update')),
  title text not null check (char_length(title) between 2 and 180),
  body text not null check (char_length(body) between 2 and 5000),
  leader_only boolean not null default false,
  status text not null default 'active' check (status in ('active','archived','removed')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.recovery_post_comments (
  id uuid primary key default extensions.gen_random_uuid(),
  post_id uuid not null references public.recovery_posts(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 2 and 2500),
  status text not null default 'active' check (status in ('active','removed')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.recovery_outreach_partners (
  id uuid primary key default extensions.gen_random_uuid(),
  organization_name text not null check (char_length(organization_name) between 2 and 180),
  organization_type text not null check (organization_type in ('treatment_provider','recovery_support','community_health','sober_living','public_agency','church','other')),
  public_url text not null check (public_url ~ '^https://'),
  public_contact text check (public_contact is null or char_length(public_contact) <= 300),
  locality text not null check (char_length(locality) between 2 and 160),
  partnership_status text not null default 'research' check (partnership_status in ('research','approved_for_contact','contacted','conversation','partner','declined','do_not_contact')),
  notes text check (notes is null or char_length(notes) <= 2000),
  verified_public_source_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(public_url)
);

-- -----------------------------------------------------------------------------
-- Authorization helpers
-- -----------------------------------------------------------------------------
create or replace function public.can_read_gift_post(requested_post_id uuid, target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select public.may_check_target_user(target_user) and exists (
    select 1
    from public.gift_posts gp
    where gp.id = requested_post_id
      and gp.moderation_status = 'approved'
      and gp.status not in ('draft','removed')
      and (
        gp.created_by = target_user
        or public.is_privileged_actor(array['minister','moderator','super_admin'])
        or (gp.visibility = 'church' and public.is_active_member(target_user))
        or (gp.visibility = 'ministry' and public.is_ministry_member(gp.ministry_id, target_user))
        or (gp.visibility = 'group' and public.is_group_member(gp.group_id, target_user))
      )
  );
$$;

create or replace function public.owns_prayer_request(requested_request_id uuid, target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select public.may_check_target_user(target_user) and exists (
    select 1 from public.prayer_request_owners pro
    where pro.request_id = requested_request_id and pro.profile_id = target_user
  );
$$;

create or replace function public.can_read_prayer_request(requested_request_id uuid, target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select public.may_check_target_user(target_user) and exists (
    select 1
    from public.member_prayer_requests pr
    where pr.id = requested_request_id
      and pr.status <> 'withdrawn'
      and (
        public.owns_prayer_request(pr.id, target_user)
        or public.is_privileged_actor(array['minister','safety_admin','super_admin'])
        or (pr.sensitivity = 'normal' and pr.visibility = 'church' and public.is_active_member(target_user))
        or (pr.sensitivity = 'normal' and pr.visibility = 'ministry' and public.is_ministry_member(pr.ministry_id, target_user))
        or (pr.sensitivity = 'normal' and pr.visibility = 'group' and public.is_group_member(pr.group_id, target_user))
      )
  );
$$;

create or replace function public.is_recovery_member(requested_program_id uuid, target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select public.may_check_target_user(target_user) and exists (
    select 1 from public.recovery_memberships rm
    where rm.program_id = requested_program_id
      and rm.profile_id = target_user
      and rm.ended_at is null
  );
$$;

create or replace function public.leads_recovery_program(requested_program_id uuid, target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select public.may_check_target_user(target_user) and (
    public.is_privileged_actor(array['minister','safety_admin','super_admin'])
    or exists (
      select 1 from public.recovery_memberships rm
      where rm.program_id = requested_program_id
        and rm.profile_id = target_user
        and rm.membership_role in ('leader','admin')
        and rm.ended_at is null
    )
  );
$$;

-- -----------------------------------------------------------------------------
-- Secure member prayer RPCs
-- -----------------------------------------------------------------------------
create or replace function public.submit_member_prayer_request(
  p_title text,
  p_request_text text,
  p_display_anonymous boolean,
  p_visibility text,
  p_ministry_id uuid,
  p_group_id uuid,
  p_category text,
  p_sensitivity text,
  p_allow_encouragement boolean,
  p_allow_prayed_events boolean
)
returns uuid
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  new_id uuid;
  display_name text;
begin
  if not public.is_active_member(auth.uid()) then
    raise exception 'Active membership is required';
  end if;
  if p_visibility = 'ministry' and not public.is_ministry_member(p_ministry_id, auth.uid()) then
    raise exception 'Ministry access is required';
  end if;
  if p_visibility = 'group' and not public.is_group_member(p_group_id, auth.uid()) then
    raise exception 'Group access is required';
  end if;
  if p_sensitivity <> 'normal' then
    p_visibility := 'leaders_only';
  end if;
  select p.display_name into display_name from public.profiles p where p.id = auth.uid();
  insert into public.member_prayer_requests (
    title, request_text, submitted_by_display, display_anonymous, visibility,
    ministry_id, group_id, category, sensitivity, allow_encouragement, allow_prayed_events
  ) values (
    left(trim(p_title), 180), left(trim(p_request_text), 5000),
    case when p_display_anonymous then null else display_name end,
    p_display_anonymous, p_visibility,
    case when p_visibility = 'ministry' then p_ministry_id else null end,
    case when p_visibility = 'group' then p_group_id else null end,
    p_category, p_sensitivity, p_allow_encouragement, p_allow_prayed_events
  ) returning id into new_id;
  insert into public.prayer_request_owners (request_id, profile_id) values (new_id, auth.uid());
  return new_id;
end;
$$;

revoke all on function public.submit_member_prayer_request(text,text,boolean,text,uuid,uuid,text,text,boolean,boolean) from public;
grant execute on function public.submit_member_prayer_request(text,text,boolean,text,uuid,uuid,text,text,boolean,boolean) to authenticated;

-- -----------------------------------------------------------------------------
-- Timestamp triggers
-- -----------------------------------------------------------------------------
create trigger gift_assessments_set_updated_at before update on public.gift_assessments
  for each row execute function public.set_updated_at();
create trigger gift_strengths_set_updated_at before update on public.gift_strengths
  for each row execute function public.set_updated_at();
create trigger gift_posts_set_updated_at before update on public.gift_posts
  for each row execute function public.set_updated_at();
create trigger gift_post_responses_set_updated_at before update on public.gift_post_responses
  for each row execute function public.set_updated_at();
create trigger prayer_requests_set_updated_at before update on public.member_prayer_requests
  for each row execute function public.set_updated_at();
create trigger prayer_interactions_set_updated_at before update on public.prayer_interactions
  for each row execute function public.set_updated_at();
create trigger recovery_programs_set_updated_at before update on public.recovery_programs
  for each row execute function public.set_updated_at();
create trigger recovery_memberships_set_updated_at before update on public.recovery_memberships
  for each row execute function public.set_updated_at();
create trigger recovery_sessions_set_updated_at before update on public.recovery_sessions
  for each row execute function public.set_updated_at();
create trigger recovery_session_guides_set_updated_at before update on public.recovery_session_guides
  for each row execute function public.set_updated_at();
create trigger recovery_progress_set_updated_at before update on public.recovery_progress
  for each row execute function public.set_updated_at();
create trigger recovery_posts_set_updated_at before update on public.recovery_posts
  for each row execute function public.set_updated_at();
create trigger recovery_post_comments_set_updated_at before update on public.recovery_post_comments
  for each row execute function public.set_updated_at();
create trigger recovery_outreach_partners_set_updated_at before update on public.recovery_outreach_partners
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Row-level security
-- -----------------------------------------------------------------------------
alter table public.gift_assessments enable row level security;
alter table public.gift_strengths enable row level security;
alter table public.gift_posts enable row level security;
alter table public.gift_post_responses enable row level security;
alter table public.member_prayer_requests enable row level security;
alter table public.prayer_request_owners enable row level security;
alter table public.prayer_interactions enable row level security;
alter table public.recovery_programs enable row level security;
alter table public.recovery_memberships enable row level security;
alter table public.recovery_sessions enable row level security;
alter table public.recovery_session_guides enable row level security;
alter table public.recovery_progress enable row level security;
alter table public.recovery_posts enable row level security;
alter table public.recovery_post_comments enable row level security;
alter table public.recovery_outreach_partners enable row level security;

create policy gift_assessment_owner_all on public.gift_assessments for all to authenticated
  using (profile_id = auth.uid() or public.is_privileged_actor(array['minister','super_admin']))
  with check (profile_id = auth.uid() or public.is_privileged_actor(array['minister','super_admin']));
create policy gift_strength_owner_all on public.gift_strengths for all to authenticated
  using (exists (select 1 from public.gift_assessments ga where ga.id = assessment_id and (ga.profile_id = auth.uid() or public.is_privileged_actor(array['minister','super_admin']))))
  with check (exists (select 1 from public.gift_assessments ga where ga.id = assessment_id and (ga.profile_id = auth.uid() or public.is_privileged_actor(array['minister','super_admin']))));

create policy gift_posts_read on public.gift_posts for select to authenticated
  using (public.can_read_gift_post(id) or created_by = auth.uid());
create policy gift_posts_insert on public.gift_posts for insert to authenticated
  with check (
    created_by = auth.uid()
    and public.is_active_member()
    and (post_type <> 'church_need' or public.has_any_role(array['group_leader','minister','super_admin']))
    and (visibility <> 'ministry' or public.is_ministry_member(ministry_id))
    and (visibility <> 'group' or public.is_group_member(group_id))
  );
create policy gift_posts_update on public.gift_posts for update to authenticated
  using (created_by = auth.uid() or public.is_privileged_actor(array['moderator','minister','super_admin']))
  with check (created_by = auth.uid() or public.is_privileged_actor(array['moderator','minister','super_admin']));
create policy gift_posts_delete on public.gift_posts for delete to authenticated
  using (created_by = auth.uid() or public.is_privileged_actor(array['moderator','minister','super_admin']));

create policy gift_responses_read on public.gift_post_responses for select to authenticated
  using (
    profile_id = auth.uid()
    or exists (select 1 from public.gift_posts gp where gp.id = post_id and gp.created_by = auth.uid())
    or public.is_privileged_actor(array['moderator','minister','super_admin'])
  );
create policy gift_responses_insert on public.gift_post_responses for insert to authenticated
  with check (profile_id = auth.uid() and public.can_read_gift_post(post_id));
create policy gift_responses_update on public.gift_post_responses for update to authenticated
  using (
    profile_id = auth.uid()
    or exists (select 1 from public.gift_posts gp where gp.id = post_id and gp.created_by = auth.uid())
  )
  with check (
    profile_id = auth.uid()
    or exists (select 1 from public.gift_posts gp where gp.id = post_id and gp.created_by = auth.uid())
  );

create policy prayer_requests_read on public.member_prayer_requests for select to authenticated
  using (public.can_read_prayer_request(id));
create policy prayer_requests_update on public.member_prayer_requests for update to authenticated
  using (public.owns_prayer_request(id) or public.is_privileged_actor(array['minister','safety_admin','super_admin']))
  with check (public.owns_prayer_request(id) or public.is_privileged_actor(array['minister','safety_admin','super_admin']));
create policy prayer_requests_delete on public.member_prayer_requests for delete to authenticated
  using (public.owns_prayer_request(id) or public.is_privileged_actor(array['minister','super_admin']));
create policy prayer_owners_read on public.prayer_request_owners for select to authenticated
  using (profile_id = auth.uid() or public.is_privileged_actor(array['minister','safety_admin','super_admin']));
create policy prayer_interactions_read on public.prayer_interactions for select to authenticated
  using (public.can_read_prayer_request(request_id));
create policy prayer_interactions_insert on public.prayer_interactions for insert to authenticated
  with check (
    created_by = auth.uid()
    and public.can_read_prayer_request(request_id)
    and exists (
      select 1 from public.member_prayer_requests pr
      where pr.id = request_id
        and ((interaction_type = 'prayed' and pr.allow_prayed_events)
          or (interaction_type <> 'prayed' and pr.allow_encouragement))
    )
  );
create policy prayer_interactions_update on public.prayer_interactions for update to authenticated
  using (created_by = auth.uid() or public.is_privileged_actor(array['moderator','minister','super_admin']))
  with check (created_by = auth.uid() or public.is_privileged_actor(array['moderator','minister','super_admin']));
create policy prayer_interactions_delete on public.prayer_interactions for delete to authenticated
  using (created_by = auth.uid() or public.is_privileged_actor(array['moderator','minister','super_admin']));

create policy recovery_programs_read on public.recovery_programs for select to authenticated
  using (status = 'active' and public.is_active_member() or public.leads_recovery_program(id));
create policy recovery_programs_manage on public.recovery_programs for all to authenticated
  using (public.leads_recovery_program(id) or public.is_privileged_actor(array['minister','super_admin']))
  with check (public.is_privileged_actor(array['minister','super_admin']) or created_by = auth.uid());
create policy recovery_memberships_read on public.recovery_memberships for select to authenticated
  using (profile_id = auth.uid() or public.leads_recovery_program(program_id));
create policy recovery_memberships_manage on public.recovery_memberships for all to authenticated
  using (profile_id = auth.uid() or public.leads_recovery_program(program_id))
  with check (profile_id = auth.uid() or public.leads_recovery_program(program_id));
create policy recovery_sessions_read on public.recovery_sessions for select to authenticated
  using ((status in ('published','completed') and public.is_recovery_member(program_id)) or public.leads_recovery_program(program_id));
create policy recovery_sessions_manage on public.recovery_sessions for all to authenticated
  using (public.leads_recovery_program(program_id))
  with check (public.leads_recovery_program(program_id));
create policy recovery_guides_manage on public.recovery_session_guides for all to authenticated
  using (exists (select 1 from public.recovery_sessions rs where rs.id = session_id and public.leads_recovery_program(rs.program_id)))
  with check (exists (select 1 from public.recovery_sessions rs where rs.id = session_id and public.leads_recovery_program(rs.program_id)));
create policy recovery_progress_owner on public.recovery_progress for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid() and exists (select 1 from public.recovery_sessions rs where rs.id = session_id and public.is_recovery_member(rs.program_id)));
create policy recovery_posts_read on public.recovery_posts for select to authenticated
  using (public.is_recovery_member(program_id) and (not leader_only or public.leads_recovery_program(program_id)));
create policy recovery_posts_insert on public.recovery_posts for insert to authenticated
  with check (created_by = auth.uid() and public.is_recovery_member(program_id) and (not leader_only or public.leads_recovery_program(program_id)));
create policy recovery_posts_update on public.recovery_posts for update to authenticated
  using (created_by = auth.uid() or public.leads_recovery_program(program_id))
  with check (created_by = auth.uid() or public.leads_recovery_program(program_id));
create policy recovery_comments_read on public.recovery_post_comments for select to authenticated
  using (exists (select 1 from public.recovery_posts rp where rp.id = post_id and public.is_recovery_member(rp.program_id)));
create policy recovery_comments_insert on public.recovery_post_comments for insert to authenticated
  with check (created_by = auth.uid() and exists (select 1 from public.recovery_posts rp where rp.id = post_id and public.is_recovery_member(rp.program_id)));
create policy recovery_comments_update on public.recovery_post_comments for update to authenticated
  using (created_by = auth.uid() or exists (select 1 from public.recovery_posts rp where rp.id = post_id and public.leads_recovery_program(rp.program_id)))
  with check (created_by = auth.uid() or exists (select 1 from public.recovery_posts rp where rp.id = post_id and public.leads_recovery_program(rp.program_id)));
create policy recovery_partners_privileged on public.recovery_outreach_partners for all to authenticated
  using (public.is_privileged_actor(array['minister','content_editor','super_admin']))
  with check (public.is_privileged_actor(array['minister','content_editor','super_admin']));

-- -----------------------------------------------------------------------------
-- Grants
-- -----------------------------------------------------------------------------
revoke all on table public.gift_assessments, public.gift_strengths, public.gift_posts,
  public.gift_post_responses, public.member_prayer_requests, public.prayer_request_owners,
  public.prayer_interactions, public.recovery_programs, public.recovery_memberships,
  public.recovery_sessions, public.recovery_session_guides, public.recovery_progress,
  public.recovery_posts, public.recovery_post_comments, public.recovery_outreach_partners from anon;

grant select, insert, update, delete on table public.gift_assessments, public.gift_strengths,
  public.gift_posts, public.gift_post_responses, public.member_prayer_requests,
  public.prayer_request_owners, public.prayer_interactions, public.recovery_programs,
  public.recovery_memberships, public.recovery_sessions, public.recovery_session_guides,
  public.recovery_progress, public.recovery_posts, public.recovery_post_comments,
  public.recovery_outreach_partners to authenticated;

grant all on table public.gift_assessments, public.gift_strengths, public.gift_posts,
  public.gift_post_responses, public.member_prayer_requests, public.prayer_request_owners,
  public.prayer_interactions, public.recovery_programs, public.recovery_memberships,
  public.recovery_sessions, public.recovery_session_guides, public.recovery_progress,
  public.recovery_posts, public.recovery_post_comments, public.recovery_outreach_partners to service_role;

comment on table public.gift_assessments is
  'Private member-entered or provider-linked spiritual-gifts results. Assessment questions and licensed reports are not copied into this table.';
comment on table public.gift_posts is
  'Member offers, member needs, church needs, and item-sharing posts. The platform does not process payments.';
comment on table public.prayer_request_owners is
  'Restricted ownership mapping separated from the member-visible Prayer Well feed to protect anonymous requests.';
comment on table public.recovery_memberships is
  'Highly sensitive recovery-ministry membership. Access is limited to the member and authorized program leaders.';
comment on table public.recovery_outreach_partners is
  'Public organization research only. Do not store treatment patient identities, inferred addiction status, or private forum members.';

commit;
