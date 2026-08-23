begin;

-- -----------------------------------------------------------------------------
-- Complete the Gifts, Prayer, and Recovery privacy boundaries introduced in 0027.
-- -----------------------------------------------------------------------------

alter table public.gift_posts
  add column if not exists risk_level text not null default 'standard'
    check (risk_level in ('standard','review','restricted')),
  add column if not exists moderation_reason text
    check (moderation_reason is null or char_length(moderation_reason) <= 1000),
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null,
  add column if not exists reviewed_at timestamptz;

create table public.recovery_access_requests (
  id uuid primary key default extensions.gen_random_uuid(),
  program_id uuid not null references public.recovery_programs(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  request_message text check (request_message is null or char_length(request_message) <= 1500),
  privacy_agreement_accepted_at timestamptz not null default timezone('utc', now()),
  status text not null default 'pending'
    check (status in ('pending','approved','declined','withdrawn','expired')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  decision_note text check (decision_note is null or char_length(decision_note) <= 1500),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(program_id, profile_id),
  check ((status in ('approved','declined') and reviewed_by is not null and reviewed_at is not null)
    or status not in ('approved','declined'))
);

create table public.public_recovery_inquiries (
  id uuid primary key default extensions.gen_random_uuid(),
  first_name text not null check (char_length(first_name) between 1 and 80),
  email text check (email is null or char_length(email) <= 254),
  phone text check (phone is null or char_length(phone) <= 40),
  preferred_contact text not null check (preferred_contact in ('email','phone','either')),
  requested_next_step text not null
    check (requested_next_step in ('attend_group','talk_to_leader','online_option','treatment_resources','general_question')),
  message text check (message is null or char_length(message) <= 1500),
  source_path text not null default '/recovery-support-lowell'
    check (char_length(source_path) <= 500),
  utm_source text check (utm_source is null or char_length(utm_source) <= 200),
  utm_medium text check (utm_medium is null or char_length(utm_medium) <= 200),
  utm_campaign text check (utm_campaign is null or char_length(utm_campaign) <= 200),
  communication_consent boolean not null check (communication_consent),
  consented_at timestamptz not null default timezone('utc', now()),
  status text not null default 'new'
    check (status in ('new','assigned','contacted','scheduled','closed','opted_out')),
  assigned_to uuid references public.profiles(id) on delete set null,
  follow_up_note text check (follow_up_note is null or char_length(follow_up_note) <= 2000),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (email is not null or phone is not null),
  check ((preferred_contact <> 'email') or email is not null),
  check ((preferred_contact <> 'phone') or phone is not null)
);

create table public.recovery_public_topics (
  id uuid primary key default extensions.gen_random_uuid(),
  source_kind text not null
    check (source_kind in ('aggregate_search','public_forum','public_web','public_rss','community_partner')),
  topic text not null check (char_length(topic) between 3 and 300),
  locality text not null default 'Lowell, Massachusetts'
    check (char_length(locality) between 2 and 160),
  public_url text check (public_url is null or public_url ~ '^https://'),
  aggregate_impressions integer check (aggregate_impressions is null or aggregate_impressions >= 0),
  aggregate_clicks integer check (aggregate_clicks is null or aggregate_clicks >= 0),
  opportunity_score integer not null default 0 check (opportunity_score between 0 and 100),
  sensitivity_score integer not null default 0 check (sensitivity_score between 0 and 100),
  recommended_action text check (recommended_action is null or char_length(recommended_action) <= 2000),
  status text not null default 'new'
    check (status in ('new','review','content_queued','partner_queued','dismissed','expired')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.recovery_partner_actions (
  id uuid primary key default extensions.gen_random_uuid(),
  partner_id uuid not null references public.recovery_outreach_partners(id) on delete cascade,
  action_type text not null
    check (action_type in ('research_note','approve_contact','contact_attempt','conversation','partnership','decline','do_not_contact')),
  note text check (note is null or char_length(note) <= 2000),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now())
);

create trigger recovery_access_requests_set_updated_at
  before update on public.recovery_access_requests
  for each row execute function public.set_updated_at();
create trigger public_recovery_inquiries_set_updated_at
  before update on public.public_recovery_inquiries
  for each row execute function public.set_updated_at();
create trigger recovery_public_topics_set_updated_at
  before update on public.recovery_public_topics
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Member-safe gift moderation.
-- -----------------------------------------------------------------------------
create or replace function public.enforce_gift_post_moderation()
returns trigger
language plpgsql
security definer
set search_path = public, auth
set row_security = off
as $$
declare
  is_reviewer boolean;
  sensitive_text text;
begin
  is_reviewer := auth.role() = 'service_role'
    or public.is_privileged_actor(array['moderator','minister','super_admin']);
  sensitive_text := lower(concat_ws(' ', new.title, new.description, new.price_note, array_to_string(new.skill_tags, ' ')));

  if sensitive_text ~ '(child ?care|babysit|transport|ride|home access|medical|therapy|counsel|electric|plumb|roof|legal|financial|cash|venmo|cashapp|paypal)' then
    new.risk_level := 'review';
  end if;
  if new.exchange_type = 'paid' or new.post_type = 'item_share' then
    new.risk_level := greatest(new.risk_level, 'review');
  end if;

  if not is_reviewer then
    if tg_op = 'INSERT' then
      new.moderation_status := 'pending';
      new.reviewed_by := null;
      new.reviewed_at := null;
    elsif new.moderation_status is distinct from old.moderation_status
       or new.reviewed_by is distinct from old.reviewed_by
       or new.reviewed_at is distinct from old.reviewed_at then
      new.moderation_status := old.moderation_status;
      new.reviewed_by := old.reviewed_by;
      new.reviewed_at := old.reviewed_at;
    end if;
  elsif new.moderation_status in ('approved','rejected','removed')
    and (tg_op = 'INSERT' or new.moderation_status is distinct from old.moderation_status) then
    new.reviewed_by := auth.uid();
    new.reviewed_at := timezone('utc', now());
  end if;
  return new;
end;
$$;

drop trigger if exists gift_posts_enforce_moderation on public.gift_posts;
create trigger gift_posts_enforce_moderation
  before insert or update on public.gift_posts
  for each row execute function public.enforce_gift_post_moderation();

-- -----------------------------------------------------------------------------
-- Recovery access requests and approval.
-- -----------------------------------------------------------------------------
create or replace function public.request_recovery_access(
  p_program_id uuid,
  p_message text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
set row_security = off
as $$
declare
  request_id uuid;
begin
  if not public.is_active_member(auth.uid()) then
    raise exception 'Active church membership is required';
  end if;
  if not exists (
    select 1 from public.recovery_programs rp
    where rp.id = p_program_id and rp.status = 'active'
  ) then
    raise exception 'Recovery program is not accepting access requests';
  end if;

  insert into public.recovery_access_requests (
    program_id, profile_id, request_message, privacy_agreement_accepted_at,
    status, reviewed_by, reviewed_at, decision_note
  ) values (
    p_program_id, auth.uid(), left(nullif(trim(p_message), ''), 1500),
    timezone('utc', now()), 'pending', null, null, null
  )
  on conflict (program_id, profile_id) do update set
    request_message = excluded.request_message,
    privacy_agreement_accepted_at = excluded.privacy_agreement_accepted_at,
    status = 'pending', reviewed_by = null, reviewed_at = null,
    decision_note = null, updated_at = timezone('utc', now())
  returning id into request_id;
  return request_id;
end;
$$;

create or replace function public.review_recovery_access_request(
  p_request_id uuid,
  p_decision text,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public, auth
set row_security = off
as $$
declare
  request_row public.recovery_access_requests%rowtype;
begin
  select * into request_row
  from public.recovery_access_requests
  where id = p_request_id
  for update;
  if not found then raise exception 'Access request not found'; end if;
  if not public.leads_recovery_program(request_row.program_id, auth.uid()) then
    raise exception 'Recovery leader access is required';
  end if;
  if p_decision not in ('approved','declined') then
    raise exception 'Decision must be approved or declined';
  end if;

  update public.recovery_access_requests set
    status = p_decision,
    reviewed_by = auth.uid(),
    reviewed_at = timezone('utc', now()),
    decision_note = left(nullif(trim(p_note), ''), 1500)
  where id = p_request_id;

  if p_decision = 'approved' then
    insert into public.recovery_memberships (
      program_id, profile_id, membership_role, display_mode, consented_at, joined_at, ended_at
    ) values (
      request_row.program_id, request_row.profile_id, 'participant', 'first_name',
      request_row.privacy_agreement_accepted_at, timezone('utc', now()), null
    )
    on conflict (program_id, profile_id) do update set
      ended_at = null,
      consented_at = excluded.consented_at,
      joined_at = excluded.joined_at,
      membership_role = case
        when public.recovery_memberships.membership_role in ('leader','admin')
          then public.recovery_memberships.membership_role
        else 'participant'
      end;
  end if;
end;
$$;

create or replace function public.leave_recovery_program(p_program_id uuid)
returns void
language sql
security definer
set search_path = public, auth
set row_security = off
as $$
  update public.recovery_memberships
  set ended_at = timezone('utc', now()), updated_at = timezone('utc', now())
  where program_id = p_program_id and profile_id = auth.uid() and ended_at is null;
$$;

revoke all on function public.request_recovery_access(uuid,text) from public;
revoke all on function public.review_recovery_access_request(uuid,text,text) from public;
revoke all on function public.leave_recovery_program(uuid) from public;
grant execute on function public.request_recovery_access(uuid,text) to authenticated;
grant execute on function public.review_recovery_access_request(uuid,text,text) to authenticated;
grant execute on function public.leave_recovery_program(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Replace the permissive recovery policies from 0027.
-- -----------------------------------------------------------------------------
drop policy if exists recovery_programs_read on public.recovery_programs;
drop policy if exists recovery_programs_manage on public.recovery_programs;
drop policy if exists recovery_memberships_read on public.recovery_memberships;
drop policy if exists recovery_memberships_manage on public.recovery_memberships;

create policy recovery_programs_member_read
  on public.recovery_programs for select to authenticated
  using (public.is_recovery_member(id) or public.leads_recovery_program(id));
create policy recovery_programs_leader_manage
  on public.recovery_programs for all to authenticated
  using (public.leads_recovery_program(id))
  with check (public.is_privileged_actor(array['minister','super_admin']) or created_by = auth.uid());

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

-- -----------------------------------------------------------------------------
-- RLS for newly added tables.
-- -----------------------------------------------------------------------------
alter table public.recovery_access_requests enable row level security;
alter table public.public_recovery_inquiries enable row level security;
alter table public.recovery_public_topics enable row level security;
alter table public.recovery_partner_actions enable row level security;

create policy recovery_access_request_owner_read
  on public.recovery_access_requests for select to authenticated
  using (profile_id = auth.uid() or public.leads_recovery_program(program_id));
create policy recovery_access_request_owner_update
  on public.recovery_access_requests for update to authenticated
  using (profile_id = auth.uid() and status = 'pending')
  with check (profile_id = auth.uid() and status in ('pending','withdrawn'));
create policy recovery_access_request_leader_manage
  on public.recovery_access_requests for all to authenticated
  using (public.leads_recovery_program(program_id))
  with check (public.leads_recovery_program(program_id));

create policy public_recovery_inquiries_outreach_read
  on public.public_recovery_inquiries for select to authenticated
  using (public.is_privileged_actor(array['minister','content_editor','super_admin']));
create policy public_recovery_inquiries_outreach_update
  on public.public_recovery_inquiries for update to authenticated
  using (public.is_privileged_actor(array['minister','content_editor','super_admin']))
  with check (public.is_privileged_actor(array['minister','content_editor','super_admin']));

create policy recovery_public_topics_outreach_manage
  on public.recovery_public_topics for all to authenticated
  using (public.is_privileged_actor(array['minister','content_editor','super_admin']))
  with check (public.is_privileged_actor(array['minister','content_editor','super_admin']));
create policy recovery_partner_actions_outreach_manage
  on public.recovery_partner_actions for all to authenticated
  using (public.is_privileged_actor(array['minister','content_editor','super_admin']))
  with check (public.is_privileged_actor(array['minister','content_editor','super_admin']));

revoke all on table public.recovery_access_requests, public.public_recovery_inquiries,
  public.recovery_public_topics, public.recovery_partner_actions from anon;
grant select, insert, update, delete on table public.recovery_access_requests,
  public.public_recovery_inquiries, public.recovery_public_topics,
  public.recovery_partner_actions to authenticated;
grant all on table public.recovery_access_requests, public.public_recovery_inquiries,
  public.recovery_public_topics, public.recovery_partner_actions to service_role;

comment on table public.public_recovery_inquiries is
  'Voluntary public next-step requests. Do not ask for or store diagnosis, substance history, sobriety dates, medication, treatment records, or inferred addiction status.';
comment on table public.recovery_public_topics is
  'Aggregate search demand and genuinely public topics only. Never store private searcher identity or infer that a named person has a substance-use condition.';
comment on function public.review_recovery_access_request(uuid,text,text) is
  'Leader-only approval workflow. Ordinary members cannot self-enroll in a private recovery program.';

commit;
