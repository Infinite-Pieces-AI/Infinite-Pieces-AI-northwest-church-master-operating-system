begin;

-- -----------------------------------------------------------------------------
-- Consent-first public pathways
-- Separates visit planning, general questions, and prayer so pastoral content can
-- never drift into advertising or the general visitor CRM.
-- -----------------------------------------------------------------------------

alter table public.visit_requests alter column email drop not null;
alter table public.visit_requests add column if not exists contact_method text;
alter table public.visit_requests add column if not exists practical_notes text;
update public.visit_requests set contact_method = 'email' where contact_method is null;
alter table public.visit_requests alter column contact_method set default 'email';
alter table public.visit_requests alter column contact_method set not null;
alter table public.visit_requests drop constraint if exists visit_requests_contact_method_check;
alter table public.visit_requests
  add constraint visit_requests_contact_method_check check (contact_method in ('email','phone'));
alter table public.visit_requests drop constraint if exists visit_requests_contact_channel_check;
alter table public.visit_requests
  add constraint visit_requests_contact_channel_check check (
    (contact_method = 'email' and email is not null)
    or (contact_method = 'phone' and phone is not null)
  );

create table public.public_questions (
  id uuid primary key default extensions.gen_random_uuid(),
  first_name text not null check (char_length(first_name) between 1 and 80),
  contact_method text not null check (contact_method in ('email','phone')),
  email extensions.citext,
  phone text,
  topic text not null check (topic in ('first_visit','beliefs','bible_study','kids_teens','accessibility','online','other')),
  message text not null check (char_length(message) between 10 and 2000),
  consent_to_contact boolean not null check (consent_to_contact),
  source_path text not null default '/ask-a-question',
  status text not null default 'new' check (status in ('new','assigned','contacted','resolved','closed','opted_out')),
  assigned_to uuid references public.profiles(id) on delete set null,
  source_ip_hash text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (
    (contact_method = 'email' and email is not null)
    or (contact_method = 'phone' and phone is not null)
  )
);
create index public_questions_status_created_idx on public.public_questions(status, created_at desc);

create table public.prayer_requests (
  id uuid primary key default extensions.gen_random_uuid(),
  first_name text check (first_name is null or char_length(first_name) between 1 and 80),
  prayer_text text not null check (char_length(prayer_text) between 3 and 2500),
  response_requested boolean not null default false,
  contact_method text check (contact_method is null or contact_method in ('email','phone')),
  email extensions.citext,
  phone text,
  consent_to_contact boolean not null default false,
  source_path text not null default '/request-prayer',
  status text not null default 'received' check (status in ('received','assigned','acknowledged','closed','deleted')),
  assigned_to uuid references public.profiles(id) on delete set null,
  source_ip_hash text,
  retention_until timestamptz not null default (timezone('utc', now()) + interval '180 days'),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (
    (not response_requested and contact_method is null and not consent_to_contact)
    or (
      response_requested
      and consent_to_contact
      and (
        (contact_method = 'email' and email is not null)
        or (contact_method = 'phone' and phone is not null)
      )
    )
  )
);
create index prayer_requests_status_created_idx on public.prayer_requests(status, created_at desc);
create index prayer_requests_retention_idx on public.prayer_requests(retention_until) where status <> 'deleted';

create table public.ministry_journey_events (
  id uuid primary key default extensions.gen_random_uuid(),
  stage text not null check (stage in (
    'public_discovery','public_answer','next_step_selected','follow_up_requested',
    'follow_up_connected','hub_access_requested','hub_activated','fellowship_joined','service_joined'
  )),
  anonymous_session_id text,
  visit_request_id uuid references public.visit_requests(id) on delete set null,
  public_question_id uuid references public.public_questions(id) on delete set null,
  profile_id uuid references public.profiles(id) on delete set null,
  source_path text,
  pathway text check (pathway is null or pathway in ('visit','question','bible_study','online','hub','fellowship','service')),
  properties jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default timezone('utc', now()),
  check (jsonb_typeof(properties) = 'object')
);
create index ministry_journey_events_stage_time_idx on public.ministry_journey_events(stage, occurred_at desc);

create trigger public_questions_set_updated_at
  before update on public.public_questions
  for each row execute function public.set_updated_at();
create trigger prayer_requests_set_updated_at
  before update on public.prayer_requests
  for each row execute function public.set_updated_at();

alter table public.conversion_events drop constraint if exists conversion_events_event_name_check;
alter table public.conversion_events
  add constraint conversion_events_event_name_check check (event_name in (
    'sunday_details_viewed','directions_clicked','calendar_added','visitor_pathway_selected',
    'plan_visit_started','plan_visit_submitted','question_submitted','online_conversation_requested',
    'event_viewed','event_registered','bible_study_requested','member_access_requested'
  ));

create or replace function public.submit_plan_visit_request(
  p_first_name text,
  p_last_name text,
  p_contact_method text,
  p_email text,
  p_phone text,
  p_party_size integer,
  p_children_attending boolean,
  p_practical_note text,
  p_consent_to_contact boolean,
  p_source_path text,
  p_source_campaign text default null,
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
    or p_contact_method not in ('email','phone')
    or p_party_size not between 1 and 25 then
    raise exception 'Invalid visit request';
  end if;
  if p_contact_method = 'email' and (p_email is null or position('@' in p_email) < 2) then
    raise exception 'Valid email is required';
  end if;
  if p_contact_method = 'phone' and nullif(trim(p_phone), '') is null then
    raise exception 'Phone is required';
  end if;

  insert into public.visit_requests(
    first_name, last_name, contact_method, email, phone, party_size, children_attending,
    requested_next_step, message, practical_notes, consent_to_contact, source_path,
    source_campaign, source_ip_hash
  ) values (
    trim(p_first_name), nullif(trim(p_last_name), ''), p_contact_method,
    case when p_contact_method = 'email' then lower(trim(p_email))::extensions.citext else null end,
    case when p_contact_method = 'phone' then nullif(trim(p_phone), '') else null end,
    p_party_size, p_children_attending, 'plan_visit', nullif(trim(p_practical_note), ''),
    nullif(trim(p_practical_note), ''), true, left(coalesce(p_source_path, '/plan-a-visit'), 500),
    nullif(left(coalesce(p_source_campaign, ''), 200), ''), p_ip_hash
  ) returning id into request_id;

  insert into public.conversion_events(event_name, visit_request_id, source_path, properties)
  values (
    'plan_visit_submitted', request_id, left(coalesce(p_source_path, '/plan-a-visit'), 500),
    jsonb_build_object('party_size', p_party_size, 'children_attending', p_children_attending)
  );
  insert into public.ministry_journey_events(stage, visit_request_id, source_path, pathway)
  values ('follow_up_requested', request_id, left(coalesce(p_source_path, '/plan-a-visit'), 500), 'visit');
  return request_id;
end;
$$;

create or replace function public.submit_public_question(
  p_first_name text,
  p_contact_method text,
  p_email text,
  p_phone text,
  p_topic text,
  p_message text,
  p_consent_to_contact boolean,
  p_source_path text,
  p_ip_hash text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare question_id uuid;
declare conversion_name text;
begin
  if not p_consent_to_contact then raise exception 'Consent to contact is required'; end if;
  if char_length(trim(p_first_name)) not between 1 and 80
    or p_contact_method not in ('email','phone')
    or p_topic not in ('first_visit','beliefs','bible_study','kids_teens','accessibility','online','other')
    or char_length(trim(p_message)) not between 10 and 2000 then
    raise exception 'Invalid public question';
  end if;
  if p_contact_method = 'email' and (p_email is null or position('@' in p_email) < 2) then
    raise exception 'Valid email is required';
  end if;
  if p_contact_method = 'phone' and nullif(trim(p_phone), '') is null then
    raise exception 'Phone is required';
  end if;

  insert into public.public_questions(
    first_name, contact_method, email, phone, topic, message,
    consent_to_contact, source_path, source_ip_hash
  ) values (
    trim(p_first_name), p_contact_method,
    case when p_contact_method = 'email' then lower(trim(p_email))::extensions.citext else null end,
    case when p_contact_method = 'phone' then nullif(trim(p_phone), '') else null end,
    p_topic, trim(p_message), true, left(coalesce(p_source_path, '/ask-a-question'), 500), p_ip_hash
  ) returning id into question_id;

  conversion_name := case
    when p_topic = 'online' then 'online_conversation_requested'
    when p_topic = 'bible_study' then 'bible_study_requested'
    else 'question_submitted'
  end;
  insert into public.conversion_events(event_name, source_path, properties)
  values (conversion_name, left(coalesce(p_source_path, '/ask-a-question'), 500), jsonb_build_object('topic', p_topic));
  insert into public.ministry_journey_events(stage, public_question_id, source_path, pathway)
  values (
    'follow_up_requested', question_id, left(coalesce(p_source_path, '/ask-a-question'), 500),
    case when p_topic = 'online' then 'online' when p_topic = 'bible_study' then 'bible_study' else 'question' end
  );
  return question_id;
end;
$$;

create or replace function public.submit_prayer_request(
  p_first_name text,
  p_prayer_text text,
  p_response_requested boolean,
  p_contact_method text,
  p_email text,
  p_phone text,
  p_consent_to_contact boolean,
  p_source_path text,
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
  if char_length(trim(p_prayer_text)) not between 3 and 2500 then
    raise exception 'Invalid prayer request';
  end if;
  if p_response_requested and not p_consent_to_contact then
    raise exception 'Consent is required when requesting a response';
  end if;
  if p_response_requested and p_contact_method = 'email'
    and (p_email is null or position('@' in p_email) < 2) then
    raise exception 'Valid email is required';
  end if;
  if p_response_requested and p_contact_method = 'phone'
    and nullif(trim(p_phone), '') is null then
    raise exception 'Phone is required';
  end if;

  insert into public.prayer_requests(
    first_name, prayer_text, response_requested, contact_method, email, phone,
    consent_to_contact, source_path, source_ip_hash
  ) values (
    nullif(trim(p_first_name), ''), trim(p_prayer_text), p_response_requested,
    case when p_response_requested then p_contact_method else null end,
    case when p_response_requested and p_contact_method = 'email' then lower(trim(p_email))::extensions.citext else null end,
    case when p_response_requested and p_contact_method = 'phone' then nullif(trim(p_phone), '') else null end,
    p_response_requested and p_consent_to_contact,
    left(coalesce(p_source_path, '/request-prayer'), 500), p_ip_hash
  ) returning id into request_id;

  insert into public.audit_events(actor_type, action, resource_type, resource_id, metadata)
  values (
    'anonymous', 'prayer_request.received', 'prayer_request', request_id,
    jsonb_build_object('response_requested', p_response_requested)
  );
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
  if p_event_name <> all(array[
    'sunday_details_viewed','directions_clicked','calendar_added','visitor_pathway_selected',
    'plan_visit_started','question_submitted','online_conversation_requested','event_viewed',
    'event_registered','bible_study_requested','member_access_requested'
  ]) then
    raise exception 'Unsupported conversion event';
  end if;
  cleaned := coalesce(p_properties, '{}'::jsonb)
    - 'email' - 'phone' - 'name' - 'first_name' - 'last_name' - 'prayer' - 'prayer_text'
    - 'message' - 'child_id' - 'profile_id' - 'household_id' - 'religious_belief'
    - 'spiritual_vulnerability';
  if pg_column_size(cleaned) > 4096 then raise exception 'Properties too large'; end if;
  insert into public.conversion_events(event_name, anonymous_session_id, source_path, properties)
  values (p_event_name, left(p_anonymous_session_id, 128), left(coalesce(p_source_path, '/'), 500), cleaned)
  returning id into event_id;
  return event_id;
end;
$$;

alter table public.public_questions enable row level security;
alter table public.prayer_requests enable row level security;
alter table public.ministry_journey_events enable row level security;

create policy public_questions_minister_read
  on public.public_questions for select to authenticated
  using (public.is_privileged_actor(array['minister','super_admin']));
create policy public_questions_minister_update
  on public.public_questions for update to authenticated
  using (public.is_privileged_actor(array['minister','super_admin']))
  with check (public.is_privileged_actor(array['minister','super_admin']));

create policy prayer_requests_restricted_read
  on public.prayer_requests for select to authenticated
  using (public.is_privileged_actor(array['minister','safety_admin','super_admin']));
create policy prayer_requests_restricted_update
  on public.prayer_requests for update to authenticated
  using (public.is_privileged_actor(array['minister','safety_admin','super_admin']))
  with check (public.is_privileged_actor(array['minister','safety_admin','super_admin']));

create policy ministry_journey_events_outreach_read
  on public.ministry_journey_events for select to authenticated
  using (public.is_privileged_actor(array['minister','super_admin']));

revoke all on table public.public_questions from anon;
revoke all on table public.prayer_requests from anon;
revoke all on table public.ministry_journey_events from anon;
grant select, update on table public.public_questions to authenticated;
grant select, update on table public.prayer_requests to authenticated;
grant select on table public.ministry_journey_events to authenticated;
grant all on table public.public_questions to service_role;
grant all on table public.prayer_requests to service_role;
grant all on table public.ministry_journey_events to service_role;

grant execute on function public.submit_plan_visit_request(text,text,text,text,text,integer,boolean,text,boolean,text,text,text) to anon, authenticated;
grant execute on function public.submit_public_question(text,text,text,text,text,text,boolean,text,text) to anon, authenticated;
grant execute on function public.submit_prayer_request(text,text,boolean,text,text,text,boolean,text,text) to anon, authenticated;

comment on table public.public_questions is
  'Consented public questions. General questions remain separate from prayer and private pastoral workflows.';
comment on table public.prayer_requests is
  'Restricted prayer workflow. Prayer text is excluded from public analytics, advertising, and general Outreach CRM records.';
comment on table public.ministry_journey_events is
  'Privacy-minimized journey stages connecting public discovery to voluntary follow-up, Hub activation, fellowship, and service.';

commit;
