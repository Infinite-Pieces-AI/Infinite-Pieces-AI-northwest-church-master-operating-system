import { AdminWorkspaceShell } from "@/components/admin-workspace-shell";
import { MasterCapabilityBoard, ReadinessChecklist } from "@/components/master-capability-board";
import { requirePermission } from "@/lib/auth/require-permission";

const capabilities = [
  {
    title: "Two-project Vercel monorepo",
    description: "The public site and private hub deploy independently from one pnpm/Turborepo repository while sharing types, UI, content models, database contracts, and security rules.",
    status: "configured" as const,
    owner: "Technical lead",
    evidence: "apps/public-web + apps/church-hub"
  },
  {
    title: "Protected production promotion",
    description: "Pull requests create previews, main represents integrated staging, and production promotion runs through a manually dispatched workflow protected by the production GitHub environment.",
    status: "planned" as const,
    owner: "Release manager",
    boundary: "Production deployment requires reviewers, passing checks, environment secrets, and an explicit release reason."
  },
  {
    title: "Privacy-aware PWA",
    description: "The hub installs to a home screen and may save only approved public schedule and weekly lesson summaries for poor-connectivity use at the venue.",
    status: "configured" as const,
    owner: "Frontend lead",
    boundary: "Chats, prayer, children, households, authentication, and personalized API responses are never stored in the offline cache."
  },
  {
    title: "VAPID web push",
    description: "User-owned push subscriptions, a server-side delivery worker, safe generic lock-screen payloads, revocation handling, and notification preferences support timely updates.",
    status: "configured" as const,
    owner: "Platform engineer",
    boundary: "Sensitive details appear only after authenticated app entry, never in a lock-screen push body."
  },
  {
    title: "Private realtime and presence",
    description: "RLS-authorized Supabase topics provide broadcast and sparse presence for assigned channels, family groups, announcements, and authorized Kids class operations.",
    status: "review" as const,
    owner: "Platform engineer",
    boundary: "Presence exposes only a display label and coarse activity. It cannot be used to track vulnerable groups across unauthorized channels."
  },
  {
    title: "Durable event and worker layer",
    description: "Outbox events power Planning Center synchronization, notifications, push delivery, Search Console aggregation, social publishing, AI jobs, group proposals, and public revalidation.",
    status: "configured" as const,
    owner: "Backend engineer",
    boundary: "Workers are idempotent, server-only, auditable, and dry-run by default."
  }
];

export default async function Page() {
  await requirePermission("system.health.read");
  return (
    <>
      <AdminWorkspaceShell
        title="System health and integration control"
        description="Deployment, PWA, realtime, push, database, storage, queues, providers, backups, and recovery status—without granting technical staff blanket access to private ministry content."
      />
      <MasterCapabilityBoard
        heading="Platform Control Plane"
        introduction="The merged operating system keeps one architecture and one policy model while allowing the public website, private PWA, administration tools, and server workers to deploy and scale independently."
        cards={capabilities}
      />
      <ReadinessChecklist
        title="Production infrastructure"
        items={[
          { label: "Church-owned GitHub, Vercel, Supabase, domain, and provider accounts", complete: false },
          { label: "Two recovery administrators for every production account", complete: false },
          { label: "Development, staging, and production data boundaries verified", complete: false },
          { label: "Database and object-storage restore exercise passed", complete: false },
          { label: "Authorization, accessibility, and security suites pass", complete: false },
          { label: "Production environment approval workflow enabled", complete: false }
        ]}
      />
    </>
  );
}
