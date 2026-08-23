begin;

create or replace function public.enforce_gift_post_moderation()
returns trigger
language plpgsql
security definer
set search_path = public, auth
set row_security = off
as $$
declare
  is_reviewer boolean;
  sensitive_text text;
begin
  is_reviewer := auth.role() = 'service_role'
    or public.is_privileged_actor(array['moderator','minister','super_admin']);
  sensitive_text := lower(concat_ws(' ', new.title, new.description, new.price_note, array_to_string(new.skill_tags, ' ')));

  if sensitive_text ~ '(child ?care|babysit|transport|ride|home access|medical|therapy|counsel|electric|plumb|roof|legal|financial|cash|venmo|cashapp|paypal)' then
    if new.risk_level = 'standard' then new.risk_level := 'review'; end if;
  end if;
  if new.exchange_type = 'paid' or new.post_type = 'item_share' then
    if new.risk_level = 'standard' then new.risk_level := 'review'; end if;
  end if;

  if not is_reviewer then
    if tg_op = 'INSERT' then
      new.moderation_status := 'pending';
      new.reviewed_by := null;
      new.reviewed_at := null;
    elsif new.moderation_status is distinct from old.moderation_status
       or new.reviewed_by is distinct from old.reviewed_by
       or new.reviewed_at is distinct from old.reviewed_at then
      new.moderation_status := old.moderation_status;
      new.reviewed_by := old.reviewed_by;
      new.reviewed_at := old.reviewed_at;
    end if;
  elsif new.moderation_status in ('approved','rejected','removed')
    and (tg_op = 'INSERT' or new.moderation_status is distinct from old.moderation_status) then
    new.reviewed_by := auth.uid();
    new.reviewed_at := timezone('utc', now());
  end if;
  return new;
end;
$$;

comment on function public.enforce_gift_post_moderation() is
  'Forces ordinary member posts into moderation and raises the risk classification for paid, item-sharing, home-access, transportation, childcare, professional, and payment-related language.';

commit;
