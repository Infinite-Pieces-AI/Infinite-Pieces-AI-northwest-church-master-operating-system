begin;

-- -----------------------------------------------------------------------------
-- Durable events. Payloads intentionally omit exact locations, private messages,
-- personal notes, and child/household information.
-- -----------------------------------------------------------------------------

create or replace function public.on_fellowship_meetup_changed()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if tg_op = 'INSERT' and new.status = 'active' then
    perform public.enqueue_outbox_event(
      'fellowship_meetup',
      new.id,
      'fellowship_meetup.created',
      jsonb_build_object(
        'meetup_id', new.id,
        'visibility', new.visibility,
        'ministry_id', new.ministry_id,
        'group_id', new.group_id,
        'starts_at', new.starts_at,
        'category', new.category
      )
    );
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status
    and new.status in ('active','cancelled','completed','removed') then
    perform public.enqueue_outbox_event(
      'fellowship_meetup',
      new.id,
      'fellowship_meetup.status_changed',
      jsonb_build_object('meetup_id', new.id, 'status', new.status, 'starts_at', new.starts_at)
    );
  end if;
  return new;
end;
$$;

create trigger fellowship_meetup_changed_outbox
  after insert or update on public.fellowship_meetups
  for each row execute function public.on_fellowship_meetup_changed();

create or replace function public.on_fellowship_member_joined()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if new.status in ('interested','going','waitlisted')
    and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    perform public.enqueue_outbox_event(
      'fellowship_meetup',
      new.meetup_id,
      'fellowship_meetup.member_response',
      jsonb_build_object(
        'meetup_id', new.meetup_id,
        'profile_id', new.profile_id,
        'response', new.status,
        'party_size', new.party_size
      )
    );
  end if;
  return new;
end;
$$;

create trigger fellowship_member_joined_outbox
  after insert or update on public.fellowship_meetup_members
  for each row execute function public.on_fellowship_member_joined();

create or replace function public.on_bible_journey_week_published()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if new.publication_status = 'published'
    and (tg_op = 'INSERT' or old.publication_status is distinct from 'published') then
    perform public.enqueue_outbox_event(
      'bible_journey_week',
      new.id,
      'bible_journey_week.published',
      jsonb_build_object(
        'journey_id', new.journey_id,
        'week_id', new.id,
        'week_number', new.week_number,
        'weekly_lesson_id', new.weekly_lesson_id,
        'audience', 'all-members'
      )
    );
  end if;
  return new;
end;
$$;

create trigger bible_journey_week_published_outbox
  after insert or update on public.bible_journey_weeks
  for each row execute function public.on_bible_journey_week_published();

-- Explicit privileges: no anonymous access to member fellowship or formation data.
revoke all on table public.fellowship_meetups from anon;
revoke all on table public.fellowship_meetup_private_details from anon;
revoke all on table public.fellowship_meetup_members from anon;
revoke all on table public.fellowship_meetup_messages from anon;
revoke all on table public.fellowship_preferences from anon;
revoke all on table public.bible_journeys from anon;
revoke all on table public.bible_journey_weeks from anon;
revoke all on table public.bible_journey_progress from anon;

grant select, insert, update, delete on table public.fellowship_meetups to authenticated;
grant select, insert, update, delete on table public.fellowship_meetup_private_details to authenticated;
grant select, insert, update, delete on table public.fellowship_meetup_members to authenticated;
grant select, insert, update, delete on table public.fellowship_meetup_messages to authenticated;
grant select, insert, update, delete on table public.fellowship_preferences to authenticated;
grant select, insert, update, delete on table public.bible_journeys to authenticated;
grant select, insert, update, delete on table public.bible_journey_weeks to authenticated;
grant select, insert, update, delete on table public.bible_journey_progress to authenticated;

grant all on table public.fellowship_meetups to service_role;
grant all on table public.fellowship_meetup_private_details to service_role;
grant all on table public.fellowship_meetup_members to service_role;
grant all on table public.fellowship_meetup_messages to service_role;
grant all on table public.fellowship_preferences to service_role;
grant all on table public.bible_journeys to service_role;
grant all on table public.bible_journey_weeks to service_role;
grant all on table public.bible_journey_progress to service_role;

revoke all on function public.can_view_fellowship_meetup(uuid,uuid) from public;
revoke all on function public.is_fellowship_participant(uuid,uuid) from public;
revoke all on function public.can_access_fellowship_thread(uuid,uuid) from public;
revoke all on function public.fellowship_meetup_attendee_count(uuid) from public;
grant execute on function public.can_view_fellowship_meetup(uuid,uuid) to authenticated, service_role;
grant execute on function public.is_fellowship_participant(uuid,uuid) to authenticated, service_role;
grant execute on function public.can_access_fellowship_thread(uuid,uuid) to authenticated, service_role;
grant execute on function public.fellowship_meetup_attendee_count(uuid) to authenticated, service_role;

comment on table public.fellowship_meetups is
  'Member-created fellowship invitations. Discoverable fields contain only general public-place information inside the private member hub.';
comment on table public.fellowship_meetup_private_details is
  'Exact meeting instructions and virtual links, visible only after an authorized member joins or expresses interest.';
comment on table public.fellowship_preferences is
  'Explicit opt-in recommendation preferences. Never derived from prayer, child, counseling, safeguarding, or private-message content.';
comment on table public.bible_journey_weeks is
  'Leader-approved whole-Bible sequence. Stores references and formation material, not unlicensed Scripture text.';
comment on table public.bible_journey_progress is
  'Member-owned formation progress and notes; never used for advertising or spiritual-status scoring.';

commit;
