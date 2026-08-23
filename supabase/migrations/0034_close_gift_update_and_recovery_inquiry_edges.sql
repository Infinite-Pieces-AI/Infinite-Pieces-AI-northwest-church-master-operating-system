begin;

-- -----------------------------------------------------------------------------
-- Gift post authorization must hold on UPDATE as well as INSERT. Ordinary
-- members cannot convert a personal offer into an official church need or move
-- a post into a group/ministry they do not belong to through a direct client.
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

  sensitive_text := lower(
    concat_ws(
      ' ',
      new.title,
      new.description,
      new.price_note,
      array_to_string(new.skill_tags, ' ')
    )
  );

  if sensitive_text ~ '(child ?care|babysit|transport|ride|home access|medical|therapy|counsel|electric|plumb|roof|legal|financial|cash|venmo|cashapp|paypal)' then
    if new.risk_level = 'standard' then new.risk_level := 'review'; end if;
  end if;
  if new.exchange_type = 'paid' or new.post_type = 'item_share' then
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

-- A current participant does not need or receive another pending access request.
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
  if exists (
    select 1
    from public.recovery_memberships rm
    where rm.program_id = p_program_id
      and rm.profile_id = auth.uid()
      and rm.ended_at is null
  ) then
    raise exception 'You already have active access to this recovery program';
  end if;
  if not exists (
    select 1
    from public.recovery_programs rp
    where rp.id = p_program_id
      and rp.status = 'active'
      and rp.accepting_access_requests
  ) then
    raise exception 'Recovery program is not accepting access requests';
  end if;

  insert into public.recovery_access_requests (
    program_id,
    profile_id,
    request_message,
    privacy_agreement_accepted_at,
    status,
    reviewed_by,
    reviewed_at,
    decision_note
  ) values (
    p_program_id,
    auth.uid(),
    left(nullif(trim(p_message), ''), 1500),
    timezone('utc', now()),
    'pending',
    null,
    null,
    null
  )
  on conflict (program_id, profile_id) do update set
    request_message = excluded.request_message,
    privacy_agreement_accepted_at = excluded.privacy_agreement_accepted_at,
    status = 'pending',
    reviewed_by = null,
    reviewed_at = null,
    decision_note = null,
    updated_at = timezone('utc', now())
  returning id into request_id;

  return request_id;
end;
$$;

-- Voluntary recovery inquiries can contain sensitive free text. Keep them inside
-- the narrow minister/super-administrator boundary even though public and
-- aggregate recovery topics may be researched by approved content operators.
drop policy if exists public_recovery_inquiries_outreach_read
  on public.public_recovery_inquiries;
drop policy if exists public_recovery_inquiries_outreach_update
  on public.public_recovery_inquiries;

create policy public_recovery_inquiries_minister_read
  on public.public_recovery_inquiries for select to authenticated
  using (public.is_privileged_actor(array['minister','super_admin']));
create policy public_recovery_inquiries_minister_update
  on public.public_recovery_inquiries for update to authenticated
  using (public.is_privileged_actor(array['minister','super_admin']))
  with check (public.is_privileged_actor(array['minister','super_admin']));

comment on function public.enforce_gift_post_moderation() is
  'Enforces gift-post role, group/ministry membership, moderation, and elevated-risk rules on both insert and update.';
comment on table public.public_recovery_inquiries is
  'Voluntary and potentially sensitive recovery next-step requests. Read/update access is limited to MFA-verified ministers and super administrators.';

commit;
