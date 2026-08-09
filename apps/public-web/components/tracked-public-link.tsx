"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import type { PublicAnalyticsEvent } from "@church/analytics";
import { trackPublicEvent } from "@/lib/analytics-client";

type LinkProps = ComponentProps<typeof Link>;

export function TrackedPublicLink({
  eventName,
  eventProperties,
  onClick,
  ...props
}: LinkProps & {
  eventName: PublicAnalyticsEvent;
  eventProperties?: Record<string, string | number | boolean | null>;
}) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        trackPublicEvent(eventName, eventProperties ?? {});
        onClick?.(event);
      }}
    />
  );
}
