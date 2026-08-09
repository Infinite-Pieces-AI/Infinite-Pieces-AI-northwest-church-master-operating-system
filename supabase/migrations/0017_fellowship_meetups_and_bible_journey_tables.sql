begin;

-- -----------------------------------------------------------------------------
-- Fellowship: member-created, time-bounded invitations into ordinary shared life.
-- Exact meeting instructions are deliberately separated from the discoverable card.
-- -----------------------------------------------------------------------------

create table public.fellowship_meetups (
  id uuid primary key default extensions.gen_random_uuid(),
  creator_profile_id uuid not null references public.profiles(id) on delete restrict,
  title text not null check (char_length(title) between 3 and 100),
  category text not null check (
    category in ('prayer','families','outdoors','food','service','sports','young-adults','whole-church')
  ),
  description text not null check (char_length(description) between 10 and 1000),
  visibility text not null default 'church' check (visibility in ('church','ministry','group')),
  ministry_id uuid references public.ministries(id) on delete set null,
  group_id uuid references public.groups(id) on delete set null,
  audience_label text not null default 'Church members' check (char_length(audience_label) between 2 and 80),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null default 'America/New_York' check (char_length(timezone) between 3 and 80),
  general_location_name text not null check (char_length(general_location_name) between 2 and 120),
  general_area text not null check (char_length(general_area) between 2 and 100),
  meeting_format text not null default 'in_person' check (meeting_format in ('in_person','virtual','hybrid')),
  family_friendly boolean not null default false,
  guardian_required_for_minors boolean not null default true,
  spontaneous boolean not null default false,
  capacity integer check (capacity is null or capacity between 2 and 500),
  allow_waitlist boolean not null default true,
  status text not null default 'active' check (status in ('draft','active','paused','cancelled','completed','removed')),
  moderation_note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (ends_at > starts_at),
  check (
    (visibility = 'church' and ministry_id is null and group_id is null)
    or (visibility = 'ministry' and ministry_id is not null and group_id is null)
    or (visibility = 'group' and group_id is not null)
  ),
  check (meeting_format <> 'virtual' or general_location_name = 'Online')
);

create index fellowship_meetups_upcoming_idx
  on public.fellowship_meetups(starts_at)
  where status in ('active','paused');
create index fellowship_meetups_visibility_idx
  on public.fellowship_meetups(visibility, ministry_id, group_id, starts_at);
create index fellowship_meetups_creator_idx
  on public.fellowship_meetups(creator_profile_id, starts_at desc);

create table public.fellowship_meetup_private_details (
  meetup_id uuid primary key references public.fellowship_meetups(id) on delete cascade,
  exact_meeting_instructions text check (
    exact_meeting_instructions is null or char_length(exact_meeting_instructions) <= 1200
  ),
  virtual_join_url text check (virtual_join_url is null or char_length(virtual_join_url) <= 2000),
  host_contact_note text check (host_contact_note is null or char_length(host_contact_note) <= 500),
  reveal_after_status text not null default 'going' check (reveal_after_status in ('interested','going')),
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (
    exact_meeting_instructions is not null
    or virtual_join_url is not null
    or host_contact_note is not null
  )
);

create table public.fellowship_meetup_members (
  id uuid primary key default extensions.gen_random_uuid(),
  meetup_id uuid not null references public.fellowship_meetups(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'going' check (
    status in ('host','interested','going','waitlisted','declined','cancelled')
  ),
  party_size integer not null default 1 check (party_size between 1 and 25),
  joined_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(meetup_id, profile_id)
);
create index fellowship_meetup_members_profile_idx
  on public.fellowship_meetup_members(profile_id, joined_at desc);
create index fellowship_meetup_members_active_idx
  on public.fellowship_meetup_members(meetup_id, status)
  where status in ('host','interested','going','waitlisted');

create table public.fellowship_meetup_messages (
  id uuid primary key default extensions.gen_random_uuid(),
  meetup_id uuid not null references public.fellowship_meetups(id) on delete cascade,
  author_profile_id uuid not null references public.profiles(id) on delete restrict,
  body text not null check (char_length(body) between 1 and 2000),
  client_message_id text check (client_message_id is null or char_length(client_message_id) <= 200),
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  unique(author_profile_id, client_message_id)
);
create index fellowship_meetup_messages_thread_idx
  on public.fellowship_meetup_messages(meetup_id, created_at);

-- Existing community reporting is extended so members can report an invitation or
-- its group thread without creating an unrestricted direct-message path.
alter table public.reports drop constraint if exists reports_target_type_check;
alter table public.reports
  add constraint reports_target_type_check
  check (target_type in ('message','post','comment','profile','media','fellowship_meetup','fellowship_message'));
alter table public.reports drop constraint if exists reports_category_check;
alter table public.reports
  add constraint reports_category_check
  check (category in ('harassment','privacy','spam','unsafe_minor_contact','unsafe_meetup','self_harm_concern','other'));

-- Preferences are explicit opt-in inputs. The platform must not infer loneliness,
-- spiritual condition, or pastoral needs from private communication or activity.
create table public.fellowship_preferences (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  recommendations_enabled boolean not null default false,
  open_to_last_minute boolean not null default false,
  family_friendly_only boolean not null default false,
  low_pressure_preferred boolean not null default true,
  categories text[] not null default '{}',
  preferred_time_windows text[] not null default '{}',
  general_areas text[] not null default '{}',
  paused_until timestamptz,
  updated_at timestamptz not null default timezone('utc', now()),
  check (categories <@ array['prayer','families','outdoors','food','service','sports','young-adults','whole-church']::text[])
);

-- -----------------------------------------------------------------------------
-- Bible Journey: an approved, sequential whole-Bible formation path.
-- Scripture text remains with a licensed provider; these tables store references,
-- leader-approved teaching, tracks, rhythms, and member-owned progress.
-- -----------------------------------------------------------------------------

create table public.bible_journeys (
  id uuid primary key default extensions.gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 3 and 120),
  subtitle text check (subtitle is null or char_length(subtitle) <= 240),
  description text check (description is null or char_length(description) <= 2000),
  total_weeks integer not null default 52 check (total_weeks between 1 and 104),
  starts_on date,
  publication_status public.publication_status not null default 'draft',
  created_by uuid references public.profiles(id) on delete set null,
  reviewed_by uuid references public.profiles(id) on delete set null,
  published_by uuid references public.profiles(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check ((publication_status <> 'published') or (published_by is not null and published_at is not null))
);

create table public.bible_journey_weeks (
  id uuid primary key default extensions.gen_random_uuid(),
  journey_id uuid not null references public.bible_journeys(id) on delete cascade,
  week_number integer not null check (week_number between 1 and 104),
  era text not null check (char_length(era) between 2 and 80),
  title text not null check (char_length(title) between 3 and 160),
  summary text not null check (char_length(summary) between 20 and 2000),
  big_idea text not null check (char_length(big_idea) between 10 and 500),
  scripture_references text[] not null check (cardinality(scripture_references) between 1 and 20),
  story_movements jsonb not null default '[]'::jsonb,
  practice_prompts jsonb not null default '[]'::jsonb,
  discussion_tracks jsonb not null default '{}'::jsonb,
  approved_ai_context jsonb not null default '{}'::jsonb,
  weekly_lesson_id uuid references public.weekly_lessons(id) on delete set null,
  publication_status public.publication_status not null default 'draft',
  created_by uuid references public.profiles(id) on delete set null,
  reviewed_by uuid references public.profiles(id) on delete set null,
  published_by uuid references public.profiles(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(journey_id, week_number),
  check (jsonb_typeof(story_movements) = 'array'),
  check (jsonb_typeof(practice_prompts) = 'array'),
  check (jsonb_typeof(discussion_tracks) = 'object'),
  check (jsonb_typeof(approved_ai_context) = 'object'),
  check ((publication_status <> 'published') or (published_by is not null and published_at is not null))
);
create index bible_journey_weeks_order_idx
  on public.bible_journey_weeks(journey_id, week_number);
create index bible_journey_weeks_lesson_idx
  on public.bible_journey_weeks(weekly_lesson_id)
  where weekly_lesson_id is not null;

create table public.bible_journey_progress (
  id uuid primary key default extensions.gen_random_uuid(),
  journey_id uuid not null references public.bible_journeys(id) on delete cascade,
  week_id uuid not null references public.bible_journey_weeks(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  rhythm_state jsonb not null default '{"read":false,"notice":false,"pray":false,"practice":false,"share":false}'::jsonb,
  personal_notes text check (personal_notes is null or char_length(personal_notes) <= 10000),
  saved_question text check (saved_question is null or char_length(saved_question) <= 2000),
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(week_id, profile_id),
  check (jsonb_typeof(rhythm_state) = 'object')
);
create index bible_journey_progress_profile_idx
  on public.bible_journey_progress(profile_id, updated_at desc);

create trigger fellowship_meetups_set_updated_at
  before update on public.fellowship_meetups
  for each row execute function public.set_updated_at();
create trigger fellowship_meetup_private_details_set_updated_at
  before update on public.fellowship_meetup_private_details
  for each row execute function public.set_updated_at();
create trigger fellowship_meetup_members_set_updated_at
  before update on public.fellowship_meetup_members
  for each row execute function public.set_updated_at();
create trigger fellowship_preferences_set_updated_at
  before update on public.fellowship_preferences
  for each row execute function public.set_updated_at();
create trigger bible_journeys_set_updated_at
  before update on public.bible_journeys
  for each row execute function public.set_updated_at();
create trigger bible_journey_weeks_set_updated_at
  before update on public.bible_journey_weeks
  for each row execute function public.set_updated_at();
create trigger bible_journey_progress_set_updated_at
  before update on public.bible_journey_progress
  for each row execute function public.set_updated_at();

commit;
