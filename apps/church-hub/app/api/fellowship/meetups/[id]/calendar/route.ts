import { getApiViewer } from "@/lib/auth/api-viewer";
import { loadFellowshipMeetupDetail } from "@/lib/fellowship";
import type { Viewer } from "@/lib/auth/viewer";

function escapeIcs(value: string): string { return value.replaceAll("\\", "\\\\").replaceAll(";", "\\;").replaceAll(",", "\\,").replaceAll("\n", "\\n"); }
function stamp(value: string): string { return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z"); }

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const apiViewer = await getApiViewer();
  if (!apiViewer) return new Response("Authentication required", { status: 401 });
  const viewer: Viewer = { ...apiViewer, displayName: apiViewer.email.split("@")[0] || "Member", roles: ["member"], aal: "aal1" };
  const { id } = await context.params;
  const detail = await loadFellowshipMeetupDetail(viewer, id);
  if (!detail || !detail.meetup.startsAt || !detail.meetup.endsAt) return new Response("Calendar details unavailable", { status: 404 });
  const ics = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Boston Church Lowell//Fellowship//EN","CALSCALE:GREGORIAN","BEGIN:VEVENT",`UID:${id}@bostonchurch-lowell`,`DTSTAMP:${stamp(new Date().toISOString())}`,`DTSTART:${stamp(detail.meetup.startsAt)}`,`DTEND:${stamp(detail.meetup.endsAt)}`,`SUMMARY:${escapeIcs(detail.meetup.title)}`,`LOCATION:${escapeIcs(`${detail.meetup.locationName}, ${detail.meetup.area}`)}`,`DESCRIPTION:${escapeIcs("Check the authenticated Church Hub thread for current instructions before traveling.")}`,"END:VEVENT","END:VCALENDAR",""] .join("\r\n");
  return new Response(ics, { headers: { "content-type": "text/calendar; charset=utf-8", "content-disposition": `attachment; filename="fellowship-${id}.ics"`, "cache-control": "private, no-store" } });
}
