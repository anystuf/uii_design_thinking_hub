# UII Design Thinking Hub — Authentication recovery gate (24 Nov 2026)

Status: SOURCE FIX IN CANDIDATE BRANCH; LIVE EMAIL AUTH NOT YET VERIFIED.
Canonical branch: feat/guided-dschool-learning-path-20261121.
Change control: keep PR #20 draft; never merge into main or import classroom data until all P0 gates pass.

## Verified source state

- The actual login/registration experience is /learn (LearningAuthForm).
- /login previously had no App Router page; a compatibility page redirects /login to /learn.
- e2e/login-compat.spec.ts covers the legacy link without duplicating authentication logic.
- lib/auth-redirect.ts chooses the named UII staging host for preview-origin confirmations and preserves local development URLs.
- Supabase browser client uses supabase-js implicit client auth with detectSessionInUrl, not an SSR code-exchange route. Do not configure a /auth/callback or /auth/confirm URL unless that route is first implemented and tested.
- Signed-in permissions are determined by backend roles, not by user-selected signup metadata.
- The repository runbook identifies dpapvhvceuoegztxfuuu as the UII **staging LMS** Supabase project. The separately supplied aignaxmirbbnfuutvvdg project currently identifies as ATH_Research and must not receive UII LMS migrations.
- A connected Supabase account with authorized access verified dpapvhvceuoegztxfuuu as ACTIVE_HEALTHY. Its public schema has 37 tables with RLS enabled. The Prisma history contains five completed migrations through 202611200001_lesson_practice; 202611210001_community_questions is not applied. The Post table still requires projectId and lacks title, topic and acceptedCommentId. These checks were read-only; no schema or data writes were performed.

## Required Supabase operator configuration — after verifying the project ID

1. Open **Authentication > URL Configuration** for the UII staging LMS project, not for ATH_Research.
2. Set the Site URL to the approved UII staging origin: https://uii-design-thinking-hub-staging.vercel.app
3. Add exact allowed redirect URL https://uii-design-thinking-hub-staging.vercel.app/learn. Add other specific UII paths only if a real flow uses them. Do not rely on a localhost default.
4. Inspect the Confirm signup email template and ensure its link honors redirectTo (the standard Supabase ConfirmationURL template typically does; custom templates using SiteURL can override the redirect behavior). Do not include personal data in screenshots or issue comments.
5. Check the frontend's NEXT_PUBLIC_SUPABASE_URL is the correct UII LMS project URL and its browser credential is only a publishable/anon key. Keep service-role and database credentials server-side.
6. If templates were customized to call an /auth/confirm route, stop: that route is not part of the current client-side implementation and needs a reviewed code+test change first.
7. Test on a dedicated fresh UII test account: signup -> confirmation link -> public UII origin /learn -> authenticated session -> dashboard -> sign out. Confirm link never targets localhost, and verify both desktop and mobile.
8. Verify resend, rate limits, OAuth (only if enabled), protected routes and Student/Lecturer/Admin authorization. Do not grant elevated roles from editable user metadata.
9. Collect only non-secret evidence: tested deployment SHA, expected origin/path, test run link, HTTP result, reviewer and acceptance timestamp. Never log confirmation tokens, session cookies, passwords or student identities.

## Backend and data compatibility gate

- Render workspace/service must be explicitly confirmed by the operator before any service selection or deployment.
- Identify Render build SHA, API origin and current health/ready; compare against the candidate SHA.
- Review the UII staging LMS schema and Prisma migration history before applying the community questions migration.
- Only after backup and review: deploy a compatible Render API; GET /community/questions without a bearer token must return 401, not 404. An authorized UAT user must be able to read and write within its access scope; cross-team access must remain denied.
- Validate Course Console writes, announcements, private evidence and project approvals against the same DB and API versions.
- Until that gate passes, do not synchronize the stable staging alias, merge main, or import the 50-person classroom roster.

## Release evidence to fill after authenticated UAT

| Gate | Result | Evidence |
| --- | --- | --- |
| Source branch and pull request | Candidate branch; PR #20 Draft | GitHub |
| Legacy /login link | Implemented in source | app/login/page.tsx; e2e/login-compat.spec.ts |
| Frontend CI at final SHA | Pending | GitHub Actions run URL |
| Supabase UII LMS connection | VERIFIED: read-only, ACTIVE_HEALTHY | Project ref dpapvhvceuoegztxfuuu |
| Supabase Site URL and email template | NOT VERIFIED | Operator check |
| Fresh signup/confirm/session E2E | NOT VERIFIED | Restricted UAT log |
| Render version and readiness | BLOCKED: workspace confirmation | Deploy SHA and health/ready |
| Database migration compatibility | Q&A migration MISSING; deployment BLOCKED | Prisma history and information_schema read-only review |
| Stable staging promotion | NOT PERFORMED | Alias mapping |
| Real classroom import | NOT PERFORMED | Private, approved dry-run only |

Security: public demo content must remain entirely synthetic, clearly labeled DEMO and must never persist LMS/student records.
