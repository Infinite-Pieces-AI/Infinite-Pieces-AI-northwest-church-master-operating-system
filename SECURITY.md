# Security policy

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability. Report it privately to the named church
security owner and technical lead using the church-approved secure channel. Include affected route,
role, reproduction steps, impact, and whether member or child data may be involved.

## Security principles

- Deny by default.
- Authorize on the server and in PostgreSQL RLS; interface visibility is not authorization.
- Separate technical administration from pastoral, safeguarding, and child-data access.
- Use least privilege and short-lived access.
- Keep all service-role/secret keys server-only.
- Preserve audit evidence without logging sensitive message bodies.
- Treat religious participation, households, minors, prayer, counseling, and media as sensitive.

## Supported versions

Only the current production branch receives security fixes. Dependency updates are reviewed and
merged through automated pull requests after passing tests.

## Incident response

Follow `docs/incident-response/incident-response-plan.md`. Any suspected child-safety concern also
follows the church safeguarding protocol and applicable external reporting duties; an in-app report
never replaces emergency or legally required reporting.
