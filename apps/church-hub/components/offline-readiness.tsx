"use client";

import { useEffect, useState } from "react";

export function OfflineReadiness() {
  const [online, setOnline] = useState(true);
  const [message, setMessage] = useState(
    "Save the public service schedule and approved weekly lesson summary for low-connectivity Sundays.",
  );

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  async function save() {
    try {
      const responses = await Promise.all([
        fetch("/api/offline/service-schedule", { cache: "reload" }),
        fetch("/api/offline/weekly-lesson", { cache: "reload" }),
      ]);
      if (responses.some((response) => !response.ok))
        throw new Error("Offline snapshot request failed");
      setMessage("Offline-safe service and lesson summaries were refreshed on this device.");
    } catch {
      setMessage("The offline-safe snapshot could not be refreshed. Try again when connected.");
    }
  }

  return (
    <section className="hub-panel notification-capability" aria-live="polite">
      <div>
        <p className="hub-kicker">Offline Readiness</p>
        <h2>{online ? "Connected" : "Offline"}</h2>
        <p>{message}</p>
        <small>
          Community messages, household information, child status, and prayer requests are never
          cached for offline use.
        </small>
      </div>
      <button className="hub-button hub-button--secondary" disabled={!online} onClick={save}>
        Refresh safe snapshot
      </button>
    </section>
  );
}
