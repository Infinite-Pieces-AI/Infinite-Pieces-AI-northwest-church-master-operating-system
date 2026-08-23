begin;

alter table public.prayer_requests
  add column if not exists leader_workflow_status text not null default 'unassigned'
    check (leader_workflow_status in ('unassigned','assigned','pastoral_followup','safeguarding_followup','closed')),
  add column if not exists assigned_to uuid references public.profiles(id) on delete set null,
  add column if not exists leader_note text
    check (leader_note is null or char_length(leader_note) <= 3000),
  add column if not exists leader_reviewed_at timestamptz;

alter table public.recovery_programs
  add column if not exists accepting_access_requests boolean not null default true,
  add column if not exists public_interest_enabled boolean not null default false;

create index if not exists gift_posts_member_board_idx
  on public.gift_posts(moderation_status, status, created_at desc);
create index if not exists gift_posts_creator_idx
  on public.gift_posts(created_by, created_at desc);
create index if not exists prayer_requests_feed_idx
  on public.prayer_requests(visibility, sensitivity, status, created_at desc);
create index if not exists prayer_requests_leader_queue_idx
  on public.prayer_requests(sensitivity, leader_workflow_status, created_at desc)
  where sensitivity <> 'normal' or visibility = 'leaders_only';
create index if not exists recovery_access_requests_queue_idx
  on public.recovery_access_requests(program_id, status, created_at desc);
create index if not exists public_recovery_inquiries_queue_idx
  on public.public_recovery_inquiries(status, created_at desc);
create index if not exists recovery_public_topics_queue_idx
  on public.recovery_public_topics(status, opportunity_score desc, created_at desc);
create index if not exists recovery_partners_pipeline_idx
  on public.recovery_outreach_partners(partnership_status, locality, updated_at desc);

create or replace function public.request_recovery_access(
  p_program_id uuid,
  p_message text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
set row_security = off
as $$
declare
  request_id uuid;
begin
  if not public.is_active_member(auth.uid()) then
    raise exception 'Active church membership is required';
  end if;
  if not exists (
    select 1 from public.recovery_programs rp
    where rp.id = p_program_id
      and rp.status = 'active'
      and rp.accepting_access_requests
  ) then
    raise exception 'Recovery program is not accepting access requests';
  end if;

  insert into public.recovery_access_requests (
    program_id, profile_id, request_message, privacy_agreement_accepted_at,
    status, reviewed_by, reviewed_at, decision_note
  ) values (
    p_program_id, auth.uid(), left(nullif(trim(p_message), ''), 1500),
    timezone('utc', now()), 'pending', null, null, null
  )
  on conflict (program_id, profile_id) do update set
    request_message = excluded.request_message,
    privacy_agreement_accepted_at = excluded.privacy_agreement_accepted_at,
    status = 'pending', reviewed_by = null, reviewed_at = null,
    decision_note = null, updated_at = timezone('utc', now())
  returning id into request_id;
  return request_id;
end;
$$;

comment on column public.prayer_requests.leader_note is
  'Restricted pastoral/safeguarding operational note. Never expose through the member Prayer Well or Outreach OS.';
comment on column public.recovery_programs.public_interest_enabled is
  'Leadership-controlled public inquiry flag. It does not make participant membership or private program data public.';

commit;
