# Data Model Guide

## Domain ownership

| Domain                               | Source of truth                                | Sensitivity                       |
| ------------------------------------ | ---------------------------------------------- | --------------------------------- |
| Public schedule/content              | Church platform                                | Public after approval             |
| Auth identities                      | Supabase Auth                                  | Confidential                      |
| Member roles/scopes                  | Church platform                                | Confidential                      |
| People/households                    | Existing ChMS or church platform per discovery | Confidential                      |
| Child check-in/release               | Existing ChMS/Planning Center initially        | Highly restricted                 |
| Kiosks, print jobs, release evidence | Church platform operational mirror             | Highly restricted                 |
| Private community/realtime           | Church platform                                | Confidential to highly restricted |
| Prayer/pastoral content              | Church platform only when explicitly approved  | Highly restricted                 |
| Media consent/private media          | Church platform                                | Highly restricted                 |
| Bible text                           | Licensed provider                              | Licensed content                  |
| Curriculum/image prompts             | Church platform draft workflow                 | Internal/reviewed                 |
| Search opportunities/readiness       | Aggregate provider data                        | Internal                          |
| Visitor leads                        | Voluntary submission                           | Confidential                      |
| Audit/security/release evidence      | Church platform                                | Restricted                        |

## Master domain tables

| Domain           | Principal tables                                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Push             | `push_subscriptions`, `notification_jobs`, `delivery_receipts`                                                                                         |
| Realtime         | durable `channels`, `channel_members`, `messages`; provider `realtime.messages` policies                                                               |
| Kids operations  | `kids_kiosk_devices`, `kids_checkin_credentials`, `label_print_jobs`, `kids_release_verifications`                                                     |
| Teaching AI      | `approved_documents`, `document_chunks`, `ai_requests`, `ai_citations`, `sermon_curriculum_drafts`, `image_prompt_drafts`                              |
| Fellowship graph | `pairing_history`, `relationship_signals`, extended `rotation_runs`, `rotation_assignments`                                                            |
| Outreach         | `search_performance_snapshots`, `keyword_opportunities`, `content_briefs`, `campaigns`, `social_drafts`, `outreach_readiness_checks`, `visit_requests` |

## Modeling rules

- UUID keys reduce guessability but never replace authorization.
- Every mutable operational table uses UTC timestamps.
- Soft lifecycle fields preserve audit history where deletion is unsafe.
- Children have no auth identity.
- Exact address, recurring location, and relationship data are minimized.
- Scripture references/provider identifiers are separate from licensed text.
- Push endpoints are hashed for idempotent registration and protected by own-user RLS.
- Presence is ephemeral and is not stored as a behavioral history.
- Relationship graph signals contain only attested aggregate familiarity—not private content.
- Short-lived Kids credentials are hashed when persisted and do not confer release authority.
- Print payloads contain only minimum approved operational fields.
- AI records retain source IDs, citations, safety flags, model/version, review status, and cost—not autonomous authority.
- Search data remains aggregate; visitor records require voluntary submission.
- Audit records avoid full sensitive-row payloads.

## Schema generation

After a local database reset:

```bash
pnpm supabase:types
```

Commit generated TypeScript types with the migration that changed them. CI compares regenerated output to the committed file.
