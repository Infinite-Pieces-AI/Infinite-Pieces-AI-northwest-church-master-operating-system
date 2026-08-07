import { PageHeading } from "@/components/page-heading";
import { thisWeekData } from "@/lib/demo-data";
export default function EventsPage() {
  return (
    <>
      <PageHeading
        eyebrow="One calendar"
        title="Events"
        description="Public, member, ministry, volunteer, and family events with clear visibility and response status."
        actions={<button className="hub-button hub-button--primary">Add to calendar</button>}
      />
      <div className="event-list">
        {thisWeekData.events.map((event, index) => (
          <article className="hub-panel event-row" key={event.id}>
            <div className="date-tile">
              <strong>{index === 0 ? "06" : "09"}</strong>
              <span>AUG</span>
            </div>
            <div>
              <p className="hub-kicker">{event.audience}</p>
              <h2>{event.title}</h2>
              <span>{event.when}</span>
            </div>
            <div className="event-actions">
              <select aria-label={`Response for ${event.title}`} defaultValue="pending">
                <option value="pending">Respond</option>
                <option value="going">Going</option>
                <option value="maybe">Maybe</option>
                <option value="declined">Can’t attend</option>
              </select>
              <button className="hub-button hub-button--secondary">Details</button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
