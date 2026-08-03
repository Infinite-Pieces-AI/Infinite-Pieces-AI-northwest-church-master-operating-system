begin;

create or replace function public.enqueue_outbox_event(
  p_aggregate_type text,
  p_aggregate_id uuid,
  p_event_type text,
  p_payload jsonb,
  p_available_at timestamptz default timezone('utc', now())
)
returns uuid
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare event_id uuid;
begin
  insert into public.outbox_events(aggregate_type, aggregate_id, event_type, payload, available_at)
  values (p_aggregate_type, p_aggregate_id, p_event_type, coalesce(p_payload, '{}'::jsonb), p_available_at)
  returning id into event_id;
  return event_id;
end;
$$;

create or replace function public.claim_outbox_events(
  requested_event_types text[],
  requested_limit integer,
  worker_id text
)
returns table (id uuid, event_type text, payload jsonb, attempts integer)
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if requested_limit not between 1 and 100 then raise exception 'requested_limit must be between 1 and 100'; end if;
  if char_length(worker_id) not between 1 and 200 then raise exception 'worker_id is required'; end if;

  return query
  with candidates as (
    select oe.id
    from public.outbox_events oe
    where oe.status = 'pending'
      and oe.available_at <= timezone('utc', now())
      and oe.event_type = any(requested_event_types)
    order by oe.available_at, oe.created_at
    for update skip locked
    limit requested_limit
  )
  update public.outbox_events oe
  set status = 'processing',
      locked_at = timezone('utc', now()),
      locked_by = worker_id,
      attempts = oe.attempts + 1
  from candidates c
  where oe.id = c.id
  returning oe.id, oe.event_type, oe.payload, oe.attempts;
end;
$$;

create or replace function public.complete_outbox_event(requested_id uuid)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  update public.outbox_events
  set status = 'sent', completed_at = timezone('utc', now()), locked_at = null, locked_by = null, last_error = null
  where id = requested_id and status = 'processing';
  if not found then raise exception 'Outbox event is not currently claimed'; end if;
end;
$$;

create or replace function public.fail_outbox_event(requested_id uuid, failure_message text)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare current_attempts integer;
begin
  select attempts into current_attempts from public.outbox_events where id = requested_id for update;
  if current_attempts is null then raise exception 'Outbox event not found'; end if;
  update public.outbox_events
  set status = case when current_attempts >= 8 then 'failed'::public.job_status else 'pending'::public.job_status end,
      available_at = case
        when current_attempts >= 8 then available_at
        else timezone('utc', now()) + make_interval(secs => least(3600, (30 * power(2, greatest(current_attempts - 1, 0)))::integer))
      end,
      locked_at = null,
      locked_by = null,
      last_error = left(coalesce(failure_message, 'Unknown worker failure'), 2000)
  where id = requested_id;
end;
$$;

revoke all on function public.enqueue_outbox_event(text,uuid,text,jsonb,timestamptz) from public;
revoke all on function public.claim_outbox_events(text[],integer,text) from public;
revoke all on function public.complete_outbox_event(uuid) from public;
revoke all on function public.fail_outbox_event(uuid,text) from public;
grant execute on function public.enqueue_outbox_event(text,uuid,text,jsonb,timestamptz) to service_role;
grant execute on function public.claim_outbox_events(text[],integer,text) to service_role;
grant execute on function public.complete_outbox_event(uuid) to service_role;
grant execute on function public.fail_outbox_event(uuid,text) to service_role;

create or replace function public.on_service_occurrence_change()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if new.publication_status = 'published' and (
    tg_op = 'INSERT'
    or old.publication_status is distinct from new.publication_status
    or old.starts_at is distinct from new.starts_at
    or old.ends_at is distinct from new.ends_at
    or old.location_id is distinct from new.location_id
    or old.status_message is distinct from new.status_message
    or old.occurrence_type is distinct from new.occurrence_type
  ) then
    perform public.enqueue_outbox_event(
      'service_occurrence', new.id, 'service_occurrence.updated',
      jsonb_build_object('service_occurrence_id', new.id, 'starts_at', new.starts_at, 'audience', 'all-members')
    );
  end if;
  return new;
end;
$$;

create or replace function public.on_weekly_lesson_published()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if new.publication_status = 'published' and (tg_op = 'INSERT' or old.publication_status is distinct from 'published') then
    perform public.enqueue_outbox_event(
      'weekly_lesson', new.id, 'weekly_lesson.published',
      jsonb_build_object('weekly_lesson_id', new.id, 'week_of', new.week_of, 'audience', 'all-members')
    );
  end if;
  return new;
end;
$$;

create or replace function public.on_invitation_created()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  perform public.enqueue_outbox_event(
    'invitation', new.id, 'invitation.created',
    jsonb_build_object('invitation_id', new.id, 'audience', 'invited-member', 'expires_at', new.expires_at)
  );
  return new;
end;
$$;

create or replace function public.on_group_cycle_approved()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if new.status in ('approved','active') and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    perform public.enqueue_outbox_event(
      'group_cycle', new.id, 'group_cycle.approved',
      jsonb_build_object('group_cycle_id', new.id, 'audience', 'assigned-members')
    );
  end if;
  return new;
end;
$$;

create or replace function public.validate_media_approval()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare subject_record record;
begin
  if new.review_status = 'approved' and old.review_status is distinct from 'approved' then
    if new.malware_scan_status <> 'clean' then raise exception 'Media cannot be approved until malware scanning is clean'; end if;
    if new.media_type = 'image' and not new.exif_removed then raise exception 'Image metadata must be removed before approval'; end if;
    if new.approved_scope is null then raise exception 'Approved media requires an explicit scope'; end if;
    if new.approved_by is null or new.approved_at is null then raise exception 'Approved media requires reviewer identity and timestamp'; end if;

    for subject_record in select mas.child_id from public.media_asset_subjects mas where mas.media_asset_id = new.id loop
      if not exists (
        select 1 from public.media_permissions mp
        where mp.child_id = subject_record.child_id
          and mp.scope = new.approved_scope
          and mp.granted
          and mp.revoked_at is null
          and mp.effective_from <= timezone('utc', now())
          and (mp.effective_until is null or mp.effective_until > timezone('utc', now()))
      ) then
        raise exception 'Missing active guardian consent for child media scope';
      end if;
    end loop;
  end if;
  return new;
end;
$$;

create or replace function public.on_media_approved()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if new.review_status = 'approved' and old.review_status is distinct from 'approved' then
    perform public.enqueue_outbox_event(
      'media_asset', new.id, 'media.approved',
      jsonb_build_object('media_asset_id', new.id, 'approved_scope', new.approved_scope)
    );
  end if;
  return new;
end;
$$;

create or replace function public.on_social_draft_approved()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    perform public.enqueue_outbox_event(
      'social_draft', new.id, 'social_draft.approved',
      jsonb_build_object('social_draft_id', new.id, 'platform', new.platform)
    );
  end if;
  return new;
end;
$$;

create or replace function public.on_checkin_status_created()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  perform public.enqueue_outbox_event(
    'checkin_status_event', new.id, 'checkin.status_updated',
    jsonb_build_object('checkin_status_event_id', new.id, 'external_reference', new.external_reference, 'state', new.state)
  );
  return new;
end;
$$;

create or replace function public.audit_sensitive_change()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare row_id uuid;
declare action_name text;
begin
  row_id := case when tg_op = 'DELETE' then old.id else new.id end;
  action_name := lower(tg_table_name) || '.' || lower(tg_op);
  insert into public.audit_events(actor_id, actor_type, action, resource_type, resource_id, metadata)
  values (
    auth.uid(),
    case when auth.uid() is null then 'service' else 'user' end,
    action_name,
    tg_table_name,
    row_id,
    jsonb_build_object('operation', tg_op)
  );
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists service_occurrence_outbox on public.service_occurrences;
create trigger service_occurrence_outbox after insert or update on public.service_occurrences
  for each row execute function public.on_service_occurrence_change();
drop trigger if exists weekly_lesson_outbox on public.weekly_lessons;
create trigger weekly_lesson_outbox after insert or update on public.weekly_lessons
  for each row execute function public.on_weekly_lesson_published();
drop trigger if exists invitation_outbox on public.invitations;
create trigger invitation_outbox after insert on public.invitations
  for each row execute function public.on_invitation_created();
drop trigger if exists group_cycle_outbox on public.group_cycles;
create trigger group_cycle_outbox after insert or update on public.group_cycles
  for each row execute function public.on_group_cycle_approved();
drop trigger if exists media_approval_validation on public.media_assets;
create trigger media_approval_validation before update on public.media_assets
  for each row execute function public.validate_media_approval();
drop trigger if exists media_approval_outbox on public.media_assets;
create trigger media_approval_outbox after update on public.media_assets
  for each row execute function public.on_media_approved();
drop trigger if exists social_draft_outbox on public.social_drafts;
create trigger social_draft_outbox after update on public.social_drafts
  for each row execute function public.on_social_draft_approved();
drop trigger if exists checkin_status_outbox on public.checkin_status_events;
create trigger checkin_status_outbox after insert on public.checkin_status_events
  for each row execute function public.on_checkin_status_created();

-- Sensitive-change audit records intentionally store no row payload.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'role_assignments','invitations','guardian_links','authorized_pickups','care_flags',
    'checkin_status_events','media_assets','media_permissions','safeguarding_reports','security_incidents'
  ]
  loop
    execute format('drop trigger if exists %I_sensitive_audit on public.%I', table_name, table_name);
    execute format('create trigger %I_sensitive_audit after insert or update or delete on public.%I for each row execute function public.audit_sensitive_change()', table_name, table_name);
  end loop;
end $$;

-- Realtime broadcasts remain private and authorized by table RLS.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages') then
    alter publication supabase_realtime add table public.messages;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'posts') then
    alter publication supabase_realtime add table public.posts;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notification_jobs') then
    alter publication supabase_realtime add table public.notification_jobs;
  end if;
end $$;

commit;
