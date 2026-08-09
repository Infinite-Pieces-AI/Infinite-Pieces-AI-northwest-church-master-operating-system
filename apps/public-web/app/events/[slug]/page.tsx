import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { ContentPage } from "@/components/content-page";
import { getPublishedEvents } from "@/lib/published-content";
export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = getPublishedEvents().find((item) => item.slug === slug);
  if (!event) notFound();
  const data = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    startDate: event.startAt,
    endDate: event.endAt,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@type": "Place", name: event.locationName, address: event.address },
  };
  return (
    <>
      <JsonLd data={data} />
      <ContentPage eyebrow="Public event" title={event.title} intro={event.summary}>
        <h2>Date and time</h2>
        <p>
          {new Date(event.startAt).toLocaleString("en-US", {
            dateStyle: "full",
            timeStyle: "short",
          })}
        </p>
        <h2>Location</h2>
        <p>
          {event.locationName}
          {event.address ? (
            <>
              <br />
              {event.address}
            </>
          ) : null}
        </p>
      </ContentPage>
    </>
  );
}
