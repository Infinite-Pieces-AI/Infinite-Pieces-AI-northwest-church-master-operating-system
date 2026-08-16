import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { requireViewer } from "@/lib/auth/viewer";
import { loadFamilyWorkspace } from "@/lib/family";

const tools = [
  {
    href: "/family/household",
    icon: "⌂",
    title: "Household",
    description: "Review household members and update the household display name.",
  },
  {
    href: "/family/pickup",
    icon: "✓",
    title: "Authorized pickup",
    description: "Manage the trusted adults who may be verified for a child’s release.",
  },
  {
    href: "/family/media-consent",
    icon: "◫",
    title: "Media consent",
    description:
      "Set separate permissions for private, internal, public, social, and advertising use.",
  },
  {
    href: "/family/check-in",
    icon: "↗",
    title: "Kids Kingdom check-in",
    description: "Open the approved check-in provider and view the latest mirrored status.",
  },
  {
    href: "/family/parent-community",
    icon: "∞",
    title: "Parent community",
    description:
      "See opt-in parent connections, playdate proposals, and family-friendly Fellowship.",
  },
] as const;

export default async function FamilyPage() {
  const viewer = await requireViewer();
  const workspace = await loadFamilyWorkspace(viewer);

  return (
    <>
      <PageHeading
        eyebrow="Guardian-managed family operations"
        title="Family"
        description="Household, authorized pickup, media consent, Kids Kingdom check-in, and opt-in parent connection tools backed by the signed-in member’s authorized records."
      />

      {!workspace.configured ? (
        <section className="real-data-state real-data-state--warning">
          <h2>Connect the production backend to use family tools.</h2>
          <p>
            This page does not fabricate household or child records. Sign in through the configured
            Supabase project and apply the approved household, guardian, child, pickup, consent, and
            check-in migrations.
          </p>
        </section>
      ) : !workspace.household ? (
        <section className="real-data-state">
          <h2>No active household is linked to this account.</h2>
          <p>
            A verified administrator must link the member to the correct household before child,
            pickup, consent, or check-in information becomes visible.
          </p>
          <Link className="hub-button hub-button--secondary" href="/profile">
            Review my account
          </Link>
        </section>
      ) : (
        <>
          <section className="hub-panel">
            <div className="panel-heading">
              <div>
                <p className="hub-kicker">Current household</p>
                <h2>{workspace.household.name}</h2>
              </div>
              <span className="pill">
                {workspace.members.length} adult member{workspace.members.length === 1 ? "" : "s"} ·{" "}
                {workspace.children.length} child record{workspace.children.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="family-record-list">
              {workspace.members.map((member) => (
                <article key={member.id}>
                  <span className="avatar">{member.displayName.slice(0, 1)}</span>
                  <div>
                    <strong>{member.displayName}</strong>
                    <small>
                      {member.relationship}
                      {member.primaryContact ? " · Primary contact" : ""}
                    </small>
                  </div>
                </article>
              ))}
              {workspace.children.map((child) => (
                <article key={child.id}>
                  <span className="avatar">{child.preferredName.slice(0, 1)}</span>
                  <div>
                    <strong>{child.preferredName}</strong>
                    <small>
                      {child.className ?? "No active class assignment"}
                      {child.latestCheckinState ? ` · ${child.latestCheckinState}` : ""}
                    </small>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="family-command-grid" style={{ marginTop: 18 }}>
            {tools.map((tool) => (
              <Link className="family-command-card" href={tool.href} key={tool.href}>
                <span aria-hidden="true">{tool.icon}</span>
                <h2>{tool.title}</h2>
                <p>{tool.description}</p>
                <b>Open →</b>
              </Link>
            ))}
          </section>
        </>
      )}
    </>
  );
}
