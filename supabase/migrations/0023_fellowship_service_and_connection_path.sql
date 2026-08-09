begin;

-- -----------------------------------------------------------------------------
-- Fellowship 2.0: practical hosting details, co-hosts, availability polls,
-- post-meetup feedback, service shifts, and a voluntary connection pathway.
-- -----------------------------------------------------------------------------

alter table public.fellowship_meetups add column if not exists host_display_name text not null default 'Church member';
alter table public.fellowship_meetups add column if not exists accessibility_notes text;
alter table public.fellowship_meetups add column if not exists food_notes text;
alter table public.fellowship_meetups add column if not exists cost_notes text;
alter table public.fellowship_meetups add column if not exists transportation_notes text;
alter table public.fellowship_meetups add column if not exists recurrence_rule text;
alter table public.fellowship_meetups add column if not exists weather_plan text;
alter table public.fellowship_meetups add column if not exists host_checklist jsonb not null default '[]'::jsonb;
alter table public.fellowship_meetups
  add constraint fellowship_meetups_host_display_name_check check (char_length(host_display_name) between 1 and 120),
  add constraint fellowship_meetups_accessibility_notes_check check (accessibility_notes is null or char_length(accessibility_notes) <= 800),
  add constraint fellowship_meetups_food_notes_check check (food_notes is null or char_length(food_notes) <= 800),
  add constraint fellowship_meetups_cost_notes_check check (cost_notes is null or char_length(cost_notes) <= 500),
  add constraint fellowship_meetups_transportation_notes_check check (transportation_notes is null or char_length(transportation_notes) <= 800),
  add constraint fellowship_meetups_recurrence_rule_check check (recurrence_rule is null or char_length(recurrence_rule) <= 500),
  add constraint fellowship_meetups_weather_plan_check check (weather_plan is null or char_length(weather_plan) <= 800),
  add constraint fellowship_meetups_host_checklist_check check (jsonb_typeof(host_checklist) = 'array');

alter table public.fellowship_preferences add column if not exists prefer_small_groups boolean not null default false;
alter table public.fellowship_preferences add column if not exists active_meetups_preferred boolean not null default false;
alter table public.fellowship_preferences add column if not exists new_here boolean not null default false;
alter table public.fellowship_preferences add column if not exists explanation_required boolean not null default true;

create table public.fellowship_meetup_cohosts (
  meetup_id uuid not null references public.fellowship_meetups(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  invited_by uuid not null references public.profiles(id) on delete restrict,
  accepted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  primary key(meetup_id, profile_id)
);

create table public.fellowship_meetup_polls (
  id uuid primary key default extensions.gen_random_uuid(),
  meetup_id uuid not null references public.fellowship_meetups(id) on delete cascade,
  question text not null check (char_length(question) between 3 and 300),
  closes_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.fellowship_meetup_poll_options (
  id uuid primary key default extensions.gen_random_uuid(),
  poll_id uuid not null references public.fellowship_meetup_polls(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 200),
  position integer not null default 0,
  unique(poll_id, label)
);

create table public.fellowship_meetup_poll_votes (
  poll_id uuid not null references public.fellowship_meetup_polls(id) on delete cascade,
  option_id uuid not null references public.fellowship_meetup_poll_options(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key(poll_id, profile_id)
);

create table public.fellowship_meetup_feedback (
  meetup_id uuid not null references public.fellowship_meetups(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  happened boolean,
  join_again boolean,
  fit_rating smallint check (fit_rating is null or fit_rating between 1 and 5),
  accessibility_feedback text check (accessibility_feedback is null or char_length(accessibility_feedback) <= 1000),
  private_note text check (private_note is null or char_length(private_note) <= 1500),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key(meetup_id, profile_id)
);

create table public.service_opportunities (
  id uuid primary key default extensions.gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 160),
  need_statement text not null check (char_length(need_statement) between 20 and 2000),
  impact_statement text not null check (char_length(impact_statement) between 20 and 2000),
  partner_name text not null check (char_length(partner_name) between 2 and 160),
  partner_reference text,
  general_location text not null check (char_length(general_location) between 2 and 200),
  age_requirements text not null default 'Adults',
  physical_requirements text,
  skills text[] not null default '{}',
  accessibility_notes text,
  safeguarding_requirements text,
  what_to_bring text,
  family_friendly boolean not null default false,
  recurrence_rule text,
  visibility text not null default 'members' check (visibility in ('public','members')),
  publication_status public.publication_status not null default 'draft',
  leader_profile_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  reviewed_by uuid references public.profiles(id) on delete set null,
  published_by uuid references public.profiles(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check ((publication_status <> 'published') or (published_by is not null and published_at is not null))
);
create index service_opportunities_publication_idx on public.service_opportunities(publication_status, visibility, created_at desc);

create table public.service_shifts (
  id uuid primary key default extensions.gen_random_uuid(),
  opportunity_id uuid not null references public.service_opportunities(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  capacity integer not null check (capacity between 1 and 1000),
  allow_waitlist boolean not null default true,
  status text not null default 'open' check (status in ('draft','open','full','cancelled','completed')),
  reminder_note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (ends_at > starts_at)
);
create index service_shifts_upcoming_idx on public.service_shifts(starts_at) where status in ('open','full');

create table public.service_shift_signups (
  shift_id uuid not null references public.service_shifts(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'going' check (status in ('going','waitlisted','cancelled','attended','no_show')),
  party_size integer not null default 1 check (party_size between 1 and 20),
  transportation_note text check (transportation_note is null or char_length(transportation_note) <= 500),
  accessibility_note text check (accessibility_note is null or char_length(accessibility_note) <= 500),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key(shift_id, profile_id)
);

create table public.connection_pathway_enrollments (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active','paused','completed','archived')),
  started_at timestamptz not null default timezone('utc', now()),
  paused_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.connection_pathway_steps (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  step_key text not null check (step_key in ('visit','fellowship','bible','service')),
  status text not null default 'not_started' check (status in ('not_started','completed','skipped')),
  completed_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key(profile_id, step_key)
);

create trigger fellowship_meetup_feedback_set_updated_at before update on public.fellowship_meetup_feedback for each row execute function public.set_updated_at();
create trigger service_opportunities_set_updated_at before update on public.service_opportunities for each row execute function public.set_updated_at();
create trigger service_shifts_set_updated_at before update on public.service_shifts for each row execute function public.set_updated_at();
create trigger service_shift_signups_set_updated_at before update on public.service_shift_signups for each row execute function public.set_updated_at();
create trigger connection_pathway_enrollments_set_updated_at before update on public.connection_pathway_enrollments for each row execute function public.set_updated_at();
create trigger connection_pathway_steps_set_updated_at before update on public.connection_pathway_steps for each row execute function public.set_updated_at();

create or replace function public.apply_service_shift_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare shift_record record;
declare current_size integer;
begin
  if new.status <> 'going' then return new; end if;
  select capacity, allow_waitlist, status into shift_record from public.service_shifts where id = new.shift_id for update;
  if shift_record is null or shift_record.status not in ('open','full') then raise exception 'Shift is not accepting signups'; end if;
  select coalesce(sum(party_size), 0)::integer into current_size
  from public.service_shift_signups
  where shift_id = new.shift_id and status in ('going','attended')
    and (tg_op = 'INSERT' or profile_id <> new.profile_id);
  if current_size + new.party_size > shift_record.capacity then
    if shift_record.allow_waitlist then new.status := 'waitlisted';
    else raise exception 'Shift capacity has been reached'; end if;
  end if;
  return new;
end;
$$;
create trigger service_shift_capacity_guard before insert or update on public.service_shift_signups for each row execute function public.apply_service_shift_capacity();

alter table public.fellowship_meetup_cohosts enable row level security;
alter table public.fellowship_meetup_polls enable row level security;
alter table public.fellowship_meetup_poll_options enable row level security;
alter table public.fellowship_meetup_poll_votes enable row level security;
alter table public.fellowship_meetup_feedback enable row level security;
alter table public.service_opportunities enable row level security;
alter table public.service_shifts enable row level security;
alter table public.service_shift_signups enable row level security;
alter table public.connection_pathway_enrollments enable row level security;
alter table public.connection_pathway_steps enable row level security;

create policy fellowship_cohosts_thread_read on public.fellowship_meetup_cohosts for select to authenticated using (public.can_access_fellowship_thread(meetup_id));
create policy fellowship_cohosts_host_manage on public.fellowship_meetup_cohosts for all to authenticated
  using (exists(select 1 from public.fellowship_meetups fm where fm.id = meetup_id and fm.creator_profile_id = auth.uid()) or public.is_privileged_actor(array['minister','moderator','super_admin']))
  with check (exists(select 1 from public.fellowship_meetups fm where fm.id = meetup_id and fm.creator_profile_id = auth.uid()) or public.is_privileged_actor(array['minister','moderator','super_admin']));

create policy fellowship_polls_thread_read on public.fellowship_meetup_polls for select to authenticated using (public.can_access_fellowship_thread(meetup_id));
create policy fellowship_polls_host_create on public.fellowship_meetup_polls for insert to authenticated with check (created_by = auth.uid() and public.can_access_fellowship_thread(meetup_id));
create policy fellowship_poll_options_thread_read on public.fellowship_meetup_poll_options for select to authenticated using (exists(select 1 from public.fellowship_meetup_polls p where p.id = poll_id and public.can_access_fellowship_thread(p.meetup_id)));
create policy fellowship_poll_options_host_manage on public.fellowship_meetup_poll_options for all to authenticated
  using (exists(select 1 from public.fellowship_meetup_polls p join public.fellowship_meetups fm on fm.id = p.meetup_id where p.id = poll_id and fm.creator_profile_id = auth.uid()))
  with check (exists(select 1 from public.fellowship_meetup_polls p join public.fellowship_meetups fm on fm.id = p.meetup_id where p.id = poll_id and fm.creator_profile_id = auth.uid()));
create policy fellowship_poll_votes_participant on public.fellowship_meetup_poll_votes for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid() and exists(select 1 from public.fellowship_meetup_polls p where p.id = poll_id and public.can_access_fellowship_thread(p.meetup_id)));
create policy fellowship_feedback_self on public.fellowship_meetup_feedback for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid() and public.can_access_fellowship_thread(meetup_id));

create policy service_opportunities_member_read on public.service_opportunities for select to authenticated
  using (publication_status = 'published' and public.is_active_member());
create policy service_opportunities_leader_manage on public.service_opportunities for all to authenticated
  using (public.is_privileged_actor(array['content_editor','minister','super_admin']))
  with check (public.is_privileged_actor(array['content_editor','minister','super_admin']));
create policy service_shifts_member_read on public.service_shifts for select to authenticated
  using (exists(select 1 from public.service_opportunities so where so.id = opportunity_id and so.publication_status = 'published' and public.is_active_member()));
create policy service_shifts_leader_manage on public.service_shifts for all to authenticated
  using (public.is_privileged_actor(array['minister','super_admin']))
  with check (public.is_privileged_actor(array['minister','super_admin']));
create policy service_signups_self_read on public.service_shift_signups for select to authenticated using (profile_id = auth.uid() or public.is_privileged_actor(array['minister','super_admin']));
create policy service_signups_self_insert on public.service_shift_signups for insert to authenticated
  with check (profile_id = auth.uid() and public.is_active_member() and status in ('going','waitlisted'));
create policy service_signups_self_update on public.service_shift_signups for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid() and status in ('going','waitlisted','cancelled'));
create policy service_signups_leader_manage on public.service_shift_signups for all to authenticated
  using (public.is_privileged_actor(array['minister','super_admin']))
  with check (public.is_privileged_actor(array['minister','super_admin']));

create policy connection_pathway_enrollment_self on public.connection_pathway_enrollments for all to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy connection_pathway_steps_self on public.connection_pathway_steps for all to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());

revoke all on table public.fellowship_meetup_cohosts, public.fellowship_meetup_polls, public.fellowship_meetup_poll_options, public.fellowship_meetup_poll_votes, public.fellowship_meetup_feedback, public.service_opportunities, public.service_shifts, public.service_shift_signups, public.connection_pathway_enrollments, public.connection_pathway_steps from anon;
grant select, insert, update, delete on table public.fellowship_meetup_cohosts, public.fellowship_meetup_polls, public.fellowship_meetup_poll_options, public.fellowship_meetup_poll_votes, public.fellowship_meetup_feedback, public.service_opportunities, public.service_shifts, public.service_shift_signups, public.connection_pathway_enrollments, public.connection_pathway_steps to authenticated;
grant all on table public.fellowship_meetup_cohosts, public.fellowship_meetup_polls, public.fellowship_meetup_poll_options, public.fellowship_meetup_poll_votes, public.fellowship_meetup_feedback, public.service_opportunities, public.service_shifts, public.service_shift_signups, public.connection_pathway_enrollments, public.connection_pathway_steps to service_role;

comment on table public.service_opportunities is 'Approved service needs and partner accountability. Service participation is never a spiritual score or advertising signal.';
comment on table public.connection_pathway_enrollments is 'Member-owned voluntary connection pathway. Completion cannot determine worth, eligibility, leadership, or pastoral status.';

commit;
