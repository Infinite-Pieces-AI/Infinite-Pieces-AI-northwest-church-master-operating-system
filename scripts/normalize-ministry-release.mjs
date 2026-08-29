import {
  existsSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const migrationsDir = join(root, "supabase", "migrations");

function remove(path) {
  const full = join(root, path);
  if (existsSync(full)) {
    rmSync(full, { force: true, recursive: true });
    console.log(`removed ${path}`);
  }
}

function replaceInFile(path, replacements) {
  const full = join(root, path);
  if (!existsSync(full)) return;
  const original = readFileSync(full, "utf8");
  let next = original;
  for (const [from, to] of replacements) next = next.split(from).join(to);
  if (next !== original) {
    writeFileSync(full, next, "utf8");
    console.log(`updated ${path}`);
  }
}

function walk(dir, results = []) {
  for (const name of readdirSync(dir)) {
    if ([".git", "node_modules", ".next", ".turbo"].includes(name)) continue;
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, results);
    else results.push(full);
  }
  return results;
}

// Remove abandoned staging copies and duplicate draft migrations. The final files
// live in their real application paths and in the canonical 0027-0039 sequence.
remove("supabase/migrations/0028_recovery_access_moderation_and_public_interest.sql");
remove("supabase/migrations/0029_ministry_operational_indexes_and_prayer_routing.sql");
remove("scripts/apply-gifts-prayer-recovery-completion.mjs");

const githubDir = join(root, ".github");
if (existsSync(githubDir)) {
  for (const name of readdirSync(githubDir)) {
    if (name.startsWith("ministry-finalize-")) remove(join(".github", name));
  }
}

// Canonicalize names throughout the release candidate. The member prayer table
// must not collide with the earlier restricted prayer-intake table. Recovery
// uses one membership-request model and one voluntary public-interest model.
const canonicalReplacements = [
  ["public.prayer_requests", "public.member_prayer_requests"],
  ["\"prayer_requests\"", "\"member_prayer_requests\""],
  ["'prayer_requests'", "'member_prayer_requests'"],
  ["recovery_access_requests", "recovery_membership_requests"],
  ["public_recovery_inquiries", "recovery_interest_requests"],
  ["recovery_partner_actions", "recovery_outreach_partner_actions"],
];

for (const full of walk(root)) {
  const path = relative(root, full).replaceAll("\\", "/");
  if (path === "scripts/normalize-ministry-release.mjs") continue;
  if (!/\.(?:sql|ts|tsx|js|mjs|md|yml|yaml)$/.test(path)) continue;
  replaceInFile(path, canonicalReplacements);
}

// Keep the secure request catalog and add an explicit accepting flag. This
// exposes only the minimum program information needed to ask a leader for access.
const canonicalAccessMigration = `begin;

alter table public.recovery_programs
  add column if not exists accepting_access_requests boolean not null default true;

create or replace function public.list_recovery_access_options()
returns table (
  program_id uuid,
  display_name text,
  public_summary text,
  meeting_day text,
  program_type text,
  official_program_confirmation boolean,
  accepting_access_requests boolean,
  current_request_status text,
  is_current_member boolean
)
language sql
stable
security definer
set search_path = public, auth
set row_security = off
as $$
  select
    rp.id,
    rp.display_name,
    rp.public_summary,
    rp.meeting_day,
    rp.program_type,
    rp.official_program_confirmation,
    rp.accepting_access_requests,
    latest_request.status,
    exists (
      select 1
      from public.recovery_memberships rm
      where rm.program_id = rp.id
        and rm.profile_id = auth.uid()
        and rm.ended_at is null
    )
  from public.recovery_programs rp
  left join lateral (
    select rmr.status
    from public.recovery_membership_requests rmr
    where rmr.program_id = rp.id
      and rmr.profile_id = auth.uid()
    order by rmr.created_at desc
    limit 1
  ) latest_request on true
  where public.is_active_member(auth.uid())
    and rp.status = 'active'
    and (
      rp.accepting_access_requests
      or latest_request.status is not null
      or exists (
        select 1
        from public.recovery_memberships rm
        where rm.program_id = rp.id
          and rm.profile_id = auth.uid()
          and rm.ended_at is null
      )
    )
  order by rp.display_name;
$$;

revoke all on function public.list_recovery_access_options() from public;
grant execute on function public.list_recovery_access_options() to authenticated;

comment on function public.list_recovery_access_options() is
  'Returns only the minimal public program description and the caller own request/membership state. It never exposes rosters, exact locations, posts, progress, or attendance.';

commit;
`;
writeFileSync(
  join(migrationsDir, "0030_recovery_access_option_rpc.sql"),
  canonicalAccessMigration,
  "utf8",
);
console.log("rewrote supabase/migrations/0030_recovery_access_option_rpc.sql");

// Preserve prayer-owner protections while making every recovery leadership
// decision depend on an AAL2/MFA session and the canonical request table.
const canonicalMfaMigration = `begin;

create or replace function public.enforce_prayer_request_boundaries()
returns trigger
language plpgsql
security definer
set search_path = public, auth
set row_security = off
as $$
declare
  privileged_reviewer boolean;
begin
  privileged_reviewer := auth.role() = 'service_role'
    or public.is_privileged_actor(array['minister','safety_admin','super_admin']);

  if tg_op = 'UPDATE' and not privileged_reviewer then
    new.title := old.title;
    new.request_text := old.request_text;
    new.submitted_by_display := old.submitted_by_display;
    new.display_anonymous := old.display_anonymous;
    new.visibility := old.visibility;
    new.ministry_id := old.ministry_id;
    new.group_id := old.group_id;
    new.category := old.category;
    new.sensitivity := old.sensitivity;
    new.allow_encouragement := old.allow_encouragement;
    new.allow_prayed_events := old.allow_prayed_events;
    new.expires_at := old.expires_at;
    new.leader_workflow_status := old.leader_workflow_status;
    new.assigned_to := old.assigned_to;
    new.leader_note := old.leader_note;
    new.leader_reviewed_at := old.leader_reviewed_at;
  end if;

  if new.sensitivity <> 'normal' then
    new.visibility := 'leaders_only';
    new.ministry_id := null;
    new.group_id := null;
    new.allow_encouragement := false;
    new.allow_prayed_events := false;
  end if;

  if new.visibility in ('church','leaders_only','private') then
    new.ministry_id := null;
    new.group_id := null;
  elsif new.visibility = 'ministry' then
    new.group_id := null;
  elsif new.visibility = 'group' then
    new.ministry_id := null;
  end if;

  return new;
end;
$$;

drop trigger if exists member_prayer_requests_enforce_boundaries
  on public.member_prayer_requests;
create trigger member_prayer_requests_enforce_boundaries
  before insert or update on public.member_prayer_requests
  for each row execute function public.enforce_prayer_request_boundaries();

create or replace function public.leads_recovery_program(
  requested_program_id uuid,
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
    else
      public.is_privileged_actor(array['minister','safety_admin','super_admin'])
      or exists (
        select 1
        from public.recovery_memberships rm
        where rm.program_id = requested_program_id
          and rm.profile_id = target_user
          and rm.membership_role in ('leader','admin')
          and rm.ended_at is null
      )
  end;
$$;

revoke all on function public.leads_recovery_program(uuid,uuid) from public;
grant execute on function public.leads_recovery_program(uuid,uuid)
  to authenticated, service_role;

comment on function public.enforce_prayer_request_boundaries() is
  'Prevents ordinary request owners from widening prayer visibility, declassifying restricted requests, or changing pastoral/safeguarding workflow fields.';
comment on function public.leads_recovery_program(uuid,uuid) is
  'Requires AAL2 MFA for recovery leader/admin operations and prevents checking another subject.';

commit;
`;
writeFileSync(
  join(migrationsDir, "0032_harden_prayer_updates_and_recovery_leader_mfa.sql"),
  canonicalMfaMigration,
  "utf8",
);
console.log("rewrote supabase/migrations/0032_harden_prayer_updates_and_recovery_leader_mfa.sql");

const canonicalEdgeMigration = `begin;

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

  if not is_reviewer then
    if new.post_type = 'church_need'
      and not public.has_any_role(array['group_leader','minister','super_admin']) then
      raise exception 'Only an approved church leader may publish a church need';
    end if;
    if new.visibility = 'ministry'
      and not public.is_ministry_member(new.ministry_id, auth.uid()) then
      raise exception 'Ministry membership is required for this visibility';
    end if;
    if new.visibility = 'group'
      and not public.is_group_member(new.group_id, auth.uid()) then
      raise exception 'Group membership is required for this visibility';
    end if;
  end if;

  sensitive_text := lower(concat_ws(
    ' ', new.title, new.description, new.price_note,
    array_to_string(new.skill_tags, ' ')
  ));
  if sensitive_text ~ '(child ?care|babysit|transport|ride|home access|medical|therapy|counsel|electric|plumb|roof|legal|financial|cash|venmo|cashapp|paypal)'
    or new.exchange_type = 'paid'
    or new.post_type = 'item_share' then
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

create or replace function public.request_recovery_membership(
  p_program_id uuid,
  p_requested_role text,
  p_display_mode text,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
set row_security = off
as $$
declare
  new_id uuid;
begin
  if not public.is_active_member(auth.uid()) then
    raise exception 'Active church membership is required';
  end if;
  if exists (
    select 1 from public.recovery_memberships rm
    where rm.program_id = p_program_id
      and rm.profile_id = auth.uid()
      and rm.ended_at is null
  ) then
    raise exception 'You already have active access to this recovery ministry';
  end if;
  if p_requested_role not in ('participant','peer_support') then
    raise exception 'Unsupported requested role';
  end if;
  if p_display_mode not in ('first_name','initials','private') then
    raise exception 'Unsupported display mode';
  end if;
  if not exists (
    select 1 from public.recovery_programs rp
    where rp.id = p_program_id
      and rp.status = 'active'
      and rp.accepting_access_requests
  ) then
    raise exception 'Recovery ministry is not accepting access requests';
  end if;

  update public.recovery_membership_requests
  set status = 'expired', updated_at = timezone('utc', now())
  where program_id = p_program_id
    and profile_id = auth.uid()
    and status = 'pending';

  insert into public.recovery_membership_requests (
    program_id, profile_id, requested_role, display_mode,
    privacy_acknowledged_at, reason, status
  ) values (
    p_program_id, auth.uid(), p_requested_role, p_display_mode,
    timezone('utc', now()), left(nullif(trim(p_reason), ''), 2000), 'pending'
  ) returning id into new_id;
  return new_id;
end;
$$;

drop policy if exists recovery_interest_requests_outreach_read
  on public.recovery_interest_requests;
drop policy if exists recovery_interest_requests_outreach_update
  on public.recovery_interest_requests;
drop policy if exists recovery_interest_requests_minister_read
  on public.recovery_interest_requests;
drop policy if exists recovery_interest_requests_minister_update
  on public.recovery_interest_requests;

create policy recovery_interest_requests_minister_read
  on public.recovery_interest_requests for select to authenticated
  using (public.has_outreach_mfa_role(array['minister','super_admin']));
create policy recovery_interest_requests_minister_update
  on public.recovery_interest_requests for update to authenticated
  using (public.has_outreach_mfa_role(array['minister','super_admin']))
  with check (public.has_outreach_mfa_role(array['minister','super_admin']));

comment on function public.enforce_gift_post_moderation() is
  'Enforces gift-post role, scope, moderation, and elevated-risk rules on insert and update.';
comment on table public.recovery_interest_requests is
  'Voluntary and potentially sensitive recovery next-step requests. Read/update access is limited to MFA-verified ministers and super administrators.';

commit;
`;
writeFileSync(
  join(migrationsDir, "0034_close_gift_update_and_recovery_inquiry_edges.sql"),
  canonicalEdgeMigration,
  "utf8",
);
console.log("rewrote supabase/migrations/0034_close_gift_update_and_recovery_inquiry_edges.sql");

const compatibilityMigration = `begin;

create table if not exists public.recovery_outreach_partner_actions (
  id uuid primary key default extensions.gen_random_uuid(),
  partner_id uuid not null references public.recovery_outreach_partners(id) on delete cascade,
  action_type text not null check (
    action_type in ('research_note','approve_contact','contact_attempt','conversation','partnership','decline','do_not_contact')
  ),
  note text check (note is null or char_length(note) <= 2000),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists recovery_outreach_partner_actions_partner_idx
  on public.recovery_outreach_partner_actions(partner_id, created_at desc);
alter table public.recovery_outreach_partner_actions enable row level security;
create policy recovery_outreach_partner_actions_manage
  on public.recovery_outreach_partner_actions for all to authenticated
  using (public.has_outreach_mfa_role(array['minister','super_admin']))
  with check (public.has_outreach_mfa_role(array['minister','super_admin']));
revoke all on table public.recovery_outreach_partner_actions from anon;
grant select, insert, update, delete on table public.recovery_outreach_partner_actions to authenticated;
grant all on table public.recovery_outreach_partner_actions to service_role;

create or replace function public.request_recovery_access(
  p_program_id uuid,
  p_message text default null
)
returns uuid
language sql
security definer
set search_path = public, auth
set row_security = off
as $$
  select public.request_recovery_membership(
    p_program_id,
    'participant',
    'first_name',
    p_message
  );
$$;

create or replace function public.review_recovery_access_request(
  p_request_id uuid,
  p_decision text,
  p_note text default null
)
returns void
language sql
security definer
set search_path = public, auth
set row_security = off
as $$
  select public.review_recovery_membership_request(
    p_request_id,
    p_decision,
    p_note
  );
$$;

create or replace function public.leave_recovery_program(p_program_id uuid)
returns void
language sql
security definer
set search_path = public, auth
set row_security = off
as $$
  update public.recovery_memberships
  set ended_at = timezone('utc', now()),
      updated_at = timezone('utc', now())
  where program_id = p_program_id
    and profile_id = auth.uid()
    and ended_at is null;
$$;

revoke all on function public.request_recovery_access(uuid,text) from public;
revoke all on function public.review_recovery_access_request(uuid,text,text) from public;
revoke all on function public.leave_recovery_program(uuid) from public;
grant execute on function public.request_recovery_access(uuid,text) to authenticated;
grant execute on function public.review_recovery_access_request(uuid,text,text) to authenticated;
grant execute on function public.leave_recovery_program(uuid) to authenticated;

comment on table public.recovery_outreach_partner_actions is
  'Human-approved relationship history for public recovery organizations. It never stores participant identity or inferred addiction status.';

commit;
`;
writeFileSync(
  join(migrationsDir, "0039_recovery_outreach_partner_actions.sql"),
  compatibilityMigration,
  "utf8",
);
console.log("created supabase/migrations/0039_recovery_outreach_partner_actions.sql");

// Align source files with canonical columns while preserving their outward API.
replaceInFile("apps/church-hub/app/api/admin/recovery/route.ts", [
  ["id,program_id,profile_id,request_message,status,created_at", "id,program_id,profile_id,reason,status,created_at"],
  ["request.request_message", "request.reason"],
]);

replaceInFile("apps/outreach-command/app/api/recovery-outreach/route.ts", [
  ["aggregate_search", "search_console"],
  ["community_partner", "manual_research"],
  ["preferred_contact", "contact_method"],
  ["requested_next_step", "interest_type"],
  ["scheduled", "conversation"],
  ["opportunity_score", "priority_score"],
  ["sensitivity_score", "sensitivity_risk"],
]);

replaceInFile("supabase/tests/0010_ministry_edge_authorization.test.sql", [
  [
    "first_name, email, preferred_contact, requested_next_step,\n  source_path, communication_consent, consented_at, status",
    "first_name, contact_method, email, interest_type,\n  source_path, consent_to_contact, status",
  ],
  [
    "'Voluntary Visitor', 'visitor@example.invalid', 'email', 'talk_to_leader',\n  '/recovery-support-lowell', true, now(), 'new'",
    "'Voluntary Visitor', 'email', 'visitor@example.invalid', 'church_peer_support',\n  '/recovery-support-lowell', true, 'new'",
  ],
]);

// Remove one-off workflow machinery after the canonical files have been written.
const workflowsDir = join(root, ".github", "workflows");
for (const name of readdirSync(workflowsDir)) {
  if (name.startsWith("temporary-") && name.endsWith(".yml")) {
    rmSync(join(workflowsDir, name), { force: true });
    console.log(`removed .github/workflows/${name}`);
  }
}

// Final structural checks before the workflow is allowed to commit.
const migrations = readdirSync(migrationsDir)
  .filter((name) => /^\d{4}_.*\.sql$/.test(name))
  .sort();
const numbers = migrations.map((name) => Number(name.slice(0, 4)));
const expected = Array.from({ length: Math.max(...numbers) }, (_, index) => index + 1);
if (numbers.length !== expected.length || numbers.some((value, index) => value !== expected[index])) {
  console.error(`Migration sequence is not contiguous: ${numbers.join(", ")}`);
  process.exit(1);
}

const tableCreates = new Map();
for (const name of migrations) {
  const sql = readFileSync(join(migrationsDir, name), "utf8");
  const expression = /create\s+table(?:\s+if\s+not\s+exists)?\s+(?:public\.)?([a-z_][a-z0-9_]*)/gi;
  for (const match of sql.matchAll(expression)) {
    const table = match[1].toLowerCase();
    const existing = tableCreates.get(table) ?? [];
    existing.push(name);
    tableCreates.set(table, existing);
  }
}
const duplicateTables = [...tableCreates.entries()].filter(([, files]) => files.length > 1);
if (duplicateTables.length) {
  console.error(
    "Duplicate table creation remains:\n" +
      duplicateTables.map(([table, files]) => `${table}: ${files.join(", ")}`).join("\n"),
  );
  process.exit(1);
}

remove("scripts/normalize-ministry-release.mjs");
console.log(`Normalized ${migrations.length} contiguous migrations and removed staging artifacts.`);
