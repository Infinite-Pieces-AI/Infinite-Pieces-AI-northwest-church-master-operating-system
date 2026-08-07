import { bibleJourneyWeeksA } from "./bible-journey-weeks-a";
import { bibleJourneyWeeksB } from "./bible-journey-weeks-b";

export interface BibleJourneyWeek {
  week: number;
  era: string;
  title: string;
  references: string[];
  bigIdea: string;
  summary: string;
}

export const bibleJourneyWeeks: BibleJourneyWeek[] = [
  ...bibleJourneyWeeksA,
  ...bibleJourneyWeeksB
];

export const bibleJourney = {
  title: "The Story of God",
  subtitle: "A 52-week journey from creation to new creation",
  currentWeek: bibleJourneyWeeks[0],
  upcoming: bibleJourneyWeeks.slice(1, 7),
  eras: [
    { label: "Creation", weeks: "1-4" },
    { label: "Promise", weeks: "5-8" },
    { label: "Exodus", weeks: "9-14" },
    { label: "Kingdom", weeks: "15-22" },
    { label: "Prophets", weeks: "23-29" },
    { label: "Wisdom", weeks: "30-32" },
    { label: "Jesus", weeks: "33-42" },
    { label: "Church", weeks: "43-51" },
    { label: "New Creation", weeks: "52" }
  ]
};
