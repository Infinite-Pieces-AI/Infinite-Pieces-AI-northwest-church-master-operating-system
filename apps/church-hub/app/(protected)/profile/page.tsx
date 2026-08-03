import { PageHeading } from "@/components/page-heading";
import { SignOutButton } from "@/components/sign-out-button";
import { requireViewer } from "@/lib/auth/viewer";

export default async function ProfilePage() {
  const viewer = await requireViewer();
  return (
    <>
      <PageHeading
        eyebrow="Account"
        title="Profile and privacy"
        description="Control your own contact details, notification preferences, directory visibility, sessions, and policy acknowledgements."
      />
      <section className="hub-panel">
        <h2>{viewer.displayName}</h2>
        <p>{viewer.email}</p>
        <p><strong>Roles:</strong> {viewer.roles.join(", ")}</p>
        <div className="row-actions">
          <button className="hub-button hub-button--secondary">Review active sessions</button>
          <SignOutButton demo={viewer.demo} />
        </div>
        <p className="privacy-note">Signing out also removes this device’s web-push subscription and clears the bounded offline cache.</p>
      </section>
    </>
  );
}
