import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = process.cwd();
const errors = [];
const warnings = [];

function fail(message) {
  errors.push(message);
}
function warn(message) {
  warnings.push(message);
}
function text(path) {
  const full = resolve(root, path);
  if (!existsSync(full)) {
    fail(`Missing required production-readiness file: ${path}`);
    return "";
  }
  return readFileSync(full, "utf8");
}
function walk(path) {
  const full = resolve(root, path);
  if (!existsSync(full)) return [];
  const rows = [];
  for (const name of readdirSync(full)) {
    const child = join(full, name);
    const info = statSync(child);
    if (info.isDirectory()) rows.push(...walk(relative(root, child)));
    else rows.push(relative(root, child).replaceAll("\\", "/"));
  }
  return rows;
}

const env = text(".env.example");
for (const [key, expected] of [
  ["NEXT_PUBLIC_ENABLE_DEMO", "false"],
  ["ALLOW_LOCAL_PREVIEW_MODE", "false"],
  ["ALLOW_LOCAL_INVITE_TOKEN_RETURN", "false"],
  ["OUTREACH_AUTO_REPLY_ENABLED", "false"],
  ["OUTREACH_AUTOMATIC_CONTACT", "false"],
  ["OUTREACH_AUTOMATIC_PUBLISHING", "false"],
]) {
  const match = env.match(new RegExp(`^${key}=(.*)$`, "m"));
  if (!match || match[1]?.trim() !== expected) {
    fail(`${key} must default to ${expected} in .env.example`);
  }
}

const required = [
  "packages/church-content/src/navigation.ts",
  "apps/public-web/components/ministry-navigator.tsx",
  "apps/public-web/app/api/guide/route.ts",
  "apps/public-web/app/request-member-access/page.tsx",
  "apps/church-hub/components/ministry-navigator.tsx",
  "apps/church-hub/app/api/ai/navigation/route.ts",
  "apps/church-hub/lib/family.ts",
  "apps/church-hub/app/(protected)/family/household/page.tsx",
  "apps/church-hub/app/(protected)/family/pickup/page.tsx",
  "apps/church-hub/app/(protected)/family/media-consent/page.tsx",
  "apps/church-hub/app/(protected)/family/check-in/page.tsx",
  "apps/church-hub/app/(protected)/family/parent-community/page.tsx",
  "apps/outreach-command/app/(protected)/member-access/page.tsx",
  "apps/outreach-command/app/(protected)/production-readiness/page.tsx",
  "apps/outreach-command/lib/live-intelligence.ts",
  "docs/PRODUCTION_READINESS_AUDIT.md",
];
required.forEach(text);

const hubViewer = text("apps/church-hub/lib/auth/viewer.ts");
const outreachViewer = text("apps/outreach-command/lib/auth/viewer.ts");
for (const [label, source] of [
  ["Church Hub", hubViewer],
  ["Outreach OS", outreachViewer],
]) {
  if (!source.includes('process.env.NEXT_PUBLIC_ENABLE_DEMO === "true"')) {
    fail(`${label} preview mode must require NEXT_PUBLIC_ENABLE_DEMO=true`);
  }
  if (!source.includes('process.env.ALLOW_LOCAL_PREVIEW_MODE === "true"')) {
    fail(`${label} preview mode must require ALLOW_LOCAL_PREVIEW_MODE=true`);
  }
  if (!source.includes('process.env.NODE_ENV !== "production"')) {
    fail(`${label} preview mode must be impossible in production`);
  }
}

const highRiskRoots = [
  "apps/public-web/app",
  "apps/public-web/components",
  "apps/church-hub/app/(protected)/family",
  "apps/church-hub/app/api/ai",
  "apps/church-hub/components/bible-context-companion.tsx",
  "apps/outreach-command/app/(protected)",
];
const highRiskFiles = highRiskRoots
  .flatMap((entry) => {
    const full = resolve(root, entry);
    if (!existsSync(full)) return [];
    return statSync(full).isDirectory() ? walk(entry) : [entry];
  })
  .filter((path) => /\.(ts|tsx|js|mjs)$/.test(path));

const prohibitedRuntimePatterns = [
  [/\bSample Household\b/i, "sample household runtime content"],
  [/\bSample Child\b/i, "sample child runtime content"],
  [/\bSynthetic demo response\b/i, "synthetic AI response"],
  [/\bSynthetic example\b/i, "synthetic runtime example"],
  [/\bApproved sermon content appears here\b/i, "fabricated sermon fallback"],
  [/\bPre-check integration pending\b/i, "dead check-in placeholder"],
  [/\bmode\s*:\s*["']demo["']/i, "demo API response"],
  [/\bdemoModeration\b/, "synthetic moderation engine"],
  [/\bsyntheticProposal\b/, "synthetic rotation engine"],
  [/\bsynthetic preflight\b/i, "synthetic moderation output"],
];

for (const path of highRiskFiles) {
  const source = readFileSync(resolve(root, path), "utf8");
  for (const [pattern, label] of prohibitedRuntimePatterns) {
    if (pattern.test(source)) fail(`${path} contains prohibited ${label}`);
  }
  if (
    path.startsWith("apps/outreach-command/app/(protected)/") &&
    /from\s+["'][^"']*demo-data["']/.test(source)
  ) {
    fail(`${path} imports runtime demo data inside the protected Outreach OS`);
  }
  if (
    path.startsWith("apps/church-hub/app/(protected)/family") &&
    /from\s+["'][^"']*demo-data["']/.test(source)
  ) {
    fail(`${path} imports runtime demo data inside Family`);
  }
}

const bibleRoute = text("apps/church-hub/app/api/ai/bible/route.ts");
if (/mode\s*:\s*["']demo["']/.test(bibleRoute) || /synthetic/i.test(bibleRoute)) {
  fail("Bible AI endpoint must return a real provider answer or an honest unavailable response");
}
const publicGuide = text("apps/public-web/app/api/guide/route.ts");
if (!publicGuide.includes("recommendMinistryDestinations")) {
  fail("Public guide must have a deterministic approved-route fallback");
}
const memberGuide = text("apps/church-hub/app/api/ai/navigation/route.ts");
if (!memberGuide.includes("recommendMinistryDestinations")) {
  fail("Member guide must have a deterministic approved-route fallback");
}

const packageJson = JSON.parse(text("package.json"));
if (!String(packageJson.scripts?.check ?? "").includes("verify:runtime-readiness")) {
  fail("The main check pipeline must run verify:runtime-readiness");
}

for (const message of warnings) console.warn(`WARNING: ${message}`);
if (errors.length) {
  console.error("Runtime readiness audit failed:");
  for (const message of errors) console.error(`- ${message}`);
  process.exit(1);
}
console.log(
  `Runtime readiness audit passed: ${required.length} required files and ${highRiskFiles.length} high-risk runtime files checked.`,
);
