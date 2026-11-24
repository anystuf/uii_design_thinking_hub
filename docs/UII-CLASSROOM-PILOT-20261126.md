# UII Design Thinking Hub — Classroom pilot runbook
**Pilot date:** 26 November 2026 (Vietnam). **Environment:** Stable Staging.
**Status:** This checklist is for acceptance. A successful Next.js build or anonymous HTTP check is **not** proof that the real classroom loop works.

## Scope and safety
- First acceptance run: one verified lecturer, two **dedicated test student** accounts belonging to separate synthetic groups, and one administrator. Real students' names, email addresses, interview notes and roster must never enter a public demo, GitHub commit, screenshots or test artifacts.
- Use existing roles and authorization on the UII Supabase project only. Do not provision accounts by inserting into Supabase Auth tables or self-assigning lecturer/admin roles.
- No class-roster import and no Gallery Walk publication before authorization, consent and teacher approval are verified.
- No unrelated Supabase projects, no production deployment and no merge to main.

## Release identity
- Canonical frontend: https://uii-design-thinking-hub-staging.vercel.app
- Pilot entry: /classroom (shown only after login); lecturer: /studio and /review; student: /studio and /evidence.
- API staging origin: https://usi-design-thinking-api-staging.onrender.com (legacy hostname, UII service).
- Record GitHub HEAD, Vercel deployment ID, backend Render SHA, Prisma migration names and CI run ID in the operator release record. Inspect the specific Render workspace/service before touching its deployments.

## 0 — Read-only readiness check
Set two verified UII origins and run npm run pilot:check:

    E2E_STAGING_FRONTEND_ORIGIN=https://uii-design-thinking-hub-staging.vercel.app \
    E2E_STAGING_API_ORIGIN=https://usi-design-thinking-api-staging.onrender.com \
    npm run pilot:check

PASS means: frontend routes render, database-ready signal works, and anonymous calls to protected backend endpoints receive 401. It is not authenticated acceptance.

## 1 — Prepare pilot classroom with test accounts
1. Verify sign-up, email confirmation, sign-in, password recovery and persistent session from a fresh test email. Role comes from the authenticated backend, never from the signup form.
2. Lecturer opens /classroom, then /console or /studio to choose/publish the course, one Design Challenge and assigned activity template. Do not replace existing classroom content if used by a real course.
3. Lecturer opens /review and publishes a **Project rubric** only after checking the 5 criteria in the classroom brief: Problem 30%, Solution 30%, Creativity 15%, Presentation 10%, Q&A 15%. Course assessment is separate: Discussion 20%, Mid-term quiz/reflection 30%, Poster Presentation 30%, Executive Report 20%.
4. Student A and Student B enroll with independent test accounts, each joins a different synthetic team. Confirm that outsider B cannot read A's project, evidence or file download.
5. Agree on an activity that produces a safe, synthetic evidence file or Drive link (no real interview PII). Do not fabricate completion or assessment.

## 2 — Teacher/student acceptance trace (a single real loop)
| Actor | Action | Evidence of PASS |
|---|---|---|
| Student A | Open /classroom → project → assigned activity | Only authorized project appears; next action is accurate |
| Student A | Complete activity, then create versioned evidence in /evidence | Real activity and evidence version persisted, file/link private |
| Student A | Submit a snapshot of selected evidence versions | Snapshot has immutable submitted version and SUBMITTED state |
| Lecturer | See snapshot on /review; publish rubric-based REVISION_REQUESTED feedback | Student receives feedback; original snapshot remains unchanged |
| Student A | Revise evidence, submit a new snapshot | New version and snapshot appear without overwriting the original |
| Lecturer | Review again and approve | Latest snapshot APPROVED; student notified |
| Student B | Attempt to view/edit A's private evidence, snapshot, upload or notice | 403/404, never another team's PII |

## 3 — Run authenticated UAT (only after environment approval)
Use .github/workflows/staging-uat.yml and e2e-staging/learning-journey.spec.ts.
- GitHub **staging-uat** environment must provide both reviewed origin variables and dedicated UII test-user secrets for STUDENT, STUDENT_B, LECTURER and ADMIN. Never paste secrets into the issue tracker or public chat.
- The workflow executes read-only preflight **before** real authenticated writes.
- The test creates synthetic records and uploads synthetic bytes. It writes to staging: run only after confirming a database backup and cleanup owner. It is not a production test.
- Capture non-sensitive counts, pass/fail by route, elapsed time, and explicit lecturer sign-off. Do not store browser auth tokens/traces, roster or signed download URLs in artifacts.

## 4 — Go/no-go for tomorrow
**Pilot GO** only when Auth email is tested end-to-end, API/DB SHA and migration parity is confirmed, both test students' access boundaries pass, and the full submission → revision → approval loop is observed with writes. A small pilot is **not** a 50-person load test.
**NO GO for class-wide rollout** if any of these fail, if Render is unverified, or if API errors prevent reliable work. Use a lecturer-supervised demonstration for a small group; do not invite the full roster.
If a frontend release regresses, reassign Stable Staging alias to the recorded last known-good deployment; changing an alias does not roll back database changes.

## 5 — Privacy and classroom operations
- Student roster is private. Teacher must validate group membership; **never infer membership** from blank spreadsheet cells.
- Project evidence is private by default; Gallery Walk requires opt-in, version-scoped review and redaction of interview identifiers.
- Monitor API error rate, time-to-first-response after Render cold start, DB pool utilization and concurrent student access before scaling above the pilot.
- Classroom launch is accepted by the lecturer, not by mocked CI alone.
