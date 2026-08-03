# PWA, Offline, and Web Push Architecture

## Objective

Deliver a home-screen-installable member experience that remains useful during poor venue connectivity without copying sensitive member information into browser caches or lock-screen notifications.

## Offline classification

| Data class | Offline behavior |
|---|---|
| Application shell, logo, structural CSS/JS | Precache permitted |
| Public service schedule | Explicit offline snapshot permitted |
| Approved weekly lesson summary and Scripture references | Explicit offline snapshot permitted |
| Public fallback/offline page | Cache permitted |
| This Week personalization | Network-only |
| Community posts and messages | Network-only |
| Prayer requests | Network-only |
| Households, children, pickup, check-in status | Network-only |
| Invitations, auth callbacks, sessions, MFA | Network-only |
| Admin, moderation, safeguarding, audit | Network-only |

The service worker recognizes offline-safe responses through narrow paths and `X-Church-Offline-Safe`. A future change that adds another offline path is a security-sensitive change requiring review.

## Caching behavior

- Use cache-first for versioned shell assets.
- Use stale-while-revalidate only for the approved schedule and lesson snapshot endpoints.
- Use network-only for authentication, APIs, protected routes, realtime, and all private data.
- Use the reviewed offline page for a failed navigation.
- Never copy production data into preview or synthetic PWA caches.
- Sign-out revokes the current device subscription, unsubscribes the browser, and clears the bounded offline snapshot cache.
- `NEXT_PUBLIC_PWA_ENABLED=false` is an emergency kill switch that unregisters the service worker and removes offline snapshots.

## Web Push

The browser subscribes through the standard Push API using the public VAPID key. The private key and VAPID subject exist only in server/worker environments. The database stores the subscription endpoint and encryption keys under the owning profile with RLS. The server and delivery worker validate the endpoint against `WEB_PUSH_ALLOWED_HOSTS`; arbitrary HTTPS URLs are rejected to prevent server-side request abuse. Add a provider host only after testing a real browser subscription and reviewing the destination.

Push payloads are sanitized to a small allowlist:

- generic title;
- generic body;
- internal hub route;
- approved topic;
- icon, badge, and tag.

Never place names of children, prayer text, counseling details, safeguarding information, medical details, home addresses, private message excerpts, or access tokens in a push body. The notification should direct the member to authenticate and open the protected content.

## Worker safety

- Dry-run inspection never claims or mutates jobs.
- Live workers claim with `FOR UPDATE SKIP LOCKED` through a service-role RPC.
- Expired provider endpoints are revoked after 404/410 responses.
- Endpoints outside the deployment allowlist are rejected before storage and again before delivery.
- Other failures retry with bounded backoff.
- Delivery receipts record provider acceptance without storing message content.

## Browser limitations

Web push support differs by browser and operating system. Notification permission must be user-initiated. The member hub must remain fully usable when push is unavailable or declined.

## Release tests

1. Private routes never appear in Cache Storage.
2. Auth and API responses always remain network-only unless explicitly offline-safe.
3. An offline service schedule and lesson render after a successful user-initiated refresh.
4. Cache version changes remove obsolete entries.
5. Push subscription RLS prevents reading or deleting another user’s endpoint.
6. Dry-run delivery leaves job state unchanged.
7. Sensitive terms are rejected or replaced by the sanitizer.
8. Revoked endpoints are disabled.
9. Logout revokes device push, unsubscribes locally, and clears offline snapshots.
10. An arbitrary HTTPS push endpoint is rejected.
11. The production PWA kill switch unregisters service workers and removes snapshots.
