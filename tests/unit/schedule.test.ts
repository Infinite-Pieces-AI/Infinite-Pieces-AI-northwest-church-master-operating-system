import { describe, expect, it } from "vitest";
import {
  resolveNextService,
  type Location,
  type ServiceTemplate
} from "@church/church-content";

const location: Location = {
  id: "loc",
  name: "Butler Middle School",
  addressLine1: "1140 Gorham Street",
  city: "Lowell",
  region: "MA",
  postalCode: "01852",
  country: "US",
  directionsUrl: "https://maps.example.invalid/butler-middle-school",
  accessibilityNotes: ["Confirm current entrance and accessibility details before publication."]
};

const template: ServiceTemplate = {
  id: "service",
  locationId: "loc",
  weekday: 0,
  localTime: "10:00",
  timezone: "America/New_York",
  title: "Sunday Worship",
  status: "published"
};

describe("canonical schedule", () => {
  it("uses a published date-specific override instead of stale template copy", () => {
    const result = resolveNextService({
      now: new Date("2026-08-10T12:00:00Z"),
      template,
      locations: [location],
      overrides: [
        {
          id: "override",
          date: "2026-08-16",
          kind: "small_groups",
          title: "Small Groups Sunday",
          publicMessage: "Small groups meet locally.",
          status: "published"
        }
      ]
    });

    expect(result.status).toBe("small_groups");
    expect(result.source).toBe("override");
    expect(result.publicMessage).toContain("Small groups");
  });

  it("advances after the local Sunday service start time", () => {
    const result = resolveNextService({
      // Sunday, August 16, 2026 at 8:00 PM in Lowell.
      now: new Date("2026-08-17T00:00:00Z"),
      template,
      locations: [location],
      overrides: []
    });

    expect(result.date).toBe("2026-08-23");
  });
});
