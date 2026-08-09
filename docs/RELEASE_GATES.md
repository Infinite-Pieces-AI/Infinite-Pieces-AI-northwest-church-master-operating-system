# Production Release Gates

Real member or child data is prohibited until the accountable owners mark every applicable gate as passed and attach evidence.

|   # | Gate                            | Required evidence                                                                    | Owner               |
| --: | ------------------------------- | ------------------------------------------------------------------------------------ | ------------------- |
|   1 | Cross-group isolation           | Automated test showing record-ID and URL changes cannot read another group           | Technical lead      |
|   2 | Guardian-child isolation        | Automated tests for linked and unlinked households                                   | Safety + technical  |
|   3 | Volunteer projection            | Test showing only assigned class, time window, and operational fields                | Kids Kingdom owner  |
|   4 | Immediate membership revocation | Realtime and subsequent requests deny removed user                                   | Technical lead      |
|   5 | Invitation controls             | Entropy, hash, email binding, expiration, one-time use, revocation tests             | Access owner        |
|   6 | Privileged MFA                  | All privileged workflows fail at `aal1` and pass at `aal2`                           | Security owner      |
|   7 | Public/private boundary         | Public key cannot query private tables or functions                                  | Security owner      |
|   8 | Private indexing                | Hub routes return noindex/no-store and require auth                                  | Frontend lead       |
|   9 | Media scope                     | Consent-scope, scan, metadata removal, review, signed URL, takedown tests            | Safety + privacy    |
|  10 | Schedule propagation            | Override updates website, hub, structured data, and notification draft               | Content owner       |
|  11 | Structured data                 | Event and organization markup validates against live content                         | Outreach owner      |
|  12 | Database restore                | Successful restore with measured RPO/RTO                                             | Technical admin     |
|  13 | Media restore                   | Separate storage restore succeeds                                                    | Technical admin     |
|  14 | Moderation routing              | Test report reaches correct trained queue without broad visibility                   | Moderation owner    |
|  15 | Safeguarding drill              | Escalation rehearsal completed; app not treated as emergency reporting               | Safety owner        |
|  16 | AI citations                    | Evaluation set shows approved sources and clear content separation                   | Ministerial owner   |
|  17 | AI authority                    | Tests show no role changes, publication, minor contact, or prohibited-data retrieval | Security + ministry |
|  18 | WCAG 2.2 AA                     | Automated plus manual keyboard/screen-reader evidence                                | Accessibility owner |
|  19 | Dual recovery ownership         | Two church leaders recover every production account                                  | Product owner       |
|  20 | Sunday fallback                 | Printed/manual check-in procedure rehearsed                                          | Sunday operations   |

## Release decision record

For each release, create a record containing:

- version and commit SHA
- environment
- migration identifiers
- test report links
- unresolved risks
- rollback procedure
- approvers
- date/time
- post-deployment checks

A waiver requires a written risk owner, expiration date, compensating controls, and approval from product, security, and the affected ministry owner. Child safety, public/private isolation, and privileged MFA are not normal waiver candidates.

## Additional master-ecosystem gates

|   # | Gate                          | Required evidence                                                                                                                             | Owner               |
| --: | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
|  21 | Offline cache isolation       | Browser test proving only shell, schedule, lesson, and offline page enter Cache Storage; sign-out and kill-switch evidence                    | Security + frontend |
|  22 | Push privacy and ownership    | Own-user RLS, generic-payload tests, approved-host rejection, endpoint revocation, sign-out cleanup, and read-only dry-run evidence           | Security + platform |
|  23 | Realtime authorization        | Assigned/unassigned subscription tests, revocation test, self-only target-helper test, and presence-field allowlist                           | Security + platform |
|  24 | Relationship graph governance | Content-free source attestation, retention, approval, deterministic replay, and no private-content access                                     | Ministry + privacy  |
|  25 | Kids kiosk/printer readiness  | Device control, minimum print fields, raw-table denial, redacted guardian history, bridge authentication, provider fallback, and outage drill | Kids + technical    |
|  26 | Custom child release          | Separate safety review ID, guardian/pickup cases, trained volunteers, dual verification, pilot approval                                       | Safeguarding owner  |
|  27 | AI curriculum and creative    | Approved-source allowlist, minister review, fictional-person disclosure, exact-output approval                                                | Content + ministry  |
|  28 | Outreach safety               | Aggregate-only search data, people-first review, sensitive-audience tests, truthful venue evidence                                            | Outreach + privacy  |
|  29 | Protected promotion           | GitHub environment reviewers, deploy-hook verification, SHA evidence, smoke test, rollback target                                             | Release manager     |
|  30 | Worker dry-run integrity      | Database evidence that all worker dry runs leave queues and outbox state unchanged                                                            | Technical admin     |
