begin;

-- -----------------------------------------------------------------------------
-- Prayer privacy is enforced at the database boundary. Ordinary request owners
-- may record an answer/update state, but may not silently widen the audience,
-- remove a restricted sensitivity classification, change ownership display, or
-- edit leader/safeguarding workflow fields through a direct client call.
-- -----------------------------------------------------------------------------
create or replace function public.enforce_prayer_request_boundaries()
returns trigger
language plpgsql
security definer
set search_path = public, auth
set row_security = off
as $$
declare
  privileged_reviewer boolean;
begin
  privileged_reviewer := auth.role() = 'service_role'
    or public.is_privileged_actor(array['minister','safety_admin','super_admin']);

  if tg_op = 'UPDATE' and not privileged_reviewer then
    new.title := old.title;
    new.request_text := old.request_text;
    new.submitted_by_display := old.submitted_by_display;
    new.display_anonymous := old.display_anonymous;
    new.visibility := old.visibility;
    new.ministry_id := old.ministry_id;
    new.group_id := old.group_id;
    new.category := old.category;
    new.sensitivity := old.sensitivity;
    new.allow_encouragement := old.allow_encouragement;
    new.allow_prayed_events := old.allow_prayed_events;
    new.expires_at := old.expires_at;
    new.leader_workflow_status := old.leader_workflow_status;
    new.assigned_to := old.assigned_to;
    new.leader_note := old.leader_note;
    new.leader_reviewed_at := old.leader_reviewed_at;
  end if;

  if new.sensitivity <> 'normal' then
    new.visibility := 'leaders_only';
    new.ministry_id := null;
    new.group_id := null;
    new.allow_encouragement := false;
    new.allow_prayed_events := false;
  end if;

  if new.visibility = 'church' or new.visibility in ('leaders_only','private') then
    new.ministry_id := null;
    new.group_id := null;
  elsif new.visibility = 'ministry' then
    new.group_id := null;
  elsif new.visibility = 'group' then
    new.ministry_id := null;
  end if;

  return new;
end;
$$;

drop trigger if exists prayer_requests_enforce_boundaries on public.prayer_requests;
create trigger prayer_requests_enforce_boundaries
  before insert or update on public.prayer_requests
  for each row execute function public.enforce_prayer_request_boundaries();

-- -----------------------------------------------------------------------------
-- Recovery leadership and access decisions always require an MFA/AAL2 session.
-- Service-role workers remain allowed for controlled server operations.
-- -----------------------------------------------------------------------------
create or replace function public.leads_recovery_program(
  requested_program_id uuid,
  target_user uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public, auth
set row_security = off
as $$
  select case
    when auth.role() = 'service_role' then true
    when target_user is null or target_user <> auth.uid() then false
    when coalesce(auth.jwt() ->> 'aal', 'aal1') <> 'aal2' then false
    else
      public.is_privileged_actor(array['minister','safety_admin','super_admin'])
      or exists (
        select 1
        from public.recovery_memberships rm
        where rm.program_id = requested_program_id
          and rm.profile_id = target_user
          and rm.membership_role in ('leader','admin')
          and rm.ended_at is null
      )
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

  if not found then
    raise exception 'Access request not found';
  end if;
  if request_row.status <> 'pending' then
    raise exception 'Only a pending access request may be reviewed';
  end if;
  if not public.leads_recovery_program(request_row.program_id, auth.uid()) then
    raise exception 'MFA-verified recovery leader access is required';
  end if;
  if p_decision not in ('approved','declined') then
    raise exception 'Decision must be approved or declined';
  end if;

  update public.recovery_access_requests
  set status = p_decision,
      reviewed_by = auth.uid(),
      reviewed_at = timezone('utc', now()),
      decision_note = left(nullif(trim(p_note), ''), 1500)
  where id = p_request_id;

  if p_decision = 'approved' then
    insert into public.recovery_memberships (
      program_id, profile_id, membership_role, display_mode,
      consented_at, joined_at, ended_at
    ) values (
      request_row.program_id,
      request_row.profile_id,
      'participant',
      'first_name',
      request_row.privacy_agreement_accepted_at,
      timezone('utc', now()),
      null
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

revoke all on function public.leads_recovery_program(uuid,uuid) from public;
grant execute on function public.leads_recovery_program(uuid,uuid) to authenticated, service_role;

comment on function public.enforce_prayer_request_boundaries() is
  'Prevents ordinary request owners from widening prayer visibility, declassifying restricted requests, or changing pastoral/safeguarding workflow fields through direct clients.';
comment on function public.leads_recovery_program(uuid,uuid) is
  'Requires AAL2 MFA for every recovery-leader/admin operation and prevents checking another user subject.';

commit;
