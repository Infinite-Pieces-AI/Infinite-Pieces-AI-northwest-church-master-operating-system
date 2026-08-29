begin;

alter table public.recovery_programs
  add column if not exists accepting_access_requests boolean not null default true;

create or replace function public.list_recovery_access_options()
returns table (
  program_id uuid,
  display_name text,
  public_summary text,
  meeting_day text,
  program_type text,
  official_program_confirmation boolean,
  accepting_access_requests boolean,
  current_request_status text,
  is_current_member boolean
)
language sql
stable
security definer
set search_path = public, auth
set row_security = off
as $$
  select
    rp.id,
    rp.display_name,
    rp.public_summary,
    rp.meeting_day,
    rp.program_type,
    rp.official_program_confirmation,
    rp.accepting_access_requests,
    latest_request.status,
    exists (
      select 1
      from public.recovery_memberships rm
      where rm.program_id = rp.id
        and rm.profile_id = auth.uid()
        and rm.ended_at is null
    )
  from public.recovery_programs rp
  left join lateral (
    select rmr.status
    from public.recovery_membership_requests rmr
    where rmr.program_id = rp.id
      and rmr.profile_id = auth.uid()
    order by rmr.created_at desc
    limit 1
  ) latest_request on true
  where public.is_active_member(auth.uid())
    and rp.status = 'active'
    and (
      rp.accepting_access_requests
      or latest_request.status is not null
      or exists (
        select 1
        from public.recovery_memberships rm
        where rm.program_id = rp.id
          and rm.profile_id = auth.uid()
          and rm.ended_at is null
      )
    )
  order by rp.display_name;
$$;

revoke all on function public.list_recovery_access_options() from public;
grant execute on function public.list_recovery_access_options() to authenticated;

comment on function public.list_recovery_access_options() is
  'Returns only the minimal public program description and the caller own request/membership state. It never exposes rosters, exact locations, posts, progress, or attendance.';

commit;
