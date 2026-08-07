import { describe, expect, it } from "vitest";
import {
  bibleJourney,
  bibleJourneyWeeks,
  fellowshipMeetups
} from "../../apps/church-hub/lib/demo-data";

describe("fellowship and whole-Bible journey demo contracts", () => {
  it("provides a complete, contiguous Genesis-to-Revelation formation path", () => {
    expect(bibleJourneyWeeks).toHaveLength(52);
    expect(bibleJourneyWeeks.map((week) => week.week)).toEqual(
      Array.from({ length: 52 }, (_, index) => index + 1)
    );
    expect(bibleJourneyWeeks[0].references).toContain("Genesis 1-2");
    expect(bibleJourneyWeeks[51].references).toContain("Revelation 21-22");
    expect(bibleJourney.currentWeek.week).toBe(1);
  });

  it("keeps every journey week usable for approved teaching review", () => {
    for (const week of bibleJourneyWeeks) {
      expect(week.title.length).toBeGreaterThan(2);
      expect(week.era.length).toBeGreaterThan(1);
      expect(week.references.length).toBeGreaterThan(0);
      expect(week.bigIdea.length).toBeGreaterThan(9);
      expect(week.summary.length).toBeGreaterThan(19);
    }
  });

  it("models varied, public-place fellowship invitations without phone-number dependency", () => {
    expect(fellowshipMeetups.length).toBeGreaterThanOrEqual(6);
    expect(new Set(fellowshipMeetups.map((meetup) => meetup.category)).size).toBeGreaterThanOrEqual(5);
    expect(fellowshipMeetups.some((meetup) => meetup.spontaneous)).toBe(true);
    expect(fellowshipMeetups.some((meetup) => meetup.familyFriendly)).toBe(true);

    for (const meetup of fellowshipMeetups) {
      expect(meetup.locationName.length).toBeGreaterThan(1);
      expect(meetup.timeLabel.length).toBeGreaterThan(1);
      expect(meetup.host.length).toBeGreaterThan(1);
      expect(meetup.description.length).toBeGreaterThan(9);
    }
  });
});
