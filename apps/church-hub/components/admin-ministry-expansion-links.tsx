import Link from "next/link";

export function AdminMinistryExpansionLinks({
  canModerate,
  canReviewPrayer,
  canManageRecovery,
}: {
  canModerate: boolean;
  canReviewPrayer: boolean;
  canManageRecovery: boolean;
}) {
  const links = [
    canModerate
      ? [
          "Gift marketplace moderation",
          "/admin/gifts",
          "Review member offers, needs, item sharing, paid services, and risk indicators.",
        ]
      : null,
    canReviewPrayer
      ? [
          "Restricted prayer routing",
          "/admin/prayer",
          "Coordinate authorized pastoral and safeguarding follow-up outside the member feed.",
        ]
      : null,
    canManageRecovery
      ? [
          "Recovery program and access",
          "/admin/recovery",
          "Configure the private program, review access requests, and confirm curriculum boundaries.",
        ]
      : null,
  ].filter((value): value is [string, string, string] => Boolean(value));

  if (!links.length) return null;
  return (
    <section className="admin-expansion-links">
      <header>
        <p>New ministry workspaces</p>
        <h2>Gifts, prayer, and recovery operations</h2>
      </header>
      <div>
        {links.map(([title, href, description]) => (
          <Link href={href} key={href}>
            <strong>{title}</strong>
            <span>{description}</span>
            <b>Open workspace →</b>
          </Link>
        ))}
      </div>
    </section>
  );
}
