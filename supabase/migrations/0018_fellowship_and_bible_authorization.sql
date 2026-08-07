begin;

-- -----------------------------------------------------------------------------
-- Authorization helpers. All target-user helpers preserve the existing rule that
-- authenticated clients may check only themselves; service workers may pass a target.
-- -----------------------------------------------------------------------------

create or replace function public.can_view_fellowship_meetup(
  requested_meetup_id uuid,
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
    and public.is_active_member(target_user)
    and exists (
      select 1
      from public.fellowship_meetups fm
      where fm.id = requested_meetup_id
        and fm.status in ('active','paused','cancelled','completed')
        and (
          fm.creator_profile_id = target_user
          or fm.visibility = 'church'
          or (fm.visibility = 'ministry' and public.is_ministry_member(fm.ministry_id, target_user))
          or (fm.visibility = 'group' and public.is_group_member(fm.group_id, target_user))
          or public.has_any_role(array['minister','moderator','safety_admin','super_admin'], target_user)
        )
    );
$$;

create or replace function public.is_fellowship_participant(
  requested_meetup_id uuid,
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
    and exists (
      select 1
      from public.fellowship_meetup_members fmm
      where fmm.meetup_id = requested_meetup_id
        and fmm.profile_id = target_user
        and fmm.status in ('host','interested','going','waitlisted')
    );
$$;

create or replace function public.can_access_fellowship_thread(
  requested_meetup_id uuid,
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
    and public.can_view_fellowship_meetup(requested_meetup_id, target_user)
    and (
      public.is_fellowship_participant(requested_meetup_id, target_user)
      or exists (
        select 1 from public.fellowship_meetups fm
        where fm.id = requested_meetup_id and fm.creator_profile_id = target_user
      )
      or public.has_any_role(array['minister','moderator','safety_admin','super_admin'], target_user)
    );
$$;

create or replace function public.fellowship_meetup_attendee_count(requested_meetup_id uuid)
returns integer
language plpgsql
stable
security definer
set search_path = public
set row_security = off
as $$
declare result_count integer;
begin
  if not public.can_view_fellowship_meetup(requested_meetup_id) then
    raise exception 'Meetup is not visible to the current member';
  end if;

  select coalesce(sum(fmm.party_size), 0)::integer
  into result_count
  from public.fellowship_meetup_members fmm
  where fmm.meetup_id = requested_meetup_id
    and fmm.status in ('host','going');

  return result_count;
end;
$$;

create or replace function public.on_fellowship_meetup_created_add_host()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  insert into public.fellowship_meetup_members(meetup_id, profile_id, status, party_size)
  values (new.id, new.creator_profile_id, 'host', 1)
  on conflict (meetup_id, profile_id) do nothing;
  return new;
end;
$$;

create trigger fellowship_meetup_add_host
  after insert on public.fellowship_meetups
  for each row execute function public.on_fellowship_meetup_created_add_host();

create or replace function public.protect_fellowship_moderation_fields()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if not public.is_privileged_actor(array['minister','moderator','safety_admin','super_admin']) then
    if tg_op = 'INSERT' then
      new.moderation_note := null;
      if new.status = 'removed' then
        raise exception 'Only an authorized moderator may create a removed meetup';
      end if;
    elsif old.moderation_note is distinct from new.moderation_note or new.status = 'removed' then
      raise exception 'Moderation fields require an authorized moderator';
    end if;
  end if;
  return new;
end;
$$;

create trigger fellowship_meetup_protect_moderation
  before insert or update on public.fellowship_meetups
  for each row execute function public.protect_fellowship_moderation_fields();

create or replace function public.validate_fellowship_membership_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  meetup_record record;
  current_party_size integer;
begin
  if new.status not in ('interested','going','waitlisted') then
    return new;
  end if;

  select fm.capacity, fm.allow_waitlist, fm.status, fm.starts_at, fm.ends_at
  into meetup_record
  from public.fellowship_meetups fm
  where fm.id = new.meetup_id
  for share;

  if meetup_record is null then
    raise exception 'Meetup not found';
  end if;
  if meetup_record.status <> 'active' then
    raise exception 'Meetup is not accepting responses';
  end if;
  if meetup_record.ends_at <= timezone('utc', now()) then
    raise exception 'Meetup is no longer accepting new responses';
  end if;

  if new.status = 'going' and meetup_record.capacity is not null then
    select coalesce(sum(fmm.party_size), 0)::integer
    into current_party_size
    from public.fellowship_meetup_members fmm
    where fmm.meetup_id = new.meetup_id
      and fmm.status in ('host','going')
      and (tg_op = 'INSERT' or fmm.id <> new.id);

    if current_party_size + new.party_size > meetup_record.capacity then
      if meetup_record.allow_waitlist then
        new.status := 'waitlisted';
      else
        raise exception 'Meetup capacity has been reached';
      end if;
    end if;
  end if;

  return new;
end;
$$;

create trigger fellowship_membership_capacity_guard
  before insert or update on public.fellowship_meetup_members
  for each row execute function public.validate_fellowship_membership_capacity();

-- -----------------------------------------------------------------------------
-- Row-level security.
-- -----------------------------------------------------------------------------

alter table public.fellowship_meetups enable row level security;
alter table public.fellowship_meetup_private_details enable row level security;
alter table public.fellowship_meetup_members enable row level security;
alter table public.fellowship_meetup_messages enable row level security;
alter table public.fellowship_preferences enable row level security;
alter table public.bible_journeys enable row level security;
alter table public.bible_journey_weeks enable row level security;
alter table public.bible_journey_progress enable row level security;

create policy fellowship_meetups_member_read
  on public.fellowship_meetups for select to authenticated
  using (public.can_view_fellowship_meetup(id));

create policy fellowship_meetups_member_create
  on public.fellowship_meetups for insert to authenticated
  with check (
    creator_profile_id = auth.uid()
    and public.is_active_member()
    and status in ('draft','active')
    and (
      visibility = 'church'
      or (visibility = 'ministry' and public.is_ministry_member(ministry_id))
      or (visibility = 'group' and public.is_group_member(group_id))
    )
  );

create policy fellowship_meetups_creator_update
  on public.fellowship_meetups for update to authenticated
  using (creator_profile_id = auth.uid())
  with check (
    creator_profile_id = auth.uid()
    and public.is_active_member()
    and status in ('draft','active','paused','cancelled','completed')
    and (
      visibility = 'church'
      or (visibility = 'ministry' and public.is_ministry_member(ministry_id))
      or (visibility = 'group' and public.is_group_member(group_id))
    )
  );

create policy fellowship_meetups_moderator_manage
  on public.fellowship_meetups for all to authenticated
  using (public.is_privileged_actor(array['minister','moderator','safety_admin','super_admin']))
  with check (public.is_privileged_actor(array['minister','moderator','safety_admin','super_admin']));

create policy fellowship_private_details_thread_read
  on public.fellowship_meetup_private_details for select to authenticated
  using (public.can_access_fellowship_thread(meetup_id));

create policy fellowship_private_details_host_manage
  on public.fellowship_meetup_private_details for all to authenticated
  using (
    exists (
      select 1 from public.fellowship_meetups fm
      where fm.id = meetup_id and fm.creator_profile_id = auth.uid()
    )
    or public.is_privileged_actor(array['minister','moderator','safety_admin','super_admin'])
  )
  with check (
    exists (
      select 1 from public.fellowship_meetups fm
      where fm.id = meetup_id and fm.creator_profile_id = auth.uid()
    )
    or public.is_privileged_actor(array['minister','moderator','safety_admin','super_admin'])
  );

create policy fellowship_members_thread_read
  on public.fellowship_meetup_members for select to authenticated
  using (public.can_access_fellowship_thread(meetup_id));

create policy fellowship_members_self_join
  on public.fellowship_meetup_members for insert to authenticated
  with check (
    profile_id = auth.uid()
    and status in ('interested','going','waitlisted')
    and public.can_view_fellowship_meetup(meetup_id)
  );

create policy fellowship_members_self_update
  on public.fellowship_meetup_members for update to authenticated
  using (profile_id = auth.uid() and status <> 'host')
  with check (
    profile_id = auth.uid()
    and status in ('interested','going','waitlisted','declined','cancelled')
    and public.can_view_fellowship_meetup(meetup_id)
  );

create policy fellowship_members_host_self_update
  on public.fellowship_meetup_members for update to authenticated
  using (profile_id = auth.uid() and status = 'host')
  with check (profile_id = auth.uid() and status = 'host');

create policy fellowship_members_self_delete
  on public.fellowship_meetup_members for delete to authenticated
  using (profile_id = auth.uid() and status <> 'host');

create policy fellowship_members_moderator_manage
  on public.fellowship_meetup_members for all to authenticated
  using (public.is_privileged_actor(array['minister','moderator','safety_admin','super_admin']))
  with check (public.is_privileged_actor(array['minister','moderator','safety_admin','super_admin']));

create policy fellowship_messages_participant_read
  on public.fellowship_meetup_messages for select to authenticated
  using (public.can_access_fellowship_thread(meetup_id));

create policy fellowship_messages_participant_create
  on public.fellowship_meetup_messages for insert to authenticated
  with check (
    author_profile_id = auth.uid()
    and public.can_access_fellowship_thread(meetup_id)
    and deleted_at is null
  );

create policy fellowship_messages_author_update
  on public.fellowship_meetup_messages for update to authenticated
  using (author_profile_id = auth.uid() and public.can_access_fellowship_thread(meetup_id))
  with check (author_profile_id = auth.uid() and public.can_access_fellowship_thread(meetup_id));

create policy fellowship_messages_moderator_manage
  on public.fellowship_meetup_messages for all to authenticated
  using (public.is_privileged_actor(array['minister','moderator','safety_admin','super_admin']))
  with check (public.is_privileged_actor(array['minister','moderator','safety_admin','super_admin']));

create policy fellowship_preferences_self
  on public.fellowship_preferences for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy bible_journeys_member_read
  on public.bible_journeys for select to authenticated
  using (
    (publication_status = 'published' and public.is_active_member())
    or public.is_privileged_actor(array['content_editor','minister','super_admin'])
  );

create policy bible_journeys_content_manage
  on public.bible_journeys for all to authenticated
  using (public.can_manage_publication_state(publication_status))
  with check (public.can_manage_publication_state(publication_status));

create policy bible_journey_weeks_member_read
  on public.bible_journey_weeks for select to authenticated
  using (
    (
      publication_status = 'published'
      and public.is_active_member()
      and exists (
        select 1 from public.bible_journeys bj
        where bj.id = journey_id and bj.publication_status = 'published'
      )
    )
    or public.is_privileged_actor(array['content_editor','minister','super_admin'])
  );

create policy bible_journey_weeks_content_manage
  on public.bible_journey_weeks for all to authenticated
  using (public.can_manage_publication_state(publication_status))
  with check (
    public.can_manage_publication_state(publication_status)
    and exists (
      select 1 from public.bible_journeys bj
      where bj.id = journey_id
        and public.can_manage_publication_state(bj.publication_status)
    )
  );

create policy bible_journey_progress_self
  on public.bible_journey_progress for all to authenticated
  using (profile_id = auth.uid())
  with check (
    profile_id = auth.uid()
    and exists (
      select 1
      from public.bible_journey_weeks bjw
      join public.bible_journeys bj on bj.id = bjw.journey_id
      where bjw.id = week_id
        and bj.id = journey_id
        and bjw.publication_status = 'published'
        and bj.publication_status = 'published'
    )
  );

commit;
