import Link from "next/link";
import { ContentPage } from "@/components/content-page";
import { getPublishedEvents } from "@/lib/published-content";
export default function EventsPage() {
  const events = getPublishedEvents();
  return (
    <ContentPage
      eyebrow="Gather together"
      title="Public events"
      intro="Every approved public event receives a unique, accurate page with date, time, location, registration, and structured data."
    >
      {events.length ? (
        <div className="info-grid">
          {events.map((event) => (
            <article className="info-panel" key={event.id}>
              <p className="eyebrow">{new Date(event.startAt).toLocaleDateString()}</p>
              <h2>{event.title}</h2>
              <p>{event.summary}</p>
              <Link href={`/events/${event.slug}`}>View details →</Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="info-panel">
          <h2>No public events are approved yet</h2>
          <p>Draft events remain private until an authorized content owner publishes them.</p>
        </div>
      )}
    </ContentPage>
  );
}
