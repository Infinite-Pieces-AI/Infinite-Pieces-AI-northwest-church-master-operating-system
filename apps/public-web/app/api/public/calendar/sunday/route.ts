import { getPublishedSchedule } from "@/lib/published-content";

function escapeIcs(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function localDateTime(date: string, time: string): string {
  const [hours = "10", minutes = "00"] = time.split(":");
  return `${date.replaceAll("-", "")}T${hours.padStart(2, "0")}${minutes.padStart(2, "0")}00`;
}

function addMinutes(localValue: string, minutesToAdd: number): string {
  const year = Number(localValue.slice(0, 4));
  const month = Number(localValue.slice(4, 6));
  const day = Number(localValue.slice(6, 8));
  const hour = Number(localValue.slice(9, 11));
  const minute = Number(localValue.slice(11, 13));
  const value = new Date(Date.UTC(year, month - 1, day, hour, minute));
  value.setUTCMinutes(value.getUTCMinutes() + minutesToAdd);
  return `${value.getUTCFullYear()}${String(value.getUTCMonth() + 1).padStart(2, "0")}${String(value.getUTCDate()).padStart(2, "0")}T${String(value.getUTCHours()).padStart(2, "0")}${String(value.getUTCMinutes()).padStart(2, "0")}00`;
}

export async function GET() {
  const service = getPublishedSchedule();
  const start = localDateTime(service.date, service.localTime);
  const end = addMinutes(start, 90);
  const location = `${service.location.name}, ${service.location.addressLine1}, ${service.location.city}, ${service.location.region} ${service.location.postalCode}`;
  const description = [
    "Boston Church Lowell Sunday worship.",
    service.publicMessage,
    "Review the public Plan a Visit page before traveling for current service details.",
  ]
    .filter(Boolean)
    .join(" ");
  const uid = `sunday-${service.date}@boston-church-lowell`;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Boston Church Lowell//Sunday Worship//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")}`,
    `DTSTART;TZID=${service.timezone}:${start}`,
    `DTEND;TZID=${service.timezone}:${end}`,
    `SUMMARY:${escapeIcs(service.title)}`,
    `LOCATION:${escapeIcs(location)}`,
    `DESCRIPTION:${escapeIcs(description)}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="boston-church-lowell-${service.date}.ics"`,
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
