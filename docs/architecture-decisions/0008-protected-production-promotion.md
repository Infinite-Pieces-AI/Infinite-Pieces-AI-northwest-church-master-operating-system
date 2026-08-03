# ADR 0008: Protected production promotion

## Status

Accepted for the master operating-system scaffold. Production account owners must verify the exact Vercel project settings before launch.

## Decision

Pull requests use Vercel previews. The `staging` branch may deploy automatically to an integration environment. Pushes to `main` do not automatically deploy either production project. A maintainer dispatches `.github/workflows/production-promotion.yml` from `main`; the workflow reruns production preflight checks and then enters the protected GitHub `production` environment. Required environment reviewers approve the public site, member hub, or both before church-owned Vercel deploy hooks are invoked.

## Why

The public site and private hub share a repository but have different risk profiles. A copy-only public update may not require a private-hub release, while authentication, child, media, realtime, or RLS changes require extra review. Manual promotion preserves atomic source control without turning every merge into an immediate production event.

## Required configuration

1. Create separate Vercel projects rooted at `apps/public-web` and `apps/church-hub`.
2. Keep `main` as the reviewed release source and disable automatic `main` deployments as represented in each `vercel.json`.
3. Create church-owned production deploy hooks and store them only as GitHub `production` environment secrets.
4. Require at least two production environment reviewers, including an accountable church owner.
5. Record the workflow run, commit SHA, release reason, migration evidence, smoke tests, and rollback deployment in the release record.
6. Verify experimentally that the selected deploy-hook configuration creates a production deployment from the intended commit/branch before relying on it.

## Consequences

Production releases are slower and more deliberate. Preview and staging environments remain the place for normal iteration. Emergency release and rollback procedures must remain documented and rehearsed.
