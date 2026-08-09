import type { FellowshipCategory, FellowshipMeetup } from "@/lib/demo-data";

export type FellowshipVisibility = "church" | "ministry" | "group";
export type FellowshipResponse = "interested" | "going" | "waitlisted" | "cancelled";

export interface FellowshipMeetupView extends FellowshipMeetup {
  startsAt?: string | undefined;
  endsAt?: string | undefined;
  timezone?: string | undefined;
  visibility?: FellowshipVisibility | undefined;
  accessibilityNote?: string | null;
  costNote?: string | null;
  weatherPlan?: string | null;
  memberResponse?: FellowshipResponse | "host" | null;
  canOpenThread?: boolean;
  canManage?: boolean;
}

export interface CreateFellowshipMeetupInput {
  title: string;
  category: FellowshipCategory;
  description: string;
  startsAt: string;
  durationMinutes: number;
  timezone: string;
  generalLocationName: string;
  generalArea: string;
  exactMeetingInstructions?: string;
  visibility: FellowshipVisibility;
  ministryId?: string;
  groupId?: string;
  audienceLabel: string;
  familyFriendly: boolean;
  capacity?: number;
  allowWaitlist: boolean;
  accessibilityNote?: string;
  costNote?: string;
  weatherPlan?: string;
  recurring?: boolean;
  recurrenceRule?: string;
}

export interface FellowshipMessageView {
  id: string;
  body: string;
  authorProfileId: string;
  authorLabel: string;
  createdAt: string;
  mine: boolean;
}
