export type RecoveryInterestStatus =
  "new" | "assigned" | "contacted" | "conversation" | "closed" | "opted_out" | "removed";

export interface RecoveryInterestRecord {
  id: string;
  firstName: string;
  contactMethod: "email" | "phone";
  email?: string | undefined;
  phone?: string | undefined;
  interestType:
    | "church_peer_support"
    | "online_conversation"
    | "family_support"
    | "treatment_resources"
    | "general_question";
  message?: string | undefined;
  sourcePath: string;
  sourceCampaign?: string | undefined;
  status: RecoveryInterestStatus;
  assignedTo?: string | undefined;
  assignedAt?: string | undefined;
  contactedAt?: string | undefined;
  closedAt?: string | undefined;
  createdAt: string;
}

export type RecoveryTopicStatus =
  "new" | "review" | "content_queued" | "partner_research" | "dismissed" | "expired";

export interface RecoveryPublicTopic {
  id: string;
  sourceKind:
    | "search_console"
    | "public_forum"
    | "public_web"
    | "public_rss"
    | "public_social"
    | "manual_research";
  sourceLabel: string;
  publicUrl?: string | undefined;
  topic: string;
  publicExcerpt?: string | undefined;
  locality: string;
  aggregateImpressions?: number | undefined;
  aggregateClicks?: number | undefined;
  averagePosition?: number | undefined;
  churchSupportIntent: number;
  treatmentResourceIntent: number;
  localRelevance: number;
  contentOpportunity: number;
  sensitivityRisk: number;
  priorityScore: number;
  recommendedAction?: string | undefined;
  status: RecoveryTopicStatus;
  observedAt?: string | undefined;
  expiresAt: string;
  createdAt: string;
}

export type RecoveryPartnerStatus =
  | "research"
  | "approved_for_contact"
  | "contacted"
  | "conversation"
  | "partner"
  | "declined"
  | "do_not_contact";

export interface RecoveryPartner {
  id: string;
  organizationName: string;
  organizationType:
    | "treatment_provider"
    | "recovery_support"
    | "community_health"
    | "sober_living"
    | "public_agency"
    | "church"
    | "other";
  publicUrl: string;
  publicContact?: string | undefined;
  locality: string;
  partnershipStatus: RecoveryPartnerStatus;
  notes?: string | undefined;
  verifiedPublicSourceAt?: string | undefined;
  createdAt: string;
}

export interface RecoveryOutreachPayload {
  interests: RecoveryInterestRecord[];
  topics: RecoveryPublicTopic[];
  partners: RecoveryPartner[];
  overview: {
    newInterests: number;
    unassignedInterests: number;
    highPriorityTopics: number;
    approvedPartnerProspects: number;
  };
}
