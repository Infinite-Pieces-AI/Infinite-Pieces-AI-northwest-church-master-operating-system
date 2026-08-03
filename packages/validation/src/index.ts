import { z } from "zod";

const optionalTrimmed = (max: number) => z.string().trim().max(max).optional().transform((value) => value || undefined);

export const visitRequestSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(254),
  phone: optionalTrimmed(40),
  partySize: z.coerce.number().int().min(1).max(20).default(1),
  childrenAges: optionalTrimmed(200),
  requestedNextStep: z.enum(["plan_visit", "bible_study", "family_group", "prayer", "general_question"]),
  message: optionalTrimmed(1500),
  communicationConsent: z.literal(true),
  sourcePath: z.string().trim().max(300).default("/"),
  campaign: optionalTrimmed(120),
  website: z.string().max(0).optional()
});

export const accessRequestSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(254),
  phone: optionalTrimmed(40),
  relationshipToChurch: z.enum(["member", "regular_attendee", "parent_guardian", "teen", "group_leader", "other"]),
  knownLeader: optionalTrimmed(160),
  reason: z.string().trim().min(10).max(1000),
  policyAcknowledged: z.literal(true),
  website: z.string().max(0).optional()
});

export const invitationAcceptSchema = z.object({
  token: z.string().min(32).max(512),
  email: z.string().trim().email().max(254),
  privacyAccepted: z.literal(true),
  communityGuidelinesAccepted: z.literal(true)
});

export const aiBibleQuestionSchema = z.object({
  question: z.string().trim().min(3).max(1500),
  contextDocumentIds: z.array(z.string().uuid()).max(12).default([]),
  requestedTranslation: z.string().trim().max(40).default("NIV"),
  includePrivateContent: z.literal(false).default(false)
});

export const socialDraftSchema = z.object({
  campaignId: z.string().uuid(),
  platform: z.enum(["facebook", "instagram", "linkedin", "youtube", "google_business_profile"]),
  body: z.string().trim().min(1).max(5000),
  imagePrompt: optionalTrimmed(2000),
  scheduledFor: z.string().datetime().optional(),
  requiresTheologicalReview: z.boolean().default(false)
});

export type VisitRequestInput = z.infer<typeof visitRequestSchema>;
export type AccessRequestInput = z.infer<typeof accessRequestSchema>;
export type InvitationAcceptInput = z.infer<typeof invitationAcceptSchema>;
export type AiBibleQuestionInput = z.infer<typeof aiBibleQuestionSchema>;

const coordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180)
});

const householdUnitSchema = z.object({
  id: z.string().trim().min(1).max(120),
  displayLabel: z.string().trim().min(1).max(160),
  memberCount: z.number().int().min(1).max(30),
  memberIds: z.array(z.string().trim().min(1).max(120)).min(1).max(30),
  availability: z.array(z.string().trim().min(1).max(120)).min(1).max(20),
  lifeStage: z.string().trim().max(120).optional(),
  isNewcomer: z.boolean().optional(),
  location: coordinatesSchema.optional(),
  requiredGroupId: z.string().trim().max(120).optional(),
  forbiddenGroupIds: z.array(z.string().trim().min(1).max(120)).max(100).optional(),
  accessibilityNeeds: z.array(z.string().trim().min(1).max(120)).max(30).optional()
}).refine((value) => value.memberIds.length <= value.memberCount, {
  message: "memberIds cannot exceed memberCount"
});

const rotationGroupSchema = z.object({
  id: z.string().trim().min(1).max(120),
  name: z.string().trim().min(1).max(160),
  minimumMembers: z.number().int().min(1).max(200),
  maximumMembers: z.number().int().min(1).max(200),
  availability: z.array(z.string().trim().min(1).max(120)).min(1).max(20),
  leaderHouseholdIds: z.array(z.string().trim().min(1).max(120)).min(1).max(20),
  location: coordinatesSchema.optional(),
  accessibilitySupports: z.array(z.string().trim().min(1).max(120)).max(30).optional()
}).refine((value) => value.maximumMembers >= value.minimumMembers, {
  message: "maximumMembers must be greater than or equal to minimumMembers"
});

export const rotationInputSchema = z.object({
  cycleId: z.string().trim().min(1).max(120),
  seed: z.string().trim().min(8).max(256),
  households: z.array(householdUnitSchema).min(1).max(500),
  groups: z.array(rotationGroupSchema).min(1).max(100),
  pairingHistory: z.array(z.object({
    householdAId: z.string().trim().min(1).max(120),
    householdBId: z.string().trim().min(1).max(120),
    cyclesAgo: z.number().int().min(0).max(100)
  })).max(50_000),
  weights: z.object({
    repeatedPairing: z.number().min(0).max(10_000).optional(),
    capacityImbalance: z.number().min(0).max(10_000).optional(),
    travelDistance: z.number().min(0).max(10_000).optional(),
    newcomerClustering: z.number().min(0).max(10_000).optional(),
    lifeStageConcentration: z.number().min(0).max(10_000).optional()
  }).optional()
});

export type RotationInputPayload = z.infer<typeof rotationInputSchema>;
