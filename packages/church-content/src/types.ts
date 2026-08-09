export type PublicationStatus = "draft" | "in_review" | "scheduled" | "published" | "archived";

export interface Location {
  id: string;
  name: string;
  addressLine1: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  directionsUrl: string;
  parkingInstructions?: string;
  entranceInstructions?: string;
  accessibilityNotes: string[];
}

export interface ServiceTemplate {
  id: string;
  locationId: string;
  weekday: number;
  localTime: string;
  timezone: string;
  title: string;
  status: PublicationStatus;
}

export interface ServiceOverride {
  id: string;
  date: string;
  kind: "cancelled" | "small_groups" | "time_change" | "location_change" | "special_service";
  title: string;
  localTime?: string;
  locationId?: string;
  publicMessage: string;
  status: PublicationStatus;
}

export interface ResolvedServiceOccurrence {
  date: string;
  title: string;
  localTime: string;
  timezone: string;
  location: Location;
  status: "scheduled" | "cancelled" | "small_groups";
  publicMessage?: string;
  source: "template" | "override";
}

export interface PublicEvent {
  id: string;
  slug: string;
  title: string;
  summary: string;
  startAt: string;
  endAt: string;
  locationName: string;
  address?: string;
  registrationUrl?: string;
  visibility: "public" | "member" | "ministry";
  status: PublicationStatus;
}

export interface SermonSummary {
  id: string;
  slug: string;
  title: string;
  seriesTitle: string;
  speaker: string;
  publishedAt: string;
  summary: string;
  scriptureReferences: string[];
  videoUrl?: string;
}

export interface MinistrySummary {
  slug: string;
  title: string;
  audience: string;
  description: string;
  callToAction: string;
}
