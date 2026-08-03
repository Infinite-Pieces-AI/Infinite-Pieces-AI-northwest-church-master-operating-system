begin;

create table public.kids_kiosk_devices (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null,
  provider text not null check (provider in ('planning_center', 'existing_chms', 'manual_fallback')),
  location_id uuid references public.locations(id) on delete set null,
  device_key_hash text not null unique,
  status text not null default 'pending' check (status in ('pending', 'approved', 'suspended', 'retired')),
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  last_seen_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (status <> 'approved' or (approved_by is not null and approved_at is not null))
);

create table public.kids_checkin_credentials (
  id uuid primary key default extensions.gen_random_uuid(),
  service_session_id uuid not null references public.service_sessions(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  token_hash text not null unique,
  key_id text not null,
  expires_at timestamptz not null,
  issued_by uuid references public.profiles(id) on delete set null,
  consumed_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  check (expires_at > created_at)
);
create index kids_checkin_credentials_active_idx
  on public.kids_checkin_credentials(service_session_id, household_id, expires_at)
  where consumed_at is null and revoked_at is null;

create table public.label_print_jobs (
  id uuid primary key default extensions.gen_random_uuid(),
  service_session_id uuid not null references public.service_sessions(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  kiosk_device_id uuid references public.kids_kiosk_devices(id) on delete set null,
  printer_adapter text not null,
  payload jsonb not null,
  payload_sha256 text not null,
  status text not null default 'queued' check (status in ('queued', 'printing', 'printed', 'failed', 'cancelled')),
  attempts integer not null default 0 check (attempts >= 0),
  printed_at timestamptz,
  last_error text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index label_print_jobs_claim_idx on public.label_print_jobs(status, created_at) where status = 'queued';

create table public.kids_release_verifications (
  id uuid primary key default extensions.gen_random_uuid(),
  service_session_id uuid not null references public.service_sessions(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  provider text not null check (provider in ('planning_center', 'existing_chms', 'manual_fallback')),
  verification_method text not null check (verification_method in ('provider_security_code', 'provider_qr', 'approved_manual_fallback')),
  provider_reference text,
  verified_by uuid not null references public.profiles(id) on delete restrict,
  result text not null check (result in ('matched', 'rejected', 'escalated')),
  occurred_at timestamptz not null default timezone('utc', now()),
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);
create index kids_release_verifications_child_idx on public.kids_release_verifications(child_id, occurred_at desc);

create trigger kids_kiosk_devices_set_updated_at before update on public.kids_kiosk_devices for each row execute function public.set_updated_at();
create trigger label_print_jobs_set_updated_at before update on public.label_print_jobs for each row execute function public.set_updated_at();

alter table public.kids_kiosk_devices enable row level security;
alter table public.kids_checkin_credentials enable row level security;
alter table public.label_print_jobs enable row level security;
alter table public.kids_release_verifications enable row level security;

create policy kids_kiosk_devices_restricted
on public.kids_kiosk_devices for all to authenticated
using (public.is_privileged_actor(array['safety_admin','technical_admin','super_admin']))
with check (public.is_privileged_actor(array['safety_admin','technical_admin','super_admin']) and public.is_aal2());

create policy kids_checkin_credentials_safety_only
on public.kids_checkin_credentials for select to authenticated
using (public.is_privileged_actor(array['safety_admin','super_admin']));

-- Printer payloads may contain minimum operational care indicators and are
-- restricted to MFA-gated safety/technical operators. Kiosks and printer
-- bridges use service-role workers rather than broad volunteer table access.
create policy label_print_jobs_operator_read
on public.label_print_jobs for select to authenticated
using (public.is_privileged_actor(array['safety_admin','technical_admin','super_admin']));

create policy kids_release_verifications_safety_read
on public.kids_release_verifications for select to authenticated
using (public.is_privileged_actor(array['safety_admin','super_admin']));

-- Guardians receive a redacted release-history projection. Internal notes,
-- provider references, and verifier identity are never returned here.
create or replace function public.get_my_child_release_history(
  requested_child_id uuid,
  requested_limit integer default 25
)
returns table (
  id uuid,
  service_session_id uuid,
  provider text,
  verification_method text,
  result text,
  occurred_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
set row_security = off
as $$
begin
  if requested_limit < 1 or requested_limit > 100 then
    raise exception 'requested_limit must be between 1 and 100';
  end if;
  if not (
    public.is_guardian_of_child(requested_child_id)
    or public.is_privileged_actor(array['safety_admin','super_admin'])
  ) then
    raise exception 'Guardian or safety access required';
  end if;

  return query
  select krv.id, krv.service_session_id, krv.provider, krv.verification_method, krv.result, krv.occurred_at
  from public.kids_release_verifications krv
  where krv.child_id = requested_child_id
  order by krv.occurred_at desc
  limit requested_limit;
end;
$$;

revoke all on function public.get_my_child_release_history(uuid, integer) from public;
grant execute on function public.get_my_child_release_history(uuid, integer) to authenticated;

revoke all on public.kids_kiosk_devices, public.kids_checkin_credentials, public.label_print_jobs, public.kids_release_verifications from anon;
grant select, insert, update, delete on public.kids_kiosk_devices to authenticated;
grant select on public.kids_checkin_credentials, public.label_print_jobs, public.kids_release_verifications to authenticated;

commit;
