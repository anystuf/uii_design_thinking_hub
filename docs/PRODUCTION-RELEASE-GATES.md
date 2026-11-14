# Production release gates

Owner approval is required for launch. This document prepares execution and records the outstanding evidence. Infrastructure provisioning, paid plans, production secrets and deployment remain owner decisions.

## Application acceptance

| Gate | Required evidence | Current state |
| --- | --- | --- |
| Patched runtime | Locked Next/React versions, runtime audit and build | Next 16.4.6 / React 19.3.1 builds, runtime audit reports zero vulnerabilities |
| Role boundaries | Real authenticated Student/Lecturer/Admin journeys and negative cases | Staging suite prepared, dedicated credentials missing |
| File integrity | Known bytes upload/download, unauthorized access denied | Staging test prepared, execution blocked on accounts |
| Immutable submissions | Original version survives revision and resubmission | Existing unit checks pass, live acceptance pending |
| Grading and notices | Version-specific weighted grade, private/deduplicated notifications | Live acceptance pending |
| Mobile/accessibility | Authenticated eight-width workflow, keyboard and assistive technology | Anonymous coverage exists, authenticated/manual coverage pending |
| Performance | Measured LCP/CLS/INP and authenticated warm p95, cold starts reported separately | Release targets remain unverified |
| Pilot | Representative learners and lecturers complete scripted journeys | Pending owner-organized cohort |

## Infrastructure preparation

Use distinct production Vercel, API and Supabase projects with production-only secret scopes. Preserve staging endpoints and CORS while preparing any domain migration. Before traffic, verify HTTPS, exact allowed frontend origins, Auth redirect allowlists, issuer/audience checks and private Storage policies. Public keys may reach the browser, server secrets and database credentials belong only on the API.

Render Free can sleep while idle and its in-process reminder scheduler may miss windows. An always-on backend and reliable reminder scheduling need an approved hosting decision and budget. Record the chosen region close to the database, connection pool limits and expected concurrency. No paid plan has been selected by this change.

## Monitoring

Run `node scripts/check-readiness.mjs` for five passive staging liveness/readiness samples. It exits nonzero on failures and emits only path, status and duration. Configure the approved production monitoring system to alert on failed readiness, sustained 5xx, auth errors, upload completion failures and reminder job failures. Use sanitized route-template/request-ID logs. Assign an alert recipient and response time before launch. This probe script does not create a scheduled monitor.

## Backups and recovery

1. Owner chooses retention and recovery objectives, including separate policies for database metadata and private evidence objects.
2. Verify the selected Supabase plan's available backup/PITR facilities and export tooling at execution time. Record backup timestamps, encryption, access control and the accountable operator.
3. Back up private Storage object bytes with a key/checksum manifest as well as relational metadata. Database recovery alone cannot recreate missing object bytes.
4. Restore into an isolated recovery project. Apply compatible application configuration and validate record counts, Auth ownership mappings, known private file bytes, evidence versions, immutable submission items, grades and notifications.
5. Record achieved recovery time and data loss window. Require a successful drill and owner acceptance before launch. No restore has been executed or certified in this iteration.

## Deployment and rollback

Build an immutable reviewed commit, run CI and staging acceptance, and record exact frontend/API revisions and migration state. Apply reviewed additive migrations with a compatibility plan. Stage the approved production build and smoke-test sign-in, roles, course loading and evidence access before switching traffic.

For application regression, restore the previously approved frontend/API revisions and repeat smoke checks. A code rollback does not revert data or object writes. For data damage, stop affected writes, preserve incident evidence and follow the tested recovery plan. Never restore a backup over live data as an automatic retry.

## Sign-off record

Record owner, QA/teaching representative, operations owner, approved commit, evidence links, accepted residual risks and launch time. Privacy/retention policy, alerting destination, backup drill, real staging UAT and pilot sign-off remain open.
