import {
  locations,
  publicEvents,
  regularSundayService,
  resolveNextService,
  sermons,
  serviceOverrides,
} from "@church/church-content";

export function getPublishedSchedule(now = new Date()) {
  return resolveNextService({
    now,
    template: regularSundayService,
    locations,
    overrides: serviceOverrides,
  });
}

export function getPublishedEvents() {
  return publicEvents.filter(
    (event) => event.status === "published" && event.visibility === "public",
  );
}

export function getPublishedSermons() {
  return sermons;
}
