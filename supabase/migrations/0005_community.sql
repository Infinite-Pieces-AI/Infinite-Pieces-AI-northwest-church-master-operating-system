begin;

create table public.channels (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null,
  slug text not null unique,
  kind public.channel_kind not null,
  group_id uuid references public.groups(id) on delete cascade,
  ministry_id uuid references public.ministries(id) on delete cascade,
  description text,
  posting_policy text not null default 'members' check (posting_policy in ('leaders', 'members', 'moderated')),
  archived_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (kind in ('announcement', 'discussion', 'prayer') or group_id is not null or ministry_id is not null)
);

create table public.channel_members (
  id uuid primary key default extensions.gen_random_uuid(),
  channel_id uuid not null references public.channels(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  membership_type text not null default 'member' check (membership_type in ('member', 'leader', 'moderator')),
  joined_at timestamptz not null default timezone('utc', now()),
  muted_until timestamptz,
  ended_at timestamptz
);
create unique index channel_members_active_unique on public.channel_members(channel_id, profile_id) where ended_at is null;
create index channel_members_profile_idx on public.channel_members(profile_id) where ended_at is null;

create table public.messages (
  id uuid primary key default extensions.gen_random_uuid(),
  channel_id uuid not null references public.channels(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  body text not null check (char_length(body) between 1 and 5000),
  reply_to_id uuid references public.messages(id) on delete set null,
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);
create index messages_channel_created_idx on public.messages(channel_id, created_at desc) where deleted_at is null;

create table public.posts (
  id uuid primary key default extensions.gen_random_uuid(),
  channel_id uuid references public.channels(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  title text,
  body text not null check (char_length(body) between 1 and 12000),
  pinned_until timestamptz,
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);
create index posts_channel_created_idx on public.posts(channel_id, created_at desc) where deleted_at is null;

create table public.comments (
  id uuid primary key default extensions.gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  body text not null check (char_length(body) between 1 and 5000),
  parent_comment_id uuid references public.comments(id) on delete cascade,
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.reactions (
  id uuid primary key default extensions.gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('message', 'post', 'comment')),
  target_id uuid not null,
  reaction text not null check (reaction in ('amen', 'encourage', 'pray', 'celebrate', 'helpful')),
  created_at timestamptz not null default timezone('utc', now()),
  unique(profile_id, target_type, target_id, reaction)
);

create table public.prayer_requests (
  id uuid primary key default extensions.gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  channel_id uuid references public.channels(id) on delete set null,
  visibility text not null default 'assigned_group' check (visibility in ('ministers_only', 'assigned_group', 'church_members')),
  body text not null check (char_length(body) between 1 and 5000),
  follow_up_requested boolean not null default false,
  status text not null default 'open' check (status in ('open', 'answered', 'closed')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.reports (
  id uuid primary key default extensions.gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete restrict,
  target_type text not null check (target_type in ('message', 'post', 'comment', 'profile', 'media')),
  target_id uuid not null,
  category text not null check (category in ('harassment', 'privacy', 'spam', 'unsafe_minor_contact', 'self_harm_concern', 'other')),
  details text,
  status public.report_status not null default 'open',
  assigned_to uuid references public.profiles(id) on delete set null,
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.moderation_actions (
  id uuid primary key default extensions.gen_random_uuid(),
  report_id uuid references public.reports(id) on delete set null,
  moderator_id uuid not null references public.profiles(id) on delete restrict,
  target_profile_id uuid references public.profiles(id) on delete set null,
  action_type text not null check (action_type in ('content_hidden', 'warning', 'temporary_restriction', 'membership_escalation', 'no_action')),
  reason text not null,
  starts_at timestamptz not null default timezone('utc', now()),
  ends_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create trigger channels_set_updated_at before update on public.channels for each row execute function public.set_updated_at();
create trigger prayer_requests_set_updated_at before update on public.prayer_requests for each row execute function public.set_updated_at();
create trigger reports_set_updated_at before update on public.reports for each row execute function public.set_updated_at();

commit;
