# ADR: Store Scripture references separately and use a licensed Bible provider

- Status: Accepted
- Date: 2026-08-02

## Decision

Copyrighted translation text must not be copied wholesale into the application database. Provider identifiers and references allow the church to change vendors while preserving lesson structure.

## Consequences

The implementation, tests, operational runbooks, and release gates must remain consistent with this decision. Reversal requires a new ADR that names migration, safety, cost, and ownership impacts.
