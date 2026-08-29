begin;

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

  if new.visibility in ('church','leaders_only','private') then
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

drop trigger if exists member_prayer_requests_enforce_boundaries
  on public.member_prayer_requests;
create trigger member_prayer_requests_enforce_boundaries
  before insert or update on public.member_prayer_requests
  for each row execute function public.enforce_prayer_request_boundaries();

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

revoke all on function public.leads_recovery_program(uuid,uuid) from public;
grant execute on function public.leads_recovery_program(uuid,uuid)
  to authenticated, service_role;

comment on function public.enforce_prayer_request_boundaries() is
  'Prevents ordinary request owners from widening prayer visibility, declassifying restricted requests, or changing pastoral/safeguarding workflow fields.';
comment on function public.leads_recovery_program(uuid,uuid) is
  'Requires AAL2 MFA for recovery leader/admin operations and prevents checking another subject.';

commit;
