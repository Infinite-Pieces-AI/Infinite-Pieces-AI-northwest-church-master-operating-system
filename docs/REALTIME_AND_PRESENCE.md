# Private Realtime and Presence

## Purpose

Provide responsive assigned-channel communication without treating WebSockets as an authorization shortcut or using online status to track members across ministries.

## Topic convention

```text
channel:<uuid>
group:<uuid>
kids-class:<uuid>
announcement:church
```

The browser may construct only validated topics through `@church/realtime`. PostgreSQL function `can_access_realtime_topic` maps each topic to current channel membership, group membership, guardian/class relationship, volunteer assignment window, or active member status. Target-user helpers are self-only for authenticated clients; only the service role may evaluate an explicit different identity. This prevents membership and role-oracle queries.

Supabase Realtime private Broadcast/Presence authorization is enforced through RLS on `realtime.messages` when the managed realtime schema is available.

## Durable versus ephemeral data

- Messages, posts, channel memberships, and notification jobs remain durable PostgreSQL records.
- Broadcast may announce that a durable record changed.
- Presence is ephemeral and is never the system of record.
- Removing a membership must deny future durable reads and realtime reconnects immediately.

## Presence minimization

Allowed fields:

```text
profileId
displayLabel
activity: online | reading | typing
clientInstanceId
updatedAt
```

Prohibited fields include email, phone, household, exact location, child data, background/browser activity, message content, prayer content, counseling information, or a list of other channels.

Kids-class topics do not expose presence by default. Teen interaction remains group-based and leader-visible; unrestricted adult-to-teen direct messages are not part of the model.

## Client behavior

1. Authenticate normally.
2. Build a validated private topic.
3. Subscribe with `private: true`.
4. Let the Realtime service evaluate database authorization.
5. Track only sanitized sparse presence after subscription succeeds.
6. Untrack and remove the channel when leaving the page.
7. Treat `CHANNEL_ERROR`, timeout, or policy denial as a normal unavailable state—not as a reason to downgrade to a public channel.

## Privacy and product behavior

Presence should help a small group know that someone is available for the current conversation. It must not create pressure to respond, publish “last seen” histories, score engagement, or expose vulnerable-group activity.

## Release tests

- Assigned user can subscribe to the exact topic.
- Unassigned user is denied even with a known UUID.
- Membership revocation denies reconnect.
- Presence contains only the allowlisted fields.
- Kids-class presence is disabled.
- No topic is configured as public fallback.
- Database reads remain RLS-protected even if a broadcast event is observed.
- An authenticated member cannot call a helper with another profile ID to discover that person’s topic access or roles.
