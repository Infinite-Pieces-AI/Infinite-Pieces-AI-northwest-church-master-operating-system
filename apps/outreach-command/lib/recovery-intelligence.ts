import { createClient } from "@/lib/supabase/server";
import type {
  RecoveryInterestRecord,
  RecoveryOutreachPayload,
  RecoveryPartner,
  RecoveryPublicTopic,
} from "./recovery-outreach-types";

type AnyRow = Record<string, unknown>;

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}

function numberValue(value: unknown, fallback = 0): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function toInterest(row: AnyRow): RecoveryInterestRecord {
  return {
    id: stringValue(row.id),
    firstName: stringValue(row.first_name, "Visitor"),
    contactMethod: stringValue(row.contact_method, "email") as RecoveryInterestRecord["contactMethod"],
    email: optionalString(row.email),
    phone: optionalString(row.phone),
    interestType: stringValue(
      row.interest_type,
      "general_question",
    ) as RecoveryInterestRecord["interestType"],
    message: optionalString(row.message),
    sourcePath: stringValue(row.source_path, "/recovery-support-lowell"),
    sourceCampaign: optionalString(row.source_campaign),
    status: stringValue(row.status, "new") as RecoveryInterestRecord["status"],
    assignedTo: optionalString(row.assigned_to),
    assignedAt: optionalString(row.assigned_at),
    contactedAt: optionalString(row.contacted_at),
    closedAt: optionalString(row.closed_at),
    createdAt: stringValue(row.created_at, new Date(0).toISOString()),
  };
}

function toTopic(row: AnyRow): RecoveryPublicTopic {
  return {
    id: stringValue(row.id),
    sourceKind: stringValue(row.source_kind, "manual_research") as RecoveryPublicTopic["sourceKind"],
    sourceLabel: stringValue(row.source_label, "Public research"),
    publicUrl: optionalString(row.public_url),
    topic: stringValue(row.topic, "Recovery support topic"),
    publicExcerpt: optionalString(row.public_excerpt),
    locality: stringValue(row.locality, "Massachusetts"),
    aggregateImpressions:
      row.aggregate_impressions == null ? undefined : numberValue(row.aggregate_impressions),
    aggregateClicks: row.aggregate_clicks == null ? undefined : numberValue(row.aggregate_clicks),
    averagePosition: row.average_position == null ? undefined : numberValue(row.average_position),
    churchSupportIntent: numberValue(row.church_support_intent),
    treatmentResourceIntent: numberValue(row.treatment_resource_intent),
    localRelevance: numberValue(row.local_relevance),
    contentOpportunity: numberValue(row.content_opportunity),
    sensitivityRisk: numberValue(row.sensitivity_risk),
    priorityScore: numberValue(row.priority_score),
    recommendedAction: optionalString(row.recommended_action),
    status: stringValue(row.status, "new") as RecoveryPublicTopic["status"],
    observedAt: optionalString(row.observed_at),
    expiresAt: stringValue(row.expires_at, new Date(0).toISOString()),
    createdAt: stringValue(row.created_at, new Date(0).toISOString()),
  };
}

function toPartner(row: AnyRow): RecoveryPartner {
  return {
    id: stringValue(row.id),
    organizationName: stringValue(row.organization_name, "Organization"),
    organizationType: stringValue(row.organization_type, "other") as RecoveryPartner["organizationType"],
    publicUrl: stringValue(row.public_url),
    publicContact: optionalString(row.public_contact),
    locality: stringValue(row.locality, "Massachusetts"),
    partnershipStatus: stringValue(
      row.partnership_status,
      "research",
    ) as RecoveryPartner["partnershipStatus"],
    notes: optionalString(row.notes),
    verifiedPublicSourceAt: optionalString(row.verified_public_source_at),
    createdAt: stringValue(row.created_at, new Date(0).toISOString()),
  };
}

export function recoveryOutreachBackendConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export async function loadRecoveryOutreach(): Promise<RecoveryOutreachPayload> {
  if (!recoveryOutreachBackendConfigured()) {
    return {
      interests: [],
      topics: [],
      partners: [],
      overview: {
        newInterests: 0,
        unassignedInterests: 0,
        highPriorityTopics: 0,
        approvedPartnerProspects: 0,
      },
    };
  }

  const client = (await createClient()) as unknown as {
    from: (table: string) => any;
  };
  const [interestResult, topicResult, partnerResult] = await Promise.all([
    client
      .from("recovery_interest_requests")
      .select(
        "id,first_name,contact_method,email,phone,interest_type,message,source_path,source_campaign,status,assigned_to,assigned_at,contacted_at,closed_at,created_at",
      )
      .neq("status", "removed")
      .order("created_at", { ascending: false })
      .limit(200),
    client
      .from("recovery_public_topics")
      .select(
        "id,source_kind,source_label,public_url,topic,public_excerpt,locality,aggregate_impressions,aggregate_clicks,average_position,church_support_intent,treatment_resource_intent,local_relevance,content_opportunity,sensitivity_risk,priority_score,recommended_action,status,observed_at,expires_at,created_at",
      )
      .neq("status", "expired")
      .order("priority_score", { ascending: false })
      .limit(200),
    client
      .from("recovery_outreach_partners")
      .select(
        "id,organization_name,organization_type,public_url,public_contact,locality,partnership_status,notes,verified_public_source_at,created_at",
      )
      .neq("partnership_status", "do_not_contact")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  if (interestResult.error) throw interestResult.error;
  if (topicResult.error) throw topicResult.error;
  if (partnerResult.error) throw partnerResult.error;

  const interests = ((interestResult.data ?? []) as AnyRow[]).map(toInterest);
  const topics = ((topicResult.data ?? []) as AnyRow[]).map(toTopic);
  const partners = ((partnerResult.data ?? []) as AnyRow[]).map(toPartner);

  return {
    interests,
    topics,
    partners,
    overview: {
      newInterests: interests.filter((row) => row.status === "new").length,
      unassignedInterests: interests.filter(
        (row) => ["new", "assigned"].includes(row.status) && !row.assignedTo,
      ).length,
      highPriorityTopics: topics.filter(
        (row) => row.priorityScore >= 75 && !["dismissed", "expired"].includes(row.status),
      ).length,
      approvedPartnerProspects: partners.filter((row) =>
        ["approved_for_contact", "contacted", "conversation", "partner"].includes(
          row.partnershipStatus,
        ),
      ).length,
    },
  };
}
