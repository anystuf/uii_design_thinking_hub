# Security, authenticated acceptance and learning experience

Date 2026-11-14, Asia/Bangkok. Branch `fix/lms-security-and-authenticated-uat-20261114`, based on PR #12 commit `9fe616a`. PR #12 and its HCI audit were reviewed. Existing navigation, lesson editing, Admin directory and responsive checks are retained.

## Runtime remediation

The baseline frontend lockfile audit reported seven vulnerable packages, including one critical Next.js package with multiple applicable advisories. These include [Windows-hosted server RCE](https://github.com/advisories/GHSA-p293-qw3h-jr36), [AVIF image optimization RCE](https://github.com/advisories/GHSA-2xp9-vwfh-vxw4), and [SVG image optimization RCE](https://github.com/advisories/GHSA-2464-fhr4-w9xw). Package applicability alone does not prove that an installation was exploited.

- Updated Next.js 14.2.35 to pinned 16.4.6, React/React DOM to pinned 19.3.1 and PostCSS to 8.5.33. Updated React types and committed the lockfile. Next.js generated the JSX/type configuration changes.
- Replaced removed `next lint` with ESLint 9 and Next.js flat configuration. Existing React effect migration findings remain visible as warnings. Lint has zero errors and 19 warnings. Immediate private-state clearing on session changes remains in place.
- ESLint 9 is retained for the current `eslint-plugin-react` peer compatibility, which excludes ESLint 10. npm marks ESLint 9 deprecated, so the lint toolchain also needs an upstream-compatible maintenance upgrade.
- Frontend `npm audit --omit=dev --registry=https://registry.npmjs.org` reports zero vulnerabilities. Full frontend audit retains seven moderate findings in lint development dependencies.
- Backend runtime audit additionally found critical [proxy-addr IP spoofing](https://github.com/advisories/GHSA-jqcg-44mw-7w3h). Updated the transitive package from 2.0.7 to 2.0.8. Backend runtime audit then reports zero critical, nine high and six moderate findings. The remaining Nest/Express/Prisma-related advisories require further remediation before launch.
- Frontend production and GitHub Pages static-export builds passed. Backend build and 50 backend tests passed after the proxy patch. The normal and static builds must be validated serially when a local production server is in use.

The framework migration follows the [Next.js 16 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16). Framework and security changes are branch work. Deployment revisions must be checked separately before claiming a live environment is patched.

## Authenticated staging tests

Added a separate real-auth suite and manual CI workflow. It checks Student/Lecturer/Admin browser login, role persistence after refresh, logout and privileged API denial. The journey uses real API and Storage calls to upload known TXT bytes, compare downloaded bytes, deny a public object URL, preserve the submitted evidence version, publish an immutable rubric, request revision, score, resubmit, approve and read a notification.

Staging inspection found one ADMIN account and no Student or Lecturer profiles. No dedicated account secrets were available locally. Running `npm run test:staging` failed all four tests during missing-configuration preconditions, before authenticated content mutations. These are blocked tests, not accepted workflows. The exact setup and remaining cross-team/concurrency cases are in [the UAT guide](STAGING-AUTHENTICATED-UAT.md).

## HCI and learning changes

- Student orientation explains course selection, learning and team practice. Mobile instructions are compact, with details shown on larger screens.
- Course search and an enrolled-course filter help learners locate their work. Empty states explain the next action. Role/status labels use Vietnamese learner-facing language.
- Progress uses an accessible progressbar with a numeric value. Lesson authoring has an explicit cancel action.
- A local Student fixture test at 320px verifies course discovery, search recovery and a visible enrollment action. It provides UI regression evidence only.
- The app's existing fonts now use Next.js self-hosting and fallback metric adjustment. The browser-time Google CSS import was removed. Jakarta and Playfair load on demand, while Inter remains preloaded. [Font optimization documentation](https://nextjs.org/docs/app/getting-started/fonts)

## Observability and release preparation

The passive readiness script initially recorded a 10-second timeout for both `/health` and `/health/ready`. Render subsequently showed a fresh Nest process startup at 09:55:14 UTC. Later five-sample probes returned all 200 responses. Liveness median/p95 were 98/417ms and database readiness median/p95 were 105/658ms. This supports separating process startup from warm requests. It does not establish an authenticated API latency distribution or an exact cold-start duration.

Added production gates for isolated configuration, always-on hosting decisions, safe logs, alert ownership, private-object backup manifests, restore validation, migration compatibility and rollback. Backup restore, monitoring setup, pilot acceptance and production launch remain pending execution/sign-off.

## Verification limits

The mobile lab used Chrome at 390x844, disabled HTTP cache, 150ms latency, 1.6Mbps download, 0.75Mbps upload and 4x CPU slowdown, with five samples per anonymous route and a fixed one-second post-load observation window. Initial runtime on this branch with browser-loaded fonts compared with the final self-hosted font configuration:

| Route | Median LCP before → after | Nearest-rank p95 LCP before → after | Maximum observed CLS before → after |
| --- | --- | --- | --- |
| Homepage | 1292 → 1212ms | 1928 → 1760ms | 0.1885 → 0.0010 |
| Learning | 2432 → 2336ms | 2976 → 2492ms | 0 → 0 |

Raw samples are in `docs/verification/2026-11-14`. An intermediate concurrent static-export validation interfered with the locally served build and caused two incomplete session-initialization checks. That run was discarded. The final run was serial and all ten affected responsive/onboarding/performance tests passed. The independent editor regression also passed in this iteration, giving eleven distinct browser tests. All eight checked anonymous desktop states passed the automated accessibility assertion. Field performance, INP and authenticated routes remain separate acceptance work.

![Local Student onboarding fixture at 320px](screenshots/2026-11-14/student-onboarding-320.png)

Local responsive checks cover 64 anonymous route/width combinations, with automated accessibility checks for eight desktop states. Editor and onboarding tests use local fixtures. The real staged role and file workflows remain blocked on account configuration. Device testing, cross-user private-access cases, database concurrency, INP, load tests and a pilot cohort remain open gates. Production readiness is pending.
