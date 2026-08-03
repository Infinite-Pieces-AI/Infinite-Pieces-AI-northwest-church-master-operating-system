begin;

-- Production role catalog. Authorization depends on these stable keys, not display labels.
insert into public.roles (key, display_name, description, privileged) values
  ('visitor', 'Visitor', 'Public website only.', false),
  ('applicant', 'Applicant', 'Pending access-request status only.', false),
  ('member', 'Member', 'Approved member content and assigned communities.', false),
  ('verified_guardian', 'Verified guardian', 'Guardian-managed household and child functions.', false),
  ('teen', 'Teen', 'Age-appropriate teen account with controlled channels.', false),
  ('group_leader', 'Group leader', 'Own group roster, events, and moderation.', false),
  ('kids_volunteer', 'Kids Kingdom volunteer', 'Assigned class operations during authorized windows.', false),
  ('content_editor', 'Content editor', 'Draft public and weekly content.', true),
  ('minister', 'Minister', 'Publish teaching content and manage ministries.', true),
  ('moderator', 'Moderator', 'Review reports and apply community actions.', true),
  ('safety_admin', 'Safety administrator', 'Restricted child-safety and safeguarding operations.', true),
  ('technical_admin', 'Technical administrator', 'Infrastructure health without pastoral-content access.', true),
  ('super_admin', 'Super administrator', 'Emergency access with extremely limited membership.', true)
on conflict (key) do update set
  display_name = excluded.display_name,
  description = excluded.description,
  privileged = excluded.privileged;

-- A new Auth identity receives only a pending profile. Membership is activated by a valid invitation.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  chosen_name text;
begin
  chosen_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    split_part(coalesce(new.email, 'Pending member'), '@', 1)
  );
  insert into public.profiles (id, email, display_name, membership_status)
  values (new.id, coalesce(new.email, new.id::text || '@pending.invalid'), chosen_name, 'pending')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

create or replace function public.write_audit_event(
  p_action text,
  p_resource_type text,
  p_resource_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare event_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  insert into public.audit_events(actor_id, actor_type, action, resource_type, resource_id, metadata)
  values (auth.uid(), 'user', p_action, p_resource_type, p_resource_id, coalesce(p_metadata, '{}'::jsonb))
  returning id into event_id;
  return event_id;
end;
$$;

create or replace function public.submit_access_request(
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text,
  p_relationship text,
  p_known_leader text,
  p_reason text,
  p_ip_hash text default null,
  p_user_agent_hash text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare request_id uuid;
begin
  if char_length(trim(p_first_name)) not between 1 and 80
    or char_length(trim(p_last_name)) not between 1 and 80
    or position('@' in p_email) < 2
    or char_length(trim(p_reason)) not between 5 and 1500 then
    raise exception 'Invalid access request';
  end if;

  if exists (
    select 1 from public.access_requests
    where lower(email::text) = lower(trim(p_email))
      and status in ('pending','verifying','approved')
      and created_at > timezone('utc', now()) - interval '24 hours'
  ) then
    -- Return an opaque stable response without revealing whether an account exists.
    select id into request_id from public.access_requests
    where lower(email::text) = lower(trim(p_email))
      and status in ('pending','verifying','approved')
      and created_at > timezone('utc', now()) - interval '24 hours'
    order by created_at desc limit 1;
    return request_id;
  end if;

  insert into public.access_requests(
    first_name, last_name, email, phone, relationship_to_church, known_leader,
    reason, source_ip_hash, source_user_agent_hash, consent_to_contact
  ) values (
    trim(p_first_name), trim(p_last_name), lower(trim(p_email))::extensions.citext,
    nullif(trim(p_phone), ''), trim(p_relationship), nullif(trim(p_known_leader), ''),
    trim(p_reason), p_ip_hash, p_user_agent_hash, true
  ) returning id into request_id;

  insert into public.audit_events(actor_type, action, resource_type, resource_id, metadata)
  values ('anonymous', 'access_request.submitted', 'access_request', request_id, jsonb_build_object('email_domain', split_part(lower(trim(p_email)), '@', 2)));
  return request_id;
end;
$$;

create or replace function public.submit_visit_request(
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text,
  p_party_size integer,
  p_children_attending boolean,
  p_requested_next_step text,
  p_message text,
  p_consent_to_contact boolean,
  p_source_path text,
  p_source_campaign text default null,
  p_utm_source text default null,
  p_utm_medium text default null,
  p_utm_campaign text default null,
  p_ip_hash text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare request_id uuid;
begin
  if not p_consent_to_contact then raise exception 'Consent to contact is required'; end if;
  if char_length(trim(p_first_name)) not between 1 and 80
    or position('@' in p_email) < 2
    or p_party_size not between 1 and 25 then
    raise exception 'Invalid visit request';
  end if;

  insert into public.visit_requests(
    first_name, last_name, email, phone, party_size, children_attending,
    requested_next_step, message, consent_to_contact, source_path, source_campaign,
    utm_source, utm_medium, utm_campaign, source_ip_hash
  ) values (
    trim(p_first_name), nullif(trim(p_last_name), ''), lower(trim(p_email))::extensions.citext,
    nullif(trim(p_phone), ''), p_party_size, p_children_attending,
    p_requested_next_step, nullif(trim(p_message), ''), true, left(coalesce(p_source_path, '/'), 500),
    nullif(left(coalesce(p_source_campaign, ''), 200), ''), nullif(left(coalesce(p_utm_source, ''), 200), ''),
    nullif(left(coalesce(p_utm_medium, ''), 200), ''), nullif(left(coalesce(p_utm_campaign, ''), 200), ''), p_ip_hash
  ) returning id into request_id;

  insert into public.conversion_events(event_name, visit_request_id, source_path, properties)
  values ('plan_visit_submitted', request_id, left(coalesce(p_source_path, '/'), 500), jsonb_build_object('party_size', p_party_size, 'children_attending', p_children_attending));
  return request_id;
end;
$$;

create or replace function public.record_public_conversion_event(
  p_event_name text,
  p_anonymous_session_id text,
  p_source_path text,
  p_properties jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare event_id uuid;
declare cleaned jsonb;
begin
  if p_event_name <> all(array['plan_visit_started','directions_clicked','event_viewed','event_registered','bible_study_requested','member_access_requested']) then
    raise exception 'Unsupported conversion event';
  end if;
  cleaned := coalesce(p_properties, '{}'::jsonb)
    - 'email' - 'phone' - 'name' - 'first_name' - 'last_name' - 'prayer' - 'message'
    - 'child_id' - 'profile_id' - 'household_id' - 'religious_belief';
  if pg_column_size(cleaned) > 4096 then raise exception 'Properties too large'; end if;
  insert into public.conversion_events(event_name, anonymous_session_id, source_path, properties)
  values (p_event_name, left(p_anonymous_session_id, 128), left(coalesce(p_source_path, '/'), 500), cleaned)
  returning id into event_id;
  return event_id;
end;
$$;

create or replace function public.create_invitation(
  p_intended_email text,
  p_token_hash text,
  p_expires_at timestamptz,
  p_roles text[] default array['member']::text[],
  p_access_request_id uuid default null,
  p_household_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare invitation_id uuid;
begin
  if not public.is_privileged_actor(array['minister','super_admin']) then raise exception 'Insufficient access'; end if;
  if not public.can_assign_role_keys(p_roles) then raise exception 'One or more requested roles cannot be assigned'; end if;
  if char_length(p_token_hash) <> 64 or p_token_hash !~ '^[0-9a-f]{64}$' then raise exception 'Invalid token hash'; end if;
  if p_expires_at <= timezone('utc', now()) or p_expires_at > timezone('utc', now()) + interval '7 days' then raise exception 'Invalid expiration'; end if;

  insert into public.invitations(access_request_id, intended_email, token_hash, roles_to_assign, intended_household_id, created_by, expires_at)
  values (p_access_request_id, lower(trim(p_intended_email))::extensions.citext, p_token_hash, p_roles, p_household_id, auth.uid(), p_expires_at)
  returning id into invitation_id;

  if p_access_request_id is not null then
    update public.access_requests
    set status = 'approved', reviewed_by = auth.uid(), reviewed_at = timezone('utc', now())
    where id = p_access_request_id;
  end if;
  perform public.write_audit_event('invitation.created', 'invitation', invitation_id, jsonb_build_object('roles', p_roles, 'expires_at', p_expires_at));
  return invitation_id;
end;
$$;

create or replace function public.consume_invitation(
  p_token_hash text,
  p_accept_privacy boolean,
  p_accept_community_guidelines boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare invitation_record public.invitations%rowtype;
declare user_email text;
declare requested_role text;
declare role_record_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not p_accept_privacy or not p_accept_community_guidelines then raise exception 'Required policies must be accepted'; end if;
  select lower(email) into user_email from auth.users where id = auth.uid();
  if user_email is null then raise exception 'Verified email required'; end if;

  select * into invitation_record
  from public.invitations
  where token_hash = p_token_hash
  for update;

  if not found then raise exception 'Invitation is invalid'; end if;
  if invitation_record.revoked_at is not null or invitation_record.consumed_at is not null or invitation_record.expires_at <= timezone('utc', now()) then
    raise exception 'Invitation is no longer usable';
  end if;
  if lower(invitation_record.intended_email::text) <> user_email then raise exception 'Invitation email does not match authenticated email'; end if;

  update public.profiles set
    email = user_email::extensions.citext,
    membership_status = 'active',
    accepted_privacy_at = timezone('utc', now()),
    accepted_community_guidelines_at = timezone('utc', now())
  where id = auth.uid();

  foreach requested_role in array invitation_record.roles_to_assign loop
    select id into role_record_id from public.roles where key = requested_role;
    if role_record_id is null then raise exception 'Invitation references an unknown role'; end if;
    insert into public.role_assignments(user_id, role_id, scope_type, assigned_by, reason)
    values (auth.uid(), role_record_id, 'church', invitation_record.created_by, 'Single-use invitation')
    on conflict do nothing;
  end loop;

  if invitation_record.intended_household_id is not null then
    insert into public.household_members(household_id, profile_id, relationship_label, can_manage_household)
    values (invitation_record.intended_household_id, auth.uid(), 'Member', false)
    on conflict do nothing;
  end if;

  update public.invitations
  set consumed_at = timezone('utc', now()), consumed_by = auth.uid()
  where id = invitation_record.id;

  insert into public.audit_events(actor_id, actor_type, action, resource_type, resource_id, metadata)
  values (auth.uid(), 'user', 'invitation.consumed', 'invitation', invitation_record.id, jsonb_build_object('roles', invitation_record.roles_to_assign));

  return jsonb_build_object('success', true, 'profile_id', auth.uid(), 'roles', invitation_record.roles_to_assign);
end;
$$;

create or replace function public.publish_weekly_lesson(p_lesson_id uuid)
returns public.weekly_lessons
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare result public.weekly_lessons%rowtype;
begin
  if not public.is_privileged_actor(array['minister','super_admin']) then raise exception 'Minister approval with MFA is required'; end if;
  update public.weekly_lessons
  set publication_status = 'published', published_by = auth.uid(), reviewed_by = coalesce(reviewed_by, auth.uid()), published_at = timezone('utc', now())
  where id = p_lesson_id
  returning * into result;
  if not found then raise exception 'Lesson not found'; end if;
  perform public.write_audit_event('weekly_lesson.published', 'weekly_lesson', p_lesson_id, jsonb_build_object('week_of', result.week_of));
  return result;
end;
$$;

-- Public projections contain no member, household, child, attendance, or private-group fields.
create or replace view public.public_service_schedule
with (security_invoker = true)
as
select
  so.id,
  so.title,
  so.starts_at,
  so.ends_at,
  so.occurrence_type,
  so.status_message,
  l.name as location_name,
  l.slug as location_slug,
  l.address_line_1,
  l.address_line_2,
  l.city,
  l.state_region,
  l.postal_code,
  l.directions_url,
  l.parking_instructions,
  l.entrance_instructions,
  l.accessibility_notes
from public.service_occurrences so
join public.locations l on l.id = so.location_id
where so.publication_status = 'published'
  and l.publication_status = 'published';

create or replace view public.public_events
with (security_invoker = true)
as
select
  e.id,
  e.title,
  e.slug,
  e.summary,
  e.description,
  e.registration_required,
  e.capacity,
  eo.id as occurrence_id,
  eo.starts_at,
  eo.ends_at,
  l.name as location_name,
  l.city,
  l.state_region,
  l.postal_code
from public.events e
join public.event_occurrences eo on eo.event_id = e.id
left join public.locations l on l.id = coalesce(eo.location_id, e.default_location_id)
where e.visibility = 'public'
  and e.publication_status = 'published';

create or replace function public.get_current_public_schedule(p_after timestamptz default timezone('utc', now()))
returns setof public.public_service_schedule
language sql
stable
security invoker
set search_path = public
as $$
  select * from public.public_service_schedule
  where starts_at >= p_after
  order by starts_at
  limit 10;
$$;

create or replace function public.get_my_this_week(p_reference_date date default current_date)
returns jsonb
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select jsonb_build_object(
    'service', (
      select to_jsonb(pss) from public.public_service_schedule pss
      where pss.starts_at >= p_reference_date::timestamptz
      order by pss.starts_at limit 1
    ),
    'lesson', (
      select jsonb_build_object(
        'id', wl.id,
        'title', wl.title,
        'summary', wl.summary,
        'scriptureOfWeekReference', wl.scripture_of_week_reference,
        'ministerAnnouncement', wl.minister_announcement,
        'weekOf', wl.week_of,
        'references', coalesce((
          select jsonb_agg(jsonb_build_object('reference', sr.reference, 'translationId', sr.translation_id, 'provider', sr.provider) order by sr.position)
          from public.scripture_references sr where sr.lesson_id = wl.id
        ), '[]'::jsonb)
      )
      from public.weekly_lessons wl
      where wl.publication_status = 'published' and wl.week_of <= p_reference_date
      order by wl.week_of desc limit 1
    ),
    'events', coalesce((
      select jsonb_agg(jsonb_build_object('id', e.id, 'title', e.title, 'startsAt', eo.starts_at) order by eo.starts_at)
      from public.events e
      join public.event_occurrences eo on eo.event_id = e.id
      where e.publication_status = 'published'
        and eo.starts_at >= timezone('utc', now())
        and (
          e.visibility in ('public','members')
          or (e.visibility = 'group' and public.is_group_member(e.group_id))
          or (e.visibility = 'ministry' and public.is_ministry_member(e.ministry_id))
        )
      limit 8
    ), '[]'::jsonb),
    'groups', coalesce((
      select jsonb_agg(jsonb_build_object('id', g.id, 'name', g.name, 'kind', g.kind))
      from public.groups g
      join public.group_memberships gm on gm.group_id = g.id
      where gm.profile_id = auth.uid() and gm.ended_at is null and g.status = 'active'
    ), '[]'::jsonb)
  )
  where public.is_active_member();
$$;

-- Volunteers receive only a time-limited operational projection, never unrestricted child rows.
create or replace function public.get_assigned_kids_roster(p_class_id uuid, p_at timestamptz default timezone('utc', now()))
returns table (
  child_id uuid,
  preferred_name text,
  current_state public.checkin_state,
  care_summary jsonb
)
language plpgsql
stable
security definer
set search_path = public
set row_security = off
as $$
begin
  if not (
    public.is_assigned_kids_volunteer(p_class_id, p_at)
    or public.is_privileged_actor(array['safety_admin','super_admin'])
  ) then
    raise exception 'Active class assignment required';
  end if;

  return query
  select
    c.id,
    c.preferred_name,
    (
      select cse.state from public.checkin_status_events cse
      where cse.child_id = c.id and cse.kids_class_id = p_class_id and cse.occurred_at <= p_at
      order by cse.occurred_at desc limit 1
    ),
    coalesce((
      select jsonb_agg(jsonb_build_object('category', cf.category, 'summary', cf.summary, 'instructions', cf.operational_instructions))
      from public.care_flags cf
      where cf.child_id = c.id and cf.active and cf.category <> 'custody'
    ), '[]'::jsonb)
  from public.children c
  join public.class_links cl on cl.child_id = c.id
  where cl.kids_class_id = p_class_id
    and cl.starts_on <= p_at::date
    and (cl.ends_on is null or cl.ends_on >= p_at::date)
    and c.active;
end;
$$;

-- Storage buckets: private member/child media and a separately controlled public publication bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('member-media', 'member-media', false, 26214400, array['image/jpeg','image/png','image/webp','video/mp4','application/pdf']),
  ('child-media', 'child-media', false, 26214400, array['image/jpeg','image/png','image/webp','video/mp4']),
  ('public-site-assets', 'public-site-assets', true, 26214400, array['image/jpeg','image/png','image/webp','image/svg+xml','video/mp4','application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy private_media_read_authorized on storage.objects for select to authenticated
  using (bucket_id in ('member-media','child-media') and public.can_access_media_storage_path(bucket_id, name));
create policy public_site_assets_content_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'public-site-assets' and public.is_privileged_actor(array['content_editor','minister','super_admin']));
create policy public_site_assets_content_update on storage.objects for update to authenticated
  using (bucket_id = 'public-site-assets' and public.is_privileged_actor(array['content_editor','minister','super_admin']))
  with check (bucket_id = 'public-site-assets' and public.is_privileged_actor(array['content_editor','minister','super_admin']));
create policy public_site_assets_content_delete on storage.objects for delete to authenticated
  using (bucket_id = 'public-site-assets' and public.is_privileged_actor(array['content_editor','minister','super_admin']));

revoke all on function public.submit_access_request(text,text,text,text,text,text,text,text,text) from public;
revoke all on function public.submit_visit_request(text,text,text,text,integer,boolean,text,text,boolean,text,text,text,text,text,text) from public;
revoke all on function public.record_public_conversion_event(text,text,text,jsonb) from public;
revoke all on function public.create_invitation(text,text,timestamptz,text[],uuid,uuid) from public;
revoke all on function public.consume_invitation(text,boolean,boolean) from public;
revoke all on function public.publish_weekly_lesson(uuid) from public;
revoke all on function public.get_assigned_kids_roster(uuid,timestamptz) from public;
revoke all on function public.write_audit_event(text,text,uuid,jsonb) from public;

grant execute on function public.submit_access_request(text,text,text,text,text,text,text,text,text) to anon, authenticated;
grant execute on function public.submit_visit_request(text,text,text,text,integer,boolean,text,text,boolean,text,text,text,text,text,text) to anon, authenticated;
grant execute on function public.record_public_conversion_event(text,text,text,jsonb) to anon, authenticated;
grant execute on function public.get_current_public_schedule(timestamptz) to anon, authenticated;
grant execute on function public.create_invitation(text,text,timestamptz,text[],uuid,uuid) to authenticated;
grant execute on function public.consume_invitation(text,boolean,boolean) to authenticated;
grant execute on function public.publish_weekly_lesson(uuid) to authenticated;
grant execute on function public.get_my_this_week(date) to authenticated;
grant execute on function public.get_assigned_kids_roster(uuid,timestamptz) to authenticated;
grant execute on function public.write_audit_event(text,text,uuid,jsonb) to authenticated;
grant select on public.public_service_schedule, public.public_events to anon, authenticated;

comment on view public.public_service_schedule is 'Safe public projection. It contains no member, household, child, prayer, attendance, or private-group data.';
comment on function public.get_assigned_kids_roster is 'Time-limited operational child projection for assigned Kids Kingdom volunteers.';

commit;
