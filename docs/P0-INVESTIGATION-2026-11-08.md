# P0 investigation — 2026-11-08

Status: **P0 not resolved; authenticated staging acceptance gate remains blocked.**

## Scope and source

Worktree: `staging-auth-fix`; branch `fix/codex-staging-auth-timeout`, based on integration commit `adcceae`. No merge to main, remote data migration, environment edit or deployment performed.

Read the complete handover/start instructions, README, PRD, implementation plan, technical design, staging runbook, frontend measurement plan, and all Release A–D UAT checklists before editing.

## Observations, not assumptions

- Render workspace/service match the handover. Service is free, Singapore, auto-deploy off, not suspended, linked to the staging integration branch. Last deployment is `dep-dbnmoajl550s73fl252g`, commit `551ebed7d0417ca097ed38bf151966f79bc29a0d`.
- Actual `healthCheckPath` is empty, unlike the intended `/health/ready` in the runbook. Do not treat a provider live label as HTTP/database readiness.
- Sequential GET `/health`, `/health/ready`, `/auth/me` without identity each timed out at approximately 45,291 / 45,014 / 45,007 ms from this runner.
- An independent curl `/health` probe resolved DNS in 248 ms, connected in 267 ms, completed TLS in 682 ms, then received no response bytes before 12,013 ms timeout.
- OPTIONS `/auth/me` with staging Origin, GET method and authorization header also received no bytes before its 15,007 ms timeout. Therefore CORS allow/deny response could not be established.
- Supabase public JWKS URL returned HTTP 200 in 1,131 ms from this runner. Vercel staging homepage returned HTTP 200.
- An unrelated control Render website also timed out with no bytes at 10,011 ms, alongside a repeated target probe at 10,010 ms. Runner-to-Render reachability or regional edge behavior remains a possible confounder; these probes cannot prove a service-specific outage.
- Runtime log retrieval returned startup/route registration at 2026-11-07 18:54 UTC and a reminder at 19:00 UTC; the queried current metrics interval returned no CPU/memory/instance samples. Events supplied no current failure reason. Empty observations do not establish zero requests or prove cold start.
- Backend clean `npm ci` failed reproducibly because the lockfile omitted declared schedule, Supabase and jose dependencies. This is a confirmed reproducibility defect, not established as the live timeout cause.

## Diagnostic conclusion

The failure currently reproduces on unauthenticated process liveness, outside JWT verification and PostgreSQL handling. This rules out a JWT/DB-only explanation for all observed requests, but does not locate the fault between Render edge, wakeup, routing and process availability. Historical prepared-statement errors cannot be assumed to explain this incident. No authenticated profile response or browser Network trace was available, so DB-backed role loading and browser CORS still require UAT.

## Reviewable changes

- Synchronize backend package-lock with declared dependencies for reproducible installs.
- Add server-generated request correlation ID and route-template/status/duration/disconnect diagnostics. No raw URL, query, body, account identity, caller-supplied ID or Authorization value is logged.
- Share a bounded authenticated request helper between dashboard and learning. Preserve bearer JWT and server-derived roles; expose only HTTP status/correlation on upstream errors, never raw response text. No automatic mutation retry or identity cache.
- Learning now handles rejected session reads, bounds API waits to the existing 25-second policy, verifies profile before requesting courses, and retries the profile when the user presses reload after initial failure. This fixes infinite loading behavior but is not a root-cause fix.
- Add regression tests for headers/mutations, sanitized errors, cancellation, safe logs and disconnect semantics.

## Verification

- Root `npm ci --no-audit --no-fund`: passed.
- Root `npm run build`: passed, includes TypeScript/build lint stage, all 8 application routes generated.
- Backend initial `npm ci`: failed with documented lockfile mismatch. `npm install --no-audit --no-fund` repaired lockfile.
- Repeated backend `npm ci --no-audit --no-fund` after repair: passed (555 packages); Prisma generation and Nest build passed again on this clean install.
- Backend Prisma generate and Nest build: passed.
- Backend test suite: 44 passed (39 existing + 5 regressions). These do not certify live DB, Storage or browser UAT.
- Targeted ESLint for changed backend code and tests: passed without autofix.
- No browser interaction tests, valid authenticated request timings, live cross-role negatives, upload/download sample or pilot measurement claimed.

## Next gate

### Follow-up: login button remains processing for two minutes

The user's new screenshot shows the login form still processing, rather than the session-detected profile screen. This is an additional pre-profile stall, not proof that Render caused the password sign-in stall. Public deployed bundles reference the intended Supabase and Render origins. A credential-free Auth settings probe using the deployed public publishable key returned 200 in 354 ms; unauthenticated Auth health returned 401 in 534 ms (no API key supplied). Render liveness again timed out at 12,009 ms. These are runner measurements, not a capture of the user's browser password request.

The current login handler awaited Supabase indefinitely, and shared one busy flag with later API work. Added separate auth busy state, a 15-second Auth-only fetch/body deadline that aborts the network operation, and a 20-second SDK-operation deadline covering non-network stalls. Session initialization on learn/dashboard is also bounded. Timeout does not imply bad credentials or clear an existing session; users reload to reconcile session state before retrying. Sign-up is never automatically repeated, and private evidence uploads are not subject to this Auth deadline. No locks are bypassed and no identity/role is fabricated.

Five additional regressions cover stalled transport, stalled response body, error/header preservation, storage isolation and stalled SDK operations. Full suite: 49 passed. Authenticated browser success and underlying live root cause remain unverified.

Obtain an authorized non-sensitive staging test session through interactive login (never paste JWT/password). Inspect browser requests alongside new diagnostics after an explicitly staging-only deployment of a reviewed commit. Recheck Render readiness/wakeup and health-check configuration. Measure at least 3–5 warm authenticated requests and a cold request if feasible, then require both dashboard and learn to populate DB-backed identity/data. P1–P5 remain gated on this result.

Rollback for these code changes: use the prior application commit; no schema rollback is needed. Do not alter production or paid plans.
