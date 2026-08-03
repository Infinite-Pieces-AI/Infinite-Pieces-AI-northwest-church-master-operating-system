begin;

create table public.life_stages (
  id uuid primary key default extensions.gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  minimum_age integer,
  maximum_age integer,
  publication_status public.publication_status not null default 'draft',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.ministries (
  id uuid primary key default extensions.gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  life_stage_id uuid references public.life_stages(id) on delete set null,
  publication_status public.publication_status not null default 'draft',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.ministry_memberships (
  id uuid primary key default extensions.gen_random_uuid(),
  ministry_id uuid not null references public.ministries(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  membership_type text not null default 'member' check (membership_type in ('member', 'leader', 'volunteer')),
  joined_at timestamptz not null default timezone('utc', now()),
  ended_at timestamptz
);
create unique index ministry_memberships_active_unique on public.ministry_memberships(ministry_id, profile_id) where ended_at is null;

create table public.groups (
  id uuid primary key default extensions.gen_random_uuid(),
  ministry_id uuid references public.ministries(id) on delete set null,
  name text not null,
  slug text not null unique,
  kind public.group_kind not null,
  description text,
  minimum_members integer not null default 4 check (minimum_members >= 0),
  maximum_members integer not null default 14 check (maximum_members >= minimum_members),
  meeting_slots text[] not null default '{}',
  general_city text,
  general_postal_prefix text,
  accessibility_supports text[] not null default '{}',
  directory_visible boolean not null default false,
  status text not null default 'active' check (status in ('draft', 'active', 'paused', 'archived')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.group_memberships (
  id uuid primary key default extensions.gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  household_id uuid references public.households(id) on delete set null,
  membership_type text not null default 'member' check (membership_type in ('member', 'leader', 'host', 'observer')),
  joined_at timestamptz not null default timezone('utc', now()),
  ended_at timestamptz
);
create unique index group_memberships_active_unique on public.group_memberships(group_id, profile_id) where ended_at is null;
create index group_memberships_profile_idx on public.group_memberships(profile_id) where ended_at is null;

create table public.leader_assignments (
  id uuid primary key default extensions.gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  resource_type text not null check (resource_type in ('ministry', 'group', 'kids_class', 'event')),
  resource_id uuid not null,
  assignment_type text not null default 'leader',
  starts_at timestamptz not null default timezone('utc', now()),
  ends_at timestamptz,
  approved_by uuid references public.profiles(id) on delete set null
);
create index leader_assignments_resource_idx on public.leader_assignments(resource_type, resource_id) where ends_at is null;
create index leader_assignments_profile_idx on public.leader_assignments(profile_id) where ends_at is null;

create table public.group_cycles (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null,
  kind public.group_kind not null,
  starts_on date not null,
  ends_on date not null,
  status public.group_cycle_status not null default 'draft',
  seed text not null,
  configuration jsonb not null default '{}'::jsonb,
  generated_by uuid references public.profiles(id) on delete set null,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (ends_on >= starts_on),
  check ((status not in ('approved', 'active', 'closed')) or approved_at is not null)
);

create table public.group_constraints (
  id uuid primary key default extensions.gen_random_uuid(),
  cycle_id uuid not null references public.group_cycles(id) on delete cascade,
  household_id uuid references public.households(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  constraint_type text not null check (constraint_type in ('required_group', 'forbidden_group', 'availability', 'accessibility', 'pastoral', 'safeguarding')),
  target_group_id uuid references public.groups(id) on delete cascade,
  value jsonb not null default '{}'::jsonb,
  sensitivity text not null default 'leadership' check (sensitivity in ('leadership', 'pastoral', 'safeguarding')),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  check (household_id is not null or profile_id is not null)
);

create table public.pairing_history (
  id uuid primary key default extensions.gen_random_uuid(),
  cycle_id uuid not null references public.group_cycles(id) on delete cascade,
  household_a_id uuid not null references public.households(id) on delete cascade,
  household_b_id uuid not null references public.households(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  check (household_a_id <> household_b_id)
);

create table public.rotation_runs (
  id uuid primary key default extensions.gen_random_uuid(),
  cycle_id uuid not null references public.group_cycles(id) on delete cascade,
  seed text not null,
  algorithm_version text not null,
  status text not null check (status in ('running', 'proposed', 'infeasible', 'approved', 'rejected')),
  input_snapshot jsonb not null,
  score_breakdown jsonb,
  constraint_issues jsonb not null default '[]'::jsonb,
  fingerprint text,
  generated_by uuid not null references public.profiles(id) on delete restrict,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.rotation_assignments (
  id uuid primary key default extensions.gen_random_uuid(),
  rotation_run_id uuid not null references public.rotation_runs(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  private_reasons jsonb not null default '[]'::jsonb,
  manually_adjusted boolean not null default false,
  adjusted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  unique(rotation_run_id, household_id)
);

create trigger life_stages_set_updated_at before update on public.life_stages for each row execute function public.set_updated_at();
create trigger ministries_set_updated_at before update on public.ministries for each row execute function public.set_updated_at();
create trigger groups_set_updated_at before update on public.groups for each row execute function public.set_updated_at();
create trigger group_cycles_set_updated_at before update on public.group_cycles for each row execute function public.set_updated_at();

commit;
