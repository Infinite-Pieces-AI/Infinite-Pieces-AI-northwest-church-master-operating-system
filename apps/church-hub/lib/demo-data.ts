export interface ThisWeekData {
  service: { title: string; dateLabel: string; time: string; location: string; address: string };
  lesson: { series: string; title: string; scripture: string; summary: string };
  scriptureOfWeek: { reference: string; note: string };
  announcement: { title: string; body: string };
  events: Array<{ id: string; title: string; when: string; audience: string }>;
  groups: Array<{ id: string; name: string; role: string; unread?: number }>;
  kids: Array<{ id: string; displayName: string; className: string; status: string; synthetic?: boolean }>;
}

export type FellowshipCategory =
  | "prayer" | "families" | "outdoors" | "food" | "service"
  | "sports" | "young-adults" | "whole-church";

export interface FellowshipMeetup {
  id: string;
  title: string;
  category: FellowshipCategory;
  host: string;
  hostInitial: string;
  dateLabel: string;
  timeLabel: string;
  locationName: string;
  area: string;
  description: string;
  audience: string;
  attendeeCount: number;
  capacity?: number;
  familyFriendly: boolean;
  spontaneous?: boolean;
  exactLocationAfterJoin?: boolean;
  tags: string[];
}

export { bibleJourney, bibleJourneyWeeks } from "./bible-journey-data";
export type { BibleJourneyWeek } from "./bible-journey-data";

export const thisWeekData: ThisWeekData = {
  "service": {
    "title": "Sunday Worship",
    "dateLabel": "Sunday, August 9",
    "time": "10:00 AM",
    "location": "Butler Middle School",
    "address": "1140 Gorham Street, Lowell"
  },
  "lesson": {
    "series": "The Story of God · Week 1",
    "title": "In the Beginning: Created for God and One Another",
    "scripture": "Genesis 1-2",
    "summary": "Begin the whole-Bible journey with creation, human dignity, purpose, relationship, and the God who brings order, life, and belonging."
  },
  "scriptureOfWeek": {
    "reference": "Genesis 1:26-31",
    "note": "Reflect on identity, dignity, stewardship, and the relationships God designed people to share."
  },
  "announcement": {
    "title": "A year through the Story of God",
    "body": "This week begins a sequenced journey from Genesis to Revelation, with personal, couple, family, teen, and group discussion tracks."
  },
  "events": [
    {
      "id": "evt-1",
      "title": "Family Group Night",
      "when": "Wednesday · 7:00 PM",
      "audience": "My family group"
    },
    {
      "id": "evt-2",
      "title": "Community Service Planning",
      "when": "Saturday · 9:30 AM",
      "audience": "Volunteer team"
    }
  ],
  "groups": [
    {
      "id": "grp-1",
      "name": "Northwest Family Group",
      "role": "Group leader",
      "unread": 3
    },
    {
      "id": "grp-2",
      "name": "Parents Community",
      "role": "Member",
      "unread": 1
    }
  ],
  "kids": [
    {
      "id": "child-1",
      "displayName": "Sample Child",
      "className": "Elementary Class",
      "status": "Not checked in",
      "synthetic": true
    }
  ]
};

export const fellowshipMeetups: FellowshipMeetup[] = [
  {
    "id": "meetup-1",
    "title": "Family prayer walk at the river",
    "category": "prayer",
    "host": "Jordan & Casey",
    "hostInitial": "J",
    "dateLabel": "Today",
    "timeLabel": "5:30 PM · about 45 minutes",
    "locationName": "Riverwalk entrance",
    "area": "Downtown Lowell",
    "description": "We are bringing the kids for an easy walk, a short prayer for the city, and time to catch up. Strollers and last-minute joins are welcome.",
    "audience": "Everyone",
    "attendeeCount": 6,
    "capacity": 18,
    "familyFriendly": true,
    "spontaneous": true,
    "exactLocationAfterJoin": true,
    "tags": [
      "Prayer",
      "Kids welcome",
      "Outdoors"
    ]
  },
  {
    "id": "meetup-2",
    "title": "Open playground afternoon",
    "category": "families",
    "host": "Parents Community",
    "hostInitial": "P",
    "dateLabel": "Saturday",
    "timeLabel": "10:30 AM-12:00 PM",
    "locationName": "Shedd Park playground",
    "area": "Lowell",
    "description": "A low-pressure playdate for children and a chance for parents to build friendships. Bring snacks, blankets, or simply show up.",
    "audience": "Parents and guardians",
    "attendeeCount": 11,
    "capacity": 30,
    "familyFriendly": true,
    "tags": [
      "Playdate",
      "Families",
      "Come and go"
    ]
  },
  {
    "id": "meetup-3",
    "title": "Coffee, Scripture, and honest conversation",
    "category": "food",
    "host": "Northwest Young Adults",
    "hostInitial": "N",
    "dateLabel": "Thursday",
    "timeLabel": "7:00 PM",
    "locationName": "Public coffee shop",
    "area": "Central Lowell",
    "description": "An open table for anyone who wants company, conversation, and one question from this week's Genesis lesson. No preparation needed.",
    "audience": "Adults and young adults",
    "attendeeCount": 8,
    "capacity": 14,
    "familyFriendly": false,
    "exactLocationAfterJoin": true,
    "tags": [
      "Coffee",
      "Bible",
      "Conversation"
    ]
  },
  {
    "id": "meetup-4",
    "title": "Serve Lowell supply-packing hour",
    "category": "service",
    "host": "Community Service Team",
    "hostInitial": "C",
    "dateLabel": "Saturday",
    "timeLabel": "2:00-3:30 PM",
    "locationName": "Approved public meeting site",
    "area": "Lowell",
    "description": "Help assemble care supplies, pray together, and meet members from across family groups. Tasks are available for multiple ages and abilities.",
    "audience": "Whole church",
    "attendeeCount": 23,
    "capacity": 60,
    "familyFriendly": true,
    "tags": [
      "Service",
      "Whole church",
      "Accessible"
    ]
  },
  {
    "id": "meetup-5",
    "title": "Sunset basketball and prayer huddle",
    "category": "sports",
    "host": "Marcus D.",
    "hostInitial": "M",
    "dateLabel": "Friday",
    "timeLabel": "6:15 PM",
    "locationName": "Public courts",
    "area": "Northwest Lowell",
    "description": "Casual half-court games, plenty of breaks, and a short prayer huddle at the end. Spectators and beginners are welcome too.",
    "audience": "Teens and adults",
    "attendeeCount": 12,
    "capacity": 24,
    "familyFriendly": true,
    "exactLocationAfterJoin": true,
    "tags": [
      "Sports",
      "Teens",
      "Beginner friendly"
    ]
  },
  {
    "id": "meetup-6",
    "title": "Sunday open lunch tables",
    "category": "whole-church",
    "host": "Hospitality Team",
    "hostInitial": "H",
    "dateLabel": "Sunday",
    "timeLabel": "After worship",
    "locationName": "Several nearby public restaurants",
    "area": "Lowell",
    "description": "Choose a table after service so nobody has to wonder where to go or eat alone. Each table lists the host, price range, family fit, and available seats.",
    "audience": "Whole church",
    "attendeeCount": 31,
    "capacity": 80,
    "familyFriendly": true,
    "tags": [
      "Lunch",
      "New friends",
      "Whole church"
    ]
  }
];

export const communityPosts = [
  {
    "id": "post-1",
    "author": "Ministry Team",
    "audience": "Church-wide",
    "createdAt": "Today · 8:15 AM",
    "title": "The Story of God begins this week",
    "body": "Open the Bible tab for Week 1, Genesis 1-2, along with personal, couple, family, teen, and group discussion tracks.",
    "reactions": 24,
    "comments": 6
  },
  {
    "id": "post-2",
    "author": "Jordan & Casey",
    "audience": "Open fellowship invitation",
    "createdAt": "Today · 10:20 AM",
    "title": "Family prayer walk after work",
    "body": "We are taking the kids for a relaxed river walk and prayer for Lowell at 5:30 PM. Join through Fellowship so the meeting point stays member-only.",
    "reactions": 16,
    "comments": 5
  },
  {
    "id": "post-3",
    "author": "Northwest Family Group",
    "audience": "My group",
    "createdAt": "Yesterday · 6:40 PM",
    "title": "Wednesday gathering reminder",
    "body": "Please respond in the event so leaders can plan seating. Do not post private addresses in the church-wide feed.",
    "reactions": 9,
    "comments": 2
  },
  {
    "id": "post-4",
    "author": "Kids Kingdom Team",
    "audience": "Verified guardians",
    "createdAt": "Monday · 4:00 PM",
    "title": "Guardian permission review",
    "body": "Please review authorized pickup and media permission settings before the next service.",
    "reactions": 7,
    "comments": 0
  }
];
