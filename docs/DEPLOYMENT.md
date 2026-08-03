# Deployment Guide

## Account ownership

Create the GitHub organization, Vercel team, Supabase organization, domain/DNS, monitoring, email, Bible-provider, ChMS, analytics, push, and backup accounts under church ownership. Record at least two recovery administrators for every production account.

## Vercel projects

| Project | Root directory | Public exposure |
|---|---|---|
| Public website | `apps/public-web` | Indexed public domain |
| Church hub | `apps/church-hub` | Authenticated subdomain, `noindex` |

The two projects share one repository but deploy independently. Pull requests create previews. The `staging` branch may deploy automatically for integrated testing. Automatic `main` deployments are disabled in the checked-in Vercel configuration.

## Protected production promotion

Production is promoted through `.github/workflows/production-promotion.yml`.

1. Configure a protected GitHub environment named `production`.
2. Require accountable church and technical reviewers.
3. Add `VERCEL_PUBLIC_PRODUCTION_DEPLOY_HOOK` and `VERCEL_HUB_PRODUCTION_DEPLOY_HOOK` as environment secrets.
4. Configure each hook against the intended reviewed production source.
5. Dispatch the workflow from `main`, select `public`, `hub`, or `both`, and provide a release reason.
6. The workflow reruns structure, sensitive-data, SQL, formatting, lint, type, unit, and build checks before requesting production approval.
7. Verify the returned deployment and record the exact Vercel deployment ID/URL with the commit SHA.

A deploy-hook setup must be tested in a non-production project first. Vercel dashboard behavior and branch settings are operational configuration, so the release owner must verify that the hook deploys the intended commit rather than assuming the repository file alone enforces it.

## Environment separation

- Development: fictional local data only.
- Staging: synthetic realistic data for training and acceptance.
- Production: approved real records only after every relevant release gate passes.

Never copy production data into previews. Use independent Supabase projects for staging and production. Keep service-role, provider, webhook, pickup-signing, VAPID private, and invitation secrets out of Vercel preview/browser variables.

## Deployment sequence

1. Merge a reviewed pull request after CI passes.
2. Apply migrations to staging and regenerate committed database types.
3. Run smoke, authorization, accessibility, integration, offline, realtime, and worker tests.
4. Review queue health, provider dry runs, backup status, and rollback steps.
5. Dispatch production promotion from the reviewed `main` commit.
6. Obtain protected-environment approval.
7. Apply an approved production migration during the release window.
8. Trigger the public site and/or member hub deployment.
9. Validate canonical schedule, auth, RLS isolation, private storage, realtime topics, PWA cache boundaries, push payload privacy, and queue health.
10. Record commit SHA, migration version, deployment IDs, approvers, evidence, and rollback target.

## High-risk changes

Require product plus security/safety approval for:

- authentication, sessions, invitations, MFA, roles, or RLS;
- children, guardians, check-in, kiosks, QR credentials, labels, release, media, or safeguarding;
- private realtime authorization or presence fields;
- service-worker cache policy or push payload contents;
- provider webhooks and server credentials;
- storage bucket policies;
- AI source scope, theological publishing, or social publishing;
- data export, deletion, retention, or backup behavior.

## Rollback

Application rollback uses a known Vercel deployment. Database migrations must be forward-fix oriented for destructive changes: introduce nullable/new structures, backfill, switch reads/writes, verify, then remove only in a separate approval. Never blindly down-migrate production child, safeguarding, audit, or check-in evidence.
