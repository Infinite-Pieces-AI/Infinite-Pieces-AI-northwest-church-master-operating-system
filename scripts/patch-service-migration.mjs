import { readFileSync, writeFileSync, rmSync } from "node:fs";

const path = "supabase/migrations/0039_service_hub_completion.sql";
const workflowPath = ".github/workflows/temporary-service-migration-patch.yml";
let sql = readFileSync(path, "utf8");

const invalid = `  updated_at timestamptz not null default timezone('utc', now()),
  check ((approved_for_members or approved_for_public) implies (reviewed_by is not null and reviewed_at is not null))
);

-- PostgreSQL does not support an IMPLIES operator; replace the intended check.
alter table public.service_impact_updates
  drop constraint if exists service_impact_updates_check;
alter table public.service_impact_updates
  add constraint service_impact_updates_approval_check check (
    (not approved_for_members and not approved_for_public)
    or (reviewed_by is not null and reviewed_at is not null)
  );`;

const valid = `  updated_at timestamptz not null default timezone('utc', now()),
  constraint service_impact_updates_approval_check check (
    (not approved_for_members and not approved_for_public)
    or (reviewed_by is not null and reviewed_at is not null)
  )
);`;

if (!sql.includes(invalid)) {
  throw new Error("Expected invalid service impact constraint block was not found.");
}

sql = sql.replace(invalid, valid);
writeFileSync(path, sql, "utf8");
rmSync("scripts/patch-service-migration.mjs", { force: true });
rmSync(workflowPath, { force: true });
console.log("Patched service migration and removed one-time helper files.");
