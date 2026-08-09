begin;

revoke all on function public.record_public_conversion_event(text,text,text,jsonb) from public;
grant execute on function public.record_public_conversion_event(text,text,text,jsonb) to anon, authenticated, service_role;

create table public.outreach_access_events (
  id uuid primary key default extensions.gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  environment text not null check (char_length(environment) between 2 and 80),
  aal text not null check (aal = 'aal2'),
  session_issued_at timestamptz not null,
  accessed_at timestamptz not null default timezone('utc', now())
);
create index outreach_access_events_profile_time_idx on public.outreach_access_events(profile_id, accessed_at desc);

create or replace function public.record_outreach_access(
  p_environment text,
  p_session_issued_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
set row_security = off
as $$
declare access_id uuid;
begin
  if auth.uid() is null or coalesce(auth.jwt() ->> 'aal', 'aal1') <> 'aal2' then
    raise exception 'AAL2 authentication is required';
  end if;
  if not public.has_outreach_mfa_role(array['minister','technical_admin','super_admin']) then
    raise exception 'Outreach role is required';
  end if;
  if p_session_issued_at < timezone('utc', now()) - interval '24 hours'
    or p_session_issued_at > timezone('utc', now()) + interval '5 minutes' then
    raise exception 'Session issue time is outside the accepted audit range';
  end if;
  insert into public.outreach_access_events(profile_id, environment, aal, session_issued_at)
  values (auth.uid(), left(trim(p_environment), 80), 'aal2', p_session_issued_at)
  returning id into access_id;
  return access_id;
end;
$$;

alter table public.outreach_access_events enable row level security;
create policy outreach_access_events_mfa_read
  on public.outreach_access_events for select to authenticated
  using (public.has_outreach_mfa_role(array['minister','technical_admin','super_admin']));

revoke all on table public.outreach_access_events from anon;
grant select on table public.outreach_access_events to authenticated;
grant all on table public.outreach_access_events to service_role;
revoke all on function public.record_outreach_access(text,timestamptz) from public;
grant execute on function public.record_outreach_access(text,timestamptz) to authenticated, service_role;

comment on table public.outreach_access_events is
  'AAL2 access audit for the private Outreach Intelligence OS. It contains no public-search subject or religious-profile information.';

commit;
