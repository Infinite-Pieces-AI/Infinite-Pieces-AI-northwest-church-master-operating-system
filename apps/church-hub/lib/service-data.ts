export interface ServiceOpportunity {
  id: string;
  title: string;
  need: string;
  impact: string;
  partner: string;
  dateLabel: string;
  duration: string;
  location: string;
  ageRequirement: string;
  physicalRequirements: string;
  skills: string[];
  accessibility: string;
  safeguarding: string;
  whatToBring: string;
  familyFriendly: boolean;
  recurring: boolean;
  shiftId: string;
  shiftLabel: string;
  capacity: number;
  signedUp: number;
}

export const serviceOpportunities: ServiceOpportunity[] = [
  {
    id: "service-1",
    title: "Pack Lowell family care supplies",
    need: "An approved community partner needs organized household and school supplies prepared for distribution.",
    impact:
      "A completed shift prepares practical resources requested by local families without photographing or profiling recipients.",
    partner: "Synthetic Lowell Community Partner",
    dateLabel: "Saturday · 9:30 AM",
    duration: "90 minutes",
    location: "Approved public community site",
    ageRequirement: "All ages with guardian supervision",
    physicalRequirements: "Seated and standing tasks available",
    skills: ["Packing", "Organization", "Hospitality"],
    accessibility: "Wheelchair-accessible work area; seated roles available",
    safeguarding: "No direct child interaction in this shift",
    whatToBring: "Closed-toe shoes and a refillable water bottle",
    familyFriendly: true,
    recurring: true,
    shiftId: "shift-1",
    shiftLabel: "9:30–11:00 AM",
    capacity: 28,
    signedUp: 19,
  },
  {
    id: "service-2",
    title: "Lowell neighborhood cleanup walk",
    need: "A public area needs litter removal coordinated with an approved local organizer.",
    impact:
      "Members and neighbors care for a shared place while building relationships side by side.",
    partner: "Synthetic Neighborhood Stewardship Team",
    dateLabel: "Saturday · 1:00 PM",
    duration: "2 hours",
    location: "Public Lowell meeting point",
    ageRequirement: "Ages 12+; minors with guardian",
    physicalRequirements: "Walking, bending, and carrying light bags",
    skills: ["Outdoor", "Teamwork"],
    accessibility: "Short-route and supply-table roles available",
    safeguarding: "Guardian supervision required for minors",
    whatToBring: "Weather-appropriate clothing; supplies provided",
    familyFriendly: true,
    recurring: false,
    shiftId: "shift-2",
    shiftLabel: "1:00–3:00 PM",
    capacity: 35,
    signedUp: 21,
  },
  {
    id: "service-3",
    title: "Welcome and meal-table preparation",
    need: "An approved public community meal needs setup, signs, table hosts, and cleanup support.",
    impact: "Guests receive clear directions and a dignified, organized welcome.",
    partner: "Synthetic Community Meal Partner",
    dateLabel: "Sunday · 3:30 PM",
    duration: "2.5 hours",
    location: "Approved partner site",
    ageRequirement: "Adults and supervised teens",
    physicalRequirements: "Light lifting; seated greeting roles available",
    skills: ["Hospitality", "Setup", "Conversation"],
    accessibility: "Seated welcome and sign-in roles available",
    safeguarding: "No one-to-one minor contact",
    whatToBring: "Comfortable shoes",
    familyFriendly: false,
    recurring: true,
    shiftId: "shift-3",
    shiftLabel: "3:30–6:00 PM",
    capacity: 18,
    signedUp: 12,
  },
  {
    id: "service-4",
    title: "Online encouragement card team",
    need: "Approved handwritten or digital encouragement cards are needed for a partner-led care initiative.",
    impact:
      "Members unable to travel can contribute to a concrete, reviewed act of care from home.",
    partner: "Synthetic Care Partnership",
    dateLabel: "Complete by next Friday",
    duration: "30–60 minutes",
    location: "Online / at home",
    ageRequirement: "All ages with guardian review for children",
    physicalRequirements: "No travel required",
    skills: ["Writing", "Art", "Remote"],
    accessibility: "Screen-reader-compatible instructions and printable option",
    safeguarding: "No recipient contact details are shared",
    whatToBring: "Approved template or art supplies",
    familyFriendly: true,
    recurring: false,
    shiftId: "shift-4",
    shiftLabel: "Flexible",
    capacity: 50,
    signedUp: 33,
  },
];
