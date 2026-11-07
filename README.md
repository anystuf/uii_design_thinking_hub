# UII Design Thinking Hub

**From ideas to impact.** A four-pillar innovation ecosystem with a working evidence-centered Design Thinking learning MVP (Next.js + NestJS + Supabase PostgreSQL).

## Four strategic pillars

| Pillar | Scope | Current phase |
| --- | --- | --- |
| Training & Education | Courses, lessons, enrollment and progress | Staging MVP / UAT |
| Innovation Lab | Challenge, teams, non-linear five modes, evidence and review | Staging MVP / UAT |
| Incubation Program | Ideation, Problem–Solution Fit, Product–Customer Fit, Go-to-Market & Growth | Future roadmap |
| Work with UII | Academic, industry and ecosystem partnerships | Future roadmap |

Planned pillars are strategic direction, **not a claim that those services are live**.

## Routes and navigation

- `/` — **UII public homepage** showing all four pillars and the roadmap. No fake Admin selector.
- `/dashboard` — **authenticated, role-aware learning dashboard** with live course, project, progress and notification summaries. User roles are server-derived from `GET /auth/me`.
- `/learn` — Learning Foundation (F01–F04): register/login, courses, lessons, enrollment, persisted progress.
- `/studio` — Design Studio (F05–F08): challenges, teams, taskboard, five modes and activities.
- `/evidence` — Evidence & Iteration (F09/F11/F12): private files, versioned evidence, immutable snapshots.
- `/review` — Assessment Studio (F13/F14), restricted to Lecturer and Admin.
- `/notifications` — Notification Center (F16): personal notices and reminders.

The earlier static concept remains in source as a design reference, but is **no longer mounted** as the live homepage. The browser does not set application roles; the backend checks authorization.

## Local development

1. Create a Supabase project; enable asymmetric RS256/ES256 JWT signing.
2. Copy `.env.example` to `.env.local`, setting `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL`.
3. Copy `backend/.env.example` to `backend/.env` and set database configuration and `SUPABASE_JWT_ISSUER`.
4. In `backend`, run `npm ci`, `npm run prisma:generate`, `npx prisma migrate deploy`, `npm run start:dev`.
5. In the repository root, run `npm ci` and `npm run dev`.
6. Open `http://localhost:3000` for the public homepage or `/learn` to sign in. The personal workspace is at `/dashboard`.
7. New registrations receive the Student role. Lecturer/Admin provisioning must be done by a trusted operator, not browser UI.

## Design and delivery

The five Stanford d.school modes are **non-linear**. Private evidence and immutable submission and rubric versions must never be replaced by demo state. The Build → Measure → Learn → Improve loop governs product improvement through pilot UAT and evidence.

- `docs/PRD-SUMMARY.md`: 14 selected MVP features.
- `docs/MVP-IMPLEMENTATION.md`: release scope and acceptance gates.
- `docs/TECHNICAL-DESIGN.md`: architecture and security model.
- `docs/FRONTEND-BUILD-MEASURE-LEARN.md`: public/private IA, pilot hypotheses and UX metrics.
- `docs/RELEASE-A-UAT.md` through `docs/RELEASE-D-UAT.md`: scripted acceptance tests.
- `docs/STAGING-DEPLOYMENT.md`: staging-specific infrastructure runbook.

## Release status

Releases A–D code is deployed in the dedicated staging environment, but **full security, storage and end-to-end UAT remains pending**. Staging readiness and production approval are not synonymous. Do not merge the staging branch to main until UII acceptance gates and pilot sign-off are complete.
