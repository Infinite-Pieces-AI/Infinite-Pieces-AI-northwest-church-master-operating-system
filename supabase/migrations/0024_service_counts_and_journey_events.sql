begin;

create or replace function public.service_shift_signup_count(requested_shift_id uuid)
returns integer
language plpgsql
stable
security definer
set search_path = public
set row_security = off
as $$
declare result_count integer;
begin
  if not public.is_active_member() then raise exception 'Active membership is required'; end if;
  if not exists (
    select 1 from public.service_shifts ss
    join public.service_opportunities so on so.id = ss.opportunity_id
    where ss.id = requested_shift_id and so.publication_status = 'published'
  ) then raise exception 'Service shift is not visible'; end if;
  select coalesce(sum(party_size),0)::integer into result_count from public.service_shift_signups where shift_id = requested_shift_id and status in ('going','attended');
  return result_count;
end;
$$;
revoke all on function public.service_shift_signup_count(uuid) from public;
grant execute on function public.service_shift_signup_count(uuid) to authenticated, service_role;

create or replace function public.on_fellowship_response_journey_event()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if new.status in ('going','host') and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    insert into public.ministry_journey_events(stage, profile_id, pathway, properties)
    values ('fellowship_joined', new.profile_id, 'fellowship', jsonb_build_object('meetup_id', new.meetup_id));
  end if;
  return new;
end;
$$;
drop trigger if exists fellowship_response_journey_event on public.fellowship_meetup_members;
create trigger fellowship_response_journey_event after insert or update on public.fellowship_meetup_members for each row execute function public.on_fellowship_response_journey_event();

create or replace function public.on_service_signup_journey_event()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if new.status = 'going' and (tg_op = 'INSERT' or old.status is distinct from 'going') then
    insert into public.ministry_journey_events(stage, profile_id, pathway, properties)
    values ('service_joined', new.profile_id, 'service', jsonb_build_object('shift_id', new.shift_id));
  end if;
  return new;
end;
$$;
drop trigger if exists service_signup_journey_event on public.service_shift_signups;
create trigger service_signup_journey_event after insert or update on public.service_shift_signups for each row execute function public.on_service_signup_journey_event();

comment on function public.service_shift_signup_count(uuid) is 'Returns an aggregate service shift count without exposing the participant roster.';

commit;
