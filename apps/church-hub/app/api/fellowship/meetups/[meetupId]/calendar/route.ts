import { getApiViewer } from "@/lib/auth/api-viewer";
import { createClient } from "@/lib/supabase/server";

function escapeIcs(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function utcIcs(value: string): string {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ meetupId: string }> },
) {
  const viewer = await getApiViewer();
  if (!viewer) return Response.json({ message: "Sign in is required." }, { status: 401 });
  const { meetupId } = await context.params;

  if (viewer.demo) {
    const start = new Date(Date.now() + 24 * 60 * 60_000);
    const end = new Date(start.getTime() + 60 * 60_000);
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Boston Church Lowell//Fellowship Demo//EN",
      "BEGIN:VEVENT",
      `UID:${meetupId}@church-hub-demo`,
      `DTSTAMP:${utcIcs(new Date().toISOString())}`,
      `DTSTART:${utcIcs(start.toISOString())}`,
      `DTEND:${utcIcs(end.toISOString())}`,
      "SUMMARY:Synthetic Fellowship Meetup",
      "DESCRIPTION:Demo calendar event with fictional details.",
      "END:VEVENT",
      "END:VCALENDAR",
      "",
    ].join("\r\n");
    return new Response(ics, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="fellowship-demo-${meetupId}.ics"`,
      },
    });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fellowship_meetups")
    .select("id,title,description,starts_at,ends_at,general_location_name,general_area")
    .eq("id", meetupId)
    .single();
  if (error || !data) {
    return Response.json({ message: "This meetup is not available to your account." }, { status: 403 });
  }

  const location = `${data.general_location_name}, ${data.general_area}`;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Boston Church Lowell//Fellowship//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${data.id}@church-hub`,
    `DTSTAMP:${utcIcs(new Date().toISOString())}`,
    `DTSTART:${utcIcs(data.starts_at)}`,
    `DTEND:${utcIcs(data.ends_at)}`,
    `SUMMARY:${escapeIcs(data.title)}`,
    `LOCATION:${escapeIcs(location)}`,
    `DESCRIPTION:${escapeIcs(`${data.description} Exact participant instructions remain in the Church Hub thread.`)}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="fellowship-${data.id}.ics"`,
      "Cache-Control": "private, no-store",
    },
  });
}
