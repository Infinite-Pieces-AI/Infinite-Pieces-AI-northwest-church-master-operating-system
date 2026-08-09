import { BusinessProfileGate } from "@/components/business-profile-gate";
import { LocalPresence } from "@/components/local-presence";
import { PageHeading } from "@/components/page-heading";

export default function LocalPresencePage() {
  return (
    <>
      <PageHeading
        eyebrow="One authoritative public identity"
        title="Local Presence"
        description="Protect the accuracy of Boston Church Lowell’s name, Sunday time, Butler Middle School meeting location, directions, structured data, visitor guidance, and approved online-ministry information."
      />
      <LocalPresence />
      <div style={{ marginTop: 18 }}>
        <BusinessProfileGate />
      </div>
    </>
  );
}
