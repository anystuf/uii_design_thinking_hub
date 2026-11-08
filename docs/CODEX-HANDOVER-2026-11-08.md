# CODEX HANDOVER — UII Design Thinking Hub

**Handover date:** 2026-11-08 (Asia/Ho_Chi_Minh)
**Owner-requested name:** **UII Design Thinking Hub** (NOT USI).
**Repository:** https://github.com/anystuf/uii_design_thinking_hub
**Current working branch:** \`chore/mvp-staging-readiness-20261106\`
**Scope:** Staging engineering, defect resolution, product/UX hardening, pilot UAT. **Do not merge into main, mutate production, or promote publicly without explicit approval.**
**Approach:** **Build → Measure → Learn → Improve**.

> This is an actionable continuation brief for Codex. Facts marked "observed" were read from current source, deployment metadata, logs, or user screenshots. Hypotheses must be tested. Never treat a running deployment as proof of fully working features.

## 0. Where to start (read these in order)

1. \`README.md\` — product structure and available routes.
2. \`docs/PRD-SUMMARY.md\` — 14 MVP functions selected from 46 user stories.
3. \`docs/MVP-IMPLEMENTATION.md\` — four releases A–D and hard acceptance gates.
4. \`docs/TECHNICAL-DESIGN.md\` — trust boundaries, RBAC, data model.
5. \`docs/STAGING-DEPLOYMENT.md\` — infrastructure and secrets guidance; **some steps describe the original desired Preview setup, while the actual staging Vercel project currently targets Production within a separate, staging-only project**.
6. \`docs/FRONTEND-BUILD-MEASURE-LEARN.md\` — public/private IA, hypotheses, and pilot measures.
7. \`docs/RELEASE-A-UAT.md\`, \`docs/RELEASE-B-UAT.md\`, \`docs/RELEASE-C-UAT.md\`, \`docs/RELEASE-D-UAT.md\` — acceptance test scripts.
8. \`components/live-hub-dashboard.tsx\`, \`components/uii-public-landing.tsx\`, \`app/learn/page.tsx\`, \`app/studio/page.tsx\`, \`app/evidence/page.tsx\`, \`app/review/page.tsx\`, \`app/notifications/page.tsx\`.
9. Backend: \`backend/src/modules/auth\`, \`backend/src/common/guards\`, \`backend/src/modules/courses\`, \`backend/src/modules/projects\`, \`backend/src/modules/studio-access\`, \`backend/src/modules/evidence\`, \`backend/src/modules/assessments\`, \`backend/src/database/prisma\`.

Treat all repository/documentation statements as working context; verify live claims against source, service status and tests.

## 1. Product vision and approved scope

**Vision:** Four-pillar, evidence-centered innovation ecosystem; first operational product is a Design Thinking Learning Hub.

| Pillar | Meaning | Phase |
| --- | --- | --- |
| Training & Education | Course, lesson, enrollment, progress | Staging MVP |
| Innovation Lab | Challenge, teams, five modes, activities, evidence, iteration | Staging MVP |
| Incubation Program | Ideation → Problem–Solution Fit → Product–Customer Fit → Go-to-Market & Growth | Future roadmap, NOT live |
| Work with UII | Academic/industry collaboration, partners, ecosystem | Future roadmap, NOT live |

**Design thinking modes**: Empathize, Define, Ideate, Prototype, Test. **They are non-linear and revisitable.** Distinguish these from the **product management loop**: Build → Measure → Learn → Improve.

**14-function MVP contract:**
- Release A: F01 auth/role access, F02 courses, F03 lessons/resources, F04 enrollment/progress.
- Release B: F05 challenges, F06 teams/tasks, F07 five-mode workspace, F08 activities/templates.
- Release C: F09 private evidence storage, F11 iteration/version history, F12 immutable versioned submissions.
- Release D: F13 lecturer review/feedback, F14 versioned rubrics/assessment, F16 user-specific notifications and deadlines.

**Canonical student journey:** sign in → enroll → learn → receive challenge → join team → practice across five modes → upload evidence → iterate → submit immutable version → receive version-specific review → revise → resubmit → approval.

**Constraints:** no fabricated metrics, fake success states, or mock data presented as live; backend is source of truth, not localStorage; challenge ≠ project; private files by default; immutable submitted snapshots and published rubric versions; roles/ownership checked by backend. AI Mentor, social feed, InnoGallery expansion, certificates, payments, public portfolios, real-time whiteboard and native mobile app are **outside current MVP**.

## 2. Actual architecture, access boundaries and routes

**Frontend:** Next.js 14, TypeScript, React, Tailwind on separate Vercel staging project.
- \`/\`: public 4-pillar UII homepage.
- \`/dashboard\`: authenticated Learning Hub with real API summaries and role-aware links.
- \`/learn\`: login/register + Learning Foundation.
- \`/studio\`: challenges, teams, tasks and Design Thinking modes.
- \`/evidence\`: private evidence/versions/iterations/submission snapshots.
- \`/review\`: Lecturer/Admin review and rubrics.
- \`/notifications\`: personal notices.

**Backend:** NestJS + Prisma + PostgreSQL via Supabase; deployed to Render. \`GET /auth/me\` verifies Supabase JWT and returns database-derived role; use \`JwtAuthGuard\`/\`RolesGuard\` plus resource-level checks. \`backend/src/main.ts\` configures CORS with exact comma-separated \`FRONTEND_ORIGIN\` values.

**Database:** Supabase Singapore, project ID \`dpapvhvceuoegztxfuuu\`. Four migrations and ~34 application tables applied (prior checks). Storage bucket \`design-evidence\` is private. Signing uses ES256. Treat actual RLS/policies/migration state as something to inspect, not assume. Do not execute demo seed against staging Supabase Auth.

**Operational identifiers** (legacy infrastructure names still contain "usi"; changing them is NOT required for product branding):
- GitHub repo: \`anystuf/uii_design_thinking_hub\`
- Staging branch: \`chore/mvp-staging-readiness-20261106\`
- Vercel staging project: \`usi-design-thinking-web-staging\`
- Vercel project ID: \`prj_UmeW6MHHoznWLTRgbDf3j6sN59qs\`
- Vercel team ID: \`team_8VlQA0p7QKZKtjfwVb40Npnm\`
- Canonical staging web: https://usi-design-thinking-web-staging.vercel.app
- Render staging service: \`usi-design-thinking-api-staging\`
- Render service ID: \`srv-dbmq6f49v7es73afgsug\`
- Render workspace ID: \`tea-dafeft0n74is739lqmpg\`
- Render API: https://usi-design-thinking-api-staging.onrender.com
- Render health: https://usi-design-thinking-api-staging.onrender.com/health/ready
- Render service currently uses free-tier Singapore region; automatic backend deploy is OFF.
- Vercel has three critical NEXT_PUBLIC_* variables, targeted to the staging Vercel project's Production + Preview; deploys were made against **Production within the staging-only Vercel project**, not an independent real production platform.
- Known successful backend ready response from an earlier test: \`{"status":"ready","service":"usi-design-thinking-hub-backend","database":"connected"}\` — verify again now.
- Latest tested frontend code commit for timeout handling: \`d9aca01bf3346f61b3a9f62456432de1dc35f4b8\`; Vercel staging deployment \`dpl_95VdkvDFjao53JYUaa4GefLNwhUw\` had state READY on 2026-11-08. **This means build success only, NOT working API.**
- Render backend last known live deployment \`dep-dbnmoajl550s73fl252g\` (Nov 7 UTC), backend commit \`551ebed7d0417ca097ed38bf151966f79bc29a0d\`.
- Existing stacked draft PRs: #1, #5, #6, #7, #9; inspect before altering merge sequence.

**Credentials:** All secrets remain in Supabase/Render/Vercel. Never print tokens, database URLs with passwords, environment values marked secret, service-role keys, signed uploads, or personally identifying pilot information. Use connector tools/configured local environments. \`NEXT_PUBLIC_*\` variables must never include secrets.

## 3. Latest actual user observations — CRITICAL P0

User created a new student account successfully, previously confirmed login persistence after refresh/new tab, and logout/protected route behavior (basic manual tests). The earlier "Student can access Admin" report was traced to **a local-only visual prototype** on \`/\` with a role selector and localStorage, **not proof of backend RBAC failure**. That prototype was removed from the mounted homepage. Actual API-level RBAC still requires formal negative testing.

**2026-11-08 user screenshots from production-targeted Vercel staging:**
1. \`/dashboard\` shows **"Phiên đăng nhập đã được nhận"**, but API profile retrieval times out after **25 seconds**: **"API phản hồi quá chậm (25 giây). Máy chủ có thể đang khởi động. Hãy thử tải lại."**
2. \`/learn\` also shows **"LOADING ACCOUNT"**, "Xin chào, Learner", and courses "Đang tải..."; neither screen has loaded authenticated backend resources.
3. Frontend routes render and Supabase session is available; **backend identity is unverified and business data unavailable**.
4. The dashboard fix in \`components/live-hub-dashboard.tsx\` introduced a 25-second AbortController timeout, retry and differentiated "session detected" UI. **This surfaced the failure; it did not resolve the cause.**
5. Previous backend logs at **2026-11-07 18:19 UTC** had PostgreSQL error \`26000\`, \`prepared statement "s0"/"s4" does not exist\` through Prisma/Supabase transaction pooler; subsequent \`?pgbouncer=true\` config was discussed and user reported a previously failing action worked. **Do not assume this is still the cause.**
6. Latest Render inspection showed service \`Live\`, free plan, but no app/request logs in interval \`2026-11-08 08:00Z–10:47Z\`. **Absence of logs neither proves no requests nor proves a backend failure; request logging/visibility may be incomplete.**
7. Vercel function runtime errors were empty, which does **not** capture browser-initiated requests to an external Render origin.
8. CORS was previously a suspect because \`FRONTEND_ORIGIN\` had once been \`http://localhost:3000\`; the user updated it, but **verify actual current allowed origin**. CORS browser errors can appear as failed network fetch.

**P0 question to answer with evidence:** When a valid student session calls \`GET /auth/me\`, is the failure from DNS/TLS/network reachability, Render free cold-start, CORS/preflight, JWT JWKS verification, Prisma pooler, backend handler/database, or a frontend auth lifecycle race?

## 4. Execution plan for Codex — ordered and gated

### Phase 0 — Reproduce, observe, isolate P0
**Do this first; do not start a UI redesign.**

1. Read repository and code. Checkout branch \`chore/mvp-staging-readiness-20261106\`; create a **new fix branch from it** (e.g. \`fix/codex-staging-auth-timeout\`) if working with normal Git PRs; don't write to \`main\`.
2. Run local \`npm ci && npm run build\` at root and \`cd backend && npm ci && npm run prisma:generate && npm run build\`, plus relevant existing tests. Redact all environment output.
3. Verify API service \`GET /health\` and \`GET /health/ready\` from a non-auth browser/runner. Measure cold vs warm response; distinguish readiness 200/503 from network/timeout and capture timestamps.
4. Inspect browser DevTools Network/Console for \`GET /auth/me\` on \`/dashboard\` and \`/learn\`: URL, method, start/finish, status, CORS preflight, response headers, timing, failure reason. **Never export a trace with Authorization headers, JWTs, cookies, or personal data.** Ensure frontend \`NEXT_PUBLIC_API_URL\` points to correct Render service. Never log Bearer tokens.
5. Compare backend Render request/app logs in the same precise time interval, accounting for UTC vs Vietnam local time. If needed, add safe request-id/route/status/duration instrumentation **without bodies or authorization headers**, and deploy ONLY staging backend.
6. Inspect \`/auth/me\` controller/service, JWT guard and JWKS fetch, Prisma \`findUnique\`, database URL pooler mode, and connection timeout behaviors. Check known Postgres \`26000\` errors only if currently reproducible; no speculative credential edits.
7. Verify \`FRONTEND_ORIGIN\` matches exact Vercel origin, CORS allowed headers and OPTIONS behavior. Use tools that do not reveal secrets.
8. If free-tier cold start exceeds 25 s, design transparent health/warmup UX with bounded retries/backoff; **don't silently bypass auth or substitute cached identity**, and don't increase timeout indefinitely. If request hangs beyond expected cold start, fix source.
9. Establish observability and minimal diagnostics (correlation ID; sanitized errors). Fix the smallest root cause first, add regression test, build, deploy staging frontend/backend only as warranted. Record before/after median/p95 for 3–5 warm requests and at least one cold-start test if feasible.

**Exit gate P0**: On staging, authenticated \`GET /auth/me\` returns correct DB-backed role reliably, both \`/dashboard\` and \`/learn\` populate real account/data, and logout/session refresh continue working. If blocked by missing authorized account access, state exactly what is blocked and provide a non-secret step to complete.

### Phase 1 — Identity, RBAC, API boundaries (Release A)
- Student signup works, stays logged in after refresh and across tabs, logout invalidates, anonymous cannot retrieve protected data.
- Validate STUDENT vs LECTURER vs ADMIN roles from DB; **no role switching in client**.
- Negative tests: STUDENT POST \`/courses\`, GET admin user-management endpoints, GET \`/assessments/queue\` are denied; unauthenticated calls return 401; no cross-course/other-student access.
- Confirm correct error semantics 401/403/404/5xx; no silent success.
- Verify course creation/publish by lecturer, enrollment, published lesson visibility, durable progress across sessions/devices.
- Audit common auth dependencies for stale JWT/React effects/refresh races; centralized API handling where justified.

**Exit gate:** Release A UAT passes in a test matrix, with no privilege escalation.

### Phase 2 — Design Studio workflow (Release B)
- Test challenge/course relationship; multiple teams per challenge; invitations, eligibility and task assignment restrictions.
- Complete two mode-specific activities for a student team, switch among all five modes without losing drafts, lecturer views authorized work.
- Validate ownership and cross-team denial.
- Improve UX navigation and clear task completion without inventing data.

**Exit gate:** F05–F08 UAT passed with persisted activity data.

### Phase 3 — Evidence, versioning and submission durability (Release C)
- Confirm private Supabase Storage bucket, MIME/size/quota rules, signed upload and download authorization.
- Verify valid upload *bytes* persist and can be downloaded; **signed URL is not evidence of successful upload**.
- Confirm version history can reopen originals; never overwrite historical evidence.
- Atomic, immutable submission snapshots with monotonic version numbers and proper late-submission policy.
- Test two students/two projects for cross-team denial.

**Exit gate:** F09/F11/F12 UAT plus ≥99% valid upload/download success target (measured sample).

### Phase 4 — Reviews, rubrics, notifications (Release D)
- Lecturer review queue scoped to owned courses; admin access only as intended.
- Publish immutable rubric version with weighting, score a specific submission version, approve/request revision with meaningful feedback.
- Student receives private notifications and can resubmit a new version; scores are tied to immutable rubric/submission versions.
- Render Free background schedule caveat: hourly in-process reminder cron may not run when service sleeps. Replace with approved reliable scheduling only if needed for acceptance.
- Verify idempotency, deduplication and relevant race conditions.

**Exit gate:** F13/F14/F16 UAT and full student journey.

### Phase 5 — Public homepage/UX, performance and observability
- Maintain \`/\` public four-pillar architecture, \`/dashboard\` private role-aware workspace, and UII naming.
- Audit mobile responsive design, keyboard navigation, loading/empty/error/retry states, accessible labels, meaningful CTAs, and WCAG basics.
- Show available-vs-roadmap status accurately; no fake user counts, fabricated partnerships, business testimonials or unimplemented forms.
- Measure first-action friction, time to enroll, lesson completion, challenge engagement, and error rates with privacy-preserving instrumentation. Do not enable surveillance analytics without approval.
- Make smallest evidence-backed improvement, compare metrics, then iterate.

**Exit gate:** small pilot results logged and critical UX blockers closed.

### Phase 6 — Decision, documentation and possible future release
- Summarize each test with pass/fail/blocker, supporting evidence and exact scope.
- Targets: ≥95% critical journey pass, 100% traceable reviewed submissions, zero successful unauthorized access, ≥99% valid upload/download (measured, not assumed).
- Run build/test/security check; update docs/README/runbooks and known limitations; prepare PRs against staging integration branch.
- **Do NOT merge to main, enable a custom production domain, expose test user data, run destructive migrations, or approve production go-live without explicit user sign-off.**

## 5. Non-negotiable engineering/security rules

- **UII branding**, despite legacy \`usi-\` Vercel/Render service URL/IDs. Don't casually rename live infrastructure because CORS/Auth/links rely on it.
- No destructive operations or secrets retrieval/dumping; no sending connection strings, JWTs, API secret values, service-role keys or full request traces to chat.
- Do not invent success indicators. An app compiling or a deployment READY ≠ validated functionality.
- Client role checks improve usability only; backend guard + resource scoping are mandatory.
- Supabase JWT should be verified from the proper issuer/JWKS; role from trusted database.
- Database migrations should be additive/reviewed; prepare rollback plan before any schema change.
- Preserve private evidence and immutable snapshot/rubric/versioning contracts.
- Avoid blind rewrites of working components. Make reproducible, tested, reviewable diffs.
- Keep all external execution on staging branch and staging resources until explicitly authorized otherwise.
- On staging, verify relevant Git sha, region, Vercel target, Render running commit, frontend origin, and correct Supabase project.
- If additional permissions/credentials are required, explain the minimal specific access needed and await the user's action; do not ask to paste secrets.

## 6. Delivery format / Definition of Done for Codex

For **each milestone**, report:
1. **Diagnosis** — symptoms, reproduced request, observable root cause vs unproven hypotheses.
2. **Change** — files changed, links to commit/PR, migration or env differences (names only for secrets).
3. **Verification** — tests executed and output summary; manual staging journey; exact HTTP status and timings where applicable.
4. **Risk** — security impact, regression/rollback notes, untested gaps.
5. **Measure** — baseline and after result, even if unavailable with reason.
6. **Learn → Improve** — next prioritised action and measurable acceptance criterion.

**First requested outcome:** Fix the \`/auth/me\` profile-load timeout and get \`/dashboard\` and \`/learn\` to load verified account and course data within a reasonable bound, then report the actual cause and test results. Do not redesign until this is proven.

## 7. Current test status (as of handover)

| Test | Evidence | State |
| --- | --- | --- |
| Registration | User manually completed signup | Observed pass |
| Login across refresh and tabs | User reported successful | Observed pass at that time |
| Logout and protected route | User reported successful | Observed pass at that time |
| Actual admin RBAC negative tests | Demo UI issue diagnosed, backend guards inspected | NOT verified live |
| GET /auth/me reliability | Screenshots show 25-second timeout | BLOCKED / P0 |
| Learning Foundation loading | Screenshot stuck "LOADING ACCOUNT" | BLOCKED / P0 |
| Release B/C/D workflows | Code deployed, no complete authenticated UAT | NOT verified |
| Next.js build | Vercel latest staging deployment READY | Build pass only |

## 8. Open questions / technical debt worth validating

- Are all frontend API endpoints correct? E.g. verify \`GET /courses/my-enrollments\` and \`GET /courses/:id/my-progress\` routes exist and have expected shape. Mismatches may cause partial load even after profile works.
- Are React auth effects racing across page mounts or token refresh? Does \`getSession\` resolve and does \`onAuthStateChange\` trigger rerender correctly?
- Is CORS returning expected \`Access-Control-Allow-Origin\` to the stable staging domain?
- Are Render and Vercel timestamps correlated? No Render request entries were surfaced in the latest checked window.
- Does backend have request logging / error traces sufficient to isolate 25s hangs without leaking personal data?
- Is Prisma configured properly for transaction pooling, and are there lingering \`26000\` errors?
- Are deployment runbooks updated for actual staging environment choices rather than originally aspirational Preview target?
- Are there old \`USI\` names in backend service identifiers, old docs or assets? Rename *user-visible copy* with care; preserve legacy provider IDs.

## 9. Fast start commands

\`\`\`bash
git clone https://github.com/anystuf/uii_design_thinking_hub.git
cd uii_design_thinking_hub
git fetch origin
git checkout chore/mvp-staging-readiness-20261106
git pull --ff-only
# Prefer a reviewed fix branch off staging
git checkout -b fix/codex-staging-auth-timeout

npm ci
npm run build

cd backend
npm ci
npm run prisma:generate
npm run build
# Run repository tests per backend/package.json; inspect scripts first.
\`\`\`

Never run real Prisma migrations or seeded-data scripts against remote staging without inspecting DB state and obtaining approval for schema/data changes.

**Working direction:** **UII Design Thinking Hub — Build → Measure → Learn → Improve.** Ship evidence, not promises.
