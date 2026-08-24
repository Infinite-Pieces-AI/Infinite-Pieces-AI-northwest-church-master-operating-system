begin;

create or replace function public.list_service_shift_summaries(p_opportunity_ids uuid[])
returns table (
  id uuid,
  opportunity_id uuid,
  starts_at timestamptz,
  ends_at timestamptz,
  capacity integer,
  signed_up_count integer,
  allow_waitlist boolean,
  status text,
  minimum_age integer,
  weather_status text,
  meeting_instructions text,
  remote_join_url text,
  user_status text,
  user_party_size integer
)
language sql
stable
security definer
set search_path = public, auth
set row_security = off
as $$
  select
    ss.id,
    ss.opportunity_id,
    ss.starts_at,
    ss.ends_at,
    ss.capacity,
    coalesce((
      select sum(sss.party_size)::integer
      from public.service_shift_signups sss
      where sss.shift_id = ss.id and sss.status in ('going','attended')
    ), 0),
    ss.allow_waitlist,
    ss.status,
    ss.minimum_age,
    ss.weather_status,
    case
      when own_signup.profile_id is not null
        or public.is_privileged_actor(array['minister','super_admin'])
        then ss.meeting_instructions
      else null
    end,
    case
      when own_signup.profile_id is not null
        or public.is_privileged_actor(array['minister','super_admin'])
        then ss.remote_join_url
      else null
    end,
    own_signup.status,
    own_signup.party_size
  from public.service_shifts ss
  join public.service_opportunities so on so.id = ss.opportunity_id
  left join public.service_shift_signups own_signup
    on own_signup.shift_id = ss.id and own_signup.profile_id = auth.uid()
  where ss.opportunity_id = any(coalesce(p_opportunity_ids, '{}'::uuid[]))
    and so.publication_status = 'published'
    and public.is_active_member(auth.uid())
  order by ss.starts_at;
$$;

revoke all on function public.list_service_shift_summaries(uuid[]) from public;
grant execute on function public.list_service_shift_summaries(uuid[]) to authenticated;

create or replace function public.review_service_proposal(
  p_proposal_id uuid,
  p_decision text,
  p_reviewer_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
set row_security = off
as $$
declare
  proposal_row public.service_proposals%rowtype;
  opportunity_id uuid;
begin
  if not public.is_privileged_actor(array['content_editor','minister','moderator','super_admin']) then
    raise exception 'Service review permission is required';
  end if;
  if p_decision not in ('needs_changes','approved','declined') then
    raise exception 'Unsupported service proposal decision';
  end if;

  select * into proposal_row
  from public.service_proposals
  where id = p_proposal_id
  for update;
  if not found then raise exception 'Service proposal not found'; end if;
  if proposal_row.status not in ('pending','needs_changes') then
    raise exception 'This proposal is not awaiting review';
  end if;

  update public.service_proposals
  set status = p_decision,
      reviewer_note = left(nullif(trim(p_reviewer_note), ''), 2500),
      reviewed_by = auth.uid(),
      reviewed_at = timezone('utc', now()),
      updated_at = timezone('utc', now())
  where id = p_proposal_id;

  if p_decision = 'approved' then
    insert into public.service_opportunities (
      title,
      need_statement,
      impact_statement,
      partner_name,
      general_location,
      age_requirements,
      skills,
      family_friendly,
      visibility,
      publication_status,
      created_by,
      reviewed_by,
      opportunity_kind,
      service_category,
      location_visibility,
      locality,
      region,
      postal_code,
      indoor_outdoor,
      commitment_level,
      registration_mode,
      church_sponsored,
      safety_summary
    ) values (
      proposal_row.title,
      proposal_row.need_statement,
      proposal_row.impact_statement,
      case when proposal_row.proposed_kind = 'approved_partner'
        then 'Proposed community partner'
        else 'Member-led service proposal'
      end,
      proposal_row.general_location,
      case when proposal_row.family_friendly
        then 'Families may participate only under the approved safety plan'
        else 'Confirm age requirements with the host'
      end,
      '{}',
      proposal_row.family_friendly,
      'members',
      'draft',
      proposal_row.created_by,
      auth.uid(),
      case
        when proposal_row.proposed_kind = 'self_guided' then 'self_guided'
        when proposal_row.proposed_kind = 'approved_partner' then 'public_lead'
        else 'member_led'
      end,
      proposal_row.service_category,
      'general',
      null,
      'MA',
      proposal_row.postal_code,
      'either',
      case when proposal_row.proposed_kind = 'self_guided' then 'self_guided' else 'one_time' end,
      case when proposal_row.proposed_kind = 'self_guided' then 'self_guided' else 'leader_contact' end,
      false,
      case proposal_row.risk_level
        when 'restricted' then 'Restricted activity remains unpublished until a complete safety plan and qualified leadership are approved.'
        when 'review' then 'Additional safety, location, transportation, minor, or professional-service review is required before publication.'
        else 'Member-led and not church-sponsored. Follow the approved public-place and participant-safety plan.'
      end
    ) returning id into opportunity_id;

    update public.service_proposals
    set status = 'converted',
        converted_opportunity_id = opportunity_id,
        updated_at = timezone('utc', now())
    where id = p_proposal_id;
  end if;

  return opportunity_id;
end;
$$;

revoke all on function public.review_service_proposal(uuid,text,text) from public;
grant execute on function public.review_service_proposal(uuid,text,text) to authenticated;

comment on function public.list_service_shift_summaries(uuid[]) is
  'Returns aggregate capacity without participant identities. Exact meeting instructions are visible only to the signed-up member or an authorized leader.';
comment on function public.review_service_proposal(uuid,text,text) is
  'Reviews a member service proposal. Approval creates a draft opportunity and never silently labels a member-led project church-sponsored.';

commit;
