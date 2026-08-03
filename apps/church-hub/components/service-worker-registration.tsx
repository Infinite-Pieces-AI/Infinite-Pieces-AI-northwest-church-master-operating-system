"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const configured = process.env.NEXT_PUBLIC_PWA_ENABLED;
    const enabled = configured === undefined
      ? process.env.NODE_ENV === "production"
      : configured === "true";

    if (enabled) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
      return;
    }

    // Emergency kill switch: stop future interception and remove only the
    // bounded offline snapshot cache. The public shell contains no member data.
    navigator.serviceWorker.getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      .catch(() => undefined);
    if ("caches" in window) {
      caches.keys()
        .then((keys) => Promise.all(keys.filter((key) => key.startsWith("church-hub-offline-")).map((key) => caches.delete(key))))
        .catch(() => undefined);
    }
  }, []);
  return null;
}
