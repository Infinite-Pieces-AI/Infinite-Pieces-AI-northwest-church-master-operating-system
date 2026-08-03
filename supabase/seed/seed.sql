-- SYNTHETIC / PUBLIC STARTER DATA ONLY.
-- Never place real member, household, child, prayer, counseling, attendance, or safeguarding data in seed files.

insert into public.life_stages (id, key, name, description, publication_status) values
  ('10000000-0000-4000-8000-000000000001', 'families', 'Families', 'Community and discipleship for households and caregivers.', 'published'),
  ('10000000-0000-4000-8000-000000000002', 'teens', 'Teens', 'Age-appropriate community for middle- and high-school students.', 'published'),
  ('10000000-0000-4000-8000-000000000003', 'young-adults', 'Young Adults', 'Community for young adults in the Northwest area.', 'published')
on conflict (id) do nothing;

insert into public.ministries (id, key, name, description, life_stage_id, publication_status) values
  ('20000000-0000-4000-8000-000000000001', 'kids-kingdom', 'Kids Kingdom', 'A welcoming children’s ministry with guardian-managed information and established check-in safeguards.', '10000000-0000-4000-8000-000000000001', 'published'),
  ('20000000-0000-4000-8000-000000000002', 'teen-ministry', 'Teen Ministry', 'Faith, friendship, service, and age-appropriate small-group community.', '10000000-0000-4000-8000-000000000002', 'published'),
  ('20000000-0000-4000-8000-000000000003', 'family-groups', 'Family Groups', 'Midweek community, Bible discussion, prayer, hospitality, and service.', '10000000-0000-4000-8000-000000000001', 'published')
on conflict (id) do nothing;

insert into public.locations (
  id, name, slug, address_line_1, city, state_region, postal_code, directions_url,
  parking_instructions, entrance_instructions, accessibility_notes, publication_status
) values (
  '30000000-0000-4000-8000-000000000001',
  'Butler Middle School',
  'butler-middle-school',
  '1140 Gorham Street',
  'Lowell',
  'MA',
  '01852',
  'https://www.google.com/maps/search/?api=1&query=1140+Gorham+Street+Lowell+MA+01852',
  'Starter copy: confirm the current parking and overflow instructions with church leadership before production.',
  'Starter copy: confirm the correct public entrance and signage before production.',
  'Contact the church before your visit for current accessibility arrangements.',
  'published'
) on conflict (id) do update set
  name = excluded.name,
  address_line_1 = excluded.address_line_1,
  city = excluded.city,
  state_region = excluded.state_region,
  postal_code = excluded.postal_code;

insert into public.service_templates (
  id, name, location_id, day_of_week, local_start_time, duration_minutes, timezone,
  recurrence_rule, effective_from, publication_status
) values (
  '40000000-0000-4000-8000-000000000001',
  'Sunday Worship',
  '30000000-0000-4000-8000-000000000001',
  0,
  '10:00',
  90,
  'America/New_York',
  'FREQ=WEEKLY;BYDAY=SU',
  current_date,
  'published'
) on conflict (id) do nothing;

insert into public.service_occurrences (
  service_template_id, location_id, title, starts_at, ends_at, occurrence_type,
  status_message, publication_status
)
select
  '40000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000001',
  'Sunday Worship',
  (service_day::date + time '10:00') at time zone 'America/New_York',
  (service_day::date + time '11:30') at time zone 'America/New_York',
  'central_worship',
  'Please confirm the latest service status on the Plan a Visit page before traveling.',
  'published'
from generate_series(current_date, current_date + 84, interval '1 day') service_day
where extract(dow from service_day) = 0
  and not exists (
    select 1 from public.service_occurrences existing
    where existing.service_template_id = '40000000-0000-4000-8000-000000000001'
      and existing.starts_at = (service_day::date + time '10:00') at time zone 'America/New_York'
  );

insert into public.series (id, title, slug, summary, starts_on, publication_status, published_at) values (
  '50000000-0000-4000-8000-000000000001',
  'Walking Together',
  'walking-together',
  'Synthetic starter series demonstrating the weekly lesson workflow. Replace with minister-approved content.',
  date_trunc('week', current_date)::date,
  'published',
  timezone('utc', now())
) on conflict (id) do nothing;

insert into public.weekly_lessons (
  id, series_id, title, slug, week_of, summary, minister_announcement,
  scripture_of_week_reference, publication_status, published_at
) values (
  '60000000-0000-4000-8000-000000000001',
  '50000000-0000-4000-8000-000000000001',
  'Listening and Doing',
  'listening-and-doing-starter',
  date_trunc('week', current_date)::date,
  'Synthetic starter content showing how a minister-approved weekly lesson appears in the member hub.',
  'This is demonstration copy. A minister must review and replace it before production.',
  'James 1:19-27',
  'published',
  timezone('utc', now())
) on conflict (id) do nothing;

insert into public.lesson_sections (lesson_id, section_type, heading, body, position) values
  ('60000000-0000-4000-8000-000000000001', 'outline', 'Main idea', 'Listen carefully, receive Scripture humbly, and practice what it teaches.', 1),
  ('60000000-0000-4000-8000-000000000001', 'discussion_questions', 'Discuss', 'What helps us move from hearing a lesson to living it together?', 2)
on conflict do nothing;

insert into public.scripture_references (lesson_id, reference, translation_id, provider, context_label, position) values
  ('60000000-0000-4000-8000-000000000001', 'James 1:19-27', 'NIV', 'licensed-provider-required', 'Primary passage', 1),
  ('60000000-0000-4000-8000-000000000001', 'Matthew 7:24-27', 'NIV', 'licensed-provider-required', 'Related passage', 2)
on conflict do nothing;

insert into public.events (
  id, title, slug, summary, description, visibility, default_location_id,
  registration_required, publication_status, published_at
) values (
  '70000000-0000-4000-8000-000000000001',
  'Welcome Sunday',
  'welcome-sunday-starter',
  'A public starter event for demonstrating event pages and structured data.',
  'Meet members, learn about ministries, and ask questions. Confirm all event details before production.',
  'public',
  '30000000-0000-4000-8000-000000000001',
  true,
  'published',
  timezone('utc', now())
) on conflict (id) do nothing;

insert into public.event_occurrences (event_id, location_id, starts_at, ends_at)
select
  '70000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000001',
  (next_sunday + time '11:45') at time zone 'America/New_York',
  (next_sunday + time '12:30') at time zone 'America/New_York'
from (
  select (current_date + ((7 - extract(dow from current_date)::integer) % 7 + 7))::date as next_sunday
) dates
where not exists (select 1 from public.event_occurrences where event_id = '70000000-0000-4000-8000-000000000001');

insert into public.kids_classes (id, name, age_band, room_label, external_reference) values
  ('80000000-0000-4000-8000-000000000001', 'Early Learners', 'Preschool', 'Assigned on check-in label', 'demo-class-early'),
  ('80000000-0000-4000-8000-000000000002', 'Elementary', 'Elementary', 'Assigned on check-in label', 'demo-class-elementary')
on conflict (id) do nothing;

insert into public.release_gate_results (gate_key, environment, status, notes) values
  ('authorization-cross-group-isolation', 'staging', 'not_started', 'Must pass before real member data.'),
  ('guardian-child-isolation', 'staging', 'not_started', 'Must pass before real child data.'),
  ('private-media-consent-scope', 'staging', 'not_started', 'Must pass before child-media upload.'),
  ('database-restore', 'staging', 'not_started', 'Quarterly restore evidence required.'),
  ('media-restore', 'staging', 'not_started', 'Storage backups are separate from database backups.'),
  ('wcag-2-2-aa', 'staging', 'not_started', 'Manual and automated accessibility review required.'),
  ('sunday-manual-fallback', 'staging', 'not_started', 'Kids Kingdom check-in fallback must be rehearsed.')
on conflict (gate_key, environment) do nothing;
