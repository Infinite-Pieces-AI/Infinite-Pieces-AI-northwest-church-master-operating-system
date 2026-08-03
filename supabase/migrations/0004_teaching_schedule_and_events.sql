begin;

create table public.locations (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null,
  slug text not null unique,
  address_line_1 text not null,
  address_line_2 text,
  city text not null,
  state_region text not null,
  postal_code text not null,
  country_code char(2) not null default 'US',
  latitude numeric(9,6),
  longitude numeric(9,6),
  directions_url text,
  parking_instructions text,
  entrance_instructions text,
  accessibility_notes text,
  publication_status public.publication_status not null default 'draft',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.service_templates (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null,
  location_id uuid not null references public.locations(id) on delete restrict,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  local_start_time time not null,
  duration_minutes integer not null default 90 check (duration_minutes between 15 and 480),
  timezone text not null default 'America/New_York',
  recurrence_rule text,
  effective_from date not null,
  effective_until date,
  publication_status public.publication_status not null default 'draft',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (effective_until is null or effective_until >= effective_from)
);

create table public.service_occurrences (
  id uuid primary key default extensions.gen_random_uuid(),
  service_template_id uuid references public.service_templates(id) on delete set null,
  location_id uuid not null references public.locations(id) on delete restrict,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  occurrence_type text not null default 'central_worship' check (occurrence_type in ('central_worship', 'small_groups', 'special_service', 'cancelled')),
  status_message text,
  publication_status public.publication_status not null default 'draft',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (ends_at > starts_at)
);
create index service_occurrences_upcoming_idx on public.service_occurrences(starts_at) where publication_status = 'published';

create table public.service_overrides (
  id uuid primary key default extensions.gen_random_uuid(),
  service_template_id uuid not null references public.service_templates(id) on delete cascade,
  occurrence_date date not null,
  override_type text not null check (override_type in ('cancel', 'replace', 'time_change', 'location_change', 'small_groups')),
  replacement_occurrence_id uuid references public.service_occurrences(id) on delete set null,
  public_message text not null,
  publication_status public.publication_status not null default 'draft',
  created_by uuid references public.profiles(id) on delete set null,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(service_template_id, occurrence_date)
);

create table public.series (
  id uuid primary key default extensions.gen_random_uuid(),
  title text not null,
  slug text not null unique,
  summary text,
  starts_on date,
  ends_on date,
  hero_image_path text,
  publication_status public.publication_status not null default 'draft',
  created_by uuid references public.profiles(id) on delete set null,
  published_by uuid references public.profiles(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.weekly_lessons (
  id uuid primary key default extensions.gen_random_uuid(),
  series_id uuid references public.series(id) on delete set null,
  service_occurrence_id uuid references public.service_occurrences(id) on delete set null,
  title text not null,
  slug text not null unique,
  week_of date not null,
  summary text,
  minister_announcement text,
  scripture_of_week_reference text,
  sermon_video_url text,
  sermon_audio_url text,
  transcript text,
  publication_status public.publication_status not null default 'draft',
  created_by uuid references public.profiles(id) on delete set null,
  reviewed_by uuid references public.profiles(id) on delete set null,
  published_by uuid references public.profiles(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index weekly_lessons_week_idx on public.weekly_lessons(week_of desc);

create table public.lesson_sections (
  id uuid primary key default extensions.gen_random_uuid(),
  lesson_id uuid not null references public.weekly_lessons(id) on delete cascade,
  section_type text not null check (section_type in ('outline', 'discussion_questions', 'application', 'announcement', 'resource')),
  heading text,
  body text not null,
  position integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.scripture_references (
  id uuid primary key default extensions.gen_random_uuid(),
  lesson_id uuid references public.weekly_lessons(id) on delete cascade,
  series_id uuid references public.series(id) on delete cascade,
  reference text not null,
  translation_id text not null,
  provider text not null,
  provider_resource_id text,
  context_label text,
  position integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  check (lesson_id is not null or series_id is not null)
);

create table public.resources (
  id uuid primary key default extensions.gen_random_uuid(),
  lesson_id uuid references public.weekly_lessons(id) on delete cascade,
  title text not null,
  resource_type text not null check (resource_type in ('document', 'audio', 'video', 'link', 'download')),
  url text,
  storage_path text,
  publication_status public.publication_status not null default 'draft',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  check (url is not null or storage_path is not null)
);

create table public.events (
  id uuid primary key default extensions.gen_random_uuid(),
  title text not null,
  slug text not null unique,
  summary text,
  description text,
  visibility public.event_visibility not null default 'public',
  ministry_id uuid references public.ministries(id) on delete set null,
  group_id uuid references public.groups(id) on delete set null,
  default_location_id uuid references public.locations(id) on delete set null,
  registration_required boolean not null default false,
  capacity integer check (capacity is null or capacity > 0),
  publication_status public.publication_status not null default 'draft',
  created_by uuid references public.profiles(id) on delete set null,
  published_by uuid references public.profiles(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.event_occurrences (
  id uuid primary key default extensions.gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  location_id uuid references public.locations(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  virtual_url text,
  cancellation_message text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (ends_at > starts_at)
);
create index event_occurrences_upcoming_idx on public.event_occurrences(starts_at);

create table public.registrations (
  id uuid primary key default extensions.gen_random_uuid(),
  event_occurrence_id uuid not null references public.event_occurrences(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  household_id uuid references public.households(id) on delete set null,
  party_size integer not null default 1 check (party_size between 1 and 25),
  status public.registration_status not null default 'registered',
  notes text,
  registered_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(event_occurrence_id, profile_id)
);

create table public.attendance_links (
  id uuid primary key default extensions.gen_random_uuid(),
  event_occurrence_id uuid not null references public.event_occurrences(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  external_reference text,
  attendance_status text not null check (attendance_status in ('expected', 'present', 'absent', 'excused')),
  recorded_by uuid references public.profiles(id) on delete set null,
  recorded_at timestamptz not null default timezone('utc', now())
);

create table public.volunteer_assignments (
  id uuid primary key default extensions.gen_random_uuid(),
  event_occurrence_id uuid not null references public.event_occurrences(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role_label text not null,
  status text not null default 'assigned' check (status in ('invited', 'assigned', 'confirmed', 'declined', 'completed')),
  assigned_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(event_occurrence_id, profile_id, role_label)
);

create trigger locations_set_updated_at before update on public.locations for each row execute function public.set_updated_at();
create trigger service_templates_set_updated_at before update on public.service_templates for each row execute function public.set_updated_at();
create trigger service_occurrences_set_updated_at before update on public.service_occurrences for each row execute function public.set_updated_at();
create trigger service_overrides_set_updated_at before update on public.service_overrides for each row execute function public.set_updated_at();
create trigger series_set_updated_at before update on public.series for each row execute function public.set_updated_at();
create trigger weekly_lessons_set_updated_at before update on public.weekly_lessons for each row execute function public.set_updated_at();
create trigger lesson_sections_set_updated_at before update on public.lesson_sections for each row execute function public.set_updated_at();
create trigger events_set_updated_at before update on public.events for each row execute function public.set_updated_at();
create trigger event_occurrences_set_updated_at before update on public.event_occurrences for each row execute function public.set_updated_at();
create trigger registrations_set_updated_at before update on public.registrations for each row execute function public.set_updated_at();
create trigger volunteer_assignments_set_updated_at before update on public.volunteer_assignments for each row execute function public.set_updated_at();

commit;
