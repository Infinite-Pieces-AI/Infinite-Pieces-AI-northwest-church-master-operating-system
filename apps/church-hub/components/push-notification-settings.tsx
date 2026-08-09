"use client";

import { useEffect, useState } from "react";
import { base64UrlToUint8Array } from "@church/pwa";

type Status = "checking" | "unsupported" | "disabled" | "enabled" | "denied" | "working" | "error";

function toApplicationServerKey(value: string): ArrayBuffer {
  const bytes = base64UrlToUint8Array(value);
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

export function PushNotificationSettings() {
  const [status, setStatus] = useState<Status>("checking");
  const [message, setMessage] = useState("Checking browser support…");

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      // Yield once so state updates happen from the asynchronous task rather than
      // synchronously inside the effect body.
      await Promise.resolve();
      if (!active) return;

      if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        setStatus("unsupported");
        setMessage("This browser does not support web push notifications.");
        return;
      }
      if (Notification.permission === "denied") {
        setStatus("denied");
        setMessage("Notifications are blocked in this browser's site settings.");
        return;
      }

      try {
        const response = await fetch("/api/push/subscriptions", { cache: "no-store" });
        const data = (await response.json()) as { enabled?: boolean };
        if (!active) return;
        setStatus(data.enabled ? "enabled" : "disabled");
        setMessage(
          data.enabled
            ? "Push notifications are enabled on at least one device."
            : "Push notifications are currently off.",
        );
      } catch {
        if (!active) return;
        setStatus("error");
        setMessage("Push settings could not be loaded.");
      }
    }

    void loadSettings();
    return () => {
      active = false;
    };
  }, []);

  async function enable() {
    try {
      setStatus("working");
      setMessage("Requesting permission…");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "disabled");
        setMessage(
          permission === "denied"
            ? "Notifications were blocked by the browser."
            : "Notification permission was not granted.",
        );
        return;
      }
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) throw new Error("VAPID public key is not configured");
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: toApplicationServerKey(publicKey),
        }));
      const response = await fetch("/api/push/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          deviceLabel: navigator.platform || "Member device",
        }),
      });
      if (!response.ok) throw new Error("Subscription could not be saved");
      setStatus("enabled");
      setMessage(
        "Push notifications are enabled. Lock-screen messages remain generic for privacy.",
      );
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Push notifications could not be enabled.",
      );
    }
  }

  async function disable() {
    try {
      setStatus("working");
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/push/subscriptions", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setStatus("disabled");
      setMessage("Push notifications are off on this device.");
    } catch {
      setStatus("error");
      setMessage("Push notifications could not be disabled.");
    }
  }

  return (
    <section className="hub-panel notification-capability" aria-live="polite">
      <div>
        <p className="hub-kicker">Web Push · VAPID protected</p>
        <h2>Device notifications</h2>
        <p>{message}</p>
        <small>
          Prayer text, child details, counseling content, and safeguarding information are never
          placed on the lock screen.
        </small>
      </div>
      <div className="row-actions">
        {status !== "enabled" ? (
          <button
            className="hub-button hub-button--primary"
            disabled={["unsupported", "denied", "working", "checking"].includes(status)}
            onClick={enable}
          >
            Enable on this device
          </button>
        ) : (
          <button className="hub-button hub-button--secondary" onClick={disable}>
            Disable on this device
          </button>
        )}
      </div>
    </section>
  );
}
