import { readFileSync, writeFileSync } from "node:fs";

function read(path) {
  return readFileSync(path, "utf8");
}

function write(path, content) {
  writeFileSync(path, content, "utf8");
}

function replaceRequired(source, before, after, label) {
  if (!source.includes(before)) {
    throw new Error(`Expected ${label} was not found`);
  }
  return source.replace(before, after);
}

const workspacePath = "apps/outreach-command/components/recovery-outreach-workspace.tsx";
let workspace = read(workspacePath);
workspace = replaceRequired(
  workspace,
  'import { useEffect, useMemo, useState } from "react";',
  'import { useCallback, useEffect, useMemo, useState } from "react";',
  "Recovery Outreach React import",
);
for (const [before, after] of [
  ["  publicContact?: string;", "  publicContact?: string | undefined;"],
  ["  notes?: string;", "  notes?: string | undefined;"],
  ["  verifiedPublicSourceAt?: string;", "  verifiedPublicSourceAt?: string | undefined;"],
  ["  publicUrl?: string;", "  publicUrl?: string | undefined;"],
  ["  impressions?: number;", "  impressions?: number | undefined;"],
  ["  clicks?: number;", "  clicks?: number | undefined;"],
  ["  recommendedAction?: string;", "  recommendedAction?: string | undefined;"],
  ["  assignedTo?: string;", "  assignedTo?: string | undefined;"],
]) {
  workspace = replaceRequired(workspace, before, after, before.trim());
}

const refreshStart = workspace.indexOf("  async function refreshLive() {");
const sendLiveStart = workspace.indexOf("\n\n  async function sendLive", refreshStart);
if (refreshStart < 0 || sendLiveStart < 0) {
  throw new Error("Expected refreshLive block was not found");
}
const refreshFunction = workspace.slice(refreshStart, sendLiveStart);
const refreshCallback = refreshFunction
  .replace("  async function refreshLive() {", "  const refreshLive = useCallback(async () => {")
  .replace(/\n  }$/, "\n  }, []);");
workspace = `${workspace.slice(0, refreshStart)}${workspace.slice(sendLiveStart + 2)}`;

const firstEffectStart = workspace.indexOf("  useEffect(() => {");
const firstEffectClose = "  }, [mode]);";
const firstEffectCloseStart = workspace.indexOf(firstEffectClose, firstEffectStart);
if (firstEffectStart < 0 || firstEffectCloseStart < 0) {
  throw new Error("Expected initial mode effect was not found");
}
const firstEffectEnd = firstEffectCloseStart + firstEffectClose.length;
const safeModeEffect = `  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (mode === "showcase") {
        const stored = window.localStorage.getItem(storageKey);
        if (!stored) return;

        try {
          const parsed = JSON.parse(stored) as RecoveryOutreachPayload;
          if (
            Array.isArray(parsed.partners) &&
            Array.isArray(parsed.topics) &&
            Array.isArray(parsed.inquiries)
          ) {
            setPayload(parsed);
            setSelectedInquiryId(parsed.inquiries[0]?.id ?? null);
          }
        } catch {
          window.localStorage.removeItem(storageKey);
        }
        return;
      }

      void refreshLive();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [mode, refreshLive]);`;
workspace = `${workspace.slice(0, firstEffectStart)}${refreshCallback}\n\n${safeModeEffect}${workspace.slice(firstEffectEnd)}`;
write(workspacePath, workspace);

const overviewPath = "apps/outreach-command/app/(protected)/overview/page.tsx";
let overview = read(overviewPath);
overview = replaceRequired(
  overview,
  '      <section className="live-command-grid">\n        {[',
  '      <section className="live-command-grid">\n        {([',
  "overview command array start",
);
overview = replaceRequired(
  overview,
  '        ].map(([href, title, description]) => (',
  '        ] as const).map(([href, title, description]) => (',
  "overview command array const assertion",
);
write(overviewPath, overview);

const pagePath = "apps/outreach-command/app/(protected)/recovery-outreach/page.tsx";
write(
  pagePath,
  `import { PageHeading } from "@/components/page-heading";
import { RecoveryOutreachWorkspace } from "@/components/recovery-outreach-workspace";
import { requireOutreachViewer } from "@/lib/auth/viewer";

export default async function RecoveryOutreachPage() {
  const viewer = await requireOutreachViewer();

  return (
    <>
      <PageHeading
        eyebrow="Recovery support intelligence"
        title="Recovery Outreach"
        description="Coordinate voluntary recovery-support requests, aggregate/public questions, and approved community partnerships without identifying private searchers or profiling anyone’s addiction status."
      />
      <RecoveryOutreachWorkspace mode={viewer.demo ? "showcase" : "live"} />
    </>
  );
}
`,
);

const routePath = "apps/outreach-command/app/api/recovery-outreach/route.ts";
let route = read(routePath);
route = replaceRequired(
  route,
  'function text(value: unknown, maximum: number, required = false): string | null {\n  const normalized = typeof value === "string" ? value.trim().slice(0, maximum) : "";\n  if (required && !normalized) throw new Error("Complete the required information.");\n  return normalized || null;\n}',
  'function text(value: unknown, maximum: number, required: true): string;\nfunction text(value: unknown, maximum: number, required?: false): string | null;\nfunction text(value: unknown, maximum: number, required = false): string | null {\n  const normalized = typeof value === "string" ? value.trim().slice(0, maximum) : "";\n  if (required && !normalized) throw new Error("Complete the required information.");\n  return normalized || null;\n}',
  "Recovery Outreach text overload",
);
write(routePath, route);

console.log("Applied Recovery Outreach release-readiness fixes.");
