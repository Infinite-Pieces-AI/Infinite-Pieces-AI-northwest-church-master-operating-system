# API Boundary

Most operations use Next.js route handlers/server actions and Supabase RPCs. There is no broad public CRUD API.

## Public routes

| Route                        | Method | Contract                                                           |
| ---------------------------- | -----: | ------------------------------------------------------------------ |
| `/api/public/schedule`       |    GET | Published schedule projection only                                 |
| `/api/public/events`         |    GET | Published public events only                                       |
| `/api/public/visit-requests` |   POST | Validated, rate-limited, voluntary lead submission                 |
| `/api/access-requests`       |   POST | Validated request; approval is never automatic                     |
| `/api/revalidate`            |   POST | Server-secret protected revalidation of approved public tags/paths |

## Member routes

| Route                             |          Method | Contract                                                  |
| --------------------------------- | --------------: | --------------------------------------------------------- |
| `/api/auth/magic-link`            |            POST | Generic response, no enumeration, no automatic sign-up    |
| `/api/invitations/accept`         |            POST | Authenticated email-bound token consumption               |
| `/api/me/this-week`               |             GET | Personalized current schedule, lesson, events, and groups |
| `/api/groups/:channelId/messages` |        GET/POST | Channel membership and posting-policy enforcement         |
| `/api/offline/service-schedule`   |             GET | Explicit low-sensitivity offline-safe schedule snapshot   |
| `/api/offline/weekly-lesson`      |             GET | Explicit approved lesson summary/reference snapshot       |
| `/api/push/subscriptions`         | GET/POST/DELETE | Own-user push registration, status, and revocation        |
| `/api/ai/bible`                   |            POST | Approved-document allowlist and citations; draft only     |

## Administrative and integration routes

| Route                                         |   Method | Required boundary                                       |
| --------------------------------------------- | -------: | ------------------------------------------------------- |
| `/api/admin/content/publish`                  |     POST | `content.publish` + MFA                                 |
| `/api/admin/rotations/generate`               |     POST | assigned group management or minister approval          |
| `/api/integrations/planning-center/check-ins` | GET/POST | safety/integration role; provider remains authoritative |
| `/api/webhooks/planning-center`               |     POST | provider signature adapter and idempotency              |
| internal worker RPCs                          | POST/RPC | service-role only; never callable by browser roles      |

## Realtime

Realtime is not a public API. Topics are validated as `channel:<uuid>`, `group:<uuid>`, `kids-class:<uuid>`, or `announcement:church`; database policy decides subscription access. Observing an event never grants permission to read the durable record.

## Error conventions

- `400`: invalid request without sensitive-state disclosure;
- `401`: authentication required;
- `403`: authenticated but not permitted;
- `404`: resource hidden or absent;
- `409`: state conflict, such as a consumed invitation;
- `429`: rate limit;
- `503`: dependency unavailable with no unsafe fallback.

Responses never include raw SQL errors, provider secrets, access tokens, prayer content, child care flags, private authorization reasoning, or release-code material.
