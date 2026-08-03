"use client";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export function PublicTelemetry() {
  if (process.env.NEXT_PUBLIC_PUBLIC_ANALYTICS_PROVIDER !== "vercel") return null;
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
