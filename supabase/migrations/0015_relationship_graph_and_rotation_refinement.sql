begin;

create table public.relationship_signals (
  id uuid primary key default extensions.gen_random_uuid(),
  household_a_id uuid not null references public.households(id) on delete cascade,
  household_b_id uuid not null references public.households(id) on delete cascade,
  source text not null check (source in ('past_group', 'event_coattendance', 'explicit_connection', 'aggregate_interaction')),
  familiarity numeric(5,4) not null check (familiarity between 0 and 1),
  observed_at timestamptz not null,
  expires_at timestamptz,
  content_free_attested boolean not null default false check (content_free_attested = true),
  approved_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  check (household_a_id <> household_b_id),
  check (expires_at is null or expires_at > observed_at)
);
create index relationship_signals_pair_idx on public.relationship_signals(household_a_id, household_b_id, observed_at desc);
create index relationship_signals_active_idx on public.relationship_signals(expires_at) where expires_at is not null;

alter table public.rotation_runs
  add column optimization_strategy text,
  add column requested_refinement_passes integer not null default 0 check (requested_refinement_passes between 0 and 20),
  add column completed_refinement_passes integer not null default 0 check (completed_refinement_passes between 0 and 20),
  add column accepted_swaps integer not null default 0 check (accepted_swaps >= 0),
  add column relationship_signal_count integer not null default 0 check (relationship_signal_count >= 0),
  add column content_free_signals_attested boolean not null default true;

alter table public.relationship_signals enable row level security;

create policy relationship_signals_leadership
on public.relationship_signals for all to authenticated
using (public.is_privileged_actor(array['minister','super_admin']))
with check (
  public.is_privileged_actor(array['minister','super_admin'])
  and public.is_aal2()
  and content_free_attested = true
);

revoke all on public.relationship_signals from anon;
grant select, insert, update, delete on public.relationship_signals to authenticated;

commit;
