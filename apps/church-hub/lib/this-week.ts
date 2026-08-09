import type { Viewer } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";
import { thisWeekData, type ThisWeekData } from "@/lib/demo-data";

interface RpcService {
  title?: unknown;
  starts_at?: unknown;
  location_name?: unknown;
  address_line_1?: unknown;
  address_line_2?: unknown;
  city?: unknown;
  state_region?: unknown;
  postal_code?: unknown;
}

interface RpcLessonReference {
  reference?: unknown;
}

interface RpcLesson {
  title?: unknown;
  summary?: unknown;
  scriptureOfWeekReference?: unknown;
  ministerAnnouncement?: unknown;
  references?: unknown;
}

interface RpcEvent {
  id?: unknown;
  title?: unknown;
  startsAt?: unknown;
}

interface RpcGroup {
  id?: unknown;
  name?: unknown;
  kind?: unknown;
}

interface RpcThisWeek {
  service?: unknown;
  lesson?: unknown;
  events?: unknown;
  groups?: unknown;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asText(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function formatService(startsAt: unknown) {
  const parsed = typeof startsAt === "string" ? new Date(startsAt) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) {
    return { dateLabel: "Schedule pending", time: "See current service details" };
  }
  return {
    dateLabel: new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(parsed),
    time: new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      hour: "numeric",
      minute: "2-digit",
    }).format(parsed),
  };
}

function formatEventTime(startsAt: unknown): string {
  const parsed = typeof startsAt === "string" ? new Date(startsAt) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return "Time pending";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function normalizeRpcSnapshot(value: unknown): ThisWeekData | null {
  const root = asRecord(value) as RpcThisWeek | null;
  if (!root) return null;
  const service = asRecord(root.service) as RpcService | null;
  const lesson = asRecord(root.lesson) as RpcLesson | null;
  if (!service || !lesson) return null;

  const serviceTime = formatService(service.starts_at);
  const address = [
    asText(service.address_line_1),
    asText(service.address_line_2),
    [asText(service.city), asText(service.state_region), asText(service.postal_code)]
      .filter(Boolean)
      .join(" "),
  ]
    .filter(Boolean)
    .join(", ");

  const references = Array.isArray(lesson.references)
    ? (lesson.references as RpcLessonReference[])
        .map((entry) => asText(entry.reference))
        .filter(Boolean)
    : [];
  const events = Array.isArray(root.events) ? (root.events as RpcEvent[]) : [];
  const groups = Array.isArray(root.groups) ? (root.groups as RpcGroup[]) : [];
  const scripture = references[0] || asText(lesson.scriptureOfWeekReference, "Reference pending");

  return {
    service: {
      title: asText(service.title, "Sunday Worship"),
      dateLabel: serviceTime.dateLabel,
      time: serviceTime.time,
      location: asText(service.location_name, "Location pending"),
      address: address || "Open the current schedule for directions",
    },
    lesson: {
      series: "Current teaching",
      title: asText(lesson.title, "Weekly lesson"),
      scripture,
      summary: asText(lesson.summary, "The approved weekly lesson will appear here."),
    },
    scriptureOfWeek: {
      reference: asText(lesson.scriptureOfWeekReference, scripture),
      note: "Open the licensed Bible provider to read the approved translation text.",
    },
    announcement: {
      title: asText(lesson.ministerAnnouncement) ? "Minister announcement" : "No new announcement",
      body: asText(lesson.ministerAnnouncement, "Current approved announcements will appear here."),
    },
    events: events.slice(0, 8).map((event, index) => ({
      id: asText(event.id, `event-${index + 1}`),
      title: asText(event.title, "Church event"),
      when: formatEventTime(event.startsAt),
      audience: "Approved audience",
    })),
    groups: groups.map((group, index) => ({
      id: asText(group.id, `group-${index + 1}`),
      name: asText(group.name, "Assigned group"),
      role: asText(group.kind, "Member"),
    })),
    kids: [],
  };
}

export async function loadThisWeekData(viewer: Viewer): Promise<ThisWeekData | null> {
  if (viewer.demo) return thisWeekData;
  const supabase = await createClient();
  const referenceDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const { data, error } = await supabase.rpc("get_my_this_week", {
    p_reference_date: referenceDate,
  });
  if (error || !data) return null;
  return normalizeRpcSnapshot(data);
}
