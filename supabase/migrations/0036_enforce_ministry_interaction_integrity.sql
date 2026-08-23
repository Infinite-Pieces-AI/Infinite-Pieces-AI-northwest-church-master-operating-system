begin;

-- -----------------------------------------------------------------------------
-- Gift response decisions belong to the post owner. Responders may express or
-- withdraw interest, but cannot mark themselves accepted/completed or rewrite
-- the response identity through a direct client.
-- -----------------------------------------------------------------------------
create or replace function public.enforce_gift_response_boundaries()
returns trigger
language plpgsql
security definer
set search_path = public, auth
set row_security = off
as $$
declare
  post_owner uuid;
  privileged_reviewer boolean;
begin
  select gp.created_by into post_owner
  from public.gift_posts gp
  where gp.id = new.post_id;

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
    if auth.uid() = old.profile_id and auth.uid() <> post_owner then
      if new.status not in ('interested','withdrawn') then
        raise exception 'A responder may only keep or withdraw their own interest';
      end if;
    elsif auth.uid() = post_owner then
      if new.status not in ('interested','accepted','declined','completed','withdrawn') then
        raise exception 'Unsupported post-owner response decision';
      end if;
    else
      raise exception 'Gift response access is not authorized';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists gift_post_responses_enforce_boundaries
  on public.gift_post_responses;
create trigger gift_post_responses_enforce_boundaries
  before insert or update on public.gift_post_responses
  for each row execute function public.enforce_gift_response_boundaries();

-- -----------------------------------------------------------------------------
-- Prayer updates are authored only by the request owner or restricted leaders.
-- Other authorized members may pray, encourage, or share Scripture when enabled.
-- -----------------------------------------------------------------------------
drop policy if exists prayer_interactions_insert on public.prayer_interactions;
create policy prayer_interactions_insert
  on public.prayer_interactions for insert to authenticated
  with check (
    created_by = auth.uid()
    and public.can_read_prayer_request(request_id)
    and exists (
      select 1
      from public.prayer_requests pr
      where pr.id = request_id
        and (
          (interaction_type = 'prayed' and pr.allow_prayed_events)
          or (
            interaction_type in ('encouragement','scripture')
            and pr.allow_encouragement
          )
          or (
            interaction_type = 'update'
            and (
              public.owns_prayer_request(pr.id, auth.uid())
              or public.is_privileged_actor(array['minister','safety_admin','super_admin'])
            )
          )
        )
    )
  );

-- -----------------------------------------------------------------------------
-- Recovery participants cannot transform their posts into official/leader-only
-- content or move posts/comments into records they are not authorized to see.
-- -----------------------------------------------------------------------------
create or replace function public.enforce_recovery_post_boundaries()
returns trigger
language plpgsql
security definer
set search_path = public, auth
set row_security = off
as $$
declare
  leader_authorized boolean;
begin
  leader_authorized := public.leads_recovery_program(new.program_id, auth.uid());

  if tg_op = 'INSERT' and not leader_authorized then
    new.created_by := auth.uid();
  elsif tg_op = 'UPDATE' and not leader_authorized then
    new.created_by := old.created_by;
    new.program_id := old.program_id;
  end if;

  if not public.is_recovery_member(new.program_id, auth.uid())
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

drop trigger if exists recovery_posts_enforce_boundaries on public.recovery_posts;
create trigger recovery_posts_enforce_boundaries
  before insert or update on public.recovery_posts
  for each row execute function public.enforce_recovery_post_boundaries();

create or replace function public.enforce_recovery_comment_boundaries()
returns trigger
language plpgsql
security definer
set search_path = public, auth
set row_security = off
as $$
declare
  target_program uuid;
  target_leader_only boolean;
  leader_authorized boolean;
begin
  select rp.program_id, rp.leader_only
  into target_program, target_leader_only
  from public.recovery_posts rp
  where rp.id = new.post_id
    and rp.status = 'active';

  if target_program is null then
    raise exception 'Recovery post not found';
  end if;
  leader_authorized := public.leads_recovery_program(target_program, auth.uid());

  if tg_op = 'INSERT' and not leader_authorized then
    new.created_by := auth.uid();
  elsif tg_op = 'UPDATE' and not leader_authorized then
    new.created_by := old.created_by;
    new.post_id := old.post_id;
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

drop trigger if exists recovery_comments_enforce_boundaries
  on public.recovery_post_comments;
create trigger recovery_comments_enforce_boundaries
  before insert or update on public.recovery_post_comments
  for each row execute function public.enforce_recovery_comment_boundaries();

drop policy if exists recovery_comments_read on public.recovery_post_comments;
drop policy if exists recovery_comments_insert on public.recovery_post_comments;
drop policy if exists recovery_comments_update on public.recovery_post_comments;

create policy recovery_comments_read
  on public.recovery_post_comments for select to authenticated
  using (
    exists (
      select 1
      from public.recovery_posts rp
      where rp.id = post_id
        and public.is_recovery_member(rp.program_id)
        and (not rp.leader_only or public.leads_recovery_program(rp.program_id))
    )
  );
create policy recovery_comments_insert
  on public.recovery_post_comments for insert to authenticated
  with check (
    created_by = auth.uid()
    and exists (
      select 1
      from public.recovery_posts rp
      where rp.id = post_id
        and public.is_recovery_member(rp.program_id)
        and (not rp.leader_only or public.leads_recovery_program(rp.program_id))
    )
  );
create policy recovery_comments_update
  on public.recovery_post_comments for update to authenticated
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.recovery_posts rp
      where rp.id = post_id and public.leads_recovery_program(rp.program_id)
    )
  )
  with check (
    created_by = auth.uid()
    or exists (
      select 1 from public.recovery_posts rp
      where rp.id = post_id and public.leads_recovery_program(rp.program_id)
    )
  );

comment on function public.enforce_gift_response_boundaries() is
  'Separates responder interest/withdrawal from the post owner’s accept/decline/complete decision.';
comment on function public.enforce_recovery_post_boundaries() is
  'Prevents recovery participants from converting their posts into official, meeting-update, or leader-only content.';
comment on function public.enforce_recovery_comment_boundaries() is
  'Prevents direct-ID access to leader-only or unrelated recovery discussions.';

commit;
