"use client";

import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import {
  buildRealtimeTopic,
  policyForScope,
  sanitizePresenceState,
  type PresenceActivity,
  type RealtimeTopicScope,
  type SafePresenceState
} from "@church/realtime";

export interface PrivateChannelSession {
  channel: RealtimeChannel;
  topic: string;
  disconnect: () => Promise<void>;
  setActivity: (activity: PresenceActivity) => Promise<void>;
}

/**
 * Opens a private Supabase Realtime channel whose topic is authorized by
 * database RLS. Presence remains sparse and should never include contact,
 * household, location, child, prayer, counseling, or message content.
 */
export async function openPrivateChannel(input: {
  supabase: SupabaseClient;
  scope: RealtimeTopicScope;
  entityId: string;
  profileId: string;
  displayLabel: string;
  clientInstanceId: string;
  onPresenceSync?: (states: readonly SafePresenceState[]) => void;
}): Promise<PrivateChannelSession> {
  const topic = buildRealtimeTopic(input.scope, input.entityId);
  const policy = policyForScope(input.scope);
  let currentActivity: PresenceActivity = "online";

  const channel = input.supabase.channel(topic, {
    config: {
      private: policy.private,
      presence: { key: input.profileId },
      broadcast: { self: false, ack: true }
    }
  });

  if (policy.exposePresence && input.onPresenceSync) {
    channel.on("presence", { event: "sync" }, () => {
      const raw = channel.presenceState<SafePresenceState>();
      const states = Object.values(raw)
        .flat()
        .map((state) => {
          try {
            return sanitizePresenceState(state);
          } catch {
            return null;
          }
        })
        .filter((state): state is SafePresenceState => state !== null);
      input.onPresenceSync?.(states);
    });
  }

  const track = async (activity: PresenceActivity) => {
    currentActivity = activity;
    if (!policy.exposePresence) return;
    await channel.track(
      sanitizePresenceState({
        profileId: input.profileId,
        displayLabel: input.displayLabel,
        activity: currentActivity,
        clientInstanceId: input.clientInstanceId,
        updatedAt: new Date().toISOString()
      })
    );
  };

  await new Promise<void>((resolve, reject) => {
    const timeout = globalThis.setTimeout(() => reject(new Error("Realtime subscription timed out")), 10_000);
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        globalThis.clearTimeout(timeout);
        await track("online");
        resolve();
      }
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        globalThis.clearTimeout(timeout);
        reject(new Error(`Realtime subscription failed: ${status}`));
      }
    });
  });

  return {
    channel,
    topic,
    setActivity: track,
    disconnect: async () => {
      try {
        if (policy.exposePresence) await channel.untrack();
      } finally {
        await input.supabase.removeChannel(channel);
      }
    }
  };
}
