# Validation report

**Artifact date:** August 2, 2026  
**Release:** `0.2.0` master operating system  
**Scope:** Source-level, architecture-level, and executable domain validation of the merged Boston Church Lowell / Northwest monorepo.

## Result

The repository passed every validation that could be completed without downloading the npm dependency graph or starting a Docker-backed Supabase environment.

This is a **production-minded engineering artifact**, not authorization to load real member, teen, child, prayer, counseling, safeguarding, or pastoral information.

## Repository-wide checks completed

| Check | Result |
|---|---:|
| Required architecture structure | 48 required files present |
| Synthetic-data, unsafe-flag, and committed-secret scan | Passed |
| Source syntax parsing | 177 TypeScript, TSX, JavaScript, and module files passed |
| JSON parsing | 62 files passed |
| YAML workflow/configuration parsing | 8 files passed |
| TOML parsing | 1 file passed |
| Workspace contracts | 27 packages passed |
| TypeScript aliases | 18 aliases resolved |
| Internal package dependency declarations | Passed |
| Next.js internal-package transpilation boundaries | Passed |
| Service-worker JavaScript syntax | Passed |
| PWA package semantic typecheck | Passed |
| Targeted public-web, member-hub, and worker semantic typechecks | Passed with temporary dependency declarations |
| Merged domain-package semantic typecheck | Passed with temporary Node runtime declarations |
| Static SQL validation | 16 contiguous migrations and 95 public tables passed |
| RLS-enablement coverage | Explicit coverage found for all 95 public application tables |
| SQL transaction and dollar-quote balance | Passed |
| `SECURITY DEFINER` search-path checks | Passed |
| Executable domain smoke suite | 7 merged packages passed |

## Executable domain smoke coverage

The source was transpiled in the artifact environment and executed against representative synthetic inputs. The smoke suite verified:

- Deterministic fellowship rotation with household integrity, fixed leaders, graph familiarity penalties, and reproducible fingerprints.
- Short-lived HMAC Kids Kingdom pickup credentials, signature validation, session binding, expiry behavior, and the custom-release safety gate.
- Offline-safe PWA path boundaries.
- Web-push provider allowlisting and rejection of non-HTTPS or unapproved endpoints.
- Sparse, validated realtime topics and presence state.
- People-first local-search opportunity scoring and mandatory human review.
- Rejection of outreach plans based on sensitive religious or private ministry signals.
- Generic lock-screen notification payloads and internal-only notification URLs.
- Durable outbox-event construction.
- AI denial of private prayer data, autonomous publishing, and independent minor communication.
- Human approval requirements for generated ministry imagery and sermon-derived curriculum.

The final executable smoke result was:

```json
{
  "rotation": {
    "strategy": "deterministic-greedy-plus-pairwise-refinement",
    "requestedPasses": 6,
    "completedPasses": 1,
    "acceptedSwaps": 0
  },
  "score": 3.8,
  "fingerprint": "d973c7259cf4",
  "packages": 7,
  "smoke": "passed"
}
```

## Important defects found and corrected during the merge

The validation and security review did more than count files. It found and corrected the following material defects or unsafe edge cases:

1. **Monorepo alias loss:** application aliases could replace rather than extend shared `@church/*` aliases. The TypeScript configurations now preserve both local and shared aliases.
2. **Worker `rootDir` conflicts:** worker projects could reject source-based workspace imports. The worker TypeScript boundaries were corrected.
3. **Unsafe dry-run mutation:** workers operating in dry-run mode could still claim jobs and leave them in a processing state. Dry run now inspects without mutating work.
4. **Synthetic content in a real environment:** personalized weekly data could silently fall back to demo content. Production now reads the authenticated database function or presents an explicit unavailable state.
5. **Cross-user membership oracle:** helper functions could be abused to probe another account's roles or memberships. Authenticated callers may now inspect only themselves unless operating through the service role.
6. **Expired/future membership ambiguity:** authorization helpers now honor membership start and end windows.
7. **Content-editor publication bypass:** editors could potentially move drafts into public states. Publishing and editing already-published content now require a minister or super administrator at AAL2.
8. **Raw Kids Kingdom metadata exposure:** guardians no longer receive raw credential tokens, printer payloads, verifier identities, provider references, or restricted release notes. A redacted guardian release-history function is provided instead.
9. **Web-push request-forgery risk:** arbitrary subscription endpoints are rejected. Push delivery is constrained to an explicit provider-host allowlist, credential-free HTTPS, and standard port 443.
10. **Shared-device residue:** sign-out now revokes the current device's push subscription, unsubscribes the browser, clears bounded Church Hub caches, ends the Supabase session, and redirects to login.
11. **Service-worker lifecycle race:** background revalidation now uses the service worker event lifecycle correctly instead of allowing updates to terminate early.
12. **Overbroad offline caching:** only approved, low-sensitivity schedule and lesson snapshots are cacheable. Messages, household information, child status, invitations, authentication responses, and personalized dashboards remain network-only.
13. **Unsafe child-release implication:** custom QR credentials are explicitly non-authoritative and remain disabled until an approved provider integration and documented safety review are complete.
14. **Autonomous SEO/social publishing:** the outreach subsystem produces drafts and readiness evidence only; publication requires accountable human approval.

## Database-specific validation completed

The static SQL validator confirmed:

- Migration numbering is contiguous from `0001` through `0016`.
- Transactions and dollar-quoted function bodies are balanced.
- Public application tables have explicit RLS enablement.
- New push, realtime, Kids Kingdom, curriculum, outreach, relationship-signal, and notification-job domains are represented in ordered migrations.
- Security-definer helpers declare controlled search paths.
- The SQL test suite includes cross-channel isolation, household/guardian isolation, content publication-state restrictions, realtime self-check restrictions, and redacted Kids release history.

Static analysis cannot prove PostgreSQL runtime behavior. The migrations and pgTAP tests still must be executed against the pinned local Supabase/PostgreSQL stack.

## Checks that still require a networked development environment

The artifact environment could not download the npm dependency graph, and Docker, `psql`, and the Supabase CLI were unavailable. Therefore, the following commands have **not** been represented as passing:

```bash
pnpm install
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm build
pnpm test:e2e
pnpm supabase:reset
pnpm supabase:test
pnpm supabase:types
```

The targeted semantic checks used temporary declarations for unavailable framework and Node type packages. They provide meaningful source validation, but they do not replace a dependency-backed monorepo typecheck or production build.

The following external operations were also not executed:

- Live Vercel preview, staging, or production deployments.
- Live Supabase migration and RLS tests.
- Planning Center or another ChMS synchronization.
- Thermal-label printer or kiosk hardware testing.
- VAPID push delivery through browser providers.
- Search Console, Google Business Profile, Google Ad Grants, social-platform, Bible-provider, email, or AI-provider integrations.
- Backup restoration.
- Accessibility testing with real assistive technologies.
- Sunday operations and safeguarding exercises.

## Required production preflight

Run the dependency-backed commands in CI or a developer workstation with registry access, Docker, and the Supabase CLI. Before production data is introduced, obtain accountable church approval and evidence for:

1. Passing live migrations and pgTAP/RLS tests.
2. MFA enrollment for every privileged account.
3. Child, teen, media, messaging, and safeguarding policies.
4. ChMS ownership and Kids Kingdom check-in/release integration.
5. Database and private-media backup restoration.
6. WCAG 2.2 AA accessibility review.
7. Incident-response and Sunday fallback rehearsals.
8. Church-owned account recovery for GitHub, Vercel, Supabase, domain/DNS, Google, ChMS, email, Bible, AI, analytics, and backup providers.
9. Privacy and legal review appropriate to Massachusetts operations.
10. Leadership approval for every AI, outreach, and publication workflow.

## Production boundary

Do not import real personal or child information until the non-negotiable release gates have passed with documented leadership, safeguarding, privacy, and technical sign-off. A successful source validation means the artifact is ready for dependency-backed integration testing—not that the church has completed its operational duty of care.
