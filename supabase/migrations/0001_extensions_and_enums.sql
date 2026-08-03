begin;

create extension if not exists pgcrypto with schema extensions;
create extension if not exists citext with schema extensions;
create extension if not exists vector with schema extensions;

create type public.membership_status as enum ('pending', 'active', 'suspended', 'departed');
create type public.publication_status as enum ('draft', 'in_review', 'scheduled', 'published', 'archived');
create type public.access_request_status as enum ('pending', 'verifying', 'approved', 'declined', 'withdrawn');
create type public.group_kind as enum ('family_group', 'ministry', 'icebreaker', 'parents', 'teens', 'service_team');
create type public.group_cycle_status as enum ('draft', 'proposed', 'approved', 'active', 'closed');
create type public.channel_kind as enum ('announcement', 'discussion', 'prayer', 'group', 'ministry', 'parents', 'teens');
create type public.event_visibility as enum ('public', 'members', 'group', 'ministry', 'leaders');
create type public.registration_status as enum ('registered', 'waitlisted', 'cancelled', 'attended', 'no_show');
create type public.report_status as enum ('open', 'triaged', 'investigating', 'resolved', 'dismissed');
create type public.checkin_state as enum ('prechecked', 'checked_in', 'moved', 'pickup_requested', 'checked_out', 'cancelled');
create type public.media_scope as enum ('private_household', 'private_class', 'private_parent_community', 'internal_presentation', 'public_website', 'official_social', 'promotional_advertising');
create type public.media_review_status as enum ('pending_scan', 'pending_consent', 'pending_review', 'approved', 'rejected', 'removed');
create type public.notification_channel as enum ('email', 'web_push', 'in_app');
create type public.job_status as enum ('pending', 'processing', 'sent', 'failed', 'cancelled');
create type public.ai_request_status as enum ('queued', 'processing', 'draft_ready', 'reviewed', 'rejected', 'failed');
create type public.social_draft_status as enum ('draft', 'in_review', 'approved', 'scheduled', 'published', 'rejected');
create type public.incident_status as enum ('open', 'contained', 'investigating', 'resolved', 'closed');
create type public.safeguarding_status as enum ('received', 'escalated', 'external_report_required', 'closed');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

comment on function public.set_updated_at is 'Maintains immutable UTC updated_at timestamps.';

commit;
