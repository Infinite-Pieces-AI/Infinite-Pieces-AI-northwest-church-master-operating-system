begin;

-- -----------------------------------------------------------------------------
-- Service Hub completion
-- -----------------------------------------------------------------------------
-- This migration turns the existing service opportunity/shift foundation into
-- a location-aware Service Hub with clear sponsorship labels, member proposals,
-- bookmarks, impact updates, ZIP discovery, and a safe public read boundary.
--
-- Sponsorship language is explicit:
--   church_hosted     = organized and supervised by the church
--   approved_partner  = approved external organization or partner
--   member_led        = approved for member discovery, but not church sponsored
--   self_guided       = independent idea; the church does not supervise the work
--   public_lead       = public information that still requires member verification
-- -----------------------------------------------------------------------------

alter table public.service_opportunities
  add column if not exists opportunity_kind text not null default 'church_hosted'
    check (opportunity_kind in ('church_hosted','approved_partner','member_led','self_guided','public_lead')),
  add column if not exists service_category text not null default 'community_care'
    check (service_category in (
      'hunger','housing','children_youth','older_adults','disability_support',
      'environment','public_health','recovery_support','neighborhood',
      'church_operations','hospitality','mentoring','transportation','other'
    )),
  add column if not exists location_visibility text not null default 'general'
    check (location_visibility in ('public','general','after_signup','leader_only')),
  add column if not exists address_line text
    check (address_line is null or char_length(address_line) <= 300),
  add column if not exists locality text
    check (locality is null or char_length(locality) <= 120),
  add column if not exists region text not null default 'MA'
    check (char_length(region) between 2 and 80),
  add column if not exists postal_code text
    check (postal_code is null or postal_code ~ '^[0-9]{5}(?:-[0-9]{4})?$'),
  add column if not exists latitude numeric(9,6)
    check (latitude is null or latitude between -90 and 90),
  add column if not exists longitude numeric(9,6)
    check (longitude is null or longitude between -180 and 180),
  add column if not exists indoor_outdoor text not null default 'either'
    check (indoor_outdoor in ('indoor','outdoor','either','remote')),
  add column if not exists commitment_level text not null default 'one_time'
    check (commitment_level in ('one_time','recurring','flexible','self_guided')),
  add column if not exists registration_mode text not null default 'hub_signup'
    check (registration_mode in ('hub_signup','external_link','leader_contact','self_guided')),
  add column if not exists source_url text
    check (source_url is null or source_url ~ '^https://'),
  add column if not exists source_verified_at timestamptz,
  add column if not exists exact_location_after_signup boolean not null default false,
  add column if not exists church_sponsored boolean not null default true,
  add column if not exists safety_summary text
    check (safety_summary is null or char_length(safety_summary) <= 1500),
  add column if not exists transportation_available boolean not null default false,
  add column if not exists background_check_required boolean not null default false;

update public.service_opportunities
set church_sponsored = opportunity_kind = 'church_hosted'
where church_sponsored is distinct from (opportunity_kind = 'church_hosted');

alter table public.service_opportunities
  drop constraint if exists service_opportunities_kind_sponsorship_check;
alter table public.service_opportunities
  add constraint service_opportunities_kind_sponsorship_check check (
    (opportunity_kind = 'church_hosted' and church_sponsored)
    or (opportunity_kind <> 'church_hosted' and not church_sponsored)
  );

alter table public.service_shifts
  add column if not exists signup_closes_at timestamptz,
  add column if not exists minimum_age integer
    check (minimum_age is null or minimum_age between 0 and 99),
  add column if not exists meeting_instructions text
    check (meeting_instructions is null or char_length(meeting_instructions) <= 2000),
  add column if not exists weather_status text not null default 'scheduled'
    check (weather_status in ('scheduled','weather_watch','relocated','postponed','cancelled')),
  add column if not exists remote_join_url text
    check (remote_join_url is null or remote_join_url ~ '^https://');

alter table public.service_shifts
  drop constraint if exists service_shifts_signup_close_check;
alter table public.service_shifts
  add constraint service_shifts_signup_close_check check (
    signup_closes_at is null or signup_closes_at <= starts_at
  );

create table public.service_zip_centroids (
  postal_code text primary key check (postal_code ~ '^[0-9]{5}$'),
  locality text not null check (char_length(locality) between 2 and 120),
  region text not null default 'MA' check (char_length(region) between 2 and 80),
  latitude numeric(9,6) not null check (latitude between -90 and 90),
  longitude numeric(9,6) not null check (longitude between -180 and 180),
  source_label text not null default 'church-maintained approximate centroid'
    check (char_length(source_label) between 3 and 200),
  verified_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.service_zip_centroids is
  'Approximate ZIP centroids used only for opportunity discovery. They are not navigation, emergency-response, or exact-location records.';

insert into public.service_zip_centroids(postal_code, locality, latitude, longitude)
values
  ('01850','Lowell',42.656000,-71.305000),
  ('01851','Lowell',42.631500,-71.334800),
  ('01852','Lowell',42.633400,-71.316200),
  ('01854','Lowell',42.655400,-71.347600),
  ('01821','Billerica',42.558400,-71.268900),
  ('01824','Chelmsford',42.599800,-71.367300),
  ('01826','Dracut',42.676400,-71.318600),
  ('01862','North Billerica',42.575100,-71.290200),
  ('01863','North Chelmsford',42.637500,-71.388300),
  ('01876','Tewksbury',42.611200,-71.227300),
  ('01879','Tyngsborough',42.676800,-71.424600),
  ('01886','Westford',42.586400,-71.440900)
on conflict (postal_code) do nothing;

create table public.service_location_catalog (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 180),
  listing_kind text not null
    check (listing_kind in ('church_site','approved_partner','public_lead','public_place','self_guided_area')),
  organization_type text not null default 'other'
    check (organization_type in (
      'church','food_security','housing','public_agency','environment',
      'health','recovery_support','older_adults','youth','disability_support','other'
    )),
  service_categories text[] not null default '{}',
  public_url text check (public_url is null or public_url ~ '^https://'),
  contact_url text check (contact_url is null or contact_url ~ '^https://'),
  address_line text check (address_line is null or char_length(address_line) <= 300),
  locality text not null check (char_length(locality) between 2 and 120),
  region text not null default 'MA' check (char_length(region) between 2 and 80),
  postal_code text check (postal_code is null or postal_code ~ '^[0-9]{5}(?:-[0-9]{4})?$'),
  latitude numeric(9,6) check (latitude is null or latitude between -90 and 90),
  longitude numeric(9,6) check (longitude is null or longitude between -180 and 180),
  public_notes text check (public_notes is null or char_length(public_notes) <= 2500),
  accessibility_notes text check (accessibility_notes is null or char_length(accessibility_notes) <= 1500),
  church_review_status text not null default 'research'
    check (church_review_status in ('research','public_lead','approved','paused','do_not_use')),
  source_verified_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check ((church_review_status = 'approved' and reviewed_by is not null and reviewed_at is not null)
    or church_review_status <> 'approved')
);
create unique index service_location_catalog_source_unique
  on public.service_location_catalog(public_url)
  where public_url is not null;
create index service_location_catalog_discovery_idx
  on public.service_location_catalog(church_review_status, postal_code, locality);

create table public.service_proposals (
  id uuid primary key default extensions.gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 180),
  need_statement text not null check (char_length(need_statement) between 20 and 2500),
  impact_statement text not null check (char_length(impact_statement) between 20 and 2500),
  service_category text not null
    check (service_category in (
      'hunger','housing','children_youth','older_adults','disability_support',
      'environment','public_health','recovery_support','neighborhood',
      'church_operations','hospitality','mentoring','transportation','other'
    )),
  proposed_kind text not null default 'member_led'
    check (proposed_kind in ('member_led','self_guided','approved_partner')),
  general_location text not null check (char_length(general_location) between 2 and 200),
  postal_code text check (postal_code is null or postal_code ~ '^[0-9]{5}(?:-[0-9]{4})?$'),
  proposed_starts_at timestamptz,
  proposed_ends_at timestamptz,
  family_friendly boolean not null default false,
  public_place_confirmed boolean not null default false,
  home_access_involved boolean not null default false,
  transportation_involved boolean not null default false,
  minors_involved boolean not null default false,
  hazardous_work boolean not null default false,
  cash_handling boolean not null default false,
  professional_service boolean not null default false,
  risk_level text not null default 'standard'
    check (risk_level in ('standard','review','restricted')),
  status text not null default 'pending'
    check (status in ('draft','pending','needs_changes','approved','declined','withdrawn','converted')),
  reviewer_note text check (reviewer_note is null or char_length(reviewer_note) <= 2500),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  converted_opportunity_id uuid references public.service_opportunities(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (proposed_ends_at is null or proposed_starts_at is null or proposed_ends_at > proposed_starts_at),
  check ((status in ('approved','declined','needs_changes','converted') and reviewed_by is not null and reviewed_at is not null)
    or status not in ('approved','declined','needs_changes','converted'))
);
create index service_proposals_review_queue_idx
  on public.service_proposals(status, risk_level, created_at desc);
create index service_proposals_owner_idx
  on public.service_proposals(created_by, created_at desc);

create table public.service_opportunity_bookmarks (
  opportunity_id uuid not null references public.service_opportunities(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key(opportunity_id, profile_id)
);

create table public.service_impact_updates (
  id uuid primary key default extensions.gen_random_uuid(),
  opportunity_id uuid not null references public.service_opportunities(id) on delete cascade,
  shift_id uuid references public.service_shifts(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  headline text not null check (char_length(headline) between 3 and 180),
  summary text not null check (char_length(summary) between 20 and 4000),
  people_served integer check (people_served is null or people_served between 0 and 1000000),
  volunteer_count integer check (volunteer_count is null or volunteer_count between 0 and 100000),
  hours_served numeric(10,2) check (hours_served is null or hours_served between 0 and 1000000),
  approved_for_members boolean not null default false,
  approved_for_public boolean not null default false,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint service_impact_updates_approval_check check (
    (not approved_for_members and not approved_for_public)
    or (reviewed_by is not null and reviewed_at is not null)
  )
);

create trigger service_location_catalog_set_updated_at
  before update on public.service_location_catalog
  for each row execute function public.set_updated_at();
create trigger service_proposals_set_updated_at
  before update on public.service_proposals
  for each row execute function public.set_updated_at();
create trigger service_impact_updates_set_updated_at
  before update on public.service_impact_updates
  for each row execute function public.set_updated_at();
create trigger service_zip_centroids_set_updated_at
  before update on public.service_zip_centroids
  for each row execute function public.set_updated_at();

create or replace function public.classify_service_proposal_risk()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if new.hazardous_work or new.home_access_involved or new.cash_handling then
    new.risk_level := 'restricted';
  elsif new.transportation_involved or new.minors_involved or new.professional_service
    or not new.public_place_confirmed then
    new.risk_level := 'review';
  else
    new.risk_level := 'standard';
  end if;
  if auth.uid() is not null then new.created_by := auth.uid(); end if;
  if tg_op = 'INSERT' and new.status <> 'draft' then new.status := 'pending'; end if;
  return new;
end;
$$;

drop trigger if exists service_proposals_classify_risk on public.service_proposals;
create trigger service_proposals_classify_risk
  before insert or update of home_access_involved, transportation_involved,
    minors_involved, hazardous_work, cash_handling, professional_service,
    public_place_confirmed
  on public.service_proposals
  for each row execute function public.classify_service_proposal_risk();

create or replace function public.service_distance_miles(
  p_latitude numeric,
  p_longitude numeric,
  p_other_latitude numeric,
  p_other_longitude numeric
)
returns numeric
language sql
immutable
strict
as $$
  select round((3958.7613 * 2 * asin(sqrt(
    power(sin(radians((p_other_latitude - p_latitude)::double precision) / 2), 2)
    + cos(radians(p_latitude::double precision))
      * cos(radians(p_other_latitude::double precision))
      * power(sin(radians((p_other_longitude - p_longitude)::double precision) / 2), 2)
  )))::numeric, 2);
$$;

create or replace function public.list_nearby_service_opportunities(
  p_postal_code text,
  p_radius_miles numeric default 15,
  p_limit integer default 100
)
returns table (
  opportunity_id uuid,
  title text,
  need_statement text,
  impact_statement text,
  partner_name text,
  opportunity_kind text,
  service_category text,
  general_location text,
  locality text,
  region text,
  postal_code text,
  distance_miles numeric,
  family_friendly boolean,
  age_requirements text,
  physical_requirements text,
  skills text[],
  accessibility_notes text,
  what_to_bring text,
  indoor_outdoor text,
  commitment_level text,
  registration_mode text,
  source_url text,
  church_sponsored boolean
)
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  with origin as (
    select latitude, longitude
    from public.service_zip_centroids
    where postal_code = left(trim(p_postal_code), 5)
  )
  select
    so.id,
    so.title,
    so.need_statement,
    so.impact_statement,
    so.partner_name,
    so.opportunity_kind,
    so.service_category,
    so.general_location,
    so.locality,
    so.region,
    so.postal_code,
    case
      when o.latitude is not null and so.latitude is not null and so.longitude is not null
        then public.service_distance_miles(o.latitude, o.longitude, so.latitude, so.longitude)
      else null
    end,
    so.family_friendly,
    so.age_requirements,
    so.physical_requirements,
    so.skills,
    so.accessibility_notes,
    so.what_to_bring,
    so.indoor_outdoor,
    so.commitment_level,
    so.registration_mode,
    so.source_url,
    so.church_sponsored
  from public.service_opportunities so
  left join origin o on true
  where public.is_active_member(auth.uid())
    and so.publication_status = 'published'
    and (
      o.latitude is null
      or so.latitude is null
      or public.service_distance_miles(o.latitude, o.longitude, so.latitude, so.longitude)
        <= greatest(1, least(coalesce(p_radius_miles, 15), 100))
      or left(coalesce(so.postal_code, ''), 5) = left(trim(p_postal_code), 5)
    )
  order by
    case when o.latitude is not null and so.latitude is not null
      then public.service_distance_miles(o.latitude, o.longitude, so.latitude, so.longitude)
      else 999999 end,
    so.created_at desc
  limit greatest(1, least(coalesce(p_limit, 100), 250));
$$;

create or replace function public.list_public_service_opportunities(p_limit integer default 12)
returns table (
  id uuid,
  title text,
  need_statement text,
  impact_statement text,
  partner_name text,
  service_category text,
  general_location text,
  locality text,
  region text,
  postal_code text,
  family_friendly boolean,
  age_requirements text,
  accessibility_notes text,
  source_url text,
  next_shift_starts_at timestamptz
)
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select
    so.id,
    so.title,
    so.need_statement,
    so.impact_statement,
    so.partner_name,
    so.service_category,
    so.general_location,
    so.locality,
    so.region,
    so.postal_code,
    so.family_friendly,
    so.age_requirements,
    so.accessibility_notes,
    so.source_url,
    (
      select min(ss.starts_at)
      from public.service_shifts ss
      where ss.opportunity_id = so.id
        and ss.status in ('open','full')
        and ss.starts_at >= timezone('utc', now())
    )
  from public.service_opportunities so
  where so.publication_status = 'published'
    and so.visibility = 'public'
    and so.opportunity_kind in ('church_hosted','approved_partner')
    and so.location_visibility in ('public','general')
  order by next_shift_starts_at nulls last, so.published_at desc nulls last
  limit greatest(1, least(coalesce(p_limit, 12), 50));
$$;

revoke all on function public.list_nearby_service_opportunities(text,numeric,integer) from public;
revoke all on function public.list_public_service_opportunities(integer) from public;
grant execute on function public.list_nearby_service_opportunities(text,numeric,integer) to authenticated;
grant execute on function public.list_public_service_opportunities(integer) to anon, authenticated;

alter table public.service_zip_centroids enable row level security;
alter table public.service_location_catalog enable row level security;
alter table public.service_proposals enable row level security;
alter table public.service_opportunity_bookmarks enable row level security;
alter table public.service_impact_updates enable row level security;

create policy service_zip_centroids_member_read
  on public.service_zip_centroids for select to authenticated
  using (public.is_active_member());
create policy service_zip_centroids_leader_manage
  on public.service_zip_centroids for all to authenticated
  using (public.is_privileged_actor(array['content_editor','minister','super_admin']))
  with check (public.is_privileged_actor(array['content_editor','minister','super_admin']));

create policy service_location_catalog_member_read
  on public.service_location_catalog for select to authenticated
  using (
    public.is_active_member()
    and church_review_status in ('public_lead','approved')
  );
create policy service_location_catalog_leader_manage
  on public.service_location_catalog for all to authenticated
  using (public.is_privileged_actor(array['content_editor','minister','super_admin']))
  with check (public.is_privileged_actor(array['content_editor','minister','super_admin']));

create policy service_proposals_owner_read
  on public.service_proposals for select to authenticated
  using (created_by = auth.uid() or public.is_privileged_actor(array['content_editor','minister','moderator','super_admin']));
create policy service_proposals_member_insert
  on public.service_proposals for insert to authenticated
  with check (created_by = auth.uid() and public.is_active_member());
create policy service_proposals_owner_update
  on public.service_proposals for update to authenticated
  using (created_by = auth.uid() and status in ('draft','pending','needs_changes'))
  with check (created_by = auth.uid() and status in ('draft','pending','withdrawn'));
create policy service_proposals_leader_manage
  on public.service_proposals for all to authenticated
  using (public.is_privileged_actor(array['content_editor','minister','moderator','super_admin']))
  with check (public.is_privileged_actor(array['content_editor','minister','moderator','super_admin']));

create policy service_bookmarks_self
  on public.service_opportunity_bookmarks for all to authenticated
  using (profile_id = auth.uid())
  with check (
    profile_id = auth.uid()
    and exists (
      select 1 from public.service_opportunities so
      where so.id = opportunity_id
        and so.publication_status = 'published'
        and public.is_active_member()
    )
  );

create policy service_impact_member_read
  on public.service_impact_updates for select to authenticated
  using (
    approved_for_members
    and exists (
      select 1 from public.service_opportunities so
      where so.id = opportunity_id and so.publication_status = 'published'
    )
  );
create policy service_impact_creator_insert
  on public.service_impact_updates for insert to authenticated
  with check (
    created_by = auth.uid()
    and (
      public.is_privileged_actor(array['content_editor','minister','super_admin'])
      or exists (
        select 1
        from public.service_shift_signups sss
        join public.service_shifts ss on ss.id = sss.shift_id
        where sss.profile_id = auth.uid()
          and ss.opportunity_id = opportunity_id
          and sss.status in ('attended','going')
      )
    )
  );
create policy service_impact_creator_update
  on public.service_impact_updates for update to authenticated
  using (created_by = auth.uid() and not approved_for_members and not approved_for_public)
  with check (created_by = auth.uid() and not approved_for_members and not approved_for_public);
create policy service_impact_leader_manage
  on public.service_impact_updates for all to authenticated
  using (public.is_privileged_actor(array['content_editor','minister','super_admin']))
  with check (public.is_privileged_actor(array['content_editor','minister','super_admin']));

revoke all on table public.service_zip_centroids, public.service_location_catalog,
  public.service_proposals, public.service_opportunity_bookmarks,
  public.service_impact_updates from anon;
grant select, insert, update, delete on table public.service_zip_centroids,
  public.service_location_catalog, public.service_proposals,
  public.service_opportunity_bookmarks, public.service_impact_updates to authenticated;
grant all on table public.service_zip_centroids, public.service_location_catalog,
  public.service_proposals, public.service_opportunity_bookmarks,
  public.service_impact_updates to service_role;

comment on table public.service_proposals is
  'Member-proposed service ideas requiring human review. Approval for discovery does not make a member-led project church sponsored.';
comment on table public.service_location_catalog is
  'Church-maintained service locations and public leads. A public lead is not an endorsement or confirmed volunteer opening.';
comment on function public.list_public_service_opportunities(integer) is
  'Returns only church-hosted or approved-partner opportunities explicitly published for public discovery.';

commit;
