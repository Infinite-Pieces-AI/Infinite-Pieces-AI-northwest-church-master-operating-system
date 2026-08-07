# Data Retention Schedule Template

> Final durations require leadership, operational, insurance, and legal review.

| Record                    | Starting policy                         | Deletion/archival method                            |
| ------------------------- | --------------------------------------- | --------------------------------------------------- |
| Unapproved access request | Short review window                     | Delete or de-identify after closure                 |
| Unused invitation         | Expiration + brief audit window         | Remove token hash; retain minimal audit             |
| Active member profile     | Membership + approved transition period | Export/delete workflow subject to holds             |
| Community content         | Community policy period                 | Soft delete then approved purge                     |
| Prayer request            | User-selected closure + short retention | Restricted deletion workflow                        |
| Child/check-in mirror     | Minimum operational need                | Defer to ChMS retention and delete mirror           |
| Private media             | Consent/event need                      | Delete object, derivatives, and backup on schedule  |
| Visitor lead              | Consent/follow-up period                | Opt-out suppression plus deletion/de-identification |
| Audit/security            | Security/legal period                   | Restricted archive then purge                       |
| AI prompt/response        | Minimal review/evaluation period        | Remove prompt text where metrics suffice            |

Run retention as reviewed jobs with dry-run reports, legal-hold checks, counts, and audit evidence.
