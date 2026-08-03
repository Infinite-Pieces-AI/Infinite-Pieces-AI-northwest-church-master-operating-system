# ADR: Use one private monorepo and two Vercel projects

- Status: Accepted
- Date: 2026-08-02

## Decision

The public site and hub share schedule, design, validation, and domain contracts. Separate repositories would duplicate facts and slow coordinated changes. Each app retains an independent deploy root. Workers split only when a genuine ownership or runtime boundary appears.

## Consequences

The implementation, tests, operational runbooks, and release gates must remain consistent with this decision. Reversal requires a new ADR that names migration, safety, cost, and ownership impacts.
