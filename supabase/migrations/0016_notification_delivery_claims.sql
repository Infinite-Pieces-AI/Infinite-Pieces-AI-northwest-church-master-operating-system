begin;

create or replace function public.claim_notification_jobs(
  requested_channel public.notification_channel,
  requested_limit integer,
  worker_id text
)
returns table (
  id uuid,
  profile_id uuid,
  template_key text,
  payload jsonb,
  attempts integer
)
language plpgsql
security definer
set search_path = public, auth, extensions
set row_security = off
as $$
begin
  if requested_limit < 1 or requested_limit > 100 then
    raise exception 'requested_limit must be between 1 and 100';
  end if;
  if char_length(worker_id) < 1 or char_length(worker_id) > 200 then
    raise exception 'worker_id is required';
  end if;

  return query
  with candidates as (
    select nj.id
    from public.notification_jobs nj
    where nj.channel = requested_channel
      and nj.status = 'pending'
      and nj.scheduled_for <= timezone('utc', now())
      and nj.attempts < 8
    order by nj.scheduled_for, nj.created_at
    for update skip locked
    limit requested_limit
  ), claimed as (
    update public.notification_jobs nj
    set status = 'processing',
        attempts = nj.attempts + 1,
        locked_at = timezone('utc', now()),
        locked_by = worker_id,
        updated_at = timezone('utc', now())
    from candidates c
    where nj.id = c.id
    returning nj.id, nj.profile_id, nj.template_key, nj.payload, nj.attempts
  )
  select claimed.id, claimed.profile_id, claimed.template_key, claimed.payload, claimed.attempts
  from claimed;
end;
$$;

create or replace function public.complete_notification_job(
  requested_id uuid,
  provider_name text,
  provider_message_id text default null
)
returns void
language plpgsql
security definer
set search_path = public, auth, extensions
set row_security = off
as $$
begin
  update public.notification_jobs
  set status = 'sent',
      sent_at = timezone('utc', now()),
      locked_at = null,
      locked_by = null,
      last_error = null,
      updated_at = timezone('utc', now())
  where id = requested_id and status = 'processing';

  if not found then
    raise exception 'Notification job is not currently claimed';
  end if;

  insert into public.delivery_receipts(notification_job_id, provider, provider_message_id, status, occurred_at)
  values (requested_id, provider_name, provider_message_id, 'accepted', timezone('utc', now()));
end;
$$;

create or replace function public.fail_notification_job(
  requested_id uuid,
  failure_message text,
  permanent_failure boolean default false
)
returns void
language plpgsql
security definer
set search_path = public, auth, extensions
set row_security = off
as $$
begin
  update public.notification_jobs
  set status = case
        when permanent_failure or attempts >= 8 then 'failed'::public.job_status
        else 'pending'::public.job_status
      end,
      scheduled_for = case
        when permanent_failure or attempts >= 8 then scheduled_for
        else timezone('utc', now()) + make_interval(mins => least(60, greatest(1, attempts * attempts)))
      end,
      locked_at = null,
      locked_by = null,
      last_error = left(coalesce(failure_message, 'Unknown notification failure'), 2000),
      updated_at = timezone('utc', now())
  where id = requested_id and status = 'processing';

  if not found then
    raise exception 'Notification job is not currently claimed';
  end if;
end;
$$;

revoke all on function public.claim_notification_jobs(public.notification_channel, integer, text) from public;
revoke all on function public.complete_notification_job(uuid, text, text) from public;
revoke all on function public.fail_notification_job(uuid, text, boolean) from public;
grant execute on function public.claim_notification_jobs(public.notification_channel, integer, text) to service_role;
grant execute on function public.complete_notification_job(uuid, text, text) to service_role;
grant execute on function public.fail_notification_job(uuid, text, boolean) to service_role;

commit;
