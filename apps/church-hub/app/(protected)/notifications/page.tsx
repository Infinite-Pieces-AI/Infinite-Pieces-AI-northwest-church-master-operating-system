import { OfflineReadiness } from "@/components/offline-readiness";
import { PageHeading } from "@/components/page-heading";
import { PushNotificationSettings } from "@/components/push-notification-settings";

export default function NotificationsPage() {
  return (
    <>
      <PageHeading
        eyebrow="Your attention"
        title="Notification and offline settings"
        description="Choose useful delivery without turning the church hub into a constant interruption."
      />
      <div className="settings-stack">
        <PushNotificationSettings />
        <OfflineReadiness />
        <section className="hub-panel">
          <h2>Default preferences</h2>
          <div className="settings-list">
            <label>
              <span>Service schedule changes</span>
              <input type="checkbox" defaultChecked />
            </label>
            <label>
              <span>Assigned group announcements</span>
              <input type="checkbox" defaultChecked />
            </label>
            <label>
              <span>Event reminders</span>
              <input type="checkbox" defaultChecked />
            </label>
            <label>
              <span>Community reactions</span>
              <input type="checkbox" />
            </label>
            <label>
              <span>Weekly digest</span>
              <input type="checkbox" defaultChecked />
            </label>
          </div>
        </section>
      </div>
    </>
  );
}
