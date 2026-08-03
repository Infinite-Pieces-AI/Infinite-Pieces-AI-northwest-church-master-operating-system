# Threat Model

## Protected assets

- member identities and role assignments
- households and guardian relationships
- child records, care flags, check-in, and pickup information
- prayer and pastoral content
- private channels and media
- invitation tokens and auth sessions
- provider secrets and service credentials
- audit, incident, and safeguarding records

## Principal threats

| Threat | Control |
|---|---|
| Shared invite code leaks | Random single-use email-bound token, hash at rest, expiration, revocation |
| Membership/role oracle | Target-user authorization helpers accept self only; explicit other-user checks require service role |
| Push endpoint SSRF | Approved provider-host allowlist at subscription and delivery boundaries |
| Shared-device residue | Sign-out revokes push, unsubscribes browser, clears offline snapshots, and ends session |
| Draft editor bypasses approval | Publication-state helper blocks content editors from modifying, deleting, or creating published rows |
| IDOR/cross-group access | RLS helpers, self-only target checks, and automated tests |
| Privileged account takeover | MFA/aal2 policies, dual recovery owners, session review |
| Public-site key reads private data | Safe projections, no service key, default-deny RLS |
| Child-media disclosure | Private bucket, exact path authorization, scope consent, scan/review, signed URLs |
| Volunteer overreach | Time-limited roster projection instead of child-table access |
| Teen/adult unsafe contact | No unrestricted direct messaging; supervised group channels |
| Webhook forgery/replay | Provider verification adapter, receipt idempotency, payload hash |
| Prompt injection/data exfiltration | Approved-document allowlist, prohibited domains, no service credentials, citations |
| Social/advertising privacy leak | Separate outreach schema, aggregate analytics, human approval, forbidden fields |
| Stale service information | Canonical occurrences/overrides and propagation tests |
| Supply-chain compromise | Lockfile, dependency review, Dependabot, CodeQL, secret scanning |
| Backup misconception | Separate database and storage backups with restore tests |
| Insider misuse | Least privilege, separated admin roles, audit, periodic access review, offboarding |

## Abuse cases

- A member changes a channel ID to read another ministry.
- A guardian changes a child ID to view another family.
- A former volunteer retains class access after the service window.
- A content editor attempts to grant a safety or super-admin role.
- A content editor attempts to publish or edit an already-published lesson directly.
- A member calls a helper with another member’s profile ID to infer roles or group membership.
- A crafted push subscription points the delivery worker at an arbitrary HTTPS service.
- A technical administrator attempts to query prayer content.
- A malicious upload is approved before scan/consent.
- A social worker publishes a draft lacking approval metadata.
- An AI request attempts to include private prayer or child records.

Each abuse case requires an automated test or documented compensating control before production.
