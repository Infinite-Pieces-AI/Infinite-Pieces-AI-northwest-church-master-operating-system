begin;

-- -----------------------------------------------------------------------------
-- Gift-response decisions use the ORIGINAL post on update. This prevents a
-- responder from temporarily pointing the response at a post they own in order
-- to obtain post-owner decision privileges.
-- -----------------------------------------------------------------------------
create or replace function public.enforce_gift_response_boundaries()
returns trigger
language plpgsql
security definer
set search_path = public, auth
set row_security = off
as $$
declare
  target_post_id uuid;
  post_owner uuid;
  privileged_reviewer boolean;
begin
  target_post_id := case when tg_op = 'UPDATE' then old.post_id else new.post_id end;
  select gp.created_by into post_owner
  from public.gift_posts gp
  where gp.id = target_post_id;

  if post_owner is null then
    raise exception 'Gift post not found';
  end if;

  privileged_reviewer := auth.role() = 'service_role'
    or public.is_privileged_actor(array['moderator','minister','super_admin']);

  if tg_op = 'INSERT' then
    if not privileged_reviewer and post_owner = auth.uid() then
      raise exception 'A post owner cannot respond to their own gift post';
    end if;
    if not privileged_reviewer then
      new.profile_id := auth.uid();
      new.status := 'interested';
    end if;
  elsif not privileged_reviewer then
    new.post_id := old.post_id;
    new.profile_id := old.profile_id;
    new.created_at := old.created_at;

    if auth.uid() = old.profile_id and auth.uid() <> post_owner then
      if new.status not in ('interested','withdrawn') then
        raise exception 'A responder may only keep or withdraw their own interest';
      end if;
    elsif auth.uid() = post_owner then
      new.message := old.message;
      if new.status not in ('accepted','declined','completed') then
        raise exception 'The post owner may accept, decline, or complete a response';
      end if;
    else
      raise exception 'Gift response access is not authorized';
    end if;
  end if;
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Prayer interaction identity and type are immutable for ordinary members.
-- This prevents an encouragement from being converted into an owner update or
-- moved onto another request after creation.
-- -----------------------------------------------------------------------------
create or replace function public.enforce_prayer_interaction_boundaries()
returns trigger
language plpgsql
security definer
set search_path = public, auth
set row_security = off
as $$
declare
  target_request_id uuid;
  target_type text;
  allow_encouragement boolean;
  allow_prayed boolean;
  request_owner boolean;
  privileged_reviewer boolean;
begin
  target_request_id := case when tg_op = 'UPDATE' then old.request_id else new.request_id end;
  target_type := case when tg_op = 'UPDATE' then old.interaction_type else new.interaction_type end;

  select pr.allow_encouragement, pr.allow_prayed_events
  into allow_encouragement, allow_prayed
  from public.prayer_requests pr
  where pr.id = target_request_id;

  if not found then
    raise exception 'Prayer request not found';
  end if;

  request_owner := public.owns_prayer_request(target_request_id, auth.uid());
  privileged_reviewer := auth.role() = 'service_role'
    or public.is_privileged_actor(array['minister','safety_admin','super_admin']);

  if tg_op = 'INSERT' and not privileged_reviewer then
    new.created_by := auth.uid();
  elsif tg_op = 'UPDATE' and not privileged_reviewer then
    new.request_id := old.request_id;
    new.created_by := old.created_by;
    new.interaction_type := old.interaction_type;
    new.created_at := old.created_at;
  end if;

  if not public.can_read_prayer_request(target_request_id, auth.uid())
    and not privileged_reviewer then
    raise exception 'Prayer request access is not authorized';
  end if;

  if target_type = 'prayed' then
    if not allow_prayed then raise exception 'Prayed events are disabled'; end if;
    new.body := null;
  elsif target_type in ('encouragement','scripture') then
    if not allow_encouragement then raise exception 'Prayer responses are disabled'; end if;
    if nullif(trim(new.body), '') is null then
      raise exception 'Prayer response text is required';
    end if;
  elsif target_type = 'update' then
    if not request_owner and not privileged_reviewer then
      raise exception 'Only the request owner or restricted leader may publish an update';
    end if;
    if nullif(trim(new.body), '') is null then
      raise exception 'Prayer update text is required';
    end if;
  else
    raise exception 'Unsupported prayer interaction type';
  end if;
  return new;
end;
$$;

drop trigger if exists prayer_interactions_enforce_boundaries
  on public.prayer_interactions;
create trigger prayer_interactions_enforce_boundaries
  before insert or update on public.prayer_interactions
  for each row execute function public.enforce_prayer_interaction_boundaries();

-- -----------------------------------------------------------------------------
-- Recovery post/comment scope is immutable during update. Authorization is
-- calculated from the original program/post rather than attacker-supplied new
-- identifiers.
-- -----------------------------------------------------------------------------
create or replace function public.enforce_recovery_post_boundaries()
returns trigger
language plpgsql
security definer
set search_path = public, auth
set row_security = off
as $$
declare
  target_program uuid;
  leader_authorized boolean;
begin
  target_program := case when tg_op = 'UPDATE' then old.program_id else new.program_id end;
  leader_authorized := public.leads_recovery_program(target_program, auth.uid());

  if tg_op = 'INSERT' and auth.role() <> 'service_role' then
    new.created_by := auth.uid();
  elsif tg_op = 'UPDATE' and auth.role() <> 'service_role' then
    new.created_by := old.created_by;
    new.program_id := old.program_id;
    new.created_at := old.created_at;
  end if;

  if not public.is_recovery_member(target_program, auth.uid())
    and not leader_authorized then
    raise exception 'Recovery program membership is required';
  end if;
  if not leader_authorized
    and (new.leader_only or new.post_type in ('announcement','meeting_update')) then
    raise exception 'Only an MFA-verified recovery leader may publish this post type';
  end if;
  return new;
end;
$$;

create or replace function public.enforce_recovery_comment_boundaries()
returns trigger
language plpgsql
security definer
set search_path = public, auth
set row_security = off
as $$
declare
  target_post_id uuid;
  target_program uuid;
  target_leader_only boolean;
  leader_authorized boolean;
begin
  target_post_id := case when tg_op = 'UPDATE' then old.post_id else new.post_id end;
  select rp.program_id, rp.leader_only
  into target_program, target_leader_only
  from public.recovery_posts rp
  where rp.id = target_post_id
    and rp.status = 'active';

  if target_program is null then
    raise exception 'Recovery post not found';
  end if;

  leader_authorized := public.leads_recovery_program(target_program, auth.uid());

  if tg_op = 'INSERT' and auth.role() <> 'service_role' then
    new.created_by := auth.uid();
  elsif tg_op = 'UPDATE' and auth.role() <> 'service_role' then
    new.created_by := old.created_by;
    new.post_id := old.post_id;
    new.created_at := old.created_at;
  end if;

  if not public.is_recovery_member(target_program, auth.uid())
    and not leader_authorized then
    raise exception 'Recovery program membership is required';
  end if;
  if target_leader_only and not leader_authorized then
    raise exception 'Leader-only recovery discussion is not available';
  end if;
  return new;
end;
$$;

comment on function public.enforce_gift_response_boundaries() is
  'Uses the original post during updates, freezes response identity, and separates responder withdrawal from post-owner decisions.';
comment on function public.enforce_prayer_interaction_boundaries() is
  'Freezes request/type identity and revalidates prayer interaction permissions on insert and update.';
comment on function public.enforce_recovery_post_boundaries() is
  'Freezes recovery post program/author identity and authorizes against the original program during updates.';
comment on function public.enforce_recovery_comment_boundaries() is
  'Freezes recovery comment post/author identity and authorizes against the original post during updates.';

commit;
