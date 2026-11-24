# UII Design Thinking Hub — consolidated release candidate (21 Nov 2026)

Status: **PREVIEW / RELEASE CANDIDATE — NOT PRODUCTION READY**.
Canonical feature source: `feat/guided-dschool-learning-path-20261121`.
Intended eventual merge target: `main`. Do not confuse a Vercel READY build with
a verified distributed application deployment.

## Scope retained in this release candidate

- Homepage-inspired learning workspace, role-aware Dashboard and Course Player.
- Five non-linear Design Thinking modes with prompts, tools, activities and learning
  canvases; Learn → Practice → Apply and a student Focus Mode.
- XP from verified LMS progress, never from fake/staged records.
- Quizzes, written/project practice, grading/review and lesson authoring.
- **Content Console** `/console` for server-authorized lecturer/admin course metadata, lesson durations, video links, publication and in-app announcements.
- **Project showcase approval** after an approved rubric-reviewed submission, distinct from the owner's subsequent opt-in Community publication.
- Design Studio with group membership, projects, evidence, feedback and iteration.
- At least two explicitly labeled **demo** student teams illustrating five stages.
- Private group discussion and collaboration; community project showcase.
- Internal Quora-style questions, topical search/filter, answers, voting and
  accepted answers (**requires new backend and database migration**).
- UII AI guide for features and pedagogy, with truthful role, pilot and API
  limitations. Auth signup follow-up, confirmation and resend UX.

## Verified regression and integration evidence

- Feature branch GitHub CI passed frontend, backend and responsive on
  2026-11-21 at commit `cdc6fa2` (3/3 jobs). Subsequent improvements need new CI.
- Vercel preview READY is **frontend build success only**.
- `GET /community/questions` is implemented in source on this branch, but the
  live Render staging service was observed on commit `f6d566b` from the legacy
  branch `chore/mvp-staging-readiness-20261106`, with manual deployments only.
- The live staging Supabase `Post` table still had a non-nullable `projectId`
  and no `title`, `topic` or `acceptedCommentId` columns at investigation.
- The live service therefore responds 404 to the new route. Without the migration,
  even deploying the new API code would not restore functionality.
- `scripts/staging-api-smoke.mjs` now checks an unauthenticated protected Q&A
  endpoint for **401**. **404 = deployed API too old**. It is intentionally a
  *post-deployment* gate, not a local unit-test assertion of staging readiness.

## Release gates before changing the default branch or production

1. **Database:** review and apply only
   `backend/prisma/migrations/202611210001_community_questions/migration.sql`
   to the intended staging project. Synchronize Prisma migration history, run
   `prisma migrate status` and verify all new columns. Preserve backups.
2. **Backend:** explicitly select/approve the correct Render workspace; update
   service `usi-design-thinking-api-staging` source to the same reviewed SHA
   as the feature branch. Do not assume `render.yaml` changes update a manually
   configured service. Deploy manually and verify `/health/ready`.
3. **API contract:** run the manual GitHub
   `Staging API compatibility smoke` workflow. Protected
   `GET /community/questions` must return **401 without authentication**
   (not 404). With real test credentials, signed-in users must receive 200
   and be able to create/read an answer; non-members must remain denied.
4. **UX/UAT:** verify two student accounts, one lecturer, one administrator,
   demo-vs-real boundaries, course-to-project links, community moderation and
   private evidence boundaries. Test email signup/sign-in and Focus Mode on phone.
5. **Release:** review CI against the *final* SHA, compare Vercel Preview to
   staging, promote only the tested artifact; obtain pilot acceptance and
   merge the canonical branch to `main` via reviewed PR. Production Vercel
   runs from a separate project: treat `main` merge as a possible release.
6. **Rollback:** keep last-known-good Vercel/Render deployments. The schema
   migration is additive; do not drop user content as an automatic rollback.

## Change control and draft policy

- ONE canonical release candidate (this branch), ONE main-target release PR.
- Hotfix `fix/signup-feedback-20261121` is maintenance of stable staging,
  not a competing source of truth. The canonical branch includes its fixes.
- Historical branches are retained for audit/rollback, not deployed as products.
- Vercel hash URLs are immutable preview artifacts. The alias
  `usi-design-thinking-web-staging.vercel.app` is a *mutable pointer* and
  must always be confirmed by checking its deployment ID and Git SHA.
- Version labels must distinguish: SOURCE VERIFIED, BUILD READY, API READY,
  DATABASE MIGRATED, AUTHENTICATED UAT and PRODUCTION RELEASED.
