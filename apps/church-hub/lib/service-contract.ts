export type ServiceSignupStatus =
  "interested" | "going" | "waitlisted" | "cancelled" | "attended" | "no_show";

export interface ServiceOpportunityView {
  id: string;
  title: string;
  summary: string;
  needStatement: string;
  impactDescription?: string | null;
  partnerName?: string | null;
  dateLabel: string;
  timeLabel: string;
  startsAt?: string;
  endsAt?: string;
  locationName: string;
  area: string;
  minimumAge?: number | null;
  familyFriendly: boolean;
  capacity?: number | null;
  signupCount: number;
  memberStatus?: ServiceSignupStatus | null;
  physicalRequirements?: string | null;
  skillsNeeded: string[];
  accessibilityNote?: string | null;
  suppliesNote?: string | null;
  transportationNote?: string | null;
  safeguardingRequirements?: string | null;
  visibility: "public" | "members" | "ministry" | "group";
  canOpenThread: boolean;
}
