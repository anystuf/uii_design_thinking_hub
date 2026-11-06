# USI Hub — Staging deployment runbook

**Target:** Singapore Supabase project `dpapvhvceuoegztxfuuu`; Draft PRs #1 → #5 → #6 → #7 → this staging PR.
**Scope:** Staging only. Do not merge into `main` or assign a production domain before UAT.

## Confirmed infrastructure

- Supabase PostgreSQL 17 in Singapore: 34 application tables from Releases A–D; **no real users or pilot data have been seeded**.
- Bucket `design-evidence` exists, is private, and allows PDF, JPG, PNG, MP3, MP4, TXT up to 50,000,000 bytes.
- JWT current signing algorithm ECC P-256 / ES256 (as evidenced by Supabase Dashboard).
- The four existing Prisma SQL migrations were already applied using the connected Supabase migration runner.
  A matching `public._prisma_migrations` history has been baselined using SHA-256 checksums of the exact repository SQL files.
- All 34 application tables and the Prisma history table have RLS enabled, with no client Data API policies: **all application access is enforced in the NestJS backend**. Do not add blanket anonymous/authenticated policies. Review the Supabase Data API exposure settings too.
- A fresh deployment must verify `npx prisma migrate status` and `npx prisma migrate deploy` using the actual Render database connection before serving users. `migrate deploy` should report no pending migrations.
- Demo seed users from `backend/prisma/seed.ts` are **not Supabase Auth identities**. Do not run this seed in live staging.

## Step 1 — Render staging API

The root `render.yaml` Blueprint declares a **Free** service in **Singapore**, with automatic deploys **off** until the configuration is reviewed.

1. Connect Render and choose the intended workspace explicitly. For manual setup, create **Web Service**, repository `anystuf/uii_design_thinking_hub`, branch `chore/mvp-staging-readiness-20261106`, root directory `backend`, runtime Node, Singapore, Free.
2. Build command: `npm install --no-audit --no-fund && npm run prisma:generate && npm run build`.
   Render uses `NODE_ENV=production` and therefore `NPM_CONFIG_INCLUDE=dev` must be set during builds to install the Nest CLI and TypeScript tooling from `devDependencies`.
3. Start command: `npm run start:prod`. Health path: `/health/ready`.
4. Add environment variables **inside Render**, never in Git or this chat:

| Name | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Exact Supabase transaction-pooler URI (if compatible with Prisma); encoded password |
| `DIRECT_URL` | Supabase direct URI (IPv6-capable host) or session-pooler URI for migrations; encoded password |
| `FRONTEND_ORIGIN` | Exact frontend staging HTTPS origin, e.g. the issued Vercel domain; no wildcard |
| `SUPABASE_JWT_ISSUER` | `https://dpapvhvceuoegztxfuuu.supabase.co/auth/v1` |
| `SUPABASE_URL` | `https://dpapvhvceuoegztxfuuu.supabase.co` |
| `SUPABASE_SECRET_KEY` | Secret key from Supabase > Settings > API Keys; **server only** |
| `EVIDENCE_BUCKET` | `design-evidence` |

Obtain PostgreSQL connection strings from **Supabase > Connect**. Do not assume a fixed pooler hostname. On Render's IPv4-only runtime, the session pooler is often the safer `DIRECT_URL` choice; test connection and migrations before launch.

`/health` is process liveness. **`/health/ready` is database readiness** and returns HTTP 503 when database is unreachable; no credentials are returned.

Render Free instances can spin down after inactivity, so hourly in-process deadline reminders are **not reliable on Free**. Use Free strictly for development/UAT; upgrade to an always-on instance only after approving any paid plan.

## Step 2 — Vercel staging frontend

1. Create a new **Next.js** Vercel project linked to the same repository.
2. Deploy branch `chore/mvp-staging-readiness-20261106` as **Preview**, not Production.
3. Use repository **root directory `.`**. Build: `npm ci && npm run build` (Next.js build).
4. Set **Preview** environment variables:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://dpapvhvceuoegztxfuuu.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase **publishable** `sb_publishable_...` key (safe for browser) |
| `NEXT_PUBLIC_API_URL` | The real HTTPS origin of the Render staging API |

5. Copy Vercel Preview URL, set Render `FRONTEND_ORIGIN` to that exact origin and redeploy the API.
6. Supabase > Authentication > URL Configuration: add only the specific staging redirect URL(s) required by your Auth flow. Keep email/password provider settings appropriate for pilot users.
7. Protect staging with Vercel's deployment protection when available; keep test accounts non-sensitive.

**Never expose `SUPABASE_SECRET_KEY` or Postgres URLs through `NEXT_PUBLIC_*`.**

## Step 3 — Pre-UAT release gate

- Render `GET /health/ready` returns HTTP 200 after successful DB connectivity (not merely an application process).
- `npx prisma migrate status` shows four applied releases and no pending migration.
- Supabase Auth new student account logs into `/learn` and creates a matching PostgreSQL `User` row.
- Provision lecturer role by **trusted server-side admin operation** only; never by editable JWT user metadata.
- Lecturer creates a course, a challenge, a rubric; two students enroll, join a team, work in five modes, upload evidence, submit snapshots, receive review and notifications.
- Confirm cross-project / cross-team API access is denied, uploaded files remain private, revisions preserve old versions, and published rubric versions are immutable.
- Review logs, errors, database backup and retention policies; then UAT checklist in `docs/RELEASE-A-UAT.md` through `docs/RELEASE-D-UAT.md`.
- **Do not** merge stacked PRs or deploy production until critical journeys, security tests and pilot stakeholders pass.

## Rollback

Backend: Render rollback to previous green deployment; avoid destructive database migrations.
Frontend: Vercel promote last verified build/rollback only after confirming schema compatibility.
Database: preserve backups and migration history. No automated schema rollbacks.
