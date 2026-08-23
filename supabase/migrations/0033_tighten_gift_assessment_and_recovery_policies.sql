begin;

-- -----------------------------------------------------------------------------
-- Gift assessment results remain member controlled. Leaders may read only an
-- assessment explicitly shared with leaders, and may never modify the result.
-- -----------------------------------------------------------------------------
drop policy if exists gift_assessment_owner_all on public.gift_assessments;
drop policy if exists gift_strength_owner_all on public.gift_strengths;

create policy gift_assessment_owner_read
  on public.gift_assessments for select to authenticated
  using (
    profile_id = auth.uid()
    or (
      share_summary_with_leaders
      and public.is_privileged_actor(array['minister','super_admin'])
    )
  );
create policy gift_assessment_owner_insert
  on public.gift_assessments for insert to authenticated
  with check (profile_id = auth.uid() and public.is_active_member());
create policy gift_assessment_owner_update
  on public.gift_assessments for update to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());
create policy gift_assessment_owner_delete
  on public.gift_assessments for delete to authenticated
  using (profile_id = auth.uid());

create policy gift_strength_owner_read
  on public.gift_strengths for select to authenticated
  using (
    exists (
      select 1
      from public.gift_assessments ga
      where ga.id = assessment_id
        and (
          ga.profile_id = auth.uid()
          or (
            ga.share_summary_with_leaders
            and public.is_privileged_actor(array['minister','super_admin'])
          )
        )
    )
  );
create policy gift_strength_owner_insert
  on public.gift_strengths for insert to authenticated
  with check (
    exists (
      select 1 from public.gift_assessments ga
      where ga.id = assessment_id and ga.profile_id = auth.uid()
    )
  );
create policy gift_strength_owner_update
  on public.gift_strengths for update to authenticated
  using (
    exists (
      select 1 from public.gift_assessments ga
      where ga.id = assessment_id and ga.profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.gift_assessments ga
      where ga.id = assessment_id and ga.profile_id = auth.uid()
    )
  );
create policy gift_strength_owner_delete
  on public.gift_strengths for delete to authenticated
  using (
    exists (
      select 1 from public.gift_assessments ga
      where ga.id = assessment_id and ga.profile_id = auth.uid()
    )
  );

-- Moderators must be able to inspect pending posts before approval.
create policy gift_posts_moderator_read
  on public.gift_posts for select to authenticated
  using (public.is_privileged_actor(array['moderator','minister','super_admin']));

-- -----------------------------------------------------------------------------
-- Recovery programs may be created only by MFA-verified privileged church
-- leaders. Existing recovery leaders may update programs they lead.
-- -----------------------------------------------------------------------------
drop policy if exists recovery_programs_leader_manage on public.recovery_programs;

create policy recovery_programs_privileged_insert
  on public.recovery_programs for insert to authenticated
  with check (
    created_by = auth.uid()
    and public.is_privileged_actor(array['minister','safety_admin','super_admin'])
  );
create policy recovery_programs_leader_update
  on public.recovery_programs for update to authenticated
  using (public.leads_recovery_program(id))
  with check (public.leads_recovery_program(id));
create policy recovery_programs_leader_delete
  on public.recovery_programs for delete to authenticated
  using (public.leads_recovery_program(id));

-- Participants may discuss and encourage. Announcements, meeting changes, and
-- leader-only posts require an MFA-verified recovery leader.
drop policy if exists recovery_posts_insert on public.recovery_posts;
create policy recovery_posts_insert
  on public.recovery_posts for insert to authenticated
  with check (
    created_by = auth.uid()
    and public.is_recovery_member(program_id)
    and (
      (
        post_type in ('discussion','encouragement','resource')
        and not leader_only
      )
      or public.leads_recovery_program(program_id)
    )
  );

comment on policy gift_assessment_owner_read on public.gift_assessments is
  'The member always sees their assessment. Ministers see it only when the member explicitly enables share_summary_with_leaders.';
comment on policy recovery_programs_privileged_insert on public.recovery_programs is
  'Only MFA-verified minister, safety administrator, or super administrator roles may create a private recovery program.';

commit;
