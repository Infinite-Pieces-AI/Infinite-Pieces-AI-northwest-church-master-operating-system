begin;

-- Outreach policies use a dedicated SECURITY DEFINER helper so role evaluation is
-- deterministic inside RLS while preserving the same two requirements:
--   1. the caller owns the JWT subject being checked;
--   2. the JWT is AAL2 and the subject has one of the allowed active roles.
create or replace function public.has_outreach_mfa_role(
  allowed_role_keys text[],
  target_user uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public, auth
set row_security = off
as $$
  select case
    when auth.role() = 'service_role' then true
    when target_user is null or target_user <> auth.uid() then false
    when coalesce(auth.jwt() ->> 'aal', 'aal1') <> 'aal2' then false
    else exists (
      select 1
      from public.role_assignments ra
      join public.roles r on r.id = ra.role_id
      join public.profiles p on p.id = ra.user_id
      where ra.user_id = target_user
        and r.key = any(allowed_role_keys)
        and r.privileged
        and p.membership_status = 'active'
        and ra.revoked_at is null
        and (ra.expires_at is null or ra.expires_at > timezone('utc', now()))
    )
  end;
$$;

revoke all on function public.has_outreach_mfa_role(text[], uuid) from public;
grant execute on function public.has_outreach_mfa_role(text[], uuid) to authenticated, service_role;

-- Connector configuration can be inspected and managed by MFA-verified ministers,
-- technical administrators, and super administrators.
drop policy if exists outreach_connectors_privileged_read on public.outreach_source_connectors;
drop policy if exists outreach_connectors_privileged_manage on public.outreach_source_connectors;
create policy outreach_connectors_privileged_read
  on public.outreach_source_connectors for select to authenticated
  using (public.has_outreach_mfa_role(array['minister','technical_admin','super_admin']));
create policy outreach_connectors_privileged_manage
  on public.outreach_source_connectors for all to authenticated
  using (public.has_outreach_mfa_role(array['minister','technical_admin','super_admin']))
  with check (public.has_outreach_mfa_role(array['minister','technical_admin','super_admin']));

-- Public-conversation intelligence and its action queue are limited to the
-- outreach-authorized ministerial boundary.
drop policy if exists public_conversation_signals_outreach_read on public.public_conversation_signals;
drop policy if exists public_conversation_signals_outreach_update on public.public_conversation_signals;
create policy public_conversation_signals_outreach_read
  on public.public_conversation_signals for select to authenticated
  using (public.has_outreach_mfa_role(array['minister','super_admin']));
create policy public_conversation_signals_outreach_update
  on public.public_conversation_signals for update to authenticated
  using (public.has_outreach_mfa_role(array['minister','super_admin']))
  with check (public.has_outreach_mfa_role(array['minister','super_admin']));

drop policy if exists public_conversation_actions_outreach_manage on public.public_conversation_actions;
create policy public_conversation_actions_outreach_manage
  on public.public_conversation_actions for all to authenticated
  using (public.has_outreach_mfa_role(array['minister','super_admin']))
  with check (public.has_outreach_mfa_role(array['minister','super_admin']));

-- Content editors may read completed public visibility evidence, while only
-- ministers and super administrators may create or modify monitoring runs.
drop policy if exists ai_visibility_runs_outreach_read on public.ai_visibility_runs;
drop policy if exists ai_visibility_runs_outreach_manage on public.ai_visibility_runs;
create policy ai_visibility_runs_outreach_read
  on public.ai_visibility_runs for select to authenticated
  using (public.has_outreach_mfa_role(array['content_editor','minister','super_admin']));
create policy ai_visibility_runs_outreach_manage
  on public.ai_visibility_runs for all to authenticated
  using (public.has_outreach_mfa_role(array['minister','super_admin']))
  with check (public.has_outreach_mfa_role(array['minister','super_admin']));

drop policy if exists ai_visibility_checks_outreach_read on public.ai_visibility_checks;
drop policy if exists ai_visibility_checks_outreach_manage on public.ai_visibility_checks;
create policy ai_visibility_checks_outreach_read
  on public.ai_visibility_checks for select to authenticated
  using (
    public.has_outreach_mfa_role(array['content_editor','minister','super_admin'])
    and exists (select 1 from public.ai_visibility_runs avr where avr.id = run_id)
  );
create policy ai_visibility_checks_outreach_manage
  on public.ai_visibility_checks for all to authenticated
  using (public.has_outreach_mfa_role(array['minister','super_admin']))
  with check (public.has_outreach_mfa_role(array['minister','super_admin']));

-- Aggregate funnels and channel attribution remain outreach-operator data rather
-- than general member analytics.
drop policy if exists outreach_funnel_snapshots_outreach_read on public.outreach_funnel_snapshots;
drop policy if exists outreach_channel_attribution_outreach_read on public.outreach_channel_attribution;
create policy outreach_funnel_snapshots_outreach_read
  on public.outreach_funnel_snapshots for select to authenticated
  using (public.has_outreach_mfa_role(array['minister','super_admin']));
create policy outreach_channel_attribution_outreach_read
  on public.outreach_channel_attribution for select to authenticated
  using (public.has_outreach_mfa_role(array['minister','super_admin']));

comment on function public.has_outreach_mfa_role(text[], uuid) is
  'Checks an MFA-verified active privileged role for Outreach Intelligence RLS without allowing authenticated users to probe another subject.';

commit;
