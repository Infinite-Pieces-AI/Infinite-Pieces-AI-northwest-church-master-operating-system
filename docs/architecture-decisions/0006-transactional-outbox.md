# ADR: Use a transactional outbox for integrations

- Status: Accepted
- Date: 2026-08-02

## Decision

Schedule, lesson, group, check-in, media, and social changes must not be tightly coupled to external providers. Durable events support retries, idempotency, observability, and safe dry runs.

## Consequences

The implementation, tests, operational runbooks, and release gates must remain consistent with this decision. Reversal requires a new ADR that names migration, safety, cost, and ownership impacts.
