begin;

-- Client-generated UUIDs make mobile/PWA retries safe without exposing sequential IDs.
alter table public.messages
  add column if not exists client_id uuid;

create unique index if not exists messages_author_client_id_unique
  on public.messages(author_id, client_id);

comment on column public.messages.client_id is
  'Optional client-generated UUID used to make message creation idempotent across retries.';

commit;
