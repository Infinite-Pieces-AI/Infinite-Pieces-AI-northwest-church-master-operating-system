# Contributing

## Working agreement

- Use small, reviewable pull requests.
- Never place real member, visitor, prayer, counseling, or child data in source control.
- Every change to authentication, roles, children, media, invitations, or RLS requires a second
  reviewer from the security/safeguarding ownership group.
- Public facts that affect attendance—time, location, accessibility, parking, cancellation, or
  service overrides—require a content owner review.
- AI output must remain a draft until an authorized human publishes it.

## Branch and commit conventions

- Branch: `feature/<ticket>-short-name`, `fix/<ticket>-short-name`, or `docs/<ticket>-short-name`
- Commit: Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`)

## Pull request checklist

1. Tests cover behavior and authorization boundaries.
2. No secret or sensitive data is included.
3. Database migrations are reversible or have an explicit recovery plan.
4. New tables have RLS enabled and tested before API exposure.
5. Accessibility was considered and keyboard behavior tested.
6. Content and safeguarding owners reviewed applicable changes.
7. Deployment and rollback notes are included for high-risk changes.
