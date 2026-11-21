# Production acceptance — 2026-11-18

**Decision: NO-GO for production.** Review branch `feat/production-acceptance-20261116` continues PR #14. No main merge, production deployment, paid service, remote schema change or role promotion.

## Implemented

- Enrollment responses add per-course progress and the first unfinished published lesson, ordered by orderIndex then ID. All reads are scoped to the trusted Student and published enrolled courses. Empty/all-completed courses have no next lesson. Maximum three bulk reads regardless of course count. Resume chooses the newest enrolled course with unfinished work, then its earliest unfinished lesson.
- Dashboard skips completed courses for resume, displays per-course completion, and opens the chosen curriculum. The lesson view opens and focuses its first unfinished lesson. Missing summary data is not represented as zero completion.
- Student-only `/teams/my/milestones` uses one membership/ownership-scoped database query. Dashboard fetches it in parallel with other sources, replacing per-team detail requests.
- Real staging suite adds a second enrolled Student with a separate team. Checks deny cross-team project/evidence/submission reads, upload presign/completion, download URL issuance, evidence editing, foreign-file association and foreign-evidence snapshots. Notification list/marking checks enforce recipient isolation. Existing known-byte, immutable-version, assessment, feedback and notification checks remain. New assertions are implemented, not live-accepted.
- Compatible lockfile fixes: Joi 17.13.4 to 17.13.9, qs 6.14.2 to 6.14.3. Compatible Nest/Prisma packages were already current. No forced major overrides.
- Two existing DB tests silently returned without database configuration; they now explicitly skip. Added an isolated-Postgres test for bulk progress and membership milestone queries, with rollback of its fixtures.

## Gate evidence

| Gate | Evidence | Result |
|---|---|---|
| Builds | Frontend production build, TypeScript, backend Prisma generation/Nest build | Local pass; live revision compatibility pending |
| Browser | 15 local tests: eight widths, role fixtures, editor, onboarding and exact resume with keyboard focus | Fixture pass; no real account certification |
| Lint | Zero errors, 19 existing warnings | Warnings retained |
| Backend tests | Query-scope/count and completion-gap checks added; DB tests explicitly skip locally | Local: 51 pass, 3 explicit database skips, 0 failures. Configured CI: 54 pass, 0 skips, including migrated Postgres relation queries and persisted evidence/assessment tests |
| Real authentication/files | Four staging tests failed missing-secret checks before authentication/content creation | Blocked; zero live journeys accepted |
| Accounts | Read-only inventory: one ADMIN profile; no local E2E variables or UAT secret file | Four dedicated identities required |
| Storage | Bucket design-evidence is private, object limit 50,000,000 bytes | Metadata verified; bytes/access checks pending |
| Deployment | Render live commit adcceae, old integration branch, auto-deploy off, not suspended, actual healthCheckPath empty; four completed DB migrations | Backend-first staging rollout required; new endpoint not live |
| Startup/health | Initial liveness/readiness probes each timed out around 10s. Render process start logged 2026-11-18 03:55:23 UTC. Later five responses per endpoint all 200 | Warm median 98/107ms, nearest-rank p95 391/614ms. Exact cold duration/authenticated p95 unverified |
| Mobile lab | Anonymous production Chrome, 390x844, 150ms latency, 1.6Mbps down/.75Mbps up, 4x CPU, cache disabled; five samples per route | Home LCP median/p95 1968/2108ms, max CLS .00109; Learn 2760/2788ms, CLS 0. Learn misses proposed 2500ms lab target. Field INP/authenticated performance unmeasured |
| Monitoring | Sanitized diagnostics/passive script available; no live health path or alert delivery verification | Open |
| Recovery | No backup export, private object manifest, approved isolated target or restore tooling/credentials | No restore attempted; RPO/RTO unmeasured |
| Human tasks | No representative users or observed task sessions | Start-under-60-seconds and satisfaction unverified |

Raw audit summaries and mobile samples: `docs/verification/2026-11-18/`. No remote data mutation during discovery. No schema migration required by these changes. Existing API response fields remain; new frontend needs the updated backend for summary/milestone functionality.

### CI evidence for source commit 5b8bdc1

[GitHub Actions run 44234585517](https://github.com/anystuf/uii_design_thinking_hub/actions/runs/44234585517) completed: backend success (54/54, zero skips), browser/responsive success, frontend failure at the strict high-severity dependency audit. Overall CI is failing and production remains NO-GO. The local frontend build passed independently; the CI frontend job stops at its audit gate. Subsequent report-only commits do not change the implementation verified by this run.

## Security

Frontend runtime-classified audit: **0 critical, 10 high** packages from the picomatch/Tailwind/build chain. The [picomatch advisory](https://github.com/advisories/GHSA-fc5q-39xc-vjpf), updated November 17, lists no patched version. Queried hypothetical 4.0.8 does not exist; no override installed. This supersedes November 14's clean audit observation. These packages process repository build globs; this app does not accept user-supplied glob patterns. This does not prove a public exploit path. Remediation or a reviewed residual-risk decision remains required; CI's audit gate is not relaxed.

Backend runtime audit after compatible fixes: **0 critical, 8 high, 6 moderate**, versus 9 high/6 moderate before. Remaining chains include Nest/Express/body-parser/multer, Prisma/deepmerge, lodash, file-type, qs and uuid. Major upgrades/upstream fixes and compatibility validation remain engineering work. Findings count affected packages, not proven exploits. Critical Next/proxy patches remain in the review lineage; the old live backend is not certified patched.

Supabase advisors: 35 INFO findings for RLS enabled without policies, one WARN for leaked-password protection. API-owned access uses deny-by-default client tables; do not add broad policies to silence INFO findings. Verify grants and live negative cases. [RLS advisor](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). Owner must review plan availability; no paid feature enabled. [TLS change](https://supabase.com/changelog/cbc-tls-ciphers-deprecated) reviewed; legacy-device compatibility unverified.

## Owner actions and remaining engineering

1. Provision dedicated Student A, Student B, Lecturer and Admin; sign in once and assign trusted application roles. Supply E2E_SUPABASE_PUBLISHABLE_KEY and E2E_STUDENT, E2E_STUDENT_B, E2E_LECTURER, E2E_ADMIN EMAIL/PASSWORD variables through ignored local secrets or protected staging-uat CI secrets. Never paste credentials in chat. Accounts alone do not pass tests.
2. Provide Render dashboard/approved access to select the reviewed backend revision, configure /health/ready and verify it before the matching frontend staging/preview. Current connector deploy cannot select an arbitrary commit/branch. Record both deployed revisions. Production rollout remains unauthorized.
3. Engineering remediates remaining advisories with tests. Security/owner reviews any narrowly documented build-chain risk exception; no blanket clean-audit claim.
4. Name an operations responder and approved alert destination; test failed-readiness alert and recovery. Choose hosting/reminder reliability without unapproved expenses. Free-service sleep remains unresolved.
5. Supply a backup plus separately exported private bytes/checksum manifest; approve an isolated zero-cost recovery target and RPO/RTO/retention. Restore there; verify ownership mappings, counts, bytes, evidence versions, frozen snapshots, grades and notifications, with timings. Never restore over live data for this drill.
6. Recruit representative users to complete resume, team evidence submission and feedback tasks; record success/time/errors/satisfaction separately from fixtures. Measure real mobile INP/LCP/CLS and authenticated endpoint p95, separating startup from warm behavior.

Concurrent snapshots/revisions, upload mismatch, signed-URL expiry, invitation acceptance, second-browser sessions and real authenticated mobile journeys still need additional engineering tests. Missing accounts explain blocked execution, not completion of this coverage.

Production GO requires passing live identity/file/integrity/security/restore/alert gates, agreed task/performance targets, a reviewed commit and explicit owner launch approval.
