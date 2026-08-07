import type { ReactNode } from "react";
import Link from "next/link";

export function IconCard({
  icon,
  title,
  children,
  href,
  linkLabel,
}: {
  icon: string;
  title: string;
  children: ReactNode;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <article className="feature-card">
      <span className="feature-card__icon" aria-hidden="true">
        {icon}
      </span>
      <h3>{title}</h3>
      <div>{children}</div>
      {href && linkLabel ? (
        <Link href={href}>
          {linkLabel} <span aria-hidden="true">→</span>
        </Link>
      ) : null}
    </article>
  );
}
