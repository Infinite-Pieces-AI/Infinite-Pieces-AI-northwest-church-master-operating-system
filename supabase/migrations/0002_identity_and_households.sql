begin;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email extensions.citext not null unique,
  display_name text not null check (char_length(display_name) between 1 and 100),
  preferred_name text,
  membership_status public.membership_status not null default 'pending',
  directory_visible boolean not null default false,
  avatar_path text,
  accepted_privacy_at timestamptz,
  accepted_community_guidelines_at timestamptz,
  last_seen_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.roles (
  id uuid primary key default extensions.gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z][a-z0-9_]*$'),
  display_name text not null,
  description text not null,
  privileged boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.role_assignments (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete restrict,
  scope_type text not null default 'church' check (scope_type in ('church', 'ministry', 'group', 'class')),
  scope_id uuid,
  assigned_by uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz,
  revoked_at timestamptz,
  revoked_by uuid references public.profiles(id) on delete set null,
  reason text,
  check ((scope_type = 'church' and scope_id is null) or (scope_type <> 'church' and scope_id is not null))
);
create unique index role_assignments_active_unique
  on public.role_assignments(user_id, role_id, scope_type, coalesce(scope_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where revoked_at is null;

create table public.access_requests (
  id uuid primary key default extensions.gen_random_uuid(),
  first_name text not null check (char_length(first_name) between 1 and 80),
  last_name text not null check (char_length(last_name) between 1 and 80),
  email extensions.citext not null,
  phone text,
  relationship_to_church text not null,
  known_leader text,
  reason text not null check (char_length(reason) between 5 and 1500),
  status public.access_request_status not null default 'pending',
  assigned_reviewer uuid references public.profiles(id) on delete set null,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  source_ip_hash text,
  source_user_agent_hash text,
  consent_to_contact boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index access_requests_status_created_idx on public.access_requests(status, created_at desc);
create index access_requests_email_idx on public.access_requests(email);

create table public.households (
  id uuid primary key default extensions.gen_random_uuid(),
  display_name text not null check (char_length(display_name) between 1 and 120),
  directory_visible boolean not null default false,
  city text,
  state_region text,
  postal_code_prefix text,
  timezone text not null default 'America/New_York',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.household_members (
  id uuid primary key default extensions.gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  relationship_label text,
  is_primary_contact boolean not null default false,
  can_manage_household boolean not null default false,
  joined_at timestamptz not null default timezone('utc', now()),
  ended_at timestamptz
);
create unique index household_members_active_unique on public.household_members(household_id, profile_id) where ended_at is null;
create index household_members_profile_idx on public.household_members(profile_id) where ended_at is null;

create table public.emergency_contacts (
  id uuid primary key default extensions.gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  display_name text not null,
  relationship_label text,
  phone text not null,
  priority integer not null default 1 check (priority between 1 and 10),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.invitations (
  id uuid primary key default extensions.gen_random_uuid(),
  access_request_id uuid references public.access_requests(id) on delete set null,
  intended_email extensions.citext not null,
  token_hash text not null unique check (char_length(token_hash) = 64),
  roles_to_assign text[] not null default array['member']::text[],
  intended_household_id uuid references public.households(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  consumed_by uuid references public.profiles(id) on delete set null,
  revoked_at timestamptz,
  revoked_by uuid references public.profiles(id) on delete set null,
  revocation_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  check (expires_at > created_at),
  check (not (consumed_at is not null and revoked_at is not null))
);
create index invitations_email_idx on public.invitations(intended_email, expires_at desc);

create table public.user_sessions (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  auth_session_id uuid,
  assurance_level text check (assurance_level in ('aal1', 'aal2')),
  ip_hash text,
  user_agent_hash text,
  started_at timestamptz not null default timezone('utc', now()),
  last_seen_at timestamptz not null default timezone('utc', now()),
  ended_at timestamptz
);

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger access_requests_set_updated_at before update on public.access_requests for each row execute function public.set_updated_at();
create trigger households_set_updated_at before update on public.households for each row execute function public.set_updated_at();
create trigger emergency_contacts_set_updated_at before update on public.emergency_contacts for each row execute function public.set_updated_at();

commit;
