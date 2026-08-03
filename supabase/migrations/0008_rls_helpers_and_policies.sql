begin;

-- Security-definer helpers centralize authorization and avoid recursive RLS checks.
-- Authenticated clients may evaluate target-user helpers only for themselves;
-- service-role workers may evaluate an explicit target for controlled jobs.
create or replace function public.may_check_target_user(target_user uuid)
returns boolean
language sql
stable
as $$
  select target_user is not null
    and (target_user = auth.uid() or coalesce(auth.role(), '') = 'service_role');
$$;

create or replace function public.is_active_member(target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select public.may_check_target_user(target_user) and exists (
    select 1 from public.profiles p
    where p.id = target_user and p.membership_status = 'active'
  );
$$;

create or replace function public.has_any_role(requested_roles text[], target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select public.may_check_target_user(target_user) and exists (
    select 1
    from public.role_assignments ra
    join public.roles r on r.id = ra.role_id
    join public.profiles p on p.id = ra.user_id
    where ra.user_id = target_user
      and r.key = any(requested_roles)
      and p.membership_status = 'active'
      and ra.revoked_at is null
      and (ra.expires_at is null or ra.expires_at > timezone('utc', now()))
  );
$$;

create or replace function public.has_role(requested_role text, target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select public.has_any_role(array[requested_role], target_user);
$$;

create or replace function public.is_aal2()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2';
$$;

create or replace function public.is_privileged_actor(requested_roles text[])
returns boolean
language sql
stable
as $$
  select public.is_aal2() and public.has_any_role(requested_roles);
$$;

create or replace function public.can_manage_publication_state(requested_status public.publication_status)
returns boolean
language sql
stable
as $$
  select case
    when requested_status in ('draft', 'in_review')
      then public.is_privileged_actor(array['content_editor','minister','super_admin'])
    else public.is_privileged_actor(array['minister','super_admin'])
  end;
$$;

create or replace function public.is_household_member(requested_household_id uuid, target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select public.may_check_target_user(target_user) and exists (
    select 1 from public.household_members hm
    where hm.household_id = requested_household_id
      and hm.profile_id = target_user
      and hm.joined_at <= timezone('utc', now())
      and (hm.ended_at is null or hm.ended_at > timezone('utc', now()))
  );
$$;

create or replace function public.can_manage_household(requested_household_id uuid, target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select public.may_check_target_user(target_user) and exists (
    select 1 from public.household_members hm
    where hm.household_id = requested_household_id
      and hm.profile_id = target_user
      and hm.can_manage_household
      and hm.ended_at is null
  );
$$;

create or replace function public.is_guardian_of_child(requested_child_id uuid, target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select public.may_check_target_user(target_user) and exists (
    select 1 from public.guardian_links gl
    where gl.child_id = requested_child_id
      and gl.guardian_profile_id = target_user
      and gl.starts_at <= timezone('utc', now())
      and (gl.ends_at is null or gl.ends_at > timezone('utc', now()))
  );
$$;

create or replace function public.can_manage_child(requested_child_id uuid, target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select public.may_check_target_user(target_user) and exists (
    select 1 from public.guardian_links gl
    where gl.child_id = requested_child_id
      and gl.guardian_profile_id = target_user
      and gl.can_manage_profile
      and gl.ends_at is null
  );
$$;

create or replace function public.is_group_member(requested_group_id uuid, target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select public.may_check_target_user(target_user) and exists (
    select 1 from public.group_memberships gm
    where gm.group_id = requested_group_id
      and gm.profile_id = target_user
      and gm.joined_at <= timezone('utc', now())
      and (gm.ended_at is null or gm.ended_at > timezone('utc', now()))
  );
$$;

create or replace function public.leads_group(requested_group_id uuid, target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select public.may_check_target_user(target_user) and (
    exists (
      select 1 from public.group_memberships gm
      where gm.group_id = requested_group_id
        and gm.profile_id = target_user
        and gm.membership_type in ('leader', 'host')
        and gm.joined_at <= timezone('utc', now())
        and (gm.ended_at is null or gm.ended_at > timezone('utc', now()))
    ) or exists (
    select 1 from public.leader_assignments la
    where la.resource_type = 'group'
      and la.resource_id = requested_group_id
      and la.profile_id = target_user
      and la.starts_at <= timezone('utc', now())
      and (la.ends_at is null or la.ends_at > timezone('utc', now()))
    )
  );
$$;

create or replace function public.is_ministry_member(requested_ministry_id uuid, target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select public.may_check_target_user(target_user) and exists (
    select 1 from public.ministry_memberships mm
    where mm.ministry_id = requested_ministry_id
      and mm.profile_id = target_user
      and mm.joined_at <= timezone('utc', now())
      and (mm.ended_at is null or mm.ended_at > timezone('utc', now()))
  );
$$;

create or replace function public.is_channel_member(requested_channel_id uuid, target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select public.may_check_target_user(target_user) and exists (
    select 1 from public.channel_members cm
    where cm.channel_id = requested_channel_id
      and cm.profile_id = target_user
      and cm.joined_at <= timezone('utc', now())
      and (cm.ended_at is null or cm.ended_at > timezone('utc', now()))
  );
$$;

create or replace function public.can_post_channel(requested_channel_id uuid, target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select public.may_check_target_user(target_user) and exists (
    select 1
    from public.channel_members cm
    join public.channels c on c.id = cm.channel_id
    where cm.channel_id = requested_channel_id
      and cm.profile_id = target_user
      and cm.joined_at <= timezone('utc', now())
      and (cm.ended_at is null or cm.ended_at > timezone('utc', now()))
      and c.archived_at is null
      and (
        c.posting_policy = 'members'
        or cm.membership_type in ('leader', 'moderator')
      )
  );
$$;

create or replace function public.is_assigned_kids_volunteer(
  requested_class_id uuid,
  requested_time timestamptz default timezone('utc', now()),
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
    select 1 from public.kids_volunteer_assignments kva
    where kva.kids_class_id = requested_class_id
      and kva.profile_id = target_user
      and requested_time between kva.starts_at - interval '45 minutes' and kva.ends_at + interval '45 minutes'
  );
$$;

create or replace function public.can_access_album(requested_album_id uuid, target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select public.may_check_target_user(target_user) and exists (
    select 1
    from public.albums a
    where a.id = requested_album_id
      and a.archived_at is null
      and (
        (a.scope = 'private_household' and public.is_household_member(a.household_id, target_user))
        or (a.scope = 'private_class' and (
          public.is_assigned_kids_volunteer(a.kids_class_id, timezone('utc', now()), target_user)
          or exists (
            select 1
            from public.class_links cl
            join public.guardian_links gl on gl.child_id = cl.child_id
              and gl.starts_at <= timezone('utc', now())
              and (gl.ends_at is null or gl.ends_at > timezone('utc', now()))
            where cl.kids_class_id = a.kids_class_id
              and gl.guardian_profile_id = target_user
              and cl.starts_on <= current_date
              and (cl.ends_on is null or cl.ends_on >= current_date)
          )
        ))
        or (a.scope = 'private_parent_community' and public.has_role('verified_guardian', target_user))
        or (a.scope = 'internal_presentation' and public.is_active_member(target_user))
        or (a.scope in ('public_website', 'official_social', 'promotional_advertising') and public.has_any_role(array['content_editor','minister','moderator','super_admin'], target_user))
      )
  );
$$;

create or replace function public.can_access_media_storage_path(requested_bucket text, requested_path text, target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select public.may_check_target_user(target_user) and exists (
    select 1
    from public.media_assets ma
    where ma.storage_bucket = requested_bucket
      and ma.storage_path = requested_path
      and ma.review_status = 'approved'
      and ma.removed_at is null
      and public.can_access_album(ma.album_id, target_user)
  );
$$;

create or replace function public.can_assign_role_key(requested_role text)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select case
    when public.is_privileged_actor(array['super_admin']) then true
    when public.is_privileged_actor(array['minister']) then requested_role = any(array['member','verified_guardian','teen','group_leader','kids_volunteer','content_editor','moderator'])
    else false
  end;
$$;

create or replace function public.can_assign_role_keys(requested_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select coalesce(bool_and(public.can_assign_role_key(role_key)), false)
  from unnest(requested_roles) as role_key;
$$;

revoke all on function public.may_check_target_user(uuid) from public;
revoke all on function public.is_active_member(uuid) from public;
revoke all on function public.has_any_role(text[], uuid) from public;
revoke all on function public.has_role(text, uuid) from public;
revoke all on function public.can_manage_publication_state(public.publication_status) from public;
revoke all on function public.is_household_member(uuid, uuid) from public;
revoke all on function public.can_manage_household(uuid, uuid) from public;
revoke all on function public.is_guardian_of_child(uuid, uuid) from public;
revoke all on function public.can_manage_child(uuid, uuid) from public;
revoke all on function public.is_group_member(uuid, uuid) from public;
revoke all on function public.leads_group(uuid, uuid) from public;
revoke all on function public.is_ministry_member(uuid, uuid) from public;
revoke all on function public.is_channel_member(uuid, uuid) from public;
revoke all on function public.can_post_channel(uuid, uuid) from public;
revoke all on function public.is_assigned_kids_volunteer(uuid, timestamptz, uuid) from public;
revoke all on function public.can_access_album(uuid, uuid) from public;
revoke all on function public.can_access_media_storage_path(text, text, uuid) from public;
revoke all on function public.can_assign_role_key(text) from public;
revoke all on function public.can_assign_role_keys(text[]) from public;
grant execute on function public.may_check_target_user(uuid) to authenticated, service_role;
grant execute on function public.is_active_member(uuid) to authenticated, service_role;
grant execute on function public.has_any_role(text[], uuid) to authenticated, service_role;
grant execute on function public.has_role(text, uuid) to authenticated, service_role;
grant execute on function public.is_aal2() to authenticated, service_role;
grant execute on function public.is_privileged_actor(text[]) to authenticated, service_role;
grant execute on function public.can_manage_publication_state(public.publication_status) to authenticated, service_role;
grant execute on function public.is_household_member(uuid, uuid) to authenticated, service_role;
grant execute on function public.can_manage_household(uuid, uuid) to authenticated, service_role;
grant execute on function public.is_guardian_of_child(uuid, uuid) to authenticated, service_role;
grant execute on function public.can_manage_child(uuid, uuid) to authenticated, service_role;
grant execute on function public.is_group_member(uuid, uuid) to authenticated, service_role;
grant execute on function public.leads_group(uuid, uuid) to authenticated, service_role;
grant execute on function public.is_ministry_member(uuid, uuid) to authenticated, service_role;
grant execute on function public.is_channel_member(uuid, uuid) to authenticated, service_role;
grant execute on function public.can_post_channel(uuid, uuid) to authenticated, service_role;
grant execute on function public.is_assigned_kids_volunteer(uuid, timestamptz, uuid) to authenticated, service_role;
grant execute on function public.can_access_album(uuid, uuid) to authenticated, service_role;
grant execute on function public.can_access_media_storage_path(text, text, uuid) to authenticated, service_role;
grant execute on function public.can_assign_role_key(text) to authenticated, service_role;
grant execute on function public.can_assign_role_keys(text[]) to authenticated, service_role;

-- RLS is enabled on every application table. Tables without an explicit policy are service-only.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'profiles','roles','role_assignments','access_requests','households','household_members','emergency_contacts','invitations','user_sessions',
    'life_stages','ministries','ministry_memberships','groups','group_memberships','leader_assignments','group_cycles','group_constraints','pairing_history','rotation_runs','rotation_assignments',
    'locations','service_templates','service_occurrences','service_overrides','series','weekly_lessons','lesson_sections','scripture_references','resources','events','event_occurrences','registrations','attendance_links','volunteer_assignments',
    'channels','channel_members','messages','posts','comments','reactions','prayer_requests','reports','moderation_actions',
    'children','guardian_links','authorized_pickups','kids_classes','class_links','kids_volunteer_assignments','care_flags','service_sessions','external_checkin_refs','checkin_status_events','albums','media_assets','media_permissions','media_asset_subjects','media_reviews','takedown_requests','parent_connections','playdate_proposals',
    'notification_preferences','notification_jobs','delivery_receipts','approved_documents','document_chunks','ai_requests','ai_citations','ai_feedback','campaigns','content_briefs','social_drafts','visit_requests','conversion_events','search_performance_snapshots','audit_events','access_reviews','deletion_requests','security_incidents','safeguarding_reports','vendor_accounts','backup_restore_tests','release_gate_results','outbox_events','webhook_receipts'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end $$;

-- Identity and access.
create policy profiles_read_self on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_privileged_actor(array['minister','moderator','safety_admin','super_admin']));
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin_update on public.profiles for update to authenticated
  using (public.is_privileged_actor(array['minister','super_admin']))
  with check (public.is_privileged_actor(array['minister','super_admin']));

create policy roles_authenticated_read on public.roles for select to authenticated using (true);
create policy role_assignments_read_own on public.role_assignments for select to authenticated
  using (user_id = auth.uid() or public.is_privileged_actor(array['minister','super_admin']));
create policy role_assignments_insert_authorized on public.role_assignments for insert to authenticated
  with check (
    public.can_assign_role_key((select r.key from public.roles r where r.id = role_id))
    and assigned_by = auth.uid()
  );
create policy role_assignments_revoke_authorized on public.role_assignments for update to authenticated
  using (public.is_privileged_actor(array['minister','super_admin']))
  with check (public.can_assign_role_key((select r.key from public.roles r where r.id = role_id)));

create policy access_requests_admin_read on public.access_requests for select to authenticated
  using (public.is_privileged_actor(array['minister','super_admin']));
create policy access_requests_admin_update on public.access_requests for update to authenticated
  using (public.is_privileged_actor(array['minister','super_admin']))
  with check (public.is_privileged_actor(array['minister','super_admin']));

create policy invitations_admin_all on public.invitations for all to authenticated
  using (public.is_privileged_actor(array['minister','super_admin']))
  with check (public.is_privileged_actor(array['minister','super_admin']) and public.can_assign_role_keys(roles_to_assign));

create policy user_sessions_read_own on public.user_sessions for select to authenticated
  using (user_id = auth.uid() or public.is_privileged_actor(array['technical_admin','super_admin']));

-- Households.
create policy households_read_own on public.households for select to authenticated
  using (public.is_household_member(id) or public.is_privileged_actor(array['minister','safety_admin','super_admin']));
create policy households_manage_own on public.households for update to authenticated
  using (public.can_manage_household(id)) with check (public.can_manage_household(id));
create policy household_members_read_own on public.household_members for select to authenticated
  using (public.is_household_member(household_id) or public.is_privileged_actor(array['minister','safety_admin','super_admin']));
create policy household_members_manage_own on public.household_members for all to authenticated
  using (public.can_manage_household(household_id) or public.is_privileged_actor(array['minister','super_admin']))
  with check (public.can_manage_household(household_id) or public.is_privileged_actor(array['minister','super_admin']));
create policy emergency_contacts_household on public.emergency_contacts for all to authenticated
  using (public.can_manage_household(household_id) or public.is_privileged_actor(array['safety_admin','super_admin']))
  with check (public.can_manage_household(household_id) or public.is_privileged_actor(array['safety_admin','super_admin']));

-- Publicly publishable church content.
create policy life_stages_public_read on public.life_stages for select to anon, authenticated using (publication_status = 'published');
create policy life_stages_content_manage on public.life_stages for all to authenticated
  using (public.can_manage_publication_state(publication_status))
  with check (public.can_manage_publication_state(publication_status));
create policy ministries_public_read on public.ministries for select to anon, authenticated using (publication_status = 'published');
create policy ministries_member_read on public.ministries for select to authenticated using (public.is_ministry_member(id));
create policy ministries_content_manage on public.ministries for all to authenticated
  using (public.can_manage_publication_state(publication_status))
  with check (public.can_manage_publication_state(publication_status));

create policy locations_public_read on public.locations for select to anon, authenticated using (publication_status = 'published');
create policy locations_content_manage on public.locations for all to authenticated
  using (public.can_manage_publication_state(publication_status))
  with check (public.can_manage_publication_state(publication_status));
create policy service_templates_public_read on public.service_templates for select to anon, authenticated using (publication_status = 'published');
create policy service_templates_content_manage on public.service_templates for all to authenticated
  using (public.can_manage_publication_state(publication_status))
  with check (public.can_manage_publication_state(publication_status));
create policy service_occurrences_public_read on public.service_occurrences for select to anon, authenticated using (publication_status = 'published');
create policy service_occurrences_content_manage on public.service_occurrences for all to authenticated
  using (public.can_manage_publication_state(publication_status))
  with check (public.can_manage_publication_state(publication_status));
create policy service_overrides_public_read on public.service_overrides for select to anon, authenticated using (publication_status = 'published');
create policy service_overrides_content_manage on public.service_overrides for all to authenticated
  using (public.can_manage_publication_state(publication_status))
  with check (public.can_manage_publication_state(publication_status));
create policy series_public_read on public.series for select to anon, authenticated using (publication_status = 'published');
create policy series_content_manage on public.series for all to authenticated
  using (public.can_manage_publication_state(publication_status))
  with check (public.can_manage_publication_state(publication_status));
create policy weekly_lessons_public_read on public.weekly_lessons for select to anon, authenticated using (publication_status = 'published');
create policy weekly_lessons_content_manage on public.weekly_lessons for all to authenticated
  using (public.can_manage_publication_state(publication_status))
  with check (public.can_manage_publication_state(publication_status));
create policy lesson_sections_public_read on public.lesson_sections for select to anon, authenticated
  using (exists (select 1 from public.weekly_lessons wl where wl.id = lesson_id and wl.publication_status = 'published'));
create policy lesson_sections_content_manage on public.lesson_sections for all to authenticated
  using (exists (
    select 1 from public.weekly_lessons wl
    where wl.id = lesson_id and public.can_manage_publication_state(wl.publication_status)
  ))
  with check (exists (
    select 1 from public.weekly_lessons wl
    where wl.id = lesson_id and public.can_manage_publication_state(wl.publication_status)
  ));
create policy scripture_references_public_read on public.scripture_references for select to anon, authenticated
  using (
    exists (select 1 from public.weekly_lessons wl where wl.id = lesson_id and wl.publication_status = 'published')
    or exists (select 1 from public.series s where s.id = series_id and s.publication_status = 'published')
  );
create policy scripture_references_content_manage on public.scripture_references for all to authenticated
  using (
    (lesson_id is not null and exists (
      select 1 from public.weekly_lessons wl
      where wl.id = lesson_id and public.can_manage_publication_state(wl.publication_status)
    ))
    or (series_id is not null and exists (
      select 1 from public.series s
      where s.id = series_id and public.can_manage_publication_state(s.publication_status)
    ))
  )
  with check (
    (lesson_id is not null and exists (
      select 1 from public.weekly_lessons wl
      where wl.id = lesson_id and public.can_manage_publication_state(wl.publication_status)
    ))
    or (series_id is not null and exists (
      select 1 from public.series s
      where s.id = series_id and public.can_manage_publication_state(s.publication_status)
    ))
  );
create policy resources_public_read on public.resources for select to anon, authenticated using (publication_status = 'published');
create policy resources_content_manage on public.resources for all to authenticated
  using (public.can_manage_publication_state(publication_status))
  with check (public.can_manage_publication_state(publication_status));

create policy events_public_read on public.events for select to anon, authenticated
  using (visibility = 'public' and publication_status = 'published');
create policy events_member_read on public.events for select to authenticated
  using (
    publication_status = 'published' and (
      visibility = 'members'
      or (visibility = 'group' and public.is_group_member(group_id))
      or (visibility = 'ministry' and public.is_ministry_member(ministry_id))
      or (visibility = 'leaders' and public.has_any_role(array['group_leader','minister','super_admin']))
    )
  );
create policy events_content_manage on public.events for all to authenticated
  using (public.can_manage_publication_state(publication_status))
  with check (public.can_manage_publication_state(publication_status));
create policy event_occurrences_read_visible on public.event_occurrences for select to anon, authenticated
  using (exists (select 1 from public.events e where e.id = event_id and e.publication_status = 'published' and (e.visibility = 'public' or public.is_active_member())));
create policy event_occurrences_content_manage on public.event_occurrences for all to authenticated
  using (exists (
    select 1 from public.events e
    where e.id = event_id and public.can_manage_publication_state(e.publication_status)
  ))
  with check (exists (
    select 1 from public.events e
    where e.id = event_id and public.can_manage_publication_state(e.publication_status)
  ));
create policy registrations_self on public.registrations for all to authenticated
  using (profile_id = auth.uid() or public.is_privileged_actor(array['minister','super_admin']))
  with check (profile_id = auth.uid() or public.is_privileged_actor(array['minister','super_admin']));
create policy attendance_links_self_or_leader on public.attendance_links for select to authenticated
  using (profile_id = auth.uid() or public.is_privileged_actor(array['minister','super_admin']));
create policy attendance_links_manage on public.attendance_links for all to authenticated
  using (public.is_privileged_actor(array['minister','super_admin']))
  with check (public.is_privileged_actor(array['minister','super_admin']));
create policy volunteer_assignments_self_read on public.volunteer_assignments for select to authenticated
  using (profile_id = auth.uid() or public.is_privileged_actor(array['minister','super_admin']));
create policy volunteer_assignments_manage on public.volunteer_assignments for all to authenticated
  using (public.is_privileged_actor(array['minister','super_admin']))
  with check (public.is_privileged_actor(array['minister','super_admin']));

-- Ministry and group memberships.
create policy ministry_memberships_self_or_leader on public.ministry_memberships for select to authenticated
  using (profile_id = auth.uid() or public.is_ministry_member(ministry_id) or public.is_privileged_actor(array['minister','super_admin']));
create policy ministry_memberships_manage on public.ministry_memberships for all to authenticated
  using (public.is_privileged_actor(array['minister','super_admin']))
  with check (public.is_privileged_actor(array['minister','super_admin']));
create policy groups_member_read on public.groups for select to authenticated
  using (public.is_group_member(id) or public.is_privileged_actor(array['minister','super_admin']) or directory_visible);
create policy groups_manage on public.groups for all to authenticated
  using (public.is_privileged_actor(array['minister','super_admin']) or public.leads_group(id))
  with check (public.is_privileged_actor(array['minister','super_admin']) or public.leads_group(id));
create policy group_memberships_member_read on public.group_memberships for select to authenticated
  using (public.is_group_member(group_id) or profile_id = auth.uid() or public.is_privileged_actor(array['minister','super_admin']));
create policy group_memberships_manage on public.group_memberships for all to authenticated
  using (public.leads_group(group_id) or public.is_privileged_actor(array['minister','super_admin']))
  with check (public.leads_group(group_id) or public.is_privileged_actor(array['minister','super_admin']));
create policy leader_assignments_self_or_admin on public.leader_assignments for select to authenticated
  using (profile_id = auth.uid() or public.is_privileged_actor(array['minister','super_admin']));
create policy leader_assignments_manage on public.leader_assignments for all to authenticated
  using (public.is_privileged_actor(array['minister','super_admin']))
  with check (public.is_privileged_actor(array['minister','super_admin']));
create policy group_cycles_leader_read on public.group_cycles for select to authenticated
  using (public.has_any_role(array['group_leader','minister','super_admin']));
create policy group_cycles_manage on public.group_cycles for all to authenticated
  using (public.is_privileged_actor(array['minister','super_admin']))
  with check (public.is_privileged_actor(array['minister','super_admin']));
create policy group_constraints_restricted on public.group_constraints for all to authenticated
  using (
    (sensitivity = 'leadership' and public.is_privileged_actor(array['minister','super_admin']))
    or (sensitivity in ('pastoral','safeguarding') and public.is_privileged_actor(array['safety_admin','super_admin']))
  )
  with check (
    (sensitivity = 'leadership' and public.is_privileged_actor(array['minister','super_admin']))
    or (sensitivity in ('pastoral','safeguarding') and public.is_privileged_actor(array['safety_admin','super_admin']))
  );
create policy pairing_history_leaders on public.pairing_history for all to authenticated
  using (public.is_privileged_actor(array['minister','super_admin']))
  with check (public.is_privileged_actor(array['minister','super_admin']));
create policy rotation_runs_leaders on public.rotation_runs for all to authenticated
  using (public.is_privileged_actor(array['minister','super_admin']))
  with check (public.is_privileged_actor(array['minister','super_admin']));
create policy rotation_assignments_leaders on public.rotation_assignments for all to authenticated
  using (public.is_privileged_actor(array['minister','super_admin']))
  with check (public.is_privileged_actor(array['minister','super_admin']));

-- Community. Channel membership is authoritative; URL knowledge grants nothing.
create policy channels_member_read on public.channels for select to authenticated
  using (public.is_channel_member(id) or public.is_privileged_actor(array['moderator','minister','super_admin']));
create policy channels_manage on public.channels for all to authenticated
  using (public.is_privileged_actor(array['minister','super_admin']))
  with check (public.is_privileged_actor(array['minister','super_admin']));
create policy channel_members_self_or_channel on public.channel_members for select to authenticated
  using (profile_id = auth.uid() or public.is_channel_member(channel_id) or public.is_privileged_actor(array['moderator','minister','super_admin']));
create policy channel_members_manage on public.channel_members for all to authenticated
  using (public.is_privileged_actor(array['minister','super_admin']))
  with check (public.is_privileged_actor(array['minister','super_admin']));
create policy messages_member_read on public.messages for select to authenticated
  using (deleted_at is null and public.is_channel_member(channel_id));
create policy messages_member_insert on public.messages for insert to authenticated
  with check (author_id = auth.uid() and public.can_post_channel(channel_id));
create policy messages_author_update on public.messages for update to authenticated
  using (author_id = auth.uid() or public.is_privileged_actor(array['moderator','super_admin']))
  with check (author_id = auth.uid() or public.is_privileged_actor(array['moderator','super_admin']));
create policy posts_member_read on public.posts for select to authenticated
  using (deleted_at is null and (channel_id is null or public.is_channel_member(channel_id)));
create policy posts_member_insert on public.posts for insert to authenticated
  with check (author_id = auth.uid() and (channel_id is null or public.can_post_channel(channel_id)));
create policy posts_author_update on public.posts for update to authenticated
  using (author_id = auth.uid() or public.is_privileged_actor(array['moderator','super_admin']))
  with check (author_id = auth.uid() or public.is_privileged_actor(array['moderator','super_admin']));
create policy comments_member_read on public.comments for select to authenticated
  using (deleted_at is null and exists (select 1 from public.posts p where p.id = post_id and (p.channel_id is null or public.is_channel_member(p.channel_id))));
create policy comments_member_insert on public.comments for insert to authenticated
  with check (author_id = auth.uid() and exists (select 1 from public.posts p where p.id = post_id and (p.channel_id is null or public.can_post_channel(p.channel_id))));
create policy comments_author_update on public.comments for update to authenticated
  using (author_id = auth.uid() or public.is_privileged_actor(array['moderator','super_admin']))
  with check (author_id = auth.uid() or public.is_privileged_actor(array['moderator','super_admin']));
create policy reactions_self_or_visible on public.reactions for select to authenticated using (public.is_active_member());
create policy reactions_self_manage on public.reactions for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy prayer_requests_scoped_read on public.prayer_requests for select to authenticated
  using (
    author_id = auth.uid()
    or (visibility = 'church_members' and public.is_active_member())
    or (visibility = 'assigned_group' and channel_id is not null and public.is_channel_member(channel_id))
    or public.is_privileged_actor(array['minister','safety_admin','super_admin'])
  );
create policy prayer_requests_author_insert on public.prayer_requests for insert to authenticated
  with check (author_id = auth.uid() and (channel_id is null or public.is_channel_member(channel_id)));
create policy prayer_requests_author_update on public.prayer_requests for update to authenticated
  using (author_id = auth.uid() or public.is_privileged_actor(array['minister','safety_admin','super_admin']))
  with check (author_id = auth.uid() or public.is_privileged_actor(array['minister','safety_admin','super_admin']));
create policy reports_own_read on public.reports for select to authenticated
  using (reporter_id = auth.uid() or public.is_privileged_actor(array['moderator','safety_admin','super_admin']));
create policy reports_member_insert on public.reports for insert to authenticated with check (reporter_id = auth.uid());
create policy reports_moderator_update on public.reports for update to authenticated
  using (public.is_privileged_actor(array['moderator','safety_admin','super_admin']))
  with check (public.is_privileged_actor(array['moderator','safety_admin','super_admin']));
create policy moderation_actions_moderators on public.moderation_actions for all to authenticated
  using (public.is_privileged_actor(array['moderator','safety_admin','super_admin']))
  with check (public.is_privileged_actor(array['moderator','safety_admin','super_admin']));

-- Children and check-in. Direct child records remain guardian/safety only; volunteers use a projection RPC.
create policy children_guardian_read on public.children for select to authenticated
  using (public.is_guardian_of_child(id) or public.is_privileged_actor(array['safety_admin','super_admin']));
create policy children_guardian_manage on public.children for all to authenticated
  using (public.can_manage_child(id) or public.is_privileged_actor(array['safety_admin','super_admin']))
  with check (public.can_manage_child(id) or public.is_privileged_actor(array['safety_admin','super_admin']));
create policy guardian_links_participant_read on public.guardian_links for select to authenticated
  using (guardian_profile_id = auth.uid() or public.is_guardian_of_child(child_id) or public.is_privileged_actor(array['safety_admin','super_admin']));
create policy guardian_links_manage on public.guardian_links for all to authenticated
  using (public.can_manage_child(child_id) or public.is_privileged_actor(array['safety_admin','super_admin']))
  with check (public.can_manage_child(child_id) or public.is_privileged_actor(array['safety_admin','super_admin']));
create policy authorized_pickups_guardian on public.authorized_pickups for all to authenticated
  using (public.is_guardian_of_child(child_id) or public.is_privileged_actor(array['safety_admin','super_admin']))
  with check (public.can_manage_child(child_id) or public.is_privileged_actor(array['safety_admin','super_admin']));
create policy kids_classes_member_read on public.kids_classes for select to authenticated using (public.is_active_member());
create policy kids_classes_manage on public.kids_classes for all to authenticated
  using (public.is_privileged_actor(array['safety_admin','minister','super_admin']))
  with check (public.is_privileged_actor(array['safety_admin','minister','super_admin']));
create policy class_links_guardian_read on public.class_links for select to authenticated
  using (public.is_guardian_of_child(child_id) or public.is_privileged_actor(array['safety_admin','super_admin']));
create policy class_links_manage on public.class_links for all to authenticated
  using (public.is_privileged_actor(array['safety_admin','super_admin']))
  with check (public.is_privileged_actor(array['safety_admin','super_admin']));
create policy kids_volunteer_assignments_self_read on public.kids_volunteer_assignments for select to authenticated
  using (profile_id = auth.uid() or public.is_privileged_actor(array['safety_admin','super_admin']));
create policy kids_volunteer_assignments_manage on public.kids_volunteer_assignments for all to authenticated
  using (public.is_privileged_actor(array['safety_admin','super_admin']))
  with check (public.is_privileged_actor(array['safety_admin','super_admin']));
create policy care_flags_guardian_safety on public.care_flags for all to authenticated
  using (public.is_guardian_of_child(child_id) or public.is_privileged_actor(array['safety_admin','super_admin']))
  with check (public.can_manage_child(child_id) or public.is_privileged_actor(array['safety_admin','super_admin']));
create policy service_sessions_assigned_read on public.service_sessions for select to authenticated
  using (public.is_active_member());
create policy service_sessions_manage on public.service_sessions for all to authenticated
  using (public.is_privileged_actor(array['safety_admin','super_admin']))
  with check (public.is_privileged_actor(array['safety_admin','super_admin']));
create policy external_checkin_refs_guardian on public.external_checkin_refs for select to authenticated
  using (public.is_guardian_of_child(child_id) or public.is_privileged_actor(array['safety_admin','super_admin']));
create policy checkin_status_scoped_read on public.checkin_status_events for select to authenticated
  using (
    public.is_guardian_of_child(child_id)
    or (kids_class_id is not null and public.is_assigned_kids_volunteer(kids_class_id, occurred_at))
    or public.is_privileged_actor(array['safety_admin','super_admin'])
  );
create policy checkin_status_manage on public.checkin_status_events for all to authenticated
  using (public.is_privileged_actor(array['safety_admin','super_admin']))
  with check (public.is_privileged_actor(array['safety_admin','super_admin']));

-- Media and parent networking.
create policy albums_scoped_read on public.albums for select to authenticated using (public.can_access_album(id));
create policy albums_authorized_manage on public.albums for all to authenticated
  using (created_by = auth.uid() or public.is_privileged_actor(array['content_editor','moderator','safety_admin','super_admin']))
  with check (created_by = auth.uid() or public.is_privileged_actor(array['content_editor','moderator','safety_admin','super_admin']));
create policy media_assets_scoped_read on public.media_assets for select to authenticated
  using (review_status = 'approved' and removed_at is null and public.can_access_album(album_id));
create policy media_assets_upload on public.media_assets for insert to authenticated
  with check (uploader_id = auth.uid() and public.can_access_album(album_id));
create policy media_assets_review_update on public.media_assets for update to authenticated
  using (public.is_privileged_actor(array['moderator','safety_admin','content_editor','super_admin']))
  with check (public.is_privileged_actor(array['moderator','safety_admin','content_editor','super_admin']));
create policy media_permissions_guardian on public.media_permissions for all to authenticated
  using (public.is_guardian_of_child(child_id) or public.is_privileged_actor(array['safety_admin','super_admin']))
  with check (public.can_manage_child(child_id) or public.is_privileged_actor(array['safety_admin','super_admin']));
create policy media_subjects_guardian_read on public.media_asset_subjects for select to authenticated
  using (public.is_guardian_of_child(child_id) or public.is_privileged_actor(array['moderator','safety_admin','super_admin']));
create policy media_subjects_review_manage on public.media_asset_subjects for all to authenticated
  using (public.is_privileged_actor(array['moderator','safety_admin','super_admin']))
  with check (public.is_privileged_actor(array['moderator','safety_admin','super_admin']));
create policy media_reviews_moderator on public.media_reviews for all to authenticated
  using (public.is_privileged_actor(array['moderator','safety_admin','content_editor','super_admin']))
  with check (public.is_privileged_actor(array['moderator','safety_admin','content_editor','super_admin']));
create policy takedown_requester_read on public.takedown_requests for select to authenticated
  using (requester_id = auth.uid() or public.is_privileged_actor(array['moderator','safety_admin','super_admin']));
create policy takedown_requester_insert on public.takedown_requests for insert to authenticated with check (requester_id = auth.uid());
create policy takedown_moderator_update on public.takedown_requests for update to authenticated
  using (public.is_privileged_actor(array['moderator','safety_admin','super_admin']))
  with check (public.is_privileged_actor(array['moderator','safety_admin','super_admin']));
create policy parent_connections_participants on public.parent_connections for all to authenticated
  using (requesting_guardian_id = auth.uid() or receiving_guardian_id = auth.uid())
  with check (requesting_guardian_id = auth.uid() or receiving_guardian_id = auth.uid());
create policy playdate_participants on public.playdate_proposals for all to authenticated
  using (exists (select 1 from public.parent_connections pc where pc.id = parent_connection_id and auth.uid() in (pc.requesting_guardian_id, pc.receiving_guardian_id)))
  with check (proposed_by = auth.uid() and exists (select 1 from public.parent_connections pc where pc.id = parent_connection_id and pc.status = 'accepted' and auth.uid() in (pc.requesting_guardian_id, pc.receiving_guardian_id)));

-- Member notifications and AI.
create policy notification_preferences_self on public.notification_preferences for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy notification_jobs_self_read on public.notification_jobs for select to authenticated using (profile_id = auth.uid());
create policy delivery_receipts_self_read on public.delivery_receipts for select to authenticated
  using (exists (select 1 from public.notification_jobs nj where nj.id = notification_job_id and nj.profile_id = auth.uid()));
create policy approved_documents_public_read on public.approved_documents for select to anon, authenticated
  using (access_scope = 'public' and publication_status = 'published');
create policy approved_documents_member_read on public.approved_documents for select to authenticated
  using (publication_status = 'published' and (access_scope = 'members' or (access_scope = 'leaders' and public.has_any_role(array['group_leader','content_editor','minister','moderator','safety_admin','super_admin']))));
create policy approved_documents_manage on public.approved_documents for all to authenticated
  using (public.is_privileged_actor(array['content_editor','minister','super_admin']))
  with check (public.is_privileged_actor(array['content_editor','minister','super_admin']));
create policy document_chunks_visible on public.document_chunks for select to authenticated
  using (exists (select 1 from public.approved_documents ad where ad.id = approved_document_id and ad.publication_status = 'published' and (ad.access_scope in ('public','members') or public.has_any_role(array['group_leader','content_editor','minister','moderator','safety_admin','super_admin']))));
create policy document_chunks_manage on public.document_chunks for all to authenticated
  using (public.is_privileged_actor(array['content_editor','minister','super_admin']))
  with check (public.is_privileged_actor(array['content_editor','minister','super_admin']));
create policy ai_requests_own on public.ai_requests for select to authenticated
  using (requester_id = auth.uid() or public.is_privileged_actor(array['content_editor','minister','moderator','super_admin']));
create policy ai_requests_create_own on public.ai_requests for insert to authenticated
  with check (requester_id = auth.uid() and public.is_active_member());
create policy ai_requests_review on public.ai_requests for update to authenticated
  using (requester_id = auth.uid() or public.is_privileged_actor(array['content_editor','minister','moderator','super_admin']))
  with check (requester_id = auth.uid() or public.is_privileged_actor(array['content_editor','minister','moderator','super_admin']));
create policy ai_citations_visible on public.ai_citations for select to authenticated
  using (exists (select 1 from public.ai_requests ar where ar.id = ai_request_id and (ar.requester_id = auth.uid() or public.is_privileged_actor(array['content_editor','minister','moderator','super_admin']))));
create policy ai_feedback_own on public.ai_feedback for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- Outreach data is separate from private ministry content.
create policy campaigns_outreach on public.campaigns for all to authenticated
  using (public.is_privileged_actor(array['minister','super_admin']))
  with check (public.is_privileged_actor(array['minister','super_admin']));
create policy content_briefs_outreach on public.content_briefs for all to authenticated
  using (public.is_privileged_actor(array['content_editor','minister','super_admin']))
  with check (public.is_privileged_actor(array['content_editor','minister','super_admin']));
create policy social_drafts_outreach on public.social_drafts for all to authenticated
  using (public.is_privileged_actor(array['content_editor','minister','super_admin']))
  with check (public.is_privileged_actor(array['content_editor','minister','super_admin']));
create policy visit_requests_outreach on public.visit_requests for all to authenticated
  using (public.is_privileged_actor(array['minister','super_admin']))
  with check (public.is_privileged_actor(array['minister','super_admin']));
create policy conversion_events_aggregate_read on public.conversion_events for select to authenticated
  using (public.is_privileged_actor(array['minister','super_admin']));
create policy search_performance_outreach on public.search_performance_snapshots for select to authenticated
  using (public.is_privileged_actor(array['minister','super_admin']));

-- Governance domains deliberately exclude ordinary technical access from pastoral/safeguarding content.
create policy audit_events_authorized_read on public.audit_events for select to authenticated
  using (public.is_privileged_actor(array['safety_admin','super_admin']) or (public.is_privileged_actor(array['technical_admin']) and resource_type in ('system','deployment','integration','backup')));
create policy access_reviews_governance on public.access_reviews for all to authenticated
  using (public.is_privileged_actor(array['safety_admin','super_admin']))
  with check (public.is_privileged_actor(array['safety_admin','super_admin']));
create policy deletion_requests_self_or_governance on public.deletion_requests for select to authenticated
  using (requester_id = auth.uid() or subject_profile_id = auth.uid() or public.is_privileged_actor(array['safety_admin','super_admin']));
create policy deletion_requests_self_insert on public.deletion_requests for insert to authenticated
  with check (requester_id = auth.uid());
create policy deletion_requests_governance_update on public.deletion_requests for update to authenticated
  using (public.is_privileged_actor(array['safety_admin','super_admin']))
  with check (public.is_privileged_actor(array['safety_admin','super_admin']));
create policy security_incidents_restricted on public.security_incidents for all to authenticated
  using (public.is_privileged_actor(array['technical_admin','safety_admin','super_admin']))
  with check (public.is_privileged_actor(array['technical_admin','safety_admin','super_admin']));
create policy safeguarding_reports_restricted on public.safeguarding_reports for all to authenticated
  using (reporter_id = auth.uid() or public.is_privileged_actor(array['safety_admin','super_admin']))
  with check (reporter_id = auth.uid() or public.is_privileged_actor(array['safety_admin','super_admin']));
create policy vendor_accounts_restricted on public.vendor_accounts for all to authenticated
  using (public.is_privileged_actor(array['technical_admin','super_admin']))
  with check (public.is_privileged_actor(array['technical_admin','super_admin']));
create policy backup_restore_tests_restricted on public.backup_restore_tests for all to authenticated
  using (public.is_privileged_actor(array['technical_admin','super_admin']))
  with check (public.is_privileged_actor(array['technical_admin','super_admin']));
create policy release_gate_results_read on public.release_gate_results for select to authenticated
  using (public.is_privileged_actor(array['minister','safety_admin','technical_admin','super_admin']));
create policy release_gate_results_manage on public.release_gate_results for all to authenticated
  using (public.is_privileged_actor(array['safety_admin','technical_admin','super_admin']))
  with check (public.is_privileged_actor(array['safety_admin','technical_admin','super_admin']));

-- Explicit privileges. RLS remains the final enforcement boundary.
grant usage on schema public to anon, authenticated;
grant select on public.life_stages, public.ministries, public.locations, public.service_templates,
  public.service_occurrences, public.service_overrides, public.series, public.weekly_lessons,
  public.lesson_sections, public.scripture_references, public.resources, public.events,
  public.event_occurrences, public.approved_documents to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke all on public.outbox_events, public.webhook_receipts from anon, authenticated;
revoke all on public.notification_jobs, public.delivery_receipts from anon;
revoke all on public.audit_events, public.security_incidents, public.safeguarding_reports from anon;

commit;
