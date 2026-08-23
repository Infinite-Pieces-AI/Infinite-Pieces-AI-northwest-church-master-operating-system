import Link from "next/link";
import { hasPermission, type Permission } from "@church/authorization";
import { PageHeading } from "@/components/page-heading";
import { requireViewer } from "@/lib/auth/viewer";

const destinations = [
  ["Serve", "/serve", "◇", "Find approved service projects, volunteer shifts, requirements, and team communication."],
  ["Recovery Ministry", "/recovery", "↺", "Open the private, opt-in recovery journey, group, resources, and leader tools."],
  ["Community", "/community", "◌", "Open assigned church, ministry, parent, and group conversations."],
  ["Events", "/events", "□", "Review events, registrations, volunteer opportunities, and calendar details."],
  ["Connection Path", "/connection-path", "↗", "Choose a voluntary next step for fellowship, Scripture, Sunday, or service."],
  ["Family", "/family", "⌁", "Manage household, children, check-in, pickup, media consent, and parent connections."],
  ["Connection Preferences", "/connection-preferences", "◎", "Control the times, gathering types, family fit, and general areas used for suggestions."],
  ["Notifications", "/notifications", "◉", "Set quiet hours and choose which reminders reach each device."],
  ["Profile", "/profile", "○", "Manage account, privacy, authentication, and member profile settings."],
] as const;

const adminPermissions: readonly Permission[] = [
  "content.draft",
  "access.approve",
  "group.manage_assigned",
  "safeguarding.review",
  "moderation.review",
  "outreach.manage",
  "audit.read",
  "system.health.read",
];

export default async function MorePage() {
  const viewer = await requireViewer();
  const canAdmin = adminPermissions.some((permission) => hasPermission(viewer.roles, permission));

  return (
    <>
      <PageHeading
        eyebrow="Every ministry tool"
        title="More"
        description="Open service, recovery, family, communication, settings, and the other Church Hub workspaces from one mobile-friendly directory."
      />
      <section className="hub-more-grid" aria-label="Additional Church Hub destinations">
        {destinations.map(([title, href, icon, description]) => (
          <Link className="hub-more-card" href={href} key={href}>
            <span aria-hidden="true">{icon}</span>
            <div>
              <strong>{title}</strong>
              <p>{description}</p>
            </div>
            <b aria-hidden="true">›</b>
          </Link>
        ))}
        {canAdmin ? (
          <Link className="hub-more-card hub-more-card--admin" href="/admin">
            <span aria-hidden="true">⚙</span>
            <div>
              <strong>Ministry Administration</strong>
              <p>Open the authorized content, moderation, safety, access, rotation, and ministry operations console.</p>
            </div>
            <b aria-hidden="true">›</b>
          </Link>
        ) : null}
      </section>
    </>
  );
}
