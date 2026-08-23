begin;

-- Safe request catalog: exposes only the public name/summary needed for an
-- authenticated adult member to request access. Meeting times, locations,
-- membership, posts, curriculum, and participant details remain private.
create or replace function public.list_requestable_recovery_programs()
returns table (
  id uuid,
  display_name text,
  public_summary text,
  program_type text,
  official_program_confirmation boolean
)
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select
    rp.id,
    rp.display_name,
    rp.public_summary,
    rp.program_type,
    rp.official_program_confirmation
  from public.recovery_programs rp
  where rp.status = 'active'
    and public.is_active_member(auth.uid())
  order by rp.display_name;
$$;

revoke all on function public.list_requestable_recovery_programs() from public;
grant execute on function public.list_requestable_recovery_programs() to authenticated;

comment on function public.list_requestable_recovery_programs() is
  'Returns only public recovery-ministry descriptions to active members so they may request leader-reviewed access. It never exposes meeting logistics or participant identities.';

commit;
