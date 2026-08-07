"use client";

import { useEffect, useId, useMemo, useState } from "react";
import type { SafePresenceState } from "@church/realtime";
import { createClient } from "@/lib/supabase/client";
import { openPrivateChannel } from "@/lib/realtime/private-channel";

export function RealtimePresenceIndicator({
  channelId,
  profileId,
  displayLabel,
  demo = false,
}: {
  channelId: string;
  profileId: string;
  displayLabel: string;
  demo?: boolean;
}) {
  const reactInstanceId = useId();
  const realtimeConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  const realtimeEnabled = !demo && realtimeConfigured;
  const [states, setStates] = useState<readonly SafePresenceState[]>([]);
  const [status, setStatus] = useState<"offline" | "connecting" | "private" | "unavailable">(
    demo ? "private" : realtimeEnabled ? "connecting" : "unavailable",
  );
  const clientInstanceId = useMemo(
    () =>
      `web_${profileId.replaceAll("-", "")}_${channelId.replaceAll("-", "")}_${reactInstanceId.replace(/[^a-zA-Z0-9]/g, "")}`,
    [channelId, profileId, reactInstanceId],
  );

  useEffect(() => {
    if (!realtimeEnabled) return;

    let active = true;
    let disconnect: (() => Promise<void>) | undefined;
    void openPrivateChannel({
      supabase: createClient(),
      scope: "channel",
      entityId: channelId,
      profileId,
      displayLabel,
      clientInstanceId,
      onPresenceSync: (next) => active && setStates(next),
    })
      .then((session) => {
        disconnect = session.disconnect;
        if (active) setStatus("private");
      })
      .catch(() => {
        if (active) setStatus("unavailable");
      });

    return () => {
      active = false;
      if (disconnect) void disconnect();
    };
  }, [channelId, clientInstanceId, displayLabel, profileId, realtimeEnabled]);

  const visible = states.filter((state) => state.activity !== "typing").slice(0, 3);
  return (
    <div className="presence-indicator" aria-live="polite">
      <span className={`presence-dot presence-dot--${status}`} aria-hidden="true" />
      <div>
        <strong>
          {status === "private"
            ? "Private realtime"
            : status === "connecting"
              ? "Connecting"
              : "Realtime unavailable"}
        </strong>
        <small>
          {demo
            ? "Synthetic preview · database authorization required in production"
            : visible.length
              ? `${visible.map((state) => state.displayLabel).join(", ")} online`
              : "Presence is limited to this assigned channel"}
        </small>
      </div>
    </div>
  );
}
