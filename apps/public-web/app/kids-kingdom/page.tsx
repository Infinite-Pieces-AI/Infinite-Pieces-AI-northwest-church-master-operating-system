import { ContentPage } from "@/components/content-page";

export default function Page() {
  return (
    <ContentPage
      eyebrow="Families"
      title="Kids Kingdom"
      intro="Learn about Sunday classes, guardian-managed information, secure check-in integration, volunteer safety, and media permissions."
    >
      <h2>Integrate before replacing</h2>
      <p>
        The parent experience can live in the Church Hub while a proven church-management system
        remains the operational source of truth for secure check-in and release.
      </p>
      <h2>Guardian control</h2>
      <p>
        Children under 13 do not receive independent accounts. Guardians control authorized pickups,
        care details, media permissions, and parent connections.
      </p>
      <h2>Private media</h2>
      <p>
        Child media belongs in private storage with scope-specific consent, moderation, metadata
        removal, short-lived links, reporting, and takedown controls.
      </p>
    </ContentPage>
  );
}
