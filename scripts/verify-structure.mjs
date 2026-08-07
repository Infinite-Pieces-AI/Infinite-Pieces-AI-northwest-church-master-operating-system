import { existsSync } from "node:fs";
import { resolve } from "node:path";

const required = [
  "apps/public-web/app/page.tsx",
  "apps/public-web/app/api/revalidate/route.ts",
  "apps/church-hub/app/(protected)/this-week/page.tsx",
  "apps/church-hub/app/(protected)/admin/outreach/page.tsx",
  "apps/church-hub/app/api/push/subscriptions/route.ts",
  "apps/church-hub/app/api/offline/service-schedule/route.ts",
  "apps/church-hub/app/api/offline/weekly-lesson/route.ts",
  "apps/church-hub/components/realtime-presence-indicator.tsx",
  "apps/church-hub/components/protected-media-frame.tsx",
  "apps/church-hub/components/sign-out-button.tsx",
  "apps/church-hub/proxy.ts",
  "apps/church-hub/app/(protected)/mfa/page.tsx",
  "apps/workers/notification-jobs/src/index.ts",
  "apps/workers/push-delivery/src/index.ts",
  "apps/workers/group-rotation-proposals/src/index.ts",
  "packages/authorization/src/index.ts",
  "packages/group-rotation/src/index.ts",
  "packages/kids-checkin/src/index.ts",
  "packages/outreach/src/index.ts",
  "packages/pwa/src/index.ts",
  "packages/realtime/src/index.ts",
  "packages/validation/src/index.ts",
  "supabase/migrations/0001_extensions_and_enums.sql",
  "supabase/migrations/0008_rls_helpers_and_policies.sql",
  "supabase/migrations/0010_outbox_triggers_and_integrity.sql",
  "supabase/migrations/0011_message_idempotency.sql",
  "supabase/migrations/0012_pwa_push_and_realtime.sql",
  "supabase/migrations/0013_kids_kiosk_and_labels.sql",
  "supabase/migrations/0014_curriculum_and_outreach_studio.sql",
  "supabase/migrations/0015_relationship_graph_and_rotation_refinement.sql",
  "supabase/migrations/0016_notification_delivery_claims.sql",
  "supabase/tests/0001_schema_security.test.sql",
  "supabase/tests/0002_rls_boundaries.test.sql",
  "supabase/tests/0003_master_ecosystem.test.sql",
  "docs/ARCHITECTURE.md",
  "docs/MASTER_OPERATING_SYSTEM.md",
  "docs/SOURCE_INTEGRATION_NOTES.md",
  "docs/PWA_OFFLINE_AND_PUSH.md",
  "docs/REALTIME_AND_PRESENCE.md",
  "docs/KIDS_KINGDOM_KIOSK.md",
  "docs/GROUP_ROTATION_GRAPH_MODEL.md",
  "docs/SEO_AI_AND_AD_GRANTS.md",
  "docs/RELEASE_GATES.md",
  "docs/VALIDATION_REPORT.md",
  "scripts/validate-sql-static.mjs",
  "scripts/validate-workspace-contracts.mjs",
  ".github/workflows/ci.yml",
  ".github/workflows/production-promotion.yml",
];

const missing = required.filter((entry) => !existsSync(resolve(process.cwd(), entry)));
if (missing.length > 0) {
  console.error(
    `Missing required project files:\n${missing.map((item) => `- ${item}`).join("\n")}`,
  );
  process.exit(1);
}

console.log(`Structure verified: ${required.length} required files present.`);
