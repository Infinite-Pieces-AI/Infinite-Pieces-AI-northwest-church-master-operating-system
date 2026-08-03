begin;

create table public.children (
  id uuid primary key default extensions.gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  preferred_name text not null,
  legal_name text,
  birth_date date,
  profile_photo_path text,
  directory_visible boolean not null default false check (directory_visible = false),
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.guardian_links (
  id uuid primary key default extensions.gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  guardian_profile_id uuid not null references public.profiles(id) on delete cascade,
  relationship_label text not null,
  legal_guardian boolean not null default false,
  can_manage_profile boolean not null default false,
  can_check_in boolean not null default true,
  can_authorize_pickup boolean not null default false,
  starts_at timestamptz not null default timezone('utc', now()),
  ends_at timestamptz,
  verified_by uuid references public.profiles(id) on delete set null,
  unique(child_id, guardian_profile_id, starts_at)
);
create index guardian_links_guardian_idx on public.guardian_links(guardian_profile_id) where ends_at is null;

create table public.authorized_pickups (
  id uuid primary key default extensions.gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  pickup_profile_id uuid references public.profiles(id) on delete set null,
  display_name text not null,
  relationship_label text,
  phone_last_four text check (phone_last_four is null or phone_last_four ~ '^[0-9]{4}$'),
  active boolean not null default true,
  authorized_by_guardian uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.kids_classes (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null,
  age_band text not null,
  room_label text,
  external_reference text,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.class_links (
  id uuid primary key default extensions.gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  kids_class_id uuid not null references public.kids_classes(id) on delete cascade,
  starts_on date not null,
  ends_on date,
  assigned_by uuid references public.profiles(id) on delete set null,
  unique(child_id, kids_class_id, starts_on),
  check (ends_on is null or ends_on >= starts_on)
);

create table public.kids_volunteer_assignments (
  id uuid primary key default extensions.gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  kids_class_id uuid not null references public.kids_classes(id) on delete cascade,
  service_occurrence_id uuid references public.service_occurrences(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  role_label text not null,
  approved_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  check (ends_at > starts_at)
);
create index kids_volunteer_active_idx on public.kids_volunteer_assignments(profile_id, starts_at, ends_at);

create table public.care_flags (
  id uuid primary key default extensions.gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  category text not null check (category in ('allergy', 'medical', 'accessibility', 'communication', 'custody', 'other')),
  summary text not null,
  operational_instructions text,
  emergency boolean not null default false,
  active boolean not null default true,
  created_by uuid not null references public.profiles(id) on delete restrict,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.service_sessions (
  id uuid primary key default extensions.gen_random_uuid(),
  service_occurrence_id uuid references public.service_occurrences(id) on delete set null,
  external_reference text,
  opens_at timestamptz not null,
  closes_at timestamptz not null,
  checkin_system text not null default 'planning_center',
  status text not null default 'scheduled' check (status in ('scheduled', 'open', 'closed', 'cancelled')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (closes_at > opens_at)
);

create table public.external_checkin_refs (
  id uuid primary key default extensions.gen_random_uuid(),
  service_session_id uuid not null references public.service_sessions(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  provider text not null,
  external_person_id text,
  external_checkin_id text,
  last_synced_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  unique(provider, service_session_id, child_id)
);

create table public.checkin_status_events (
  id uuid primary key default extensions.gen_random_uuid(),
  service_session_id uuid not null references public.service_sessions(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  kids_class_id uuid references public.kids_classes(id) on delete set null,
  state public.checkin_state not null,
  external_reference text,
  occurred_at timestamptz not null,
  recorded_by uuid references public.profiles(id) on delete set null,
  source text not null default 'planning_center' check (source in ('planning_center', 'existing_chms', 'manual_fallback')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);
create index checkin_status_child_time_idx on public.checkin_status_events(child_id, occurred_at desc);

create table public.albums (
  id uuid primary key default extensions.gen_random_uuid(),
  title text not null,
  scope public.media_scope not null,
  household_id uuid references public.households(id) on delete cascade,
  kids_class_id uuid references public.kids_classes(id) on delete cascade,
  group_id uuid references public.groups(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete restrict,
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (
    (scope = 'private_household' and household_id is not null)
    or (scope = 'private_class' and kids_class_id is not null)
    or (scope = 'private_parent_community')
    or (scope in ('internal_presentation', 'public_website', 'official_social', 'promotional_advertising'))
  )
);

create table public.media_assets (
  id uuid primary key default extensions.gen_random_uuid(),
  album_id uuid not null references public.albums(id) on delete cascade,
  uploader_id uuid not null references public.profiles(id) on delete restrict,
  storage_bucket text not null check (storage_bucket in ('member-media', 'child-media')),
  storage_path text not null,
  media_type text not null check (media_type in ('image', 'video', 'document')),
  mime_type text not null,
  bytes bigint not null check (bytes between 1 and 26214400),
  sha256 text not null,
  exif_removed boolean not null default false,
  malware_scan_status text not null default 'pending' check (malware_scan_status in ('pending', 'clean', 'blocked', 'error')),
  review_status public.media_review_status not null default 'pending_scan',
  approved_scope public.media_scope,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  removed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  unique(storage_bucket, storage_path)
);

create table public.media_permissions (
  id uuid primary key default extensions.gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  scope public.media_scope not null,
  granted boolean not null,
  granted_by_guardian uuid not null references public.profiles(id) on delete restrict,
  effective_from timestamptz not null default timezone('utc', now()),
  effective_until timestamptz,
  revoked_at timestamptz,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);
create index media_permissions_child_scope_idx on public.media_permissions(child_id, scope, effective_from desc);

create table public.media_asset_subjects (
  media_asset_id uuid not null references public.media_assets(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  confirmed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key(media_asset_id, child_id)
);

create table public.media_reviews (
  id uuid primary key default extensions.gen_random_uuid(),
  media_asset_id uuid not null references public.media_assets(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete restrict,
  decision public.media_review_status not null check (decision in ('approved', 'rejected', 'removed')),
  approved_scope public.media_scope,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.takedown_requests (
  id uuid primary key default extensions.gen_random_uuid(),
  media_asset_id uuid not null references public.media_assets(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete restrict,
  reason text not null,
  status public.report_status not null default 'open',
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.parent_connections (
  id uuid primary key default extensions.gen_random_uuid(),
  requesting_guardian_id uuid not null references public.profiles(id) on delete cascade,
  receiving_guardian_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'blocked', 'ended')),
  requester_share_email boolean not null default false,
  requester_share_phone boolean not null default false,
  receiver_share_email boolean not null default false,
  receiver_share_phone boolean not null default false,
  responded_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (requesting_guardian_id <> receiving_guardian_id)
);

create table public.playdate_proposals (
  id uuid primary key default extensions.gen_random_uuid(),
  parent_connection_id uuid not null references public.parent_connections(id) on delete cascade,
  proposed_by uuid not null references public.profiles(id) on delete restrict,
  proposed_window_start timestamptz not null,
  proposed_window_end timestamptz not null,
  general_location text not null,
  notes text,
  status text not null default 'proposed' check (status in ('proposed', 'accepted', 'declined', 'countered', 'cancelled', 'completed')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (proposed_window_end > proposed_window_start)
);

create trigger children_set_updated_at before update on public.children for each row execute function public.set_updated_at();
create trigger authorized_pickups_set_updated_at before update on public.authorized_pickups for each row execute function public.set_updated_at();
create trigger kids_classes_set_updated_at before update on public.kids_classes for each row execute function public.set_updated_at();
create trigger care_flags_set_updated_at before update on public.care_flags for each row execute function public.set_updated_at();
create trigger service_sessions_set_updated_at before update on public.service_sessions for each row execute function public.set_updated_at();
create trigger albums_set_updated_at before update on public.albums for each row execute function public.set_updated_at();
create trigger parent_connections_set_updated_at before update on public.parent_connections for each row execute function public.set_updated_at();
create trigger playdate_proposals_set_updated_at before update on public.playdate_proposals for each row execute function public.set_updated_at();

commit;
