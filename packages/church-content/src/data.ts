import type {
  Location,
  MinistrySummary,
  PublicEvent,
  SermonSummary,
  ServiceOverride,
  ServiceTemplate,
} from "./types";

export const churchIdentity = {
  publicName: "Boston Church Lowell",
  regionName: "Northwest Region",
  parentOrganization: "Boston Church of Christ",
  description:
    "A community of disciples seeking to love God, love one another, and serve Lowell and the surrounding region.",
  publicPath: "/lowell",
  contactEmail: "hello@example.invalid",
  phoneDisplay: "Church office number pending approval",
} as const;

export const locations: Location[] = [
  {
    id: "butler-middle-school",
    name: "Butler Middle School",
    addressLine1: "1140 Gorham Street",
    city: "Lowell",
    region: "MA",
    postalCode: "01852",
    country: "US",
    directionsUrl:
      "https://www.google.com/maps/search/?api=1&query=1140+Gorham+Street+Lowell+MA+01852",
    accessibilityNotes: [
      "Accessible entrance details must be verified by the service operations owner.",
      "Parking and first-time guest entrance instructions are maintained in one approved record.",
    ],
  },
];

export const regularSundayService: ServiceTemplate = {
  id: "lowell-sunday-worship",
  locationId: "butler-middle-school",
  weekday: 0,
  localTime: "10:00",
  timezone: "America/New_York",
  title: "Sunday Worship",
  status: "published",
};

export const serviceOverrides: ServiceOverride[] = [
  {
    id: "sample-small-groups-2026-08-16",
    date: "2026-08-16",
    kind: "small_groups",
    title: "Small Groups Sunday",
    publicMessage:
      "This is synthetic starter content. Leadership must confirm any real schedule change before publishing.",
    status: "draft",
  },
  {
    id: "sample-special-service-2026-09-06",
    date: "2026-09-06",
    kind: "special_service",
    title: "Special Outdoor Worship",
    localTime: "11:00",
    publicMessage: "Synthetic example only. Location and time are not approved public information.",
    status: "draft",
  },
];

export const publicEvents: PublicEvent[] = [
  {
    id: "event-welcome-lunch",
    slug: "welcome-lunch",
    title: "Welcome Lunch",
    summary:
      "A relaxed introduction for visitors and newer members to meet local ministry leaders.",
    startAt: "2026-08-23T12:00:00-04:00",
    endAt: "2026-08-23T13:30:00-04:00",
    locationName: "Location shared after registration",
    visibility: "public",
    status: "draft",
  },
  {
    id: "event-community-service",
    slug: "lowell-community-service-day",
    title: "Lowell Community Service Day",
    summary: "A church-wide opportunity to serve alongside local community partners.",
    startAt: "2026-09-12T09:00:00-04:00",
    endAt: "2026-09-12T12:00:00-04:00",
    locationName: "Lowell, Massachusetts",
    visibility: "public",
    status: "draft",
  },
];

export const sermons: SermonSummary[] = [
  {
    id: "sermon-listen-and-live",
    slug: "listen-and-live",
    title: "Listen and Live the Word",
    seriesTitle: "Faith in Practice",
    speaker: "Minister name pending approval",
    publishedAt: "2026-08-02T10:00:00-04:00",
    summary:
      "A starter sermon record showing how a weekly lesson, approved outline, transcript, and Scripture references connect.",
    scriptureReferences: ["James 1:19-27"],
  },
];

export const ministries: MinistrySummary[] = [
  {
    slug: "kids-kingdom",
    title: "Kids Kingdom",
    audience: "Families with children",
    description:
      "Age-appropriate classes, secure check-in integration, and guardian-managed family information.",
    callToAction: "Learn about Sunday check-in",
  },
  {
    slug: "teens",
    title: "Teen Ministry",
    audience: "Middle- and high-school students",
    description:
      "Faith, friendship, service, and supervised group communication with clear youth-safety boundaries.",
    callToAction: "Meet the teen ministry",
  },
  {
    slug: "family-groups",
    title: "Family Groups",
    audience: "Adults, couples, and households",
    description:
      "Smaller communities that meet during the week for friendship, prayer, learning, and service.",
    callToAction: "Find a group",
  },
  {
    slug: "campus-and-young-professionals",
    title: "Campus & Young Professionals",
    audience: "College students and young adults",
    description: "Bible study, mentoring, service, and community for the current season of life.",
    callToAction: "Connect with a leader",
  },
];
