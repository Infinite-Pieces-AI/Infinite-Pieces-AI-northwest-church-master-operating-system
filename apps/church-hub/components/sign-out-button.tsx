"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

async function revokeDevicePushSubscription(demo: boolean): Promise<void> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
  const registration = await navigator.serviceWorker.ready.catch(() => null);
  const subscription = await registration?.pushManager.getSubscription().catch(() => null);
  if (!subscription) return;
  if (!demo) {
    await fetch("/api/push/subscriptions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
      keepalive: true
    }).catch(() => undefined);
  }
  await subscription.unsubscribe().catch(() => false);
}

async function clearPrivateDeviceState(): Promise<void> {
  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.ready.catch(() => null);
    registration?.active?.postMessage({ type: "CLEAR_CHURCH_HUB_CACHES" });
  }
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter((key) => key.startsWith("church-hub-offline-")).map((key) => caches.delete(key))
    );
  }
}

export function SignOutButton({ demo }: { demo: boolean }) {
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  async function signOut() {
    setWorking(true);
    setError("");
    try {
      await revokeDevicePushSubscription(demo);
      if (!demo) {
        const { error: signOutError } = await createClient().auth.signOut();
        if (signOutError) throw signOutError;
      }
      await clearPrivateDeviceState();
      window.location.replace("/login");
    } catch {
      setError("Sign-out could not be completed. Close the app and contact a technical administrator if this continues.");
      setWorking(false);
    }
  }

  return (
    <div>
      <button className="hub-button hub-button--secondary" type="button" onClick={signOut} disabled={working}>
        {working ? "Signing out…" : "Sign out of this device"}
      </button>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
    </div>
  );
}
