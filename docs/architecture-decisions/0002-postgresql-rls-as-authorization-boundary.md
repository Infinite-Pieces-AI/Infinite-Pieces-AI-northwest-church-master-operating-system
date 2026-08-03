# ADR: Use PostgreSQL Row-Level Security as the final authorization boundary

- Status: Accepted
- Date: 2026-08-02

## Decision

Client-side route guards are insufficient. Every protected table enables RLS; security-definer helpers centralize scoped checks and automated SQL tests cover cross-tenant/group/household abuse cases.

## Consequences

The implementation, tests, operational runbooks, and release gates must remain consistent with this decision. Reversal requires a new ADR that names migration, safety, cost, and ownership impacts.
