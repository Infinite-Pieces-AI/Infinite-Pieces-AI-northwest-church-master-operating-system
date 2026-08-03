export interface ThisWeekData {
  service: { title: string; dateLabel: string; time: string; location: string; address: string };
  lesson: { series: string; title: string; scripture: string; summary: string };
  scriptureOfWeek: { reference: string; note: string };
  announcement: { title: string; body: string };
  events: Array<{ id: string; title: string; when: string; audience: string }>;
  groups: Array<{ id: string; name: string; role: string; unread?: number }>;
  kids: Array<{ id: string; displayName: string; className: string; status: string; synthetic?: boolean }>;
}

export const thisWeekData: ThisWeekData = {
  service: { title: "Sunday Worship", dateLabel: "Sunday, August 9", time: "10:00 AM", location: "Butler Middle School", address: "1140 Gorham Street, Lowell" },
  lesson: { series: "Faith in Practice", title: "Listen and Live the Word", scripture: "James 1:19-27", summary: "Receive the word with humility, listen carefully, and put it into practice in daily relationships." },
  scriptureOfWeek: { reference: "James 1:22", note: "Licensed passage text appears only after an approved Bible provider is connected." },
  announcement: { title: "Welcome Lunch planning", body: "Leaders are reviewing a future welcome lunch. Draft announcements stay private until approved." },
  events: [
    { id: "evt-1", title: "Family Group Night", when: "Wednesday · 7:00 PM", audience: "My family group" },
    { id: "evt-2", title: "Community Service Planning", when: "Saturday · 9:30 AM", audience: "Volunteer team" }
  ],
  groups: [
    { id: "grp-1", name: "Northwest Family Group", role: "Group leader", unread: 3 },
    { id: "grp-2", name: "Parents Community", role: "Member", unread: 1 }
  ],
  kids: [{ id: "child-1", displayName: "Sample Child", className: "Elementary Class", status: "Not checked in", synthetic: true }]
};

export const communityPosts = [
  { id: "post-1", author: "Ministry Team", audience: "Church-wide", createdAt: "Today · 8:15 AM", title: "This week’s lesson is ready", body: "The approved outline, Scripture references, and group questions are available in the Bible tab.", reactions: 18, comments: 4 },
  { id: "post-2", author: "Northwest Family Group", audience: "My group", createdAt: "Yesterday · 6:40 PM", title: "Wednesday gathering reminder", body: "Please respond in the event so leaders can plan seating. Do not post private addresses in the church-wide feed.", reactions: 9, comments: 2 },
  { id: "post-3", author: "Kids Kingdom Team", audience: "Verified guardians", createdAt: "Monday · 4:00 PM", title: "Guardian permission review", body: "Please review authorized pickup and media permission settings before the next service.", reactions: 7, comments: 0 }
];
