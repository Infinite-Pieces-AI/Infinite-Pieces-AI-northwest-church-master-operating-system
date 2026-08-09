export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface HouseholdUnit {
  /** Households are atomic: couples and dependent children are never split. */
  id: string;
  displayLabel: string;
  memberCount: number;
  memberIds: readonly string[];
  availability: readonly string[];
  lifeStage?: string;
  isNewcomer?: boolean;
  location?: Coordinates;
  requiredGroupId?: string;
  forbiddenGroupIds?: readonly string[];
  accessibilityNeeds?: readonly string[];
  /** 0 means few current connections; 1 means broadly connected. Aggregate only. */
  connectionDegree?: number;
  /** A leader-approved soft signal that this household needs an especially welcoming group. */
  welcomeSupportPriority?: boolean;
}

export interface RotationGroup {
  id: string;
  name: string;
  minimumMembers: number;
  maximumMembers: number;
  availability: readonly string[];
  leaderHouseholdIds: readonly string[];
  location?: Coordinates;
  accessibilitySupports?: readonly string[];
  /** 0..1 operational estimate of the group's capacity to welcome a less-connected household. */
  communityAnchorScore?: number;
}

export interface PairingHistoryEntry {
  householdAId: string;
  householdBId: string;
  /** Zero is the immediately preceding cycle. Higher values are older. */
  cyclesAgo: number;
}

export const relationshipSignalSources = [
  "past_group",
  "event_coattendance",
  "explicit_connection",
  "aggregate_interaction",
] as const;

export type RelationshipSignalSource = (typeof relationshipSignalSources)[number];

/**
 * A content-free graph edge. It may describe aggregate familiarity, but must
 * never contain message text, prayer details, pastoral notes, or child data.
 */
export interface RelationshipSignal {
  householdAId: string;
  householdBId: string;
  familiarity: number;
  source: RelationshipSignalSource;
  observedAt?: string;
}

export interface RotationWeights {
  repeatedPairing: number;
  capacityImbalance: number;
  travelDistance: number;
  newcomerClustering: number;
  lifeStageConcentration: number;
  existingRelationshipConcentration: number;
  isolatedHouseholdSupport: number;
}

export interface RotationInput {
  cycleId: string;
  seed: string;
  households: readonly HouseholdUnit[];
  groups: readonly RotationGroup[];
  pairingHistory: readonly PairingHistoryEntry[];
  relationshipSignals?: readonly RelationshipSignal[];
  /** Deterministic pairwise refinement passes after initial placement. */
  refinementPasses?: number;
  weights?: Partial<RotationWeights>;
}

export type HardConstraintCode =
  | "DUPLICATE_HOUSEHOLD"
  | "DUPLICATE_GROUP"
  | "UNKNOWN_REQUIRED_GROUP"
  | "TOTAL_CAPACITY_EXCEEDED"
  | "LEADER_NOT_FOUND"
  | "LEADER_CONFLICT"
  | "REQUIRED_GROUP_CONFLICT"
  | "UNKNOWN_RELATIONSHIP_HOUSEHOLD"
  | "INVALID_RELATIONSHIP_SIGNAL"
  | "NO_FEASIBLE_GROUP";

export interface ConstraintIssue {
  code: HardConstraintCode;
  message: string;
  householdId?: string;
  groupId?: string;
}

export interface HouseholdAssignment {
  householdId: string;
  groupId: string;
  memberCount: number;
  privateReasons: readonly string[];
}

export interface GroupSummary {
  groupId: string;
  householdIds: readonly string[];
  memberCount: number;
  minimumMembers: number;
  maximumMembers: number;
}

export interface ScoreBreakdown {
  repeatedPairing: number;
  capacityImbalance: number;
  travelDistance: number;
  newcomerClustering: number;
  lifeStageConcentration: number;
  existingRelationshipConcentration: number;
  isolatedHouseholdSupport: number;
  total: number;
}

export interface OptimizationSummary {
  strategy: "deterministic-greedy-plus-pairwise-refinement";
  requestedPasses: number;
  completedPasses: number;
  acceptedSwaps: number;
}

export interface RotationProposal {
  cycleId: string;
  seed: string;
  status: "proposed" | "infeasible";
  assignments: readonly HouseholdAssignment[];
  unassignedHouseholdIds: readonly string[];
  groups: readonly GroupSummary[];
  issues: readonly ConstraintIssue[];
  warnings: readonly string[];
  score: ScoreBreakdown;
  optimization: OptimizationSummary;
  generatedAt: string;
  /** A stable fingerprint lets leadership reproduce and audit the proposal. */
  fingerprint: string;
}
