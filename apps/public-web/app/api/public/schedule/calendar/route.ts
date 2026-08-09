import { getPublishedSchedule } from "@/lib/published-content";

function escapeIcs(value: string): string {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replaceAll("\n", "\\n");
}

export function GET() {
  const service = getPublishedSchedule();
  const date = service.date.replaceAll("-", "");
  const time = `${service.localTime.replace(":", "")}00`;
  const location = `${service.location.name}, ${service.location.addressLine1}, ${service.location.city}, ${service.location.region} ${service.location.postalCode}`;
  const generated = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Boston Church Lowell//Sunday Worship//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${service.date}-sunday-worship@bostonchurch-lowell`,
    `DTSTAMP:${generated}`,
    `DTSTART;TZID=${service.timezone}:${date}T${time}`,
    `SUMMARY:${escapeIcs(service.title)}`,
    `LOCATION:${escapeIcs(location)}`,
    `DESCRIPTION:${escapeIcs("Current Sunday information: visit the official Boston Church Lowell website before traveling.")}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");

  return new Response(ics, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="boston-church-lowell-${service.date}.ics"`,
      "cache-control": "public, max-age=300",
    },
  });
}
