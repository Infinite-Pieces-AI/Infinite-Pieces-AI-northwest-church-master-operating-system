export type RecoveryInterestStatus =
  | "new"
  | "assigned"
  | "contacted"
  | "conversation"
  | "closed"
  | "opted_out"
  | "removed";

export interface RecoveryInterestRecord {
  id: string;
  firstName: string;
  contactMethod: "email" | "phone";
  email?: string;
  phone?: string;
  interestType:
    | "church_peer_support"
    | "online_conversation"
    | "family_support"
    | "treatment_resources"
    | "general_question";
  message?: string;
  sourcePath: string;
  sourceCampaign?: string;
  status: RecoveryInterestStatus;
  assignedTo?: string;
  assignedAt?: string;
  contactedAt?: string;
  closedAt?: string;
  createdAt: string;
}

export type RecoveryTopicStatus =
  | "new"
  | "review"
  | "content_queued"
  | "partner_research"
  | "dismissed"
  | "expired";

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
  publicUrl?: string;
  topic: string;
  publicExcerpt?: string;
  locality: string;
  aggregateImpressions?: number;
  aggregateClicks?: number;
  averagePosition?: number;
  churchSupportIntent: number;
  treatmentResourceIntent: number;
  localRelevance: number;
  contentOpportunity: number;
  sensitivityRisk: number;
  priorityScore: number;
  recommendedAction?: string;
  status: RecoveryTopicStatus;
  observedAt?: string;
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
  publicContact?: string;
  locality: string;
  partnershipStatus: RecoveryPartnerStatus;
  notes?: string;
  verifiedPublicSourceAt?: string;
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
