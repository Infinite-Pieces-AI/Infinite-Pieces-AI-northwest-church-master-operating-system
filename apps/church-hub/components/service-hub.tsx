"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

type ServiceKind =
  | "church_hosted"
  | "approved_partner"
  | "member_led"
  | "self_guided"
  | "public_lead";

type ServiceCategory =
  | "hunger"
  | "housing"
  | "children_youth"
  | "older_adults"
  | "disability_support"
  | "environment"
  | "public_health"
  | "recovery_support"
  | "neighborhood"
  | "church_operations"
  | "hospitality"
  | "mentoring"
  | "transportation"
  | "other";

type SignupStatus = "going" | "waitlisted" | "cancelled" | "attended" | null;

type ServiceTab = "discover" | "nearby" | "commitments" | "scripture" | "propose";

interface ServiceShift {
  id: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  signedUpCount: number;
  allowWaitlist: boolean;
  status: "open" | "full" | "cancelled" | "completed";
  minimumAge?: number;
  weatherStatus?: "scheduled" | "weather_watch" | "relocated" | "postponed" | "cancelled";
  meetingInstructions?: string;
  userStatus: SignupStatus;
  partySize?: number;
}

interface ServiceOpportunity {
  id: string;
  title: string;
  needStatement: string;
  impactStatement: string;
  partnerName: string;
  kind: ServiceKind;
  category: ServiceCategory;
  generalLocation: string;
  locality: string;
  region: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  familyFriendly: boolean;
  ageRequirements: string;
  physicalRequirements?: string;
  skills: string[];
  accessibilityNotes?: string;
  safeguardingRequirements?: string;
  whatToBring?: string;
  indoorOutdoor: "indoor" | "outdoor" | "either" | "remote";
  commitmentLevel: "one_time" | "recurring" | "flexible" | "self_guided";
  registrationMode: "hub_signup" | "external_link" | "leader_contact" | "self_guided";
  sourceUrl?: string;
  sourceVerifiedAt?: string;
  churchSponsored: boolean;
  safetySummary?: string;
  transportationAvailable?: boolean;
  backgroundCheckRequired?: boolean;
  bookmarked: boolean;
  distanceMiles?: number | null;
  shifts: ServiceShift[];
}

interface ServiceProposal {
  id: string;
  title: string;
  category: ServiceCategory;
  generalLocation: string;
  postalCode?: string;
  proposedKind: "member_led" | "self_guided" | "approved_partner";
  status: "draft" | "pending" | "needs_changes" | "approved" | "declined" | "withdrawn" | "converted";
  riskLevel: "standard" | "review" | "restricted";
  reviewerNote?: string;
  createdAt: string;
}

interface ServicePayload {
  opportunities: ServiceOpportunity[];
  proposals: ServiceProposal[];
}

interface Coordinates {
  latitude: number;
  longitude: number;
  label: string;
}

const categoryLabels: Record<ServiceCategory, string> = {
  hunger: "Hunger and food access",
  housing: "Housing and shelter",
  children_youth: "Children and youth",
  older_adults: "Older adults",
  disability_support: "Disability support",
  environment: "Environment",
  public_health: "Public health",
  recovery_support: "Recovery support",
  neighborhood: "Neighborhood care",
  church_operations: "Church operations",
  hospitality: "Hospitality",
  mentoring: "Mentoring",
  transportation: "Transportation",
  other: "Other",
};

const kindLabels: Record<ServiceKind, string> = {
  church_hosted: "Church-hosted",
  approved_partner: "Approved partner",
  member_led: "Member-led · not church-sponsored",
  self_guided: "Self-guided",
  public_lead: "Public lead · verify first",
};

const kindDescriptions: Record<ServiceKind, string> = {
  church_hosted: "Organized and supervised through an approved church leader.",
  approved_partner: "Hosted by an external organization the church has reviewed and approved.",
  member_led: "Approved for member discovery, but organized independently by the member host.",
  self_guided: "An idea you may complete independently. The church does not supervise the activity.",
  public_lead: "Publicly listed opportunity information. Availability and requirements must be confirmed with the source.",
};

const zipCentroids: Record<string, Coordinates> = {
  "01850": { latitude: 42.656, longitude: -71.305, label: "Lowell 01850" },
  "01851": { latitude: 42.6315, longitude: -71.3348, label: "Lowell 01851" },
  "01852": { latitude: 42.6334, longitude: -71.3162, label: "Lowell 01852" },
  "01854": { latitude: 42.6554, longitude: -71.3476, label: "Lowell 01854" },
  "01821": { latitude: 42.5584, longitude: -71.2689, label: "Billerica 01821" },
  "01824": { latitude: 42.5998, longitude: -71.3673, label: "Chelmsford 01824" },
  "01826": { latitude: 42.6764, longitude: -71.3186, label: "Dracut 01826" },
  "01862": { latitude: 42.5751, longitude: -71.2902, label: "North Billerica 01862" },
  "01863": { latitude: 42.6375, longitude: -71.3883, label: "North Chelmsford 01863" },
  "01876": { latitude: 42.6112, longitude: -71.2273, label: "Tewksbury 01876" },
  "01879": { latitude: 42.6768, longitude: -71.4246, label: "Tyngsborough 01879" },
  "01886": { latitude: 42.5864, longitude: -71.4409, label: "Westford 01886" },
};

function futureDate(daysAhead: number, hour: number, minute = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function endAfter(start: string, hours: number): string {
  return new Date(new Date(start).getTime() + hours * 60 * 60 * 1000).toISOString();
}

const careKitStart = futureDate(7, 11, 35);
const cleanupStart = futureDate(6, 9, 30);
const setupStart = futureDate(7, 8, 15);

const previewOpportunities: ServiceOpportunity[] = [
  {
    id: "service-care-kits",
    title: "Pack neighborhood care kits after Sunday worship",
    needStatement:
      "Prepare practical hygiene and comfort kits that an approved ministry leader can distribute through reviewed local partners.",
    impactStatement:
      "A well-organized one-hour project gives families, teens, and adults a concrete way to serve together while partner organizations direct the kits where they are most useful.",
    partnerName: "Boston Church Lowell",
    kind: "church_hosted",
    category: "housing",
    generalLocation: "Butler Middle School",
    locality: "Lowell",
    region: "MA",
    postalCode: "01852",
    latitude: 42.6177,
    longitude: -71.296,
    familyFriendly: true,
    ageRequirements: "All ages with guardian supervision",
    physicalRequirements: "Seated and standing roles available",
    skills: ["Packing", "Hospitality", "Organization"],
    accessibilityNotes: "Table-height packing and seated roles are available.",
    safeguardingRequirements: "Children remain with their guardian; no direct recipient contact during packing.",
    whatToBring: "Optional unopened travel-size hygiene items from the approved list",
    indoorOutdoor: "indoor",
    commitmentLevel: "one_time",
    registrationMode: "hub_signup",
    churchSponsored: true,
    safetySummary: "Leader-supervised indoor project. Items are reviewed before distribution.",
    transportationAvailable: false,
    backgroundCheckRequired: false,
    bookmarked: true,
    shifts: [
      {
        id: "shift-care-kits",
        startsAt: careKitStart,
        endsAt: endAfter(careKitStart, 1.25),
        capacity: 32,
        signedUpCount: 19,
        allowWaitlist: true,
        status: "open",
        minimumAge: 0,
        weatherStatus: "scheduled",
        meetingInstructions: "Meet at the marked Church Hub service table after worship.",
        userStatus: null,
      },
    ],
  },
  {
    id: "service-sunday-setup",
    title: "Sunday welcome, setup, and accessibility team",
    needStatement:
      "Help create a calm, clearly marked Sunday experience by placing signs, preparing welcome materials, supporting accessibility, and resetting shared spaces afterward.",
    impactStatement:
      "Guests and families can find the right entrance, Kids Kingdom information, seating, and a person who is ready to help without pressure.",
    partnerName: "Boston Church Lowell",
    kind: "church_hosted",
    category: "church_operations",
    generalLocation: "Butler Middle School",
    locality: "Lowell",
    region: "MA",
    postalCode: "01852",
    latitude: 42.6177,
    longitude: -71.296,
    familyFriendly: false,
    ageRequirements: "Adults and approved teens serving with a leader",
    physicalRequirements: "Light lifting; seated welcome roles also available",
    skills: ["Hospitality", "Accessibility", "Setup", "Guest support"],
    accessibilityNotes: "Seated greeting and information-table roles are available.",
    safeguardingRequirements: "Teen volunteers remain in visible, leader-supervised teams.",
    whatToBring: "Closed-toe shoes for setup roles",
    indoorOutdoor: "either",
    commitmentLevel: "recurring",
    registrationMode: "hub_signup",
    churchSponsored: true,
    safetySummary: "Approved team assignment with a named Sunday coordinator.",
    transportationAvailable: false,
    backgroundCheckRequired: false,
    bookmarked: false,
    shifts: [
      {
        id: "shift-sunday-setup",
        startsAt: setupStart,
        endsAt: endAfter(setupStart, 3.75),
        capacity: 12,
        signedUpCount: 8,
        allowWaitlist: true,
        status: "open",
        minimumAge: 16,
        weatherStatus: "scheduled",
        meetingInstructions: "Meet the Sunday coordinator at the approved church entrance.",
        userStatus: null,
      },
    ],
  },
  {
    id: "service-neighborhood-cleanup",
    title: "Neighborhood litter pickup and prayer walk",
    needStatement:
      "A member household is inviting others to care for a public park area while praying for the surrounding neighborhood.",
    impactStatement:
      "A small group can leave a shared public space cleaner, model visible care for neighbors, and build relationships through ordinary service.",
    partnerName: "Member-led invitation",
    kind: "member_led",
    category: "environment",
    generalLocation: "Shedd Park area",
    locality: "Lowell",
    region: "MA",
    postalCode: "01852",
    latitude: 42.6368,
    longitude: -71.2885,
    familyFriendly: true,
    ageRequirements: "Families welcome; minors remain with their guardian",
    physicalRequirements: "Walking, bending, and light carrying; choose only safe litter",
    skills: ["Neighborhood care", "Prayer", "Cleanup"],
    accessibilityNotes: "A paved-loop prayer role is available without litter pickup.",
    safeguardingRequirements: "Public-place gathering; guardians supervise children; no hazardous waste handling.",
    whatToBring: "Gloves, water, bright clothing; bags supplied by host",
    indoorOutdoor: "outdoor",
    commitmentLevel: "one_time",
    registrationMode: "hub_signup",
    churchSponsored: false,
    safetySummary:
      "Member-led and not church-sponsored. Do not touch needles, chemicals, sharp objects, or unknown hazardous material; report them to the city.",
    transportationAvailable: false,
    backgroundCheckRequired: false,
    bookmarked: false,
    shifts: [
      {
        id: "shift-cleanup",
        startsAt: cleanupStart,
        endsAt: endAfter(cleanupStart, 1.5),
        capacity: 18,
        signedUpCount: 11,
        allowWaitlist: true,
        status: "open",
        minimumAge: 0,
        weatherStatus: "weather_watch",
        meetingInstructions: "The public meeting point appears after RSVP acceptance.",
        userStatus: null,
      },
    ],
  },
  {
    id: "service-mvfb",
    title: "Explore Merrimack Valley Food Bank volunteer openings",
    needStatement:
      "The food bank and its member agencies periodically publish opportunities involving food distribution, community markets, deliveries, and partner programs.",
    impactStatement:
      "Verified openings can help address food insecurity across Greater Lowell while matching volunteers to an organization that owns the work and training requirements.",
    partnerName: "Merrimack Valley Food Bank",
    kind: "public_lead",
    category: "hunger",
    generalLocation: "1703 Middlesex Street",
    locality: "Lowell",
    region: "MA",
    postalCode: "01851",
    latitude: 42.6371,
    longitude: -71.351,
    familyFriendly: false,
    ageRequirements: "Confirm current age and group requirements with the organization",
    physicalRequirements: "Varies by opening",
    skills: ["Food access", "Packing", "Distribution", "Delivery"],
    accessibilityNotes: "Ask the organization about role-specific accommodations.",
    safeguardingRequirements: "Register directly with the organization and follow its screening and safety rules.",
    whatToBring: "Confirm with the organization",
    indoorOutdoor: "either",
    commitmentLevel: "flexible",
    registrationMode: "external_link",
    sourceUrl: "https://mvfb.org/how-to-help/group-volunteers-2/",
    sourceVerifiedAt: new Date().toISOString(),
    churchSponsored: false,
    safetySummary: "Public lead only. Availability changes and must be confirmed on the official source page.",
    transportationAvailable: false,
    backgroundCheckRequired: false,
    bookmarked: false,
    shifts: [],
  },
  {
    id: "service-agespan",
    title: "Explore AgeSpan Meals on Wheels volunteering",
    needStatement:
      "AgeSpan publicly recruits volunteers to deliver meals and provide regular social connection for older adults and adults with disabilities.",
    impactStatement:
      "A recurring delivery route can address hunger and isolation while helping neighbors remain connected in their community.",
    partnerName: "AgeSpan",
    kind: "public_lead",
    category: "older_adults",
    generalLocation: "Lowell and surrounding service area",
    locality: "Lowell",
    region: "MA",
    postalCode: "01852",
    latitude: 42.6334,
    longitude: -71.3162,
    familyFriendly: false,
    ageRequirements: "Confirm driver, age, vehicle, and screening requirements with AgeSpan",
    physicalRequirements: "Reliable transportation and repeated vehicle entry; role requirements vary",
    skills: ["Driving", "Consistency", "Older-adult support"],
    accessibilityNotes: "Ask AgeSpan about non-driving and accommodated roles.",
    safeguardingRequirements: "Apply through AgeSpan and complete all required screening and training.",
    whatToBring: "Reliable vehicle if applying to drive",
    indoorOutdoor: "either",
    commitmentLevel: "recurring",
    registrationMode: "external_link",
    sourceUrl: "https://agespan.org/volunteer/meals-on-wheels/",
    sourceVerifiedAt: new Date().toISOString(),
    churchSponsored: false,
    safetySummary: "Public lead only. The church does not supervise routes or determine eligibility.",
    transportationAvailable: false,
    backgroundCheckRequired: true,
    bookmarked: false,
    shifts: [],
  },
  {
    id: "service-eliot-day-center",
    title: "Explore Eliot Day Center volunteer and donation needs",
    needStatement:
      "The Eliot Day Center publicly describes needs involving food preparation, cleanup, clothing and hygiene-item sorting, and welcoming conversation with guests.",
    impactStatement:
      "Approved volunteers can support a daytime resource hub serving unhoused neighbors while following the Day Center’s own direction and boundaries.",
    partnerName: "Eliot Day Center",
    kind: "public_lead",
    category: "housing",
    generalLocation: "273 Summer Street",
    locality: "Lowell",
    region: "MA",
    postalCode: "01852",
    latitude: 42.6392,
    longitude: -71.3122,
    familyFriendly: false,
    ageRequirements: "Confirm current requirements with the Day Center",
    physicalRequirements: "Roles vary from sorting and cleanup to food service and conversation",
    skills: ["Hospitality", "Food service", "Sorting", "Conversation"],
    accessibilityNotes: "Ask the Day Center which roles can be adapted.",
    safeguardingRequirements: "Contact the Day Center before arriving and follow its guest-privacy and safety practices.",
    whatToBring: "Only items or supplies the Day Center has confirmed it can use",
    indoorOutdoor: "indoor",
    commitmentLevel: "flexible",
    registrationMode: "external_link",
    sourceUrl: "https://eliotlowell.org/daycenter/",
    sourceVerifiedAt: new Date().toISOString(),
    churchSponsored: false,
    safetySummary: "Public lead only. Never photograph or publish a guest without the organization’s explicit process and consent.",
    transportationAvailable: false,
    backgroundCheckRequired: false,
    bookmarked: false,
    shifts: [],
  },
  {
    id: "service-cba",
    title: "Explore Coalition for a Better Acre volunteer opportunities",
    needStatement:
      "Coalition for a Better Acre publicly invites volunteers and supports food distribution, resident engagement, neighborhood events, and community revitalization.",
    impactStatement:
      "Volunteers can support resident-led neighborhood work through an organization that coordinates the role, timing, and community priorities.",
    partnerName: "Coalition for a Better Acre",
    kind: "public_lead",
    category: "neighborhood",
    generalLocation: "517 Moody Street",
    locality: "Lowell",
    region: "MA",
    postalCode: "01854",
    latitude: 42.645,
    longitude: -71.328,
    familyFriendly: false,
    ageRequirements: "Confirm current project requirements with CBA",
    physicalRequirements: "Varies by food distribution, event, or neighborhood project",
    skills: ["Food distribution", "Community events", "Neighborhood care"],
    accessibilityNotes: "Ask CBA about project-specific accommodations.",
    safeguardingRequirements: "Use CBA’s official volunteer process and project leadership.",
    whatToBring: "Confirm with CBA before the project",
    indoorOutdoor: "either",
    commitmentLevel: "flexible",
    registrationMode: "external_link",
    sourceUrl: "https://www.coalitionforabetteracre.org/volunteer",
    sourceVerifiedAt: new Date().toISOString(),
    churchSponsored: false,
    safetySummary: "Public lead only. Current projects and capacity must be confirmed with CBA.",
    transportationAvailable: false,
    backgroundCheckRequired: false,
    bookmarked: false,
    shifts: [],
  },
  {
    id: "service-cert",
    title: "Explore Lowell Community Emergency Response Team training",
    needStatement:
      "The City of Lowell invites residents to learn preparedness skills and support the community during emergencies through its CERT program.",
    impactStatement:
      "Trained volunteers can contribute safely and under public-agency direction rather than improvising during an emergency.",
    partnerName: "City of Lowell CERT",
    kind: "public_lead",
    category: "public_health",
    generalLocation: "City of Lowell",
    locality: "Lowell",
    region: "MA",
    postalCode: "01852",
    latitude: 42.6334,
    longitude: -71.3162,
    familyFriendly: false,
    ageRequirements: "Confirm current training and eligibility requirements with the city",
    physicalRequirements: "Training and activation requirements vary",
    skills: ["Emergency preparedness", "Public service", "Training"],
    accessibilityNotes: "Ask the city about accessible training and volunteer roles.",
    safeguardingRequirements: "Only act within city training, authorization, and incident command.",
    whatToBring: "Follow city instructions",
    indoorOutdoor: "either",
    commitmentLevel: "recurring",
    registrationMode: "external_link",
    sourceUrl: "https://www.lowellma.gov/328/Emergency-Preparedness",
    sourceVerifiedAt: new Date().toISOString(),
    churchSponsored: false,
    safetySummary: "Public lead only. Never self-deploy to an emergency.",
    transportationAvailable: false,
    backgroundCheckRequired: false,
    bookmarked: false,
    shifts: [],
  },
  {
    id: "service-encouragement-cards",
    title: "Create encouragement cards for isolated neighbors",
    needStatement:
      "Set aside time to write thoughtful, nonpolitical, non-soliciting encouragement cards that an approved ministry or community partner can distribute.",
    impactStatement:
      "A simple handwritten message can communicate dignity and care to an older adult, recovering neighbor, caregiver, or person experiencing isolation.",
    partnerName: "Self-guided service idea",
    kind: "self_guided",
    category: "older_adults",
    generalLocation: "Complete at home; distribute only through an approved recipient channel",
    locality: "Any location",
    region: "MA",
    familyFriendly: true,
    ageRequirements: "All ages with guardian review",
    physicalRequirements: "Seated activity",
    skills: ["Encouragement", "Writing", "Art"],
    accessibilityNotes: "Can be completed seated, with speech-to-text, or as a family project.",
    safeguardingRequirements: "Do not include personal contact information or deliver directly to a private home without an approved partner process.",
    whatToBring: "Cards, markers, envelopes, and the approved content guidance",
    indoorOutdoor: "indoor",
    commitmentLevel: "self_guided",
    registrationMode: "self_guided",
    churchSponsored: false,
    safetySummary: "Independent idea. A partner or ministry leader should approve recipient distribution.",
    transportationAvailable: false,
    backgroundCheckRequired: false,
    bookmarked: false,
    shifts: [],
  },
];

const previewProposals: ServiceProposal[] = [
  {
    id: "proposal-1",
    title: "Family-friendly public trail cleanup",
    category: "environment",
    generalLocation: "Lowell public trail area",
    postalCode: "01854",
    proposedKind: "member_led",
    status: "pending",
    riskLevel: "review",
    createdAt: new Date().toISOString(),
  },
];

const scriptureGuides = [
  {
    reference: "Mark 10:45",
    theme: "Jesus defines greatness through service",
    reflection: "Choose a role that helps another person rather than one that mainly increases your visibility.",
  },
  {
    reference: "John 13:12–17",
    theme: "Jesus models humble, practical care",
    reflection: "Look for ordinary tasks others may overlook: setup, cleanup, listening, carrying, preparing, and welcoming.",
  },
  {
    reference: "Matthew 25:35–40",
    theme: "Care for people in need matters deeply to Christ",
    reflection: "Serve with dignity and without using another person’s hardship as content, proof, or publicity.",
  },
  {
    reference: "Galatians 5:13",
    theme: "Freedom becomes loving service",
    reflection: "Let love—not guilt, pressure, or comparison—shape the commitment you make.",
  },
  {
    reference: "1 Peter 4:10–11",
    theme: "Use your gifts as a faithful steward",
    reflection: "Offer the ability you actually have, stay within your competence, and make room for others’ gifts too.",
  },
  {
    reference: "Philippians 2:3–4",
    theme: "Pay attention to the interests of others",
    reflection: "Begin with the need identified by the community or partner, not the project you personally prefer to perform.",
  },
  {
    reference: "James 2:14–17",
    theme: "Faith becomes visible through practical care",
    reflection: "Pair prayer and encouragement with a concrete, responsible next action when you are able.",
  },
  {
    reference: "Hebrews 13:16",
    theme: "Do good and share",
    reflection: "Consider time, skills, supplies, hospitality, transportation, advocacy, and consistent presence—not only money.",
  },
  {
    reference: "Micah 6:8",
    theme: "Justice, mercy, and humility belong together",
    reflection: "Serve in a way that respects people’s choices, privacy, culture, and leadership.",
  },
  {
    reference: "Romans 12:9–13",
    theme: "Sincere love practices generosity and hospitality",
    reflection: "Build reliable habits of service instead of waiting only for dramatic moments.",
  },
  {
    reference: "Colossians 3:23–24",
    theme: "Work wholeheartedly for the Lord",
    reflection: "Complete the task carefully, arrive prepared, and communicate if you can no longer serve.",
  },
  {
    reference: "Ephesians 2:10",
    theme: "We are created for good works",
    reflection: "Ask which prepared opportunity fits this season of your life, capacity, family, and gifts.",
  },
] as const;

const storageKey = "church-hub-service-showcase-v2";

function distanceMiles(a: Coordinates, latitude: number, longitude: number): number {
  const radius = 3958.7613;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const dLat = toRadians(latitude - a.latitude);
  const dLon = toRadians(longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(latitude);
  const haversine =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return radius * 2 * Math.asin(Math.min(1, Math.sqrt(haversine)));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function directionsUrl(opportunity: ServiceOpportunity): string {
  const query = [opportunity.generalLocation, opportunity.locality, opportunity.region, opportunity.postalCode]
    .filter(Boolean)
    .join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function ServiceHub({
  mode,
  canLead,
  defaultPostalCode = "01852",
}: {
  mode: "showcase" | "live";
  canLead: boolean;
  defaultPostalCode?: string;
}) {
  const [activeTab, setActiveTab] = useState<ServiceTab>("discover");
  const [opportunities, setOpportunities] = useState<ServiceOpportunity[]>(previewOpportunities);
  const [proposals, setProposals] = useState<ServiceProposal[]>(previewProposals);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [postalCode, setPostalCode] = useState(defaultPostalCode);
  const [radius, setRadius] = useState(15);
  const [origin, setOrigin] = useState<Coordinates | null>(zipCentroids[defaultPostalCode] ?? null);
  const [category, setCategory] = useState<"all" | ServiceCategory>("all");
  const [kind, setKind] = useState<"all" | ServiceKind>("all");
  const [familyOnly, setFamilyOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [guideQuestion, setGuideQuestion] = useState("");
  const [loading, setLoading] = useState(mode === "live");

  useEffect(() => {
    if (mode === "showcase") {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        try {
          const payload = JSON.parse(stored) as ServicePayload;
          if (Array.isArray(payload.opportunities)) setOpportunities(payload.opportunities);
          if (Array.isArray(payload.proposals)) setProposals(payload.proposals);
        } catch {
          window.localStorage.removeItem(storageKey);
        }
      }
      return;
    }
    void refreshLive(postalCode, radius);
    // The initial load is intentionally controlled here rather than on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    if (mode !== "showcase") return;
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ opportunities, proposals } satisfies ServicePayload),
    );
  }, [mode, opportunities, proposals]);

  async function refreshLive(nextPostalCode: string, nextRadius: number) {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        postalCode: nextPostalCode,
        radius: String(nextRadius),
      });
      const response = await fetch(`/api/service?${params.toString()}`, { cache: "no-store" });
      const payload = (await response.json()) as ServicePayload & { message?: string };
      if (!response.ok) throw new Error(payload.message ?? "Unable to load service opportunities.");
      setOpportunities(payload.opportunities ?? []);
      setProposals(payload.proposals ?? []);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to load service opportunities.");
    } finally {
      setLoading(false);
    }
  }

  async function sendLive(action: string, payload: Record<string, unknown>) {
    const response = await fetch("/api/service", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    });
    const result = (await response.json()) as { message?: string };
    if (!response.ok) throw new Error(result.message ?? "The service action could not be completed.");
    await refreshLive(postalCode, radius);
  }

  const nearbyOpportunities = useMemo(() => {
    return opportunities.map((opportunity) => {
      if (!origin || opportunity.latitude == null || opportunity.longitude == null) {
        return opportunity;
      }
      return {
        ...opportunity,
        distanceMiles: distanceMiles(origin, opportunity.latitude, opportunity.longitude),
      };
    });
  }, [opportunities, origin]);

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return nearbyOpportunities
      .filter((opportunity) => {
        if (category !== "all" && opportunity.category !== category) return false;
        if (kind !== "all" && opportunity.kind !== kind) return false;
        if (familyOnly && !opportunity.familyFriendly) return false;
        if (activeTab === "nearby" && opportunity.distanceMiles != null && opportunity.distanceMiles > radius) {
          return false;
        }
        if (!normalized) return true;
        return [
          opportunity.title,
          opportunity.needStatement,
          opportunity.impactStatement,
          opportunity.partnerName,
          opportunity.generalLocation,
          opportunity.locality,
          opportunity.postalCode ?? "",
          opportunity.skills.join(" "),
          categoryLabels[opportunity.category],
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalized);
      })
      .sort((a, b) => {
        const distanceA = a.distanceMiles ?? 9999;
        const distanceB = b.distanceMiles ?? 9999;
        return distanceA - distanceB || a.title.localeCompare(b.title);
      });
  }, [activeTab, category, familyOnly, kind, nearbyOpportunities, radius, search]);

  const commitments = useMemo(
    () =>
      nearbyOpportunities.filter(
        (opportunity) =>
          opportunity.bookmarked ||
          opportunity.shifts.some((shift) => shift.userStatus === "going" || shift.userStatus === "waitlisted"),
      ),
    [nearbyOpportunities],
  );

  const selected = nearbyOpportunities.find((opportunity) => opportunity.id === selectedId) ?? null;

  function applyPostalCode() {
    const normalized = postalCode.trim().slice(0, 5);
    const coordinates = zipCentroids[normalized];
    if (coordinates) {
      setOrigin(coordinates);
      setPostalCode(normalized);
      setActiveTab("nearby");
      setNotice(`Showing opportunities near ${coordinates.label}. Distances are approximate.`);
      if (mode === "live") void refreshLive(normalized, radius);
      return;
    }
    setOrigin(null);
    setActiveTab("nearby");
    setNotice(
      "That ZIP is not in the local showroom centroid list. Live deployments can add ZIP centroids or a church-approved geocoding provider; exact ZIP matches still appear.",
    );
    if (mode === "live") void refreshLive(normalized, radius);
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setNotice("This browser does not provide location access. Enter a ZIP code instead.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOrigin({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          label: "your current location",
        });
        setActiveTab("nearby");
        setNotice("Using your device location only for this page session. It is not saved to your profile.");
      },
      () => setNotice("Location permission was not granted. You can still search by ZIP code."),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  function guide() {
    const question = guideQuestion.toLowerCase();
    if (/scripture|bible|verse|jesus|why serve|heart/.test(question)) {
      setActiveTab("scripture");
      setNotice("Opened Serve in Scripture. References use short summaries rather than reproducing a copyrighted translation.");
      return;
    }
    if (/near|zip|close|distance|lowell|chelmsford|dracut|tewksbury/.test(question)) {
      setActiveTab("nearby");
      setNotice("Opened the ZIP and distance finder.");
      return;
    }
    if (/family|kids|child/.test(question)) setFamilyOnly(true);
    if (/food|hunger|meal|pantry/.test(question)) setCategory("hunger");
    else if (/older|senior|elder|meals on wheels/.test(question)) setCategory("older_adults");
    else if (/clean|park|environment|litter/.test(question)) setCategory("environment");
    else if (/church|sunday|setup|welcome/.test(question)) setCategory("church_operations");
    else if (/recovery|sober|addiction/.test(question)) setCategory("recovery_support");
    if (/my idea|propose|start|organize|unofficial|member-led/.test(question)) {
      setActiveTab("propose");
      setNotice("Opened the member-led service proposal form. Proposals are reviewed before appearing to other members.");
      return;
    }
    setActiveTab("discover");
    setNotice("Filtered the service board using the needs and preferences you named.");
  }

  async function toggleBookmark(opportunity: ServiceOpportunity) {
    try {
      if (mode === "showcase") {
        setOpportunities((current) =>
          current.map((row) =>
            row.id === opportunity.id ? { ...row, bookmarked: !row.bookmarked } : row,
          ),
        );
      } else {
        await sendLive(opportunity.bookmarked ? "remove_bookmark" : "bookmark", {
          opportunityId: opportunity.id,
        });
      }
      setNotice(opportunity.bookmarked ? "Removed from saved service opportunities." : "Saved to My commitments.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The bookmark could not be updated.");
    }
  }

  async function joinShift(opportunity: ServiceOpportunity, shift: ServiceShift) {
    if (shift.status === "cancelled" || shift.status === "completed") return;
    const rawPartySize = window.prompt("How many people are you signing up, including yourself?", "1");
    if (rawPartySize == null) return;
    const partySize = Math.max(1, Math.min(20, Number.parseInt(rawPartySize, 10) || 1));
    const available = Math.max(0, shift.capacity - shift.signedUpCount);
    const nextStatus: SignupStatus = partySize <= available ? "going" : shift.allowWaitlist ? "waitlisted" : null;
    if (!nextStatus) {
      setNotice("That shift is full and does not accept a waitlist.");
      return;
    }
    try {
      if (mode === "showcase") {
        setOpportunities((current) =>
          current.map((row) =>
            row.id === opportunity.id
              ? {
                  ...row,
                  shifts: row.shifts.map((item) =>
                    item.id === shift.id
                      ? {
                          ...item,
                          userStatus: nextStatus,
                          partySize,
                          signedUpCount:
                            nextStatus === "going" ? item.signedUpCount + partySize : item.signedUpCount,
                        }
                      : item,
                  ),
                }
              : row,
          ),
        );
      } else {
        await sendLive("join_shift", { shiftId: shift.id, partySize });
      }
      setNotice(
        nextStatus === "going"
          ? "You are registered. Open My commitments for the shift and instructions."
          : "The shift is full, so you were added to the waitlist.",
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The shift signup could not be completed.");
    }
  }

  async function cancelSignup(opportunity: ServiceOpportunity, shift: ServiceShift) {
    try {
      if (mode === "showcase") {
        setOpportunities((current) =>
          current.map((row) =>
            row.id === opportunity.id
              ? {
                  ...row,
                  shifts: row.shifts.map((item) =>
                    item.id === shift.id
                      ? {
                          ...item,
                          signedUpCount:
                            item.userStatus === "going"
                              ? Math.max(0, item.signedUpCount - (item.partySize ?? 1))
                              : item.signedUpCount,
                          userStatus: "cancelled",
                        }
                      : item,
                  ),
                }
              : row,
          ),
        );
      } else {
        await sendLive("cancel_signup", { shiftId: shift.id });
      }
      setNotice("Your signup was cancelled so the space can be offered to someone else.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The signup could not be cancelled.");
    }
  }

  function startSelfGuided(opportunity: ServiceOpportunity) {
    setOpportunities((current) =>
      current.map((row) => (row.id === opportunity.id ? { ...row, bookmarked: true } : row)),
    );
    setActiveTab("commitments");
    setNotice("Added the self-guided idea to My commitments. Review the safety and recipient-distribution boundaries before beginning.");
  }

  async function createProposal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const flags = {
      publicPlaceConfirmed: data.get("publicPlaceConfirmed") === "on",
      homeAccessInvolved: data.get("homeAccessInvolved") === "on",
      transportationInvolved: data.get("transportationInvolved") === "on",
      minorsInvolved: data.get("minorsInvolved") === "on",
      hazardousWork: data.get("hazardousWork") === "on",
      cashHandling: data.get("cashHandling") === "on",
      professionalService: data.get("professionalService") === "on",
    };
    const riskLevel: ServiceProposal["riskLevel"] =
      flags.hazardousWork || flags.homeAccessInvolved || flags.cashHandling
        ? "restricted"
        : flags.transportationInvolved ||
            flags.minorsInvolved ||
            flags.professionalService ||
            !flags.publicPlaceConfirmed
          ? "review"
          : "standard";
    const proposal: ServiceProposal = {
      id: crypto.randomUUID(),
      title: String(data.get("title") ?? "").trim(),
      category: String(data.get("category")) as ServiceCategory,
      generalLocation: String(data.get("generalLocation") ?? "").trim(),
      postalCode: String(data.get("postalCode") ?? "").trim() || undefined,
      proposedKind: String(data.get("proposedKind")) as ServiceProposal["proposedKind"],
      status: "pending",
      riskLevel,
      createdAt: new Date().toISOString(),
    };
    try {
      if (mode === "showcase") {
        setProposals((current) => [proposal, ...current]);
      } else {
        await sendLive("create_proposal", {
          ...proposal,
          needStatement: String(data.get("needStatement") ?? "").trim(),
          impactStatement: String(data.get("impactStatement") ?? "").trim(),
          proposedStartsAt: String(data.get("proposedStartsAt") ?? "") || null,
          proposedEndsAt: String(data.get("proposedEndsAt") ?? "") || null,
          familyFriendly: data.get("familyFriendly") === "on",
          ...flags,
        });
      }
      form.reset();
      setNotice(
        riskLevel === "restricted"
          ? "The proposal was routed for restricted leader review because it involves higher-risk activity. It is not visible to members."
          : "The proposal was sent for leader review. It will not appear to other members until approved.",
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The proposal could not be submitted.");
    }
  }

  function resetShowcase() {
    setOpportunities(previewOpportunities);
    setProposals(previewProposals);
    setSelectedId(null);
    window.localStorage.removeItem(storageKey);
    setNotice("Service Hub showcase restored.");
  }

  function renderOpportunityCard(opportunity: ServiceOpportunity) {
    const nextShift = opportunity.shifts
      .filter((shift) => shift.status === "open" || shift.status === "full")
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];
    const remaining = nextShift ? Math.max(0, nextShift.capacity - nextShift.signedUpCount) : null;
    return (
      <article className="service-card" key={opportunity.id}>
        <header>
          <span className={`service-kind service-kind--${opportunity.kind}`}>{kindLabels[opportunity.kind]}</span>
          {opportunity.distanceMiles != null ? <b>{opportunity.distanceMiles.toFixed(1)} mi</b> : null}
        </header>
        <p className="service-card__category">{categoryLabels[opportunity.category]}</p>
        <h3>{opportunity.title}</h3>
        <p>{opportunity.needStatement}</p>
        <div className="service-card__meta">
          <span>⌖ {opportunity.generalLocation}{opportunity.postalCode ? ` · ${opportunity.postalCode}` : ""}</span>
          <span>{opportunity.familyFriendly ? "Family-friendly" : opportunity.ageRequirements}</span>
          <span>{opportunity.indoorOutdoor.replace("_", " ")} · {opportunity.commitmentLevel.replace("_", " ")}</span>
        </div>
        <div className="tag-row">
          {opportunity.skills.slice(0, 4).map((skill) => <span key={skill}>{skill}</span>)}
        </div>
        {nextShift ? (
          <div className="service-card__shift">
            <strong>{formatDateTime(nextShift.startsAt)}</strong>
            <span>
              {nextShift.userStatus === "going"
                ? "You are going"
                : nextShift.userStatus === "waitlisted"
                  ? "You are waitlisted"
                  : remaining === 0
                    ? nextShift.allowWaitlist
                      ? "Waitlist open"
                      : "Full"
                    : `${remaining} spot${remaining === 1 ? "" : "s"} left`}
            </span>
          </div>
        ) : (
          <div className="service-card__shift service-card__shift--source">
            <strong>{opportunity.registrationMode === "self_guided" ? "Start when ready" : "Confirm with source"}</strong>
            <span>{opportunity.registrationMode.replace("_", " ")}</span>
          </div>
        )}
        <footer>
          <button type="button" onClick={() => setSelectedId(opportunity.id)}>View details</button>
          <button
            type="button"
            className={opportunity.bookmarked ? "active" : ""}
            onClick={() => void toggleBookmark(opportunity)}
            aria-label={opportunity.bookmarked ? "Remove saved opportunity" : "Save opportunity"}
          >
            {opportunity.bookmarked ? "★ Saved" : "☆ Save"}
          </button>
        </footer>
      </article>
    );
  }

  return (
    <div className="service-hub">
      <section className="service-hero">
        <div>
          <p className="module-kicker">Love God by loving neighbors in practical ways</p>
          <h2>Find a real need. Choose a responsible role. Serve with humility.</h2>
          <p>
            Discover church-hosted projects, approved partners, member-led invitations, self-guided
            ideas, and public opportunity leads—each clearly labeled so you know who owns the work.
          </p>
        </div>
        <div className="service-hero__metrics">
          <div><strong>{opportunities.length}</strong><span>ways to serve</span></div>
          <div><strong>{commitments.length}</strong><span>saved or joined</span></div>
          <div><strong>{proposals.filter((proposal) => proposal.status === "pending").length}</strong><span>ideas in review</span></div>
        </div>
      </section>

      <section className="service-guide">
        <div>
          <strong>✦ Serve Guide</strong>
          <span>Describe your availability, gifts, family needs, ZIP, or the kind of neighbor you hope to support.</span>
        </div>
        <div>
          <input
            value={guideQuestion}
            onChange={(event) => setGuideQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") guide();
            }}
            placeholder="Example: Our family has two hours Saturday near 01852"
            maxLength={500}
          />
          <button type="button" onClick={guide}>Guide me</button>
        </div>
      </section>

      <nav className="module-tabs service-tabs" aria-label="Service Hub sections">
        {([
          ["discover", "Discover"],
          ["nearby", "Near me"],
          ["commitments", "My commitments"],
          ["scripture", "Serve in Scripture"],
          ["propose", "Propose service"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={activeTab === value ? "active" : ""}
            onClick={() => setActiveTab(value)}
          >
            {label}
          </button>
        ))}
      </nav>

      {notice ? <p className="module-notice" role="status">{notice}</p> : null}

      {(activeTab === "discover" || activeTab === "nearby") ? (
        <>
          <section className="service-finder">
            <div className="service-finder__location">
              <label>
                ZIP code
                <input
                  value={postalCode}
                  onChange={(event) => setPostalCode(event.target.value.replace(/\D/g, "").slice(0, 5))}
                  inputMode="numeric"
                  placeholder="01852"
                />
              </label>
              <label>
                Radius
                <select value={radius} onChange={(event) => setRadius(Number(event.target.value))}>
                  <option value={3}>3 miles</option>
                  <option value={5}>5 miles</option>
                  <option value={10}>10 miles</option>
                  <option value={15}>15 miles</option>
                  <option value={25}>25 miles</option>
                  <option value={50}>50 miles</option>
                </select>
              </label>
              <button type="button" onClick={applyPostalCode}>Find nearby</button>
              <button type="button" className="secondary" onClick={useCurrentLocation}>Use my location</button>
            </div>
            <p>
              {origin
                ? `Distance is calculated from ${origin.label}; coordinates remain in this page session.`
                : "Enter a supported ZIP or use device location. Exact private addresses are never used for discovery."}
            </p>
          </section>

          <section className="service-controls">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search needs, skills, partners, or locations…" />
            <select value={category} onChange={(event) => setCategory(event.target.value as typeof category)}>
              <option value="all">All service categories</option>
              {Object.entries(categoryLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
            </select>
            <select value={kind} onChange={(event) => setKind(event.target.value as typeof kind)}>
              <option value="all">All sponsorship types</option>
              {Object.entries(kindLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
            </select>
            <label className="service-check"><input type="checkbox" checked={familyOnly} onChange={(event) => setFamilyOnly(event.target.checked)} /> Family-friendly only</label>
          </section>

          <section className="service-kind-key" aria-label="Service sponsorship labels">
            {Object.entries(kindDescriptions).map(([value, description]) => (
              <article key={value}>
                <strong>{kindLabels[value as ServiceKind]}</strong>
                <span>{description}</span>
              </article>
            ))}
          </section>

          {loading ? <p className="module-empty">Loading service opportunities…</p> : null}
          {!loading ? (
            <section className="service-grid">
              {filtered.map(renderOpportunityCard)}
              {!filtered.length ? (
                <div className="module-empty-state">
                  <h3>No matching opportunities yet</h3>
                  <p>Expand the radius, remove a filter, check a nearby ZIP, or propose a responsible member-led service idea.</p>
                  <button type="button" onClick={() => setActiveTab("propose")}>Propose an idea</button>
                </div>
              ) : null}
            </section>
          ) : null}
        </>
      ) : null}

      {activeTab === "commitments" ? (
        <section className="module-workspace">
          <div className="section-heading">
            <div><p>Reliable follow-through</p><h3>My saved opportunities and shift commitments</h3></div>
          </div>
          <div className="service-commitments">
            {commitments.map((opportunity) => (
              <article key={opportunity.id}>
                <div>
                  <span className={`service-kind service-kind--${opportunity.kind}`}>{kindLabels[opportunity.kind]}</span>
                  <h3>{opportunity.title}</h3>
                  <p>{opportunity.generalLocation} · {opportunity.locality}</p>
                </div>
                <div>
                  {opportunity.shifts
                    .filter((shift) => shift.userStatus === "going" || shift.userStatus === "waitlisted")
                    .map((shift) => (
                      <div className="service-commitment-shift" key={shift.id}>
                        <strong>{formatDateTime(shift.startsAt)}</strong>
                        <span>{shift.userStatus === "going" ? `Going · party of ${shift.partySize ?? 1}` : "Waitlisted"}</span>
                        {shift.meetingInstructions ? <small>{shift.meetingInstructions}</small> : null}
                        <button type="button" onClick={() => void cancelSignup(opportunity, shift)}>Cancel signup</button>
                      </div>
                    ))}
                  {!opportunity.shifts.some((shift) => shift.userStatus === "going" || shift.userStatus === "waitlisted") ? (
                    <p>Saved for later review.</p>
                  ) : null}
                </div>
                <button type="button" onClick={() => setSelectedId(opportunity.id)}>Open details</button>
              </article>
            ))}
            {!commitments.length ? <p className="module-empty">You have not saved or joined a service opportunity yet.</p> : null}
          </div>
        </section>
      ) : null}

      {activeTab === "scripture" ? (
        <section className="module-workspace service-scripture">
          <div className="section-heading">
            <div><p>Scripture before activity</p><h3>Let serving be shaped by Jesus, love, humility, and responsibility</h3></div>
          </div>
          <p className="module-boundary">
            These are references and ministry summaries—not a reproduced Bible translation. Open the approved Bible reader for the full passage and translation.
          </p>
          <div className="service-scripture-grid">
            {scriptureGuides.map((guide) => (
              <article key={guide.reference}>
                <span>{guide.reference}</span>
                <h3>{guide.theme}</h3>
                <p>{guide.reflection}</p>
                <a href={`/bible?reference=${encodeURIComponent(guide.reference)}`}>Open in Bible Journey →</a>
              </article>
            ))}
          </div>
          <div className="service-reflection-plan">
            <h3>A simple serving rhythm</h3>
            <ol>
              <li><strong>Listen:</strong> What need has the community, partner, or church leader actually identified?</li>
              <li><strong>Discern:</strong> Which role fits your gifts, competence, health, schedule, family, and current capacity?</li>
              <li><strong>Prepare:</strong> Review safety, accessibility, age, transportation, safeguarding, and supplies.</li>
              <li><strong>Serve:</strong> Arrive reliably, follow the host’s direction, protect dignity, and avoid using hardship as content.</li>
              <li><strong>Reflect:</strong> Thank God, follow up responsibly, and share impact only through approved consent-aware channels.</li>
            </ol>
          </div>
        </section>
      ) : null}

      {activeTab === "propose" ? (
        <section className="service-proposal-layout">
          <form className="module-form service-proposal-form" onSubmit={(event) => void createProposal(event)}>
            <div className="section-heading span-2"><div><p>Member initiative with review</p><h3>Propose a service opportunity</h3></div></div>
            <label>
              Proposal type
              <select name="proposedKind" defaultValue="member_led">
                <option value="member_led">Member-led gathering · not church-sponsored</option>
                <option value="self_guided">Self-guided service idea</option>
                <option value="approved_partner">Suggest an external partner for church review</option>
              </select>
            </label>
            <label>
              Category
              <select name="category" defaultValue="neighborhood">
                {Object.entries(categoryLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
              </select>
            </label>
            <label className="span-2">Title<input name="title" required minLength={3} maxLength={180} /></label>
            <label className="span-2">What need did you identify?<textarea name="needStatement" required minLength={20} maxLength={2500} rows={4} /></label>
            <label className="span-2">What responsible impact could this create?<textarea name="impactStatement" required minLength={20} maxLength={2500} rows={4} /></label>
            <label>General location<input name="generalLocation" required maxLength={200} placeholder="Public park area, Lowell" /></label>
            <label>ZIP code<input name="postalCode" inputMode="numeric" pattern="[0-9]{5}" maxLength={5} placeholder="01852" /></label>
            <label>Proposed start<input name="proposedStartsAt" type="datetime-local" /></label>
            <label>Proposed end<input name="proposedEndsAt" type="datetime-local" /></label>
            <fieldset className="span-2 service-risk-fieldset">
              <legend>Safety and review factors</legend>
              <label className="check-label"><input type="checkbox" name="familyFriendly" /> Designed for families</label>
              <label className="check-label"><input type="checkbox" name="publicPlaceConfirmed" /> Uses a lawful public or approved partner location</label>
              <label className="check-label"><input type="checkbox" name="minorsInvolved" /> Involves minors beyond their own guardian’s supervision</label>
              <label className="check-label"><input type="checkbox" name="transportationInvolved" /> Includes rides or transportation coordination</label>
              <label className="check-label"><input type="checkbox" name="homeAccessInvolved" /> Requires entering a private home</label>
              <label className="check-label"><input type="checkbox" name="hazardousWork" /> Includes hazardous cleanup, construction, medical, or emergency work</label>
              <label className="check-label"><input type="checkbox" name="cashHandling" /> Collects or transfers cash/payment</label>
              <label className="check-label"><input type="checkbox" name="professionalService" /> Represents licensed or professional services</label>
            </fieldset>
            <button type="submit">Send for service-team review</button>
          </form>
          <aside className="service-proposal-aside">
            <h3>What approval means</h3>
            <p>
              Approval can make a responsible proposal visible to members. It does not automatically make a member-led project church-sponsored, insured, professionally licensed, child-safe, or supervised.
            </p>
            <h4>Always requires deeper review</h4>
            <ul>
              <li>Private-home access or transportation</li>
              <li>Children outside their own guardian’s supervision</li>
              <li>Hazardous cleanup, construction, medical, legal, or financial work</li>
              <li>Cash collection, payments, or professional-service claims</li>
              <li>Photography, stories, or personal information about people receiving support</li>
            </ul>
            <h4>My proposal status</h4>
            <div className="service-proposal-status-list">
              {proposals.map((proposal) => (
                <article key={proposal.id}>
                  <strong>{proposal.title}</strong>
                  <span>{proposal.status.replace("_", " ")} · {proposal.riskLevel} review</span>
                  <small>{proposal.generalLocation}{proposal.postalCode ? ` · ${proposal.postalCode}` : ""}</small>
                  {proposal.reviewerNote ? <p>{proposal.reviewerNote}</p> : null}
                </article>
              ))}
            </div>
          </aside>
        </section>
      ) : null}

      {selected ? (
        <section className="service-detail" role="dialog" aria-modal="false" aria-label={`${selected.title} details`}>
          <button className="service-detail__close" type="button" onClick={() => setSelectedId(null)} aria-label="Close service details">×</button>
          <div className="service-detail__header">
            <div>
              <span className={`service-kind service-kind--${selected.kind}`}>{kindLabels[selected.kind]}</span>
              <p>{categoryLabels[selected.category]}</p>
              <h2>{selected.title}</h2>
              <small>{kindDescriptions[selected.kind]}</small>
            </div>
            {selected.distanceMiles != null ? <strong>{selected.distanceMiles.toFixed(1)} miles away</strong> : null}
          </div>
          <div className="service-detail__grid">
            <article><h3>The need</h3><p>{selected.needStatement}</p></article>
            <article><h3>Expected impact</h3><p>{selected.impactStatement}</p></article>
            <article><h3>Location</h3><p>{selected.generalLocation}, {selected.locality}, {selected.region} {selected.postalCode}</p><a href={directionsUrl(selected)} target="_blank" rel="noreferrer">Open public directions ↗</a></article>
            <article><h3>Who can serve</h3><p>{selected.ageRequirements}</p>{selected.physicalRequirements ? <p>{selected.physicalRequirements}</p> : null}</article>
            <article><h3>Accessibility</h3><p>{selected.accessibilityNotes ?? "Ask the host about role adaptations."}</p></article>
            <article><h3>Safeguarding and safety</h3><p>{selected.safeguardingRequirements ?? selected.safetySummary ?? "Follow the host’s approved safety process."}</p></article>
            <article><h3>What to bring</h3><p>{selected.whatToBring ?? "The host will provide instructions."}</p></article>
            <article><h3>Skills</h3><div className="tag-row">{selected.skills.map((skill) => <span key={skill}>{skill}</span>)}</div></article>
          </div>
          <div className="service-detail__actions">
            {selected.shifts.map((shift) => (
              <article key={shift.id}>
                <div><strong>{formatDateTime(shift.startsAt)}</strong><span>{shift.capacity - shift.signedUpCount} open of {shift.capacity}</span></div>
                {shift.userStatus === "going" || shift.userStatus === "waitlisted" ? (
                  <button type="button" onClick={() => void cancelSignup(selected, shift)}>Cancel {shift.userStatus}</button>
                ) : (
                  <button type="button" onClick={() => void joinShift(selected, shift)}>{shift.signedUpCount >= shift.capacity ? "Join waitlist" : "Join shift"}</button>
                )}
              </article>
            ))}
            {selected.registrationMode === "external_link" && selected.sourceUrl ? (
              <a href={selected.sourceUrl} target="_blank" rel="noreferrer">Open official source and verify availability ↗</a>
            ) : null}
            {selected.registrationMode === "self_guided" ? (
              <button type="button" onClick={() => startSelfGuided(selected)}>Add self-guided plan</button>
            ) : null}
          </div>
          {selected.kind === "public_lead" ? (
            <p className="module-boundary">
              This is public-source information, not a church endorsement or confirmed opening. Verify availability, requirements, screening, accessibility, and current instructions directly with the organization.
            </p>
          ) : null}
        </section>
      ) : null}

      {mode === "showcase" ? (
        <button type="button" className="module-secondary" onClick={resetShowcase}>Reset Service Hub showcase</button>
      ) : null}
    </div>
  );
}
