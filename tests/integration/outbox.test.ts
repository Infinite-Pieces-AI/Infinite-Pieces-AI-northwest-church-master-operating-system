import { describe, expect, it } from "vitest";
import { createOutboxEvent } from "@church/notifications";

describe("outbox event contract", () => {
  it("creates a versioned, serializable event without executing an integration", () => {
    const event = createOutboxEvent({
      id: "00000000-0000-4000-8000-000000000010",
      type: "weekly_lesson.published",
      aggregateType: "weekly_lesson",
      aggregateId: "lesson-id",
      payload: { audience: "all-members" },
      occurredAt: new Date("2026-08-02T12:00:00.000Z"),
    });

    expect(event.type).toBe("weekly_lesson.published");
    expect(event.aggregateId).toBe("lesson-id");
    expect(event.occurredAt).toBe("2026-08-02T12:00:00.000Z");
    expect(() => JSON.stringify(event)).not.toThrow();
  });
});
