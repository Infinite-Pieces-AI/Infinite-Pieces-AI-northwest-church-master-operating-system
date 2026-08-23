begin;

-- -----------------------------------------------------------------------------
-- Hardening and public-to-private recovery intake
-- -----------------------------------------------------------------------------
-- This migration closes the recovery self-enrollment and visibility gaps from
-- 0027, adds reviewable member/public intake, and makes gift moderation explicit.

alter table public.gift_posts alter column moderation_status set default 'pending';

create table public.recovery_membership_requests (
  id uuid primary key default extensions.gen_random_uuid(),
  program_id uuid not null references public.recovery_programs(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  requested_role text not null default 'participant' check (requested_role in ('participant','peer_support')),
  display_mode text not null default 'first_name' check (display_mode in ('first_name','initials','private')),
  privacy_acknowledged_at timestamptz not null,
  reason text check (reason is null or char_length(reason) <= 2000),
  status text not null default 'pending' check (status in ('pending','approved','declined','withdrawn','expired')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_note text check (review_note is null or char_length(review_note) <= 2000),
  expires_at timestamptz not null default (timezone('utc', now()) + interval '30 days'),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(program_id, profile_id, status),
  check ((status in ('approved','declined') and reviewed_by is not null and reviewed_at is not null)
      or status not in ('approved','declined'))
);

create table public.recovery_interest_requests (
  id uuid primary key default extensions.gen_random_uuid(),
  first_name text not null check (char_length(first_name) between 1 and 80),
  contact_method text not null check (contact_method in ('email','phone')),
  email text check (email is null or char_length(email) <= 254),
  phone text check (phone is null or char_length(phone) <= 40),
  interest_type text not null default 'church_peer_support' check (
    interest_type in ('church_peer_support','online_conversation','family_support','treatment_resources','general_question')
  ),
  message text check (message is null or char_length(message) <= 3000),
  consent_to_contact boolean not null check (consent_to_contact),
  source_path text not null default '/recovery-support-lowell' check (char_length(source_path) <= 300),
  source_campaign text check (source_campaign is null or char_length(source_campaign) <= 200),
  request_fingerprint text check (request_fingerprint is null or char_length(request_fingerprint) between 32 and 128),
  status text not null default 'new' check (status in ('new','assigned','contacted','conversation','closed','opted_out','removed')),
  assigned_to uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz,
  contacted_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check ((contact_method = 'email' and email is not null)
      or (contact_method = 'phone' and phone is not null))
);
create index recovery_interest_requests_queue_idx
  on public.recovery_interest_requests(status, created_at desc);
create index recovery_interest_requests_rate_idx
  on public.recovery_interest_requests(request_fingerprint, created_at desc)
  where request_fingerprint is not null;

create table public.recovery_public_topics (
  id uuid primary key default extensions.gen_random_uuid(),
  source_kind text not null check (source_kind in ('search_console','public_forum','public_web','public_rss','public_social','manual_research')),
  source_label text not null check (char_length(source_label) between 2 and 160),
  public_url text check (public_url is null or public_url ~ '^https://'),
  topic text not null check (char_length(topic) between 3 and 300),
  public_excerpt text check (public_excerpt is null or char_length(public_excerpt) <= 2000),
  locality text not null default 'Massachusetts' check (char_length(locality) between 2 and 160),
  aggregate_impressions integer check (aggregate_impressions is null or aggregate_impressions >= 0),
  aggregate_clicks integer check (aggregate_clicks is null or aggregate_clicks >= 0),
  average_position numeric(7,2) check (average_position is null or average_position >= 0),
  church_support_intent integer not null default 0 check (church_support_intent between 0 and 100),
  treatment_resource_intent integer not null default 0 check (treatment_resource_intent between 0 and 100),
  local_relevance integer not null default 0 check (local_relevance between 0 and 100),
  content_opportunity integer not null default 0 check (content_opportunity between 0 and 100),
  sensitivity_risk integer not null default 0 check (sensitivity_risk between 0 and 100),
  priority_score integer not null default 0 check (priority_score between 0 and 100),
  recommended_action text check (recommended_action is null or char_length(recommended_action) <= 2000),
  status text not null default 'new' check (status in ('new','review','content_queued','partner_research','dismissed','expired')),
  observed_at timestamptz,
  expires_at timestamptz not null default (timezone('utc', now()) + interval '90 days'),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (aggregate_clicks is null or aggregate_impressions is null or aggregate_clicks <= aggregate_impressions)
);
create index recovery_public_topics_priority_idx
  on public.recovery_public_topics(status, priority_score desc, created_at desc);

create trigger recovery_membership_requests_set_updated_at
  before update on public.recovery_membership_requests
  for each row execute function public.set_updated_at();
create trigger recovery_interest_requests_set_updated_at
  before update on public.recovery_interest_requests
  for each row execute function public.set_updated_at();
create trigger recovery_public_topics_set_updated_at
  before update on public.recovery_public_topics
  for each row execute function public.set_updated_at();

-- A gift-post creator can read their own pending post. Other members can read only
-- approved posts within their authorized scope. Moderators can review all posts.
create or replace function public.can_read_gift_post(
  requested_post_id uuid,
  target_user uuid default auth.uid()
)
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
      and gp.status <> 'removed'
      and (
        gp.created_by = target_user
        or public.is_privileged_actor(array['moderator','minister','super_admin'])
        or (
          gp.moderation_status = 'approved'
          and gp.status not in ('draft','removed')
          and (
            (gp.visibility = 'church' and public.is_active_member(target_user))
            or (gp.visibility = 'ministry' and public.is_ministry_member(gp.ministry_id, target_user))
            or (gp.visibility = 'group' and public.is_group_member(gp.group_id, target_user))
          )
        )
      )
  );
$$;

create or replace function public.is_recovery_member(
  requested_program_id uuid,
  target_user uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select public.may_check_target_user(target_user) and exists (
    select 1
    from public.recovery_memberships rm
    where rm.program_id = requested_program_id
      and rm.profile_id = target_user
      and rm.ended_at is null
  );
$$;

create or replace function public.leads_recovery_program(
  requested_program_id uuid,
  target_user uuid default auth.uid()
)
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
      select 1
      from public.recovery_memberships rm
      where rm.program_id = requested_program_id
        and rm.profile_id = target_user
        and rm.membership_role in ('leader','admin')
        and rm.ended_at is null
    )
  );
$$;

create or replace function public.can_read_recovery_program(
  requested_program_id uuid,
  target_user uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select public.may_check_target_user(target_user)
    and (
      public.is_recovery_member(requested_program_id, target_user)
      or public.leads_recovery_program(requested_program_id, target_user)
    );
$$;

create or replace function public.request_recovery_membership(
  p_program_id uuid,
  p_requested_role text,
  p_display_mode text,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  new_id uuid;
begin
  if not public.is_active_member(auth.uid()) then
    raise exception 'Active church membership is required';
  end if;
  if p_requested_role not in ('participant','peer_support') then
    raise exception 'Unsupported requested role';
  end if;
  if p_display_mode not in ('first_name','initials','private') then
    raise exception 'Unsupported display mode';
  end if;
  if not exists (
    select 1 from public.recovery_programs rp
    where rp.id = p_program_id and rp.status = 'active'
  ) then
    raise exception 'This recovery ministry is not accepting requests';
  end if;
  if public.is_recovery_member(p_program_id, auth.uid()) then
    raise exception 'You already have access to this recovery ministry';
  end if;
  update public.recovery_membership_requests
  set status = 'expired', updated_at = timezone('utc', now())
  where program_id = p_program_id
    and profile_id = auth.uid()
    and status = 'pending'
    and expires_at <= timezone('utc', now());
  insert into public.recovery_membership_requests (
    program_id, profile_id, requested_role, display_mode,
    privacy_acknowledged_at, reason
  ) values (
    p_program_id, auth.uid(), p_requested_role, p_display_mode,
    timezone('utc', now()), left(nullif(trim(p_reason), ''), 2000)
  ) returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.review_recovery_membership_request(
  p_request_id uuid,
  p_decision text,
  p_review_note text
)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  request_row public.recovery_membership_requests%rowtype;
begin
  select * into request_row
  from public.recovery_membership_requests
  where id = p_request_id
  for update;
  if not found then raise exception 'Membership request not found'; end if;
  if not public.leads_recovery_program(request_row.program_id, auth.uid()) then
    raise exception 'Recovery leader access is required';
  end if;
  if request_row.status <> 'pending' then
    raise exception 'This request has already been reviewed';
  end if;
  if p_decision not in ('approved','declined') then
    raise exception 'Unsupported decision';
  end if;
  update public.recovery_membership_requests
  set status = p_decision,
      reviewed_by = auth.uid(),
      reviewed_at = timezone('utc', now()),
      review_note = left(nullif(trim(p_review_note), ''), 2000),
      updated_at = timezone('utc', now())
  where id = p_request_id;
  if p_decision = 'approved' then
    insert into public.recovery_memberships (
      program_id, profile_id, membership_role, display_mode,
      consented_at, joined_at
    ) values (
      request_row.program_id, request_row.profile_id,
      request_row.requested_role, request_row.display_mode,
      request_row.privacy_acknowledged_at, timezone('utc', now())
    )
    on conflict (program_id, profile_id) do update
      set membership_role = excluded.membership_role,
          display_mode = excluded.display_mode,
          consented_at = excluded.consented_at,
          joined_at = timezone('utc', now()),
          ended_at = null,
          updated_at = timezone('utc', now());
  end if;
end;
$$;

create or replace function public.submit_recovery_interest_request(
  p_first_name text,
  p_contact_method text,
  p_email text,
  p_phone text,
  p_interest_type text,
  p_message text,
  p_consent_to_contact boolean,
  p_source_path text,
  p_source_campaign text,
  p_request_fingerprint text
)
returns uuid
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  new_id uuid;
begin
  if not p_consent_to_contact then
    raise exception 'Consent to contact is required';
  end if;
  if p_contact_method not in ('email','phone') then
    raise exception 'Unsupported contact method';
  end if;
  if p_interest_type not in ('church_peer_support','online_conversation','family_support','treatment_resources','general_question') then
    raise exception 'Unsupported interest type';
  end if;
  if p_contact_method = 'email' and nullif(trim(p_email), '') is null then
    raise exception 'Email is required';
  end if;
  if p_contact_method = 'phone' and nullif(trim(p_phone), '') is null then
    raise exception 'Phone is required';
  end if;
  insert into public.recovery_interest_requests (
    first_name, contact_method, email, phone, interest_type, message,
    consent_to_contact, source_path, source_campaign, request_fingerprint
  ) values (
    left(trim(p_first_name), 80), p_contact_method,
    left(nullif(lower(trim(p_email)), ''), 254),
    left(nullif(trim(p_phone), ''), 40), p_interest_type,
    left(nullif(trim(p_message), ''), 3000), true,
    left(coalesce(nullif(trim(p_source_path), ''), '/recovery-support-lowell'), 300),
    left(nullif(trim(p_source_campaign), ''), 200),
    left(nullif(trim(p_request_fingerprint), ''), 128)
  ) returning id into new_id;
  return new_id;
end;
$$;

revoke all on function public.request_recovery_membership(uuid,text,text,text) from public;
revoke all on function public.review_recovery_membership_request(uuid,text,text) from public;
revoke all on function public.submit_recovery_interest_request(text,text,text,text,text,text,boolean,text,text,text) from public;
grant execute on function public.request_recovery_membership(uuid,text,text,text) to authenticated;
grant execute on function public.review_recovery_membership_request(uuid,text,text) to authenticated;
grant execute on function public.submit_recovery_interest_request(text,text,text,text,text,text,boolean,text,text,text) to anon, authenticated;

alter table public.recovery_membership_requests enable row level security;
alter table public.recovery_interest_requests enable row level security;
alter table public.recovery_public_topics enable row level security;

-- Replace broad/self-service recovery policies from 0027.
drop policy if exists recovery_programs_read on public.recovery_programs;
drop policy if exists recovery_programs_manage on public.recovery_programs;
drop policy if exists recovery_memberships_read on public.recovery_memberships;
drop policy if exists recovery_memberships_manage on public.recovery_memberships;

create policy recovery_programs_private_read
  on public.recovery_programs for select to authenticated
  using (public.can_read_recovery_program(id));
create policy recovery_programs_leader_manage
  on public.recovery_programs for all to authenticated
  using (public.leads_recovery_program(id))
  with check (public.is_privileged_actor(array['minister','safety_admin','super_admin']) or created_by = auth.uid());

create policy recovery_memberships_private_read
  on public.recovery_memberships for select to authenticated
  using (profile_id = auth.uid() or public.leads_recovery_program(program_id));
create policy recovery_memberships_leader_insert
  on public.recovery_memberships for insert to authenticated
  with check (public.leads_recovery_program(program_id));
create policy recovery_memberships_leader_update
  on public.recovery_memberships for update to authenticated
  using (public.leads_recovery_program(program_id))
  with check (public.leads_recovery_program(program_id));
create policy recovery_memberships_leader_delete
  on public.recovery_memberships for delete to authenticated
  using (public.leads_recovery_program(program_id));

create policy recovery_membership_requests_member_read
  on public.recovery_membership_requests for select to authenticated
  using (profile_id = auth.uid() or public.leads_recovery_program(program_id));
create policy recovery_membership_requests_member_withdraw
  on public.recovery_membership_requests for update to authenticated
  using (profile_id = auth.uid() and status = 'pending')
  with check (profile_id = auth.uid() and status = 'withdrawn');

create policy recovery_interest_requests_privileged_read
  on public.recovery_interest_requests for select to authenticated
  using (public.is_privileged_actor(array['minister','content_editor','super_admin']));
create policy recovery_interest_requests_privileged_update
  on public.recovery_interest_requests for update to authenticated
  using (public.is_privileged_actor(array['minister','content_editor','super_admin']))
  with check (public.is_privileged_actor(array['minister','content_editor','super_admin']));

create policy recovery_public_topics_privileged_all
  on public.recovery_public_topics for all to authenticated
  using (public.is_privileged_actor(array['minister','content_editor','super_admin']))
  with check (public.is_privileged_actor(array['minister','content_editor','super_admin']));

revoke all on table public.recovery_membership_requests,
  public.recovery_interest_requests, public.recovery_public_topics from anon;
grant select, update on table public.recovery_membership_requests to authenticated;
grant select, update on table public.recovery_interest_requests to authenticated;
grant select, insert, update, delete on table public.recovery_public_topics to authenticated;
grant all on table public.recovery_membership_requests,
  public.recovery_interest_requests, public.recovery_public_topics to service_role;

comment on table public.recovery_membership_requests is
  'Opt-in requests reviewed by an authorized recovery leader. Members cannot directly enroll themselves.';
comment on table public.recovery_interest_requests is
  'Voluntary public requests for church peer support, an online conversation, family support, or official treatment-resource guidance.';
comment on table public.recovery_public_topics is
  'Public or aggregate recovery-support topics only. Never store private forum identities, inferred addiction status, diagnoses, or treatment records.';

commit;
