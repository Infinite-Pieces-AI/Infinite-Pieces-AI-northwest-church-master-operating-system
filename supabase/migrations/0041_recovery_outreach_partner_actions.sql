begin;

create table if not exists public.recovery_outreach_partner_actions (
  id uuid primary key default extensions.gen_random_uuid(),
  partner_id uuid not null references public.recovery_outreach_partners(id) on delete cascade,
  action_type text not null check (
    action_type in ('research_note','approve_contact','contact_attempt','conversation','partnership','decline','do_not_contact')
  ),
  note text check (note is null or char_length(note) <= 2000),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists recovery_outreach_partner_actions_partner_idx
  on public.recovery_outreach_partner_actions(partner_id, created_at desc);
alter table public.recovery_outreach_partner_actions enable row level security;
create policy recovery_outreach_partner_actions_manage
  on public.recovery_outreach_partner_actions for all to authenticated
  using (public.has_outreach_mfa_role(array['minister','super_admin']))
  with check (public.has_outreach_mfa_role(array['minister','super_admin']));
revoke all on table public.recovery_outreach_partner_actions from anon;
grant select, insert, update, delete on table public.recovery_outreach_partner_actions to authenticated;
grant all on table public.recovery_outreach_partner_actions to service_role;

create or replace function public.request_recovery_access(
  p_program_id uuid,
  p_message text default null
)
returns uuid
language sql
security definer
set search_path = public, auth
set row_security = off
as $$
  select public.request_recovery_membership(
    p_program_id,
    'participant',
    'first_name',
    p_message
  );
$$;

create or replace function public.review_recovery_access_request(
  p_request_id uuid,
  p_decision text,
  p_note text default null
)
returns void
language sql
security definer
set search_path = public, auth
set row_security = off
as $$
  select public.review_recovery_membership_request(
    p_request_id,
    p_decision,
    p_note
  );
$$;

create or replace function public.leave_recovery_program(p_program_id uuid)
returns void
language sql
security definer
set search_path = public, auth
set row_security = off
as $$
  update public.recovery_memberships
  set ended_at = timezone('utc', now()),
      updated_at = timezone('utc', now())
  where program_id = p_program_id
    and profile_id = auth.uid()
    and ended_at is null;
$$;

revoke all on function public.request_recovery_access(uuid,text) from public;
revoke all on function public.review_recovery_access_request(uuid,text,text) from public;
revoke all on function public.leave_recovery_program(uuid) from public;
grant execute on function public.request_recovery_access(uuid,text) to authenticated;
grant execute on function public.review_recovery_access_request(uuid,text,text) to authenticated;
grant execute on function public.leave_recovery_program(uuid) to authenticated;

comment on table public.recovery_outreach_partner_actions is
  'Human-approved relationship history for public recovery organizations. It never stores participant identity or inferred addiction status.';

commit;
