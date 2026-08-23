begin;

create or replace function public.publish_recovery_session(
  p_program_id uuid,
  p_series_key text,
  p_week_number integer,
  p_title text,
  p_participant_summary text,
  p_scripture_references text[],
  p_licensed_resource_url text,
  p_scheduled_for timestamptz,
  p_leader_agenda text,
  p_safety_notes text
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
set row_security = off
as $$
declare
  session_id uuid;
begin
  if not public.leads_recovery_program(p_program_id, auth.uid()) then
    raise exception 'MFA-verified recovery leader access is required';
  end if;
  if p_week_number < 1 or p_week_number > 260 then
    raise exception 'Week number must be between 1 and 260';
  end if;
  if nullif(trim(p_title), '') is null
    or nullif(trim(p_participant_summary), '') is null
    or nullif(trim(p_leader_agenda), '') is null then
    raise exception 'Title, participant summary, and leader agenda are required';
  end if;
  if p_licensed_resource_url is not null
    and p_licensed_resource_url !~ '^https://' then
    raise exception 'Licensed resource URL must use HTTPS';
  end if;

  insert into public.recovery_sessions (
    program_id,
    series_key,
    week_number,
    title,
    participant_summary,
    scripture_references,
    licensed_resource_url,
    scheduled_for,
    status,
    created_by
  ) values (
    p_program_id,
    left(trim(p_series_key), 120),
    p_week_number,
    left(trim(p_title), 180),
    left(trim(p_participant_summary), 3000),
    coalesce(p_scripture_references, '{}'),
    nullif(trim(p_licensed_resource_url), ''),
    p_scheduled_for,
    'published',
    auth.uid()
  )
  on conflict (program_id, series_key, week_number) do update set
    title = excluded.title,
    participant_summary = excluded.participant_summary,
    scripture_references = excluded.scripture_references,
    licensed_resource_url = excluded.licensed_resource_url,
    scheduled_for = excluded.scheduled_for,
    status = 'published'
  returning id into session_id;

  insert into public.recovery_session_guides (
    session_id,
    leader_agenda,
    safety_notes,
    updated_by
  ) values (
    session_id,
    left(trim(p_leader_agenda), 10000),
    left(nullif(trim(p_safety_notes), ''), 5000),
    auth.uid()
  )
  on conflict (session_id) do update set
    leader_agenda = excluded.leader_agenda,
    safety_notes = excluded.safety_notes,
    updated_by = auth.uid(),
    updated_at = timezone('utc', now());

  return session_id;
end;
$$;

revoke all on function public.publish_recovery_session(
  uuid,text,integer,text,text,text[],text,timestamptz,text,text
) from public;
grant execute on function public.publish_recovery_session(
  uuid,text,integer,text,text,text[],text,timestamptz,text,text
) to authenticated;

comment on function public.publish_recovery_session(
  uuid,text,integer,text,text,text[],text,timestamptz,text,text
) is
  'Atomically publishes the participant guide and restricted facilitator agenda after an MFA-verified recovery leader passes curriculum and safety review.';

commit;
