"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { PublicAnalyticsEvent } from "@church/analytics";
import { trackPublicEvent } from "@/lib/analytics-client";

export function PublicActionLink({
  href,
  event,
  properties,
  className,
  children,
  ariaLabel,
  download,
}: {
  href: string;
  event: PublicAnalyticsEvent;
  properties?: Record<string, unknown>;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
  download?: boolean;
}) {
  const track = () => trackPublicEvent(event, properties);
  const external = /^(https?:|mailto:|tel:)/.test(href);

  if (external || download) {
    return (
      <a
        className={className}
        href={href}
        aria-label={ariaLabel}
        onClick={track}
        download={download || undefined}
      >
        {children}
      </a>
    );
  }

  return (
    <Link className={className} href={href} aria-label={ariaLabel} onClick={track}>
      {children}
    </Link>
  );
}
