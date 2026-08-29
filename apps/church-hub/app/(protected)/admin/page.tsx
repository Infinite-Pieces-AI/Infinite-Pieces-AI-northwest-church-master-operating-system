import Link from "next/link";
import { notFound } from "next/navigation";
import { hasPermission, type Permission } from "@church/authorization";
import { PageHeading } from "@/components/page-heading";
import { requireViewer } from "@/lib/auth/viewer";

const tools: ReadonlyArray<{
  title: string;
  description: string;
  slug: string;
  permission: Permission;
}> = [
  {
    title: "Content",
    description:
      "Draft, review, schedule, and publish weekly lessons, events, service overrides, and announcements.",
    slug: "content",
    permission: "content.draft",
  },
  {
    title: "Service Hub",
    description:
      "Review member-led ideas, verify public sources and partner locations, create volunteer shifts, publish opportunities, and protect sponsorship and safety boundaries.",
    slug: "service",
    permission: "content.draft",
  },
  {
    title: "Access",
    description:
      "Review applicants, verify identity, issue single-use invitations, and audit role assignments.",
    slug: "access",
    permission: "access.approve",
  },
  {
    title: "Groups",
    description:
      "Manage ministries, family groups, rotation cycles, constraints, proposals, and leader approval.",
    slug: "groups",
    permission: "group.manage_assigned",
  },
  {
    title: "Volunteer Rotations",
    description:
      "Generate review-only volunteer serving proposals from approved availability, roles, frequencies, and blackout dates.",
    slug: "rotations",
    permission: "group.manage_assigned",
  },
  {
    title: "Kids Kingdom",
    description:
      "View integration health, consent review, private media queues, safeguarding controls, and fallback readiness.",
    slug: "kids",
    permission: "safeguarding.review",
  },
  {
    title: "Moderation",
    description:
      "Review reports, preserve evidence, run an advisory language preflight, apply proportionate actions, and escalate safety concerns.",
    slug: "moderation",
    permission: "moderation.review",
  },
  {
    title: "Outreach Studio",
    description:
      "Review search performance, draft content, campaigns, visitor CRM, and human publication gates.",
    slug: "outreach",
    permission: "outreach.manage",
  },
  {
    title: "Governance",
    description:
      "Audit events, access reviews, retention, incidents, backups, and production release gates.",
    slug: "governance",
    permission: "audit.read",
  },
  {
    title: "System Health",
    description:
      "Environment, integrations, job queues, errors, and restore-test status without private content access.",
    slug: "system",
    permission: "system.health.read",
  },
];

export default async function AdminPage() {
  const viewer = await requireViewer();
  const visibleTools = tools.filter((tool) => hasPermission(viewer.roles, tool.permission));
  if (!visibleTools.length) notFound();

  return (
    <>
      <PageHeading
        eyebrow="Role-limited operations"
        title="Ministry Administration"
        description="Administrative access is divided by responsibility; a developer does not automatically gain pastoral, child, prayer, recovery, or safeguarding visibility."
      />
      <div className="admin-grid">
        {visibleTools.map((tool) => (
          <Link className="admin-card" href={`/admin/${tool.slug}`} key={tool.slug}>
            <span aria-hidden="true">{tool.title.slice(0, 1)}</span>
            <h2>{tool.title}</h2>
            <p>{tool.description}</p>
            <strong>Open workspace →</strong>
          </Link>
        ))}
      </div>
      <section className="hub-panel release-panel">
        <p className="hub-kicker">Production boundary</p>
        <h2>
          The complete interfaces can be explored now; live records require approved production
          connections.
        </h2>
        <div
          className="release-meter"
          aria-label="Production governance and integration work remains"
        >
          <span style={{ width: viewer.demo ? "58%" : "82%" }} />
        </div>
        <p>
          Interactive showcase mode saves only inside this browser. Production operation requires
          church-owned Supabase configuration, approved roles, database migrations, moderation and
          safeguarding owners, restore testing, provider credentials, accessibility review, and
          Sunday fallback procedures.
        </p>
      </section>
    </>
  );
}
