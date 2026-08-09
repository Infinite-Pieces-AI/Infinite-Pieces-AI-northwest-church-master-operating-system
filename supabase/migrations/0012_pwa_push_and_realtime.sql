begin;

create table public.push_subscriptions (
  id uuid primary key default extensions.gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null check (endpoint ~ '^https://'),
  endpoint_hash text not null,
  p256dh_key text not null,
  auth_key text not null,
  expiration_time timestamptz,
  device_label text,
  permission_status text not null default 'granted' check (permission_status in ('granted', 'denied', 'prompt', 'revoked')),
  failure_count integer not null default 0 check (failure_count >= 0),
  last_success_at timestamptz,
  last_failure_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(profile_id, endpoint_hash)
);
create index push_subscriptions_active_profile_idx
  on public.push_subscriptions(profile_id)
  where revoked_at is null and permission_status = 'granted';

create trigger push_subscriptions_set_updated_at
before update on public.push_subscriptions
for each row execute function public.set_updated_at();

alter table public.push_subscriptions enable row level security;

create policy push_subscriptions_read_own
on public.push_subscriptions for select to authenticated
using (profile_id = auth.uid());

create policy push_subscriptions_insert_own
on public.push_subscriptions for insert to authenticated
with check (profile_id = auth.uid() and permission_status in ('granted', 'prompt'));

create policy push_subscriptions_update_own
on public.push_subscriptions for update to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

create policy push_subscriptions_delete_own
on public.push_subscriptions for delete to authenticated
using (profile_id = auth.uid());

create or replace function public.can_access_realtime_topic(
  requested_topic text,
  target_user uuid default auth.uid()
)
returns boolean
language plpgsql
stable
security definer
set search_path = public, auth, extensions
as $$
declare
  topic_scope text;
  topic_identifier text;
  topic_uuid uuid;
begin
  if target_user is null or requested_topic is null then
    return false;
  end if;
  if not public.may_check_target_user(target_user) then
    return false;
  end if;

  topic_scope := split_part(requested_topic, ':', 1);
  topic_identifier := split_part(requested_topic, ':', 2);

  if topic_scope = 'announcement' and topic_identifier = 'church' then
    return public.is_active_member(target_user);
  end if;

  if topic_identifier !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    return false;
  end if;
  topic_uuid := topic_identifier::uuid;

  if topic_scope = 'channel' then
    return public.is_channel_member(topic_uuid, target_user);
  elsif topic_scope = 'group' then
    return public.is_group_member(topic_uuid, target_user);
  elsif topic_scope = 'kids-class' then
    return public.is_assigned_kids_volunteer(topic_uuid, timezone('utc', now()), target_user)
      or exists (
        select 1
        from public.class_links cl
        join public.guardian_links gl on gl.child_id = cl.child_id
        where cl.kids_class_id = topic_uuid
          and gl.guardian_profile_id = target_user
          and gl.starts_at <= timezone('utc', now())
          and (gl.ends_at is null or gl.ends_at > timezone('utc', now()))
          and cl.starts_on <= current_date
          and (cl.ends_on is null or cl.ends_on >= current_date)
      );
  end if;

  return false;
end;
$$;

revoke all on function public.can_access_realtime_topic(text, uuid) from public;
grant execute on function public.can_access_realtime_topic(text, uuid) to authenticated, service_role;

-- Supabase Realtime uses policies on realtime.messages for private broadcast
-- and presence authorization. Managed Supabase owns this table, while some local
-- bootstrap environments expose it without granting the migration role ownership.
-- In that expected case, defer the managed-table policy installation rather than
-- failing the application's own schema migration.
do $$
begin
  if to_regclass('realtime.messages') is not null
    and to_regprocedure('realtime.topic()') is not null then
    begin
      execute 'alter table realtime.messages enable row level security';
      execute 'drop policy if exists church_realtime_receive on realtime.messages';
      execute 'drop policy if exists church_realtime_send on realtime.messages';
      execute 'create policy church_realtime_receive on realtime.messages for select to authenticated using (public.can_access_realtime_topic(realtime.topic()))';
      execute 'create policy church_realtime_send on realtime.messages for insert to authenticated with check (public.can_access_realtime_topic(realtime.topic()))';
    exception
      when insufficient_privilege or undefined_table or undefined_function then
        raise notice 'Skipping managed Realtime policy bootstrap: %', sqlerrm;
    end;
  end if;
end $$;

revoke all on public.push_subscriptions from anon;
grant select, insert, update, delete on public.push_subscriptions to authenticated;

commit;
