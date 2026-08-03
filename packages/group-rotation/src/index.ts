import { createHash } from "node:crypto";
import type {
  ConstraintIssue,
  Coordinates,
  GroupSummary,
  HouseholdAssignment,
  HouseholdUnit,
  PairingHistoryEntry,
  RelationshipSignal,
  RotationGroup,
  RotationInput,
  RotationProposal,
  RotationWeights,
  ScoreBreakdown
} from "./types";

export type * from "./types";

const defaultWeights: RotationWeights = {
  repeatedPairing: 12,
  capacityImbalance: 5,
  travelDistance: 0.35,
  newcomerClustering: 8,
  lifeStageConcentration: 2,
  existingRelationshipConcentration: 6,
  isolatedHouseholdSupport: 10
};

interface MutableGroup {
  definition: RotationGroup;
  households: HouseholdUnit[];
  memberCount: number;
}

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRandom(seed: string): () => number {
  let state = stableHash(seed) || 1;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function haversineKilometres(a?: Coordinates, b?: Coordinates): number {
  if (!a || !b) return 0;
  const radius = 6371;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLatitude = toRadians(b.latitude - a.latitude);
  const dLongitude = toRadians(b.longitude - a.longitude);
  const latitudeA = toRadians(a.latitude);
  const latitudeB = toRadians(b.latitude);
  const h =
    Math.sin(dLatitude / 2) ** 2 +
    Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(dLongitude / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function sharesAvailability(household: HouseholdUnit, group: RotationGroup): boolean {
  return household.availability.some((slot) => group.availability.includes(slot));
}

function supportsAccessibility(household: HouseholdUnit, group: RotationGroup): boolean {
  const required = household.accessibilityNeeds ?? [];
  const supported = new Set(group.accessibilitySupports ?? []);
  return required.every((need) => supported.has(need));
}

function canBelongToGroup(household: HouseholdUnit, definition: RotationGroup): boolean {
  if (household.requiredGroupId && household.requiredGroupId !== definition.id) return false;
  if (household.forbiddenGroupIds?.includes(definition.id)) return false;
  if (!sharesAvailability(household, definition)) return false;
  if (!supportsAccessibility(household, definition)) return false;
  return true;
}

function isFeasible(household: HouseholdUnit, group: MutableGroup): boolean {
  return canBelongToGroup(household, group.definition) &&
    group.memberCount + household.memberCount <= group.definition.maximumMembers;
}

function historyPenalty(
  household: HouseholdUnit,
  group: MutableGroup,
  history: readonly PairingHistoryEntry[]
): number {
  const groupIds = new Set(group.households.map((item) => item.id));
  return history.reduce((penalty, entry) => {
    const paired =
      (entry.householdAId === household.id && groupIds.has(entry.householdBId)) ||
      (entry.householdBId === household.id && groupIds.has(entry.householdAId));
    return paired ? penalty + 1 / (entry.cyclesAgo + 1) : penalty;
  }, 0);
}

function relationshipFamiliarity(
  household: HouseholdUnit,
  group: MutableGroup,
  signals: readonly RelationshipSignal[]
): number {
  const groupIds = new Set(group.households.map((item) => item.id));
  return signals.reduce((score, signal) => {
    const applies =
      (signal.householdAId === household.id && groupIds.has(signal.householdBId)) ||
      (signal.householdBId === household.id && groupIds.has(signal.householdAId));
    return applies ? score + signal.familiarity : score;
  }, 0);
}

function isolatedSupportPenalty(household: HouseholdUnit, group: RotationGroup): number {
  const connectionDegree = Math.min(1, Math.max(0, household.connectionDegree ?? 0.5));
  const anchorScore = Math.min(1, Math.max(0, group.communityAnchorScore ?? 0.5));
  const priorityMultiplier = household.welcomeSupportPriority ? 1.5 : 1;
  return (1 - connectionDegree) * (1 - anchorScore) * priorityMultiplier;
}

function candidateScore(
  household: HouseholdUnit,
  group: MutableGroup,
  allGroups: readonly MutableGroup[],
  history: readonly PairingHistoryEntry[],
  relationships: readonly RelationshipSignal[],
  weights: RotationWeights
): number {
  const projected = group.memberCount + household.memberCount;
  const target = (group.definition.minimumMembers + group.definition.maximumMembers) / 2;
  const repeat = historyPenalty(household, group, history) * weights.repeatedPairing;
  const familiarity = relationshipFamiliarity(household, group, relationships) * weights.existingRelationshipConcentration;
  const support = isolatedSupportPenalty(household, group.definition) * weights.isolatedHouseholdSupport;
  const imbalance = Math.abs(projected - target) * weights.capacityImbalance;
  const travel = haversineKilometres(household.location, group.definition.location) * weights.travelDistance;
  const newcomerCount = group.households.filter((item) => item.isNewcomer).length + (household.isNewcomer ? 1 : 0);
  const newcomer = Math.max(0, newcomerCount - 1) * weights.newcomerClustering;
  const sameStage = household.lifeStage
    ? group.households.filter((item) => item.lifeStage === household.lifeStage).length
    : 0;
  const stage = Math.max(0, sameStage - 1) * weights.lifeStageConcentration;
  const globalBalance = allGroups.length
    ? Math.abs(projected / group.definition.maximumMembers - averageUtilization(allGroups))
    : 0;
  return repeat + familiarity + support + imbalance + travel + newcomer + stage + globalBalance;
}

function averageUtilization(groups: readonly MutableGroup[]): number {
  if (!groups.length) return 0;
  return groups.reduce((sum, group) => sum + group.memberCount / group.definition.maximumMembers, 0) / groups.length;
}

function validateInput(input: RotationInput): ConstraintIssue[] {
  const issues: ConstraintIssue[] = [];
  const householdIds = new Set<string>();
  const groupIds = new Set<string>();
  for (const household of input.households) {
    if (householdIds.has(household.id)) {
      issues.push({ code: "DUPLICATE_HOUSEHOLD", householdId: household.id, message: `Household ${household.id} appears more than once.` });
    }
    householdIds.add(household.id);
  }
  for (const group of input.groups) {
    if (groupIds.has(group.id)) {
      issues.push({ code: "DUPLICATE_GROUP", groupId: group.id, message: `Group ${group.id} appears more than once.` });
    }
    groupIds.add(group.id);
  }
  for (const household of input.households) {
    if (household.requiredGroupId && !groupIds.has(household.requiredGroupId)) {
      issues.push({ code: "UNKNOWN_REQUIRED_GROUP", householdId: household.id, message: `Required group ${household.requiredGroupId} does not exist.` });
    }
    if (household.connectionDegree !== undefined && (household.connectionDegree < 0 || household.connectionDegree > 1)) {
      issues.push({ code: "INVALID_RELATIONSHIP_SIGNAL", householdId: household.id, message: `Household ${household.id} connectionDegree must be between 0 and 1.` });
    }
  }
  for (const signal of input.relationshipSignals ?? []) {
    if (!householdIds.has(signal.householdAId) || !householdIds.has(signal.householdBId)) {
      issues.push({ code: "UNKNOWN_RELATIONSHIP_HOUSEHOLD", message: "A relationship signal references a household outside this rotation input." });
    }
    if (signal.householdAId === signal.householdBId || signal.familiarity < 0 || signal.familiarity > 1) {
      issues.push({ code: "INVALID_RELATIONSHIP_SIGNAL", householdId: signal.householdAId, message: "Relationship familiarity must be between 0 and 1 and connect two different households." });
    }
  }
  const people = input.households.reduce((sum, household) => sum + household.memberCount, 0);
  const capacity = input.groups.reduce((sum, group) => sum + group.maximumMembers, 0);
  if (people > capacity) {
    issues.push({ code: "TOTAL_CAPACITY_EXCEEDED", message: `${people} people cannot fit within total group capacity of ${capacity}.` });
  }
  const leaderAssignments = new Map<string, string>();
  for (const group of input.groups) {
    for (const leaderId of group.leaderHouseholdIds) {
      if (!householdIds.has(leaderId)) {
        issues.push({ code: "LEADER_NOT_FOUND", groupId: group.id, householdId: leaderId, message: `Leader household ${leaderId} was not supplied.` });
      }
      const existing = leaderAssignments.get(leaderId);
      if (existing && existing !== group.id) {
        issues.push({ code: "LEADER_CONFLICT", groupId: group.id, householdId: leaderId, message: `Leader household ${leaderId} is assigned to more than one group.` });
      }
      leaderAssignments.set(leaderId, group.id);
      const household = input.households.find((item) => item.id === leaderId);
      if (household?.requiredGroupId && household.requiredGroupId !== group.id) {
        issues.push({ code: "REQUIRED_GROUP_CONFLICT", groupId: group.id, householdId: leaderId, message: `Leader household ${leaderId} requires another group.` });
      }
    }
  }
  return issues;
}

function makeFingerprint(input: RotationInput, assignments: readonly HouseholdAssignment[]): string {
  const canonical = JSON.stringify({
    cycleId: input.cycleId,
    seed: input.seed,
    assignments: [...assignments]
      .map(({ householdId, groupId }) => ({ householdId, groupId }))
      .sort((a, b) => a.householdId.localeCompare(b.householdId))
  });
  return createHash("sha256").update(canonical).digest("hex");
}

function calculateScore(
  groups: readonly MutableGroup[],
  history: readonly PairingHistoryEntry[],
  relationships: readonly RelationshipSignal[],
  weights: RotationWeights
): ScoreBreakdown {
  let repeatedPairing = 0;
  let travelDistance = 0;
  let newcomerClustering = 0;
  let lifeStageConcentration = 0;
  let existingRelationshipConcentration = 0;
  let isolatedHouseholdSupport = 0;
  for (const group of groups) {
    for (let first = 0; first < group.households.length; first += 1) {
      const household = group.households[first];
      if (!household) continue;
      travelDistance += haversineKilometres(household.location, group.definition.location);
      isolatedHouseholdSupport += isolatedSupportPenalty(household, group.definition);
      for (let second = first + 1; second < group.households.length; second += 1) {
        const peer = group.households[second];
        if (!peer) continue;
        const match = history.find(
          (entry) =>
            (entry.householdAId === household.id && entry.householdBId === peer.id) ||
            (entry.householdAId === peer.id && entry.householdBId === household.id)
        );
        if (match) repeatedPairing += 1 / (match.cyclesAgo + 1);
        for (const signal of relationships) {
          const applies =
            (signal.householdAId === household.id && signal.householdBId === peer.id) ||
            (signal.householdAId === peer.id && signal.householdBId === household.id);
          if (applies) existingRelationshipConcentration += signal.familiarity;
        }
      }
    }
    newcomerClustering += Math.max(0, group.households.filter((item) => item.isNewcomer).length - 1);
    const stages = new Map<string, number>();
    for (const household of group.households) {
      if (household.lifeStage) stages.set(household.lifeStage, (stages.get(household.lifeStage) ?? 0) + 1);
    }
    for (const count of stages.values()) lifeStageConcentration += Math.max(0, count - 2);
  }
  const utilization = groups.map((group) => group.memberCount / group.definition.maximumMembers);
  const mean = utilization.reduce((sum, value) => sum + value, 0) / Math.max(utilization.length, 1);
  const capacityImbalance = utilization.reduce((sum, value) => sum + Math.abs(value - mean), 0);
  const weighted = {
    repeatedPairing: repeatedPairing * weights.repeatedPairing,
    capacityImbalance: capacityImbalance * weights.capacityImbalance,
    travelDistance: travelDistance * weights.travelDistance,
    newcomerClustering: newcomerClustering * weights.newcomerClustering,
    lifeStageConcentration: lifeStageConcentration * weights.lifeStageConcentration,
    existingRelationshipConcentration: existingRelationshipConcentration * weights.existingRelationshipConcentration,
    isolatedHouseholdSupport: isolatedHouseholdSupport * weights.isolatedHouseholdSupport
  };
  return { ...weighted, total: Object.values(weighted).reduce((sum, value) => sum + value, 0) };
}

function refineByPairwiseSwaps(input: {
  groups: MutableGroup[];
  history: readonly PairingHistoryEntry[];
  relationships: readonly RelationshipSignal[];
  weights: RotationWeights;
  frozenHouseholdIds: ReadonlySet<string>;
  passes: number;
  seed: string;
}): { completedPasses: number; acceptedSwaps: number; movedHouseholdIds: Set<string> } {
  let acceptedSwaps = 0;
  let completedPasses = 0;
  const movedHouseholdIds = new Set<string>();
  const orderedGroups = [...input.groups].sort((a, b) => stableHash(`${input.seed}:${a.definition.id}`) - stableHash(`${input.seed}:${b.definition.id}`));

  for (let pass = 0; pass < input.passes; pass += 1) {
    let improved = false;
    completedPasses += 1;
    for (let firstGroupIndex = 0; firstGroupIndex < orderedGroups.length; firstGroupIndex += 1) {
      for (let secondGroupIndex = firstGroupIndex + 1; secondGroupIndex < orderedGroups.length; secondGroupIndex += 1) {
        const firstGroup = orderedGroups[firstGroupIndex];
        const secondGroup = orderedGroups[secondGroupIndex];
        if (!firstGroup || !secondGroup) continue;
        const firstCandidates = [...firstGroup.households]
          .filter((household) => !input.frozenHouseholdIds.has(household.id))
          .sort((a, b) => stableHash(`${input.seed}:${a.id}`) - stableHash(`${input.seed}:${b.id}`));
        const secondCandidates = [...secondGroup.households]
          .filter((household) => !input.frozenHouseholdIds.has(household.id))
          .sort((a, b) => stableHash(`${input.seed}:${a.id}`) - stableHash(`${input.seed}:${b.id}`));

        for (const firstHousehold of firstCandidates) {
          for (const secondHousehold of secondCandidates) {
            if (!canBelongToGroup(firstHousehold, secondGroup.definition) || !canBelongToGroup(secondHousehold, firstGroup.definition)) continue;
            const nextFirstCount = firstGroup.memberCount - firstHousehold.memberCount + secondHousehold.memberCount;
            const nextSecondCount = secondGroup.memberCount - secondHousehold.memberCount + firstHousehold.memberCount;
            if (nextFirstCount > firstGroup.definition.maximumMembers || nextSecondCount > secondGroup.definition.maximumMembers) continue;

            const before = calculateScore(input.groups, input.history, input.relationships, input.weights).total;
            const firstIndex = firstGroup.households.findIndex((item) => item.id === firstHousehold.id);
            const secondIndex = secondGroup.households.findIndex((item) => item.id === secondHousehold.id);
            if (firstIndex < 0 || secondIndex < 0) continue;
            firstGroup.households[firstIndex] = secondHousehold;
            secondGroup.households[secondIndex] = firstHousehold;
            firstGroup.memberCount = nextFirstCount;
            secondGroup.memberCount = nextSecondCount;
            const after = calculateScore(input.groups, input.history, input.relationships, input.weights).total;
            if (after + 0.000001 < before) {
              acceptedSwaps += 1;
              improved = true;
              movedHouseholdIds.add(firstHousehold.id);
              movedHouseholdIds.add(secondHousehold.id);
            } else {
              firstGroup.households[firstIndex] = firstHousehold;
              secondGroup.households[secondIndex] = secondHousehold;
              firstGroup.memberCount = firstGroup.memberCount - secondHousehold.memberCount + firstHousehold.memberCount;
              secondGroup.memberCount = secondGroup.memberCount - firstHousehold.memberCount + secondHousehold.memberCount;
            }
          }
        }
      }
    }
    if (!improved) break;
  }
  return { completedPasses, acceptedSwaps, movedHouseholdIds };
}

/**
 * Produces a deterministic, review-only proposal. It never publishes assignments.
 * Households are atomic, hard constraints are enforced first, and leaders must approve the result.
 */
export function generateRotationProposal(input: RotationInput): RotationProposal {
  const weights = { ...defaultWeights, ...input.weights };
  const relationships = input.relationshipSignals ?? [];
  const requestedPasses = Math.max(0, Math.min(20, input.refinementPasses ?? 4));
  const issues = validateInput(input);
  const groups: MutableGroup[] = input.groups.map((definition) => ({ definition, households: [], memberCount: 0 }));
  const assigned = new Set<string>();
  const reasonMap = new Map<string, string[]>();
  const random = createRandom(`${input.cycleId}:${input.seed}`);

  const assign = (household: HouseholdUnit, group: MutableGroup, reasons: string[]) => {
    group.households.push(household);
    group.memberCount += household.memberCount;
    assigned.add(household.id);
    reasonMap.set(household.id, reasons);
  };

  for (const group of groups) {
    for (const leaderId of group.definition.leaderHouseholdIds) {
      const household = input.households.find((item) => item.id === leaderId);
      if (!household || assigned.has(household.id)) continue;
      if (isFeasible(household, group)) assign(household, group, ["Required approved leadership coverage"]);
      else issues.push({ code: "NO_FEASIBLE_GROUP", householdId: household.id, groupId: group.definition.id, message: `Leader household ${household.id} does not satisfy the hard constraints for ${group.definition.name}.` });
    }
  }

  for (const household of input.households.filter((item) => item.requiredGroupId && !assigned.has(item.id))) {
    const group = groups.find((item) => item.definition.id === household.requiredGroupId);
    if (group && isFeasible(household, group)) assign(household, group, ["Leadership-approved required group"]);
    else {
      issues.push({
        code: "NO_FEASIBLE_GROUP",
        householdId: household.id,
        ...(household.requiredGroupId ? { groupId: household.requiredGroupId } : {}),
        message: `Household ${household.id} cannot be placed in its required group without violating a hard constraint.`
      });
    }
  }

  const unassigned = input.households
    .filter((item) => !assigned.has(item.id))
    .sort((a, b) => {
      const difficultyA = (a.forbiddenGroupIds?.length ?? 0) + (a.accessibilityNeeds?.length ?? 0) + a.memberCount;
      const difficultyB = (b.forbiddenGroupIds?.length ?? 0) + (b.accessibilityNeeds?.length ?? 0) + b.memberCount;
      return difficultyB - difficultyA || stableHash(`${input.seed}:${a.id}`) - stableHash(`${input.seed}:${b.id}`);
    });

  for (const household of unassigned) {
    const candidates = groups
      .filter((group) => isFeasible(household, group))
      .map((group) => ({ group, score: candidateScore(household, group, groups, input.pairingHistory, relationships, weights), tie: random() }))
      .sort((a, b) => a.score - b.score || a.tie - b.tie);
    const selected = candidates[0];
    if (!selected) {
      issues.push({ code: "NO_FEASIBLE_GROUP", householdId: household.id, message: `No group can accept household ${household.id} without violating a hard constraint.` });
      continue;
    }
    const reasons = ["Hard constraints satisfied", "Lowest available weighted penalty"];
    if (historyPenalty(household, selected.group, input.pairingHistory) === 0) reasons.push("No recent repeated household pairing in selected group");
    if (relationshipFamiliarity(household, selected.group, relationships) === 0) reasons.push("Supports new household connections from approved aggregate signals");
    assign(household, selected.group, reasons);
  }

  const frozenHouseholdIds = new Set<string>([
    ...input.groups.flatMap((group) => group.leaderHouseholdIds),
    ...input.households.filter((household) => household.requiredGroupId).map((household) => household.id)
  ]);
  const refinement = refineByPairwiseSwaps({
    groups,
    history: input.pairingHistory,
    relationships,
    weights,
    frozenHouseholdIds,
    passes: requestedPasses,
    seed: `${input.cycleId}:${input.seed}:refinement`
  });
  for (const householdId of refinement.movedHouseholdIds) {
    reasonMap.set(householdId, [...(reasonMap.get(householdId) ?? []), "Deterministic pairwise refinement improved novelty or balance"]);
  }

  const warnings: string[] = [];
  for (const group of groups) {
    if (group.memberCount < group.definition.minimumMembers) {
      warnings.push(`${group.definition.name} has ${group.memberCount} members, below its preferred minimum of ${group.definition.minimumMembers}.`);
    }
  }
  if (relationships.some((signal) => signal.source === "aggregate_interaction")) {
    warnings.push("Aggregate interaction signals were used. Leadership should verify that only content-free, governance-approved metadata was supplied.");
  }

  const summaries: GroupSummary[] = groups.map((group) => ({
    groupId: group.definition.id,
    householdIds: group.households.map((item) => item.id),
    memberCount: group.memberCount,
    minimumMembers: group.definition.minimumMembers,
    maximumMembers: group.definition.maximumMembers
  }));
  const assignments: HouseholdAssignment[] = groups.flatMap((group) =>
    group.households.map((household) => ({
      householdId: household.id,
      groupId: group.definition.id,
      memberCount: household.memberCount,
      privateReasons: reasonMap.get(household.id) ?? ["Hard constraints satisfied"]
    }))
  );
  const unassignedHouseholdIds = input.households.filter((item) => !assigned.has(item.id)).map((item) => item.id);
  const fatal = issues.some((issue) => issue.code !== "NO_FEASIBLE_GROUP") || unassignedHouseholdIds.length > 0;
  return {
    cycleId: input.cycleId,
    seed: input.seed,
    status: fatal ? "infeasible" : "proposed",
    assignments,
    unassignedHouseholdIds,
    groups: summaries,
    issues,
    warnings,
    score: calculateScore(groups, input.pairingHistory, relationships, weights),
    optimization: {
      strategy: "deterministic-greedy-plus-pairwise-refinement",
      requestedPasses,
      completedPasses: refinement.completedPasses,
      acceptedSwaps: refinement.acceptedSwaps
    },
    generatedAt: new Date().toISOString(),
    fingerprint: makeFingerprint(input, assignments)
  };
}

export function compareProposals(previous: RotationProposal, next: RotationProposal): {
  movedHouseholdIds: string[];
  unchangedHouseholdIds: string[];
} {
  const previousMap = new Map(previous.assignments.map((item) => [item.householdId, item.groupId]));
  const movedHouseholdIds: string[] = [];
  const unchangedHouseholdIds: string[] = [];
  for (const assignment of next.assignments) {
    if (previousMap.get(assignment.householdId) === assignment.groupId) unchangedHouseholdIds.push(assignment.householdId);
    else movedHouseholdIds.push(assignment.householdId);
  }
  return { movedHouseholdIds, unchangedHouseholdIds };
}
