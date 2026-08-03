begin;

select plan(12);

select has_table('public', 'profiles', 'Identity profile table exists');
select has_table('public', 'channels', 'Community channel table exists');
select has_table('public', 'children', 'Child records are isolated in a dedicated table');
select has_table('public', 'outbox_events', 'Durable outbox table exists');
select has_function('public', 'consume_invitation', array['text', 'boolean', 'boolean'], 'Single-use invitation consumption RPC exists');
select has_function('public', 'get_assigned_kids_roster', array['uuid', 'timestamp with time zone'], 'Time-limited Kids Kingdom roster projection exists');

select is(
  (
    select count(*)::integer
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and not c.relrowsecurity
  ),
  0,
  'Every public application table has Row Level Security enabled'
);

select is(
  (select public from storage.buckets where id = 'member-media'),
  false,
  'Member media bucket is private'
);

select is(
  (select public from storage.buckets where id = 'child-media'),
  false,
  'Child media bucket is private'
);

select is(
  (
    select count(*)::integer
    from information_schema.columns
    where table_schema = 'public'
      and table_name in ('public_service_schedule', 'public_events')
      and column_name in (
        'profile_id', 'member_id', 'household_id', 'child_id', 'author_id',
        'prayer_request_id', 'attendance_id', 'channel_id'
      )
  ),
  0,
  'Public projections expose no direct private-domain identifiers'
);

select is(
  (
    select count(*)::integer
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename = 'messages'
      and policyname = 'messages_member_read'
  ),
  1,
  'Messages require the channel-membership read policy'
);

select is(
  (
    select count(*)::integer
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename = 'children'
      and policyname = 'children_guardian_read'
  ),
  1,
  'Children require the guardian/safety read policy'
);

select * from finish();
rollback;
