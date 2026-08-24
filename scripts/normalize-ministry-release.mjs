// Triggered after the normalization workflow was present on the source branch.
import { existsSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
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

remove("supabase/migrations/0028_recovery_access_moderation_and_public_interest.sql");
remove("supabase/migrations/0029_ministry_operational_indexes_and_prayer_routing.sql");

const migrationFiles = readdirSync(migrationsDir)
  .filter((name) => /^00(?:2[7-9]|3\d|4\d)_.*\.sql$/.test(name))
  .map((name) => join("supabase", "migrations", name));
const prayerSqlReplacements = [["public.prayer_requests", "public.member_prayer_requests"]];
for (const path of migrationFiles) replaceInFile(path, prayerSqlReplacements);

for (const path of [
  "supabase/tests/0008_gifts_prayer_recovery_ministries.test.sql",
  "apps/church-hub/app/api/prayer-well/route.ts",
  "apps/church-hub/app/api/prayer-well-complete/route.ts",
  "apps/church-hub/app/api/admin/prayer/route.ts",
]) {
  replaceInFile(path, [
    ["public.prayer_requests", "public.member_prayer_requests"],
    ['.from("prayer_requests")', '.from("member_prayer_requests")'],
    [".from('prayer_requests')", ".from('member_prayer_requests')"],
  ]);
}

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
  'Returns only the minimal program information needed for an active church member to request leader-reviewed recovery-ministry access. It never returns participant rosters, exact private locations, posts, progress, or attendance.';

commit;
`;
writeFileSync(
  join(migrationsDir, "0030_recovery_access_option_rpc.sql"),
  canonicalAccessMigration,
  "utf8",
);
console.log("rewrote supabase/migrations/0030_recovery_access_option_rpc.sql");

const workflowsDir = join(root, ".github", "workflows");
for (const name of readdirSync(workflowsDir)) {
  if (name.startsWith("temporary-") && name.endsWith(".yml")) {
    rmSync(join(workflowsDir, name), { force: true });
    console.log(`removed .github/workflows/${name}`);
  }
}
remove("scripts/normalize-ministry-release.mjs");

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

const forbidden = [
  "recovery_access_requests",
  "public_recovery_inquiries",
  "recovery_partner_actions",
];
const forbiddenHits = [];
for (const full of walk(root)) {
  if (!/\.(?:sql|ts|tsx|js|mjs|md|yml|yaml)$/.test(full)) continue;
  const text = readFileSync(full, "utf8");
  for (const token of forbidden) {
    if (text.includes(token)) forbiddenHits.push(`${relative(root, full)} -> ${token}`);
  }
}
if (forbiddenHits.length) {
  console.error("Superseded recovery identifiers remain:\n" + forbiddenHits.join("\n"));
  process.exit(1);
}

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

console.log(`Normalized ${migrations.length} contiguous migrations with no duplicate table creation.`);
