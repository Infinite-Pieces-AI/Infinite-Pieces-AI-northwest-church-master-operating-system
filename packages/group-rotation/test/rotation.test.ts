import { describe, expect, it } from "vitest";
import { generateRotationProposal } from "../src";

const input = {
  cycleId: "fall-2026",
  seed: "leadership-approved-seed",
  households: [
    {
      id: "h1",
      displayLabel: "Household 1",
      memberCount: 2,
      memberIds: ["m1", "m2"],
      availability: ["tuesday"],
      lifeStage: "families",
    },
    {
      id: "h2",
      displayLabel: "Household 2",
      memberCount: 1,
      memberIds: ["m3"],
      availability: ["tuesday", "thursday"],
      isNewcomer: true,
    },
    {
      id: "h3",
      displayLabel: "Household 3",
      memberCount: 2,
      memberIds: ["m4", "m5"],
      availability: ["thursday"],
      lifeStage: "families",
    },
    {
      id: "h4",
      displayLabel: "Household 4",
      memberCount: 1,
      memberIds: ["m6"],
      availability: ["tuesday", "thursday"],
    },
  ],
  groups: [
    {
      id: "g1",
      name: "Tuesday Group",
      minimumMembers: 2,
      maximumMembers: 4,
      availability: ["tuesday"],
      leaderHouseholdIds: ["h1"],
    },
    {
      id: "g2",
      name: "Thursday Group",
      minimumMembers: 2,
      maximumMembers: 4,
      availability: ["thursday"],
      leaderHouseholdIds: ["h3"],
    },
  ],
  pairingHistory: [{ householdAId: "h1", householdBId: "h2", cyclesAgo: 0 }],
} as const;

describe("generateRotationProposal", () => {
  it("is deterministic for the same seed and keeps households intact", () => {
    const first = generateRotationProposal(input);
    const second = generateRotationProposal(input);
    expect(first.fingerprint).toBe(second.fingerprint);
    expect(first.assignments).toHaveLength(input.households.length);
    expect(new Set(first.assignments.map((item) => item.householdId)).size).toBe(
      input.households.length,
    );
  });

  it("places leadership households in their approved group", () => {
    const proposal = generateRotationProposal(input);
    expect(proposal.assignments.find((item) => item.householdId === "h1")?.groupId).toBe("g1");
    expect(proposal.assignments.find((item) => item.householdId === "h3")?.groupId).toBe("g2");
  });

  it("uses content-free relationship signals to prefer a new connection", () => {
    const proposal = generateRotationProposal({
      ...input,
      relationshipSignals: [
        {
          householdAId: "h1",
          householdBId: "h2",
          familiarity: 1,
          source: "past_group",
        },
      ],
      refinementPasses: 6,
    });
    expect(proposal.status).toBe("proposed");
    expect(proposal.assignments.find((item) => item.householdId === "h2")?.groupId).toBe("g2");
    expect(proposal.optimization.strategy).toBe("deterministic-greedy-plus-pairwise-refinement");
  });

  it("reports an infeasible proposal instead of silently violating capacity", () => {
    const proposal = generateRotationProposal({
      ...input,
      households: [
        ...input.households,
        {
          id: "h5",
          displayLabel: "Large household",
          memberCount: 7,
          memberIds: ["a", "b", "c", "d", "e", "f", "g"],
          availability: ["tuesday"],
        },
      ],
    });
    expect(proposal.status).toBe("infeasible");
    expect(proposal.unassignedHouseholdIds).toContain("h5");
  });
});
