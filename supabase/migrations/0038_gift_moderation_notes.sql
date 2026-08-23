begin;

alter table public.gift_posts
  add column moderation_note text
    check (moderation_note is null or char_length(moderation_note) <= 2000);

comment on column public.gift_posts.moderation_note is
  'Restricted moderator rationale. It is not displayed in the ordinary member gift board.';

commit;
