import type {
  Location,
  ResolvedServiceOccurrence,
  ServiceOverride,
  ServiceTemplate,
} from "./types";

const weekdayToJsDay = (weekday: number): number => ((weekday % 7) + 7) % 7;

interface ZonedDateTimeParts {
  year: number;
  month: number;
  day: number;
  weekday: number;
  hour: number;
  minute: number;
}

function partsInTimeZone(date: Date, timeZone: string): ZonedDateTimeParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const values = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  const weekdays: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const weekday = weekdays[values.weekday ?? ""];
  if (weekday === undefined) throw new Error(`Unable to resolve weekday in ${timeZone}`);

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    weekday,
    hour: Number(values.hour),
    minute: Number(values.minute),
  };
}

function dateOnlyUtc(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
}

export function nextDateForWeekday(from: Date, weekday: number, timeZone = "UTC"): Date {
  const local = partsInTimeZone(from, timeZone);
  const result = dateOnlyUtc(local.year, local.month, local.day);
  const delta = (weekdayToJsDay(weekday) - local.weekday + 7) % 7;
  result.setUTCDate(result.getUTCDate() + delta);
  return result;
}

export function toIsoDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function minutesFromLocalTime(localTime: string): number {
  const match = /^(\d{2}):(\d{2})$/.exec(localTime);
  if (!match) throw new Error(`Invalid local time: ${localTime}`);
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) throw new Error(`Invalid local time: ${localTime}`);
  return hours * 60 + minutes;
}

export function resolveNextService(input: {
  now: Date;
  template: ServiceTemplate;
  locations: Location[];
  overrides: ServiceOverride[];
}): ResolvedServiceOccurrence {
  const { now, template, locations, overrides } = input;
  const templateLocation = locations.find((location) => location.id === template.locationId);
  if (!templateLocation) throw new Error(`Missing location ${template.locationId}`);

  const localNow = partsInTimeZone(now, template.timezone);
  const today = toIsoDate(dateOnlyUtc(localNow.year, localNow.month, localNow.day));
  const currentMinutes = localNow.hour * 60 + localNow.minute;
  const candidate = nextDateForWeekday(now, template.weekday, template.timezone);

  for (let attempts = 0; attempts < 8; attempts += 1) {
    const date = toIsoDate(candidate);
    const override = overrides.find((item) => item.date === date && item.status === "published");
    const effectiveTime = override?.localTime ?? template.localTime;

    // Once the local start time has passed, advance to the next weekly occurrence.
    // This avoids showing a service that ended hours earlier as the "next" service.
    if (date === today && currentMinutes >= minutesFromLocalTime(effectiveTime)) {
      candidate.setUTCDate(candidate.getUTCDate() + 7);
      continue;
    }

    if (override) {
      const location = override.locationId
        ? locations.find((item) => item.id === override.locationId)
        : templateLocation;
      if (!location) throw new Error(`Missing override location ${override.locationId}`);

      return {
        date,
        title: override.title,
        localTime: effectiveTime,
        timezone: template.timezone,
        location,
        status:
          override.kind === "cancelled"
            ? "cancelled"
            : override.kind === "small_groups"
              ? "small_groups"
              : "scheduled",
        publicMessage: override.publicMessage,
        source: "override",
      };
    }

    return {
      date,
      title: template.title,
      localTime: template.localTime,
      timezone: template.timezone,
      location: templateLocation,
      status: "scheduled",
      source: "template",
    };
  }

  throw new Error("Unable to resolve next service occurrence");
}
