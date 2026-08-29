begin;

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

  if not is_reviewer then
    if new.post_type = 'church_need'
      and not public.has_any_role(array['group_leader','minister','super_admin']) then
      raise exception 'Only an approved church leader may publish a church need';
    end if;
    if new.visibility = 'ministry'
      and not public.is_ministry_member(new.ministry_id, auth.uid()) then
      raise exception 'Ministry membership is required for this visibility';
    end if;
    if new.visibility = 'group'
      and not public.is_group_member(new.group_id, auth.uid()) then
      raise exception 'Group membership is required for this visibility';
    end if;
  end if;

  sensitive_text := lower(concat_ws(
    ' ', new.title, new.description, new.price_note,
    array_to_string(new.skill_tags, ' ')
  ));
  if sensitive_text ~ '(child ?care|babysit|transport|ride|home access|medical|therapy|counsel|electric|plumb|roof|legal|financial|cash|venmo|cashapp|paypal)'
    or new.exchange_type = 'paid'
    or new.post_type = 'item_share' then
    if new.risk_level = 'standard' then new.risk_level := 'review'; end if;
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

create or replace function public.request_recovery_membership(
  p_program_id uuid,
  p_requested_role text,
  p_display_mode text,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
set row_security = off
as $$
declare
  new_id uuid;
begin
  if not public.is_active_member(auth.uid()) then
    raise exception 'Active church membership is required';
  end if;
  if exists (
    select 1 from public.recovery_memberships rm
    where rm.program_id = p_program_id
      and rm.profile_id = auth.uid()
      and rm.ended_at is null
  ) then
    raise exception 'You already have active access to this recovery ministry';
  end if;
  if p_requested_role not in ('participant','peer_support') then
    raise exception 'Unsupported requested role';
  end if;
  if p_display_mode not in ('first_name','initials','private') then
    raise exception 'Unsupported display mode';
  end if;
  if not exists (
    select 1 from public.recovery_programs rp
    where rp.id = p_program_id
      and rp.status = 'active'
      and rp.accepting_access_requests
  ) then
    raise exception 'Recovery ministry is not accepting access requests';
  end if;

  update public.recovery_membership_requests
  set status = 'expired', updated_at = timezone('utc', now())
  where program_id = p_program_id
    and profile_id = auth.uid()
    and status = 'pending';

  insert into public.recovery_membership_requests (
    program_id, profile_id, requested_role, display_mode,
    privacy_acknowledged_at, reason, status
  ) values (
    p_program_id, auth.uid(), p_requested_role, p_display_mode,
    timezone('utc', now()), left(nullif(trim(p_reason), ''), 2000), 'pending'
  ) returning id into new_id;
  return new_id;
end;
$$;

drop policy if exists recovery_interest_requests_outreach_read
  on public.recovery_interest_requests;
drop policy if exists recovery_interest_requests_outreach_update
  on public.recovery_interest_requests;
drop policy if exists recovery_interest_requests_minister_read
  on public.recovery_interest_requests;
drop policy if exists recovery_interest_requests_minister_update
  on public.recovery_interest_requests;

create policy recovery_interest_requests_minister_read
  on public.recovery_interest_requests for select to authenticated
  using (public.has_outreach_mfa_role(array['minister','super_admin']));
create policy recovery_interest_requests_minister_update
  on public.recovery_interest_requests for update to authenticated
  using (public.has_outreach_mfa_role(array['minister','super_admin']))
  with check (public.has_outreach_mfa_role(array['minister','super_admin']));

comment on function public.enforce_gift_post_moderation() is
  'Enforces gift-post role, scope, moderation, and elevated-risk rules on insert and update.';
comment on table public.recovery_interest_requests is
  'Voluntary and potentially sensitive recovery next-step requests. Read/update access is limited to MFA-verified ministers and super administrators.';

commit;
