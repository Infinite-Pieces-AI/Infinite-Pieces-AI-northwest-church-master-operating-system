import { AdminWorkspaceShell } from "@/components/admin-workspace-shell";
import {
  ApprovalRail,
  MasterCapabilityBoard,
  ReadinessChecklist,
} from "@/components/master-capability-board";
import { requirePermission } from "@/lib/auth/require-permission";

const capabilities = [
  {
    title: "Planning Center or approved ChMS source of truth",
    description:
      "The parent hub can pre-check and mirror status while the proven operational system remains authoritative for arrival, class assignment, security labels, and release.",
    status: "review" as const,
    owner: "Kids Kingdom director",
    boundary:
      "Custom checkout remains disabled until a documented safety review, drill, and rollback plan pass.",
    evidence: "packages/planning-center + packages/kids-checkin",
  },
  {
    title: "Kiosk and QR adapter",
    description:
      "Provider-neutral kiosk contracts support authenticated household lookup, short-lived check-in credentials, device registration, and service-session scoping.",
    status: "configured" as const,
    owner: "Sunday operations",
    boundary:
      "QR credentials identify a check-in transaction; they do not independently authorize child release.",
  },
  {
    title: "Label and printer bridge",
    description:
      "A local bridge can receive approved print jobs for child labels and guardian security receipts without exposing service-role credentials to a kiosk browser.",
    status: "planned" as const,
    owner: "Technical administrator",
    boundary:
      "Only minimum operational fields should be printed. Detailed care notes remain in the authorized system.",
  },
  {
    title: "Release evidence and dual verification",
    description:
      "Release actions can record the provider reference, authorized volunteer, verified guardian or pickup person, matching security evidence, and timestamp.",
    status: "blocked" as const,
    owner: "Safeguarding lead",
    boundary:
      "No custom release action is enabled merely because a matching code exists. The approved Sunday protocol governs.",
  },
  {
    title: "Private classroom media",
    description:
      "Uploads are validated, stripped of location metadata, consent-scoped, moderated, stored privately, and served through short-lived access links.",
    status: "review" as const,
    owner: "Media moderator",
    boundary:
      "Viewer watermarks and disabled context menus are deterrents only; they cannot prevent screenshots or redistribution.",
  },
  {
    title: "Guardian-managed parent community",
    description:
      "Adults opt into parent connections and playdate proposals while home addresses, schools, recurring schedules, custody details, and precise locations remain private.",
    status: "planned" as const,
    owner: "Parent ministry leader",
    boundary:
      "Children under 13 receive no independent social account. Teen communication stays in leader-visible group channels.",
  },
];

export default async function Page() {
  await requirePermission("safeguarding.review");
  return (
    <>
      <AdminWorkspaceShell
        title="Kids Kingdom operations"
        description="A parent-friendly experience layered over a proven check-in system, with release gates, private media, consent scope, and Sunday fallback at the center."
      />
      <ApprovalRail
        steps={[
          {
            label: "Integrate",
            detail: "Connect the approved ChMS and synthetic test roster.",
            state: "current",
          },
          {
            label: "Rehearse",
            detail: "Run kiosk, printer, offline, and manual fallback drills.",
            state: "future",
          },
          {
            label: "Review",
            detail: "Safeguarding, privacy, and operations sign-off.",
            state: "future",
          },
          {
            label: "Pilot",
            detail: "Limited service with trained staff and provider fallback.",
            state: "future",
          },
          {
            label: "Operate",
            detail: "Monitor, audit, and re-certify access regularly.",
            state: "future",
          },
        ]}
      />
      <MasterCapabilityBoard
        heading="Kids Kingdom Safety Core"
        introduction="The new kiosk, QR, printer, photo, and parent-networking ideas are included as governed adapters. Safety-critical check-in and release remain integration-first rather than being replaced by an unproven custom flow."
        cards={capabilities}
      />
      <ReadinessChecklist
        title="Custom release feature gate"
        items={[
          { label: "Approved system of record selected", complete: false },
          { label: "Child and teen online-safety policy approved", complete: false },
          { label: "Kiosk and printer threat model reviewed", complete: false },
          { label: "Manual Sunday fallback rehearsed", complete: false },
          { label: "Guardian and authorized-pickup test cases pass", complete: false },
          { label: "Safety review identifier recorded", complete: false },
        ]}
      />
    </>
  );
}
