# Fellowship Rotation: Constraints and Graph-Aware Novelty

## Product goal

Create leadership-reviewable fellowship proposals that help members meet people they know less well while preserving households, accessibility, safety, leadership, availability, and human pastoral judgment.

## Why this is not a random shuffle

A random shuffle can split household units, overfill a group, repeat the same pairings, isolate newcomers, ignore transportation or accessibility, and violate restricted assignments. The optimizer therefore separates hard feasibility from soft quality.

## Hard constraints

- household unit remains atomic;
- required or forbidden group assignments;
- group maximum capacity;
- approved leader placement;
- compatible availability;
- required accessibility support;
- safeguarding or pastoral restrictions supplied as private constraints.

A hard-constraint failure produces an infeasible proposal and warnings. It is never silently violated.

## Soft scoring

```text
repeated pairing
+ existing relationship concentration
+ capacity imbalance
+ travel distance
+ newcomer clustering
+ life-stage concentration
+ insufficient welcome support for less-connected households
```

The initial deterministic greedy placement uses a leadership-approved seed. A deterministic pairwise local-swap refinement then evaluates safe household swaps and accepts only score improvements.

This realizes the useful part of graph partitioning without pretending that one generic community-detection algorithm solves a pastoral assignment problem.

## Relationship graph

A `relationship_signal` is a content-free edge between two households with a familiarity value from 0 to 1. Allowed sources are:

- prior group membership;
- approved aggregate event co-attendance;
- explicit adult connection;
- approved aggregate interaction metadata.

The signal must never contain message text, prayer content, pastoral notes, counseling details, child activity, or inferred sensitive traits. Aggregate-interaction signals require an explicit content-free attestation and leadership approval.

## Isolated-household support

A household may receive an aggregate connection-degree estimate and a leader-approved welcome-support priority. A group may receive a community-anchor score. These are soft supports, not labels exposed to members.

## Reproducibility and audit

Each proposal records:

- cycle and seed;
- algorithm version;
- immutable input snapshot;
- hard-constraint issues;
- score breakdown;
- requested/completed refinement passes;
- accepted swaps;
- relationship-signal count;
- assignments and fingerprint;
- requesting leader;
- manual changes and approver.

The system does not activate memberships, create member-visible explanations, or send notifications until leadership approves the final proposal.
