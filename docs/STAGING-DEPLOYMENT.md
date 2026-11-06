# USI Design Thinking Hub — staging deployment runbook

**Scope:** Non-production staging for Next.js frontend + continuously running NestJS API, backed by Supabase Singapore project `dpapvhvceuoegztxfuuu`.

**Current state (2026-11-06):** Four A–D SQL migrations have been applied on the project by the Supabase migration tool; the exact migration file SHA-256 checksums have also been recorded as completed in Prisma's `public._prisma_migrations` table. App data has **not** been seeded. Bucket `design-evidence` is private and has 50 MB / six MIME restrictions.

The Render Blueprint (`render.yaml`) is only **configuration**. Committing it does not create or deploy paid infrastructure. It pins a temporary staging branch, disables automatic deploys, and specifies the **paid Starter** web-service plan; confirm pricing before provisioning.

## Deployment gates

1. Review and test GitHub PRs A (#1), B (#5), C (#6), D (#7), and this infrastructure PR. Do not merge to `main` or deploy production before real-user UAT. Check GitHub Actions for latest passing head commit.
2. Provision a **continuously running** NestJS service in Singapore. The Release D hourly in-process deadline notifications do not execute when a free web instance is asleep.
3. Add all secret environment variables **in the hosting dashboard**, never commit or paste them into chat. Obtain the exact database URLs from Supabase Dashboard → Connect (pooler); prefer the session pooler for a persistent Node server and for Prisma migrations if direct IPv6 is unavailable. Confirm TLS and percent-encode special characters in passwords.
4. Make sure the Render service references this staging branch; configure a Vercel Next.js project to deploy the same reviewed staging branch, not `main`. Configure Vercel with a real backend origin; the app defaults to `localhost:4000` when `NEXT_PUBLIC_API_URL` is unset.
5. In Supabase Authentication → URL Configuration, set the staging Site URL and allowed redirect URL(s) to the *actual* HTTPS Vercel hostname. Configure the Render `FRONTEND_ORIGIN` to that exact frontend origin (no trailing path). Restart/redeploy after environment changes.
6. Verify staging endpoints, then create real Supabase Auth accounts for one lecturer and at least two students. Provision lecturer role by a trusted admin only after their first login, never via browser-editable metadata. Complete Release A–D UAT checklists. No demo seed is appropriate for staging because its fixed User IDs do not correspond to real Supabase Auth user IDs.

## Backend — Render Blueprint

Repository root: `render.yaml`; service root: `backend`; region: `singapore`.

Build: `npm install --no-audit --no-fund && npm run prisma:generate && npm run build`.

Pre-deploy: `npx prisma migrate deploy`. Prisma migration history already contains four completed source-file checksums. If a migration mismatch appears, **stop** and inspect the migration history; do not use `prisma migrate reset` on this remote database.

Start: `npm run start:prod`. Health probe: `/health`.

| Environment variable | Source | Secret? |
|---|---|---|
| `DATABASE_URL` | Supabase Connect: persistent application pooler URL | **Yes** |
| `DIRECT_URL` | Supabase Connect: direct URL or session pooler for Prisma | **Yes** |
| `SUPABASE_SECRET_KEY` | Supabase API Keys: `sb_secret_...` | **Yes — backend only** |
| `FRONTEND_ORIGIN` | Actual Vercel staging origin, e.g. `https://<actual-domain>.vercel.app` | No |
| `SUPABASE_URL` | `https://dpapvhvceuoegztxfuuu.supabase.co` | No |
| `SUPABASE_JWT_ISSUER` | `https://dpapvhvceuoegztxfuuu.supabase.co/auth/v1` | No |
| `EVIDENCE_BUCKET` | `design-evidence` | No |

`NODE_ENV=production` is provided by Blueprint; Render sets the runtime `PORT`. Do not put secrets in `NEXT_PUBLIC_*` variables.

**Billing:** Render Starter is a paid service (required here for the continuously running hourly notification scheduler). Rendering `render.yaml` in the repository does not authorize provisioning or charges.

## Frontend — Vercel

Create a separate Vercel project from GitHub repository `anystuf/uii_design_thinking_hub`, choose the staging branch, framework **Next.js**, root directory **repository root**. Do not assume a project name equals its final Vercel hostname; copy the actual deployment URL.

| Environment variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://dpapvhvceuoegztxfuuu.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Existing `sb_publishable_...` from Supabase API Keys |
| `NEXT_PUBLIC_API_URL` | Actual Render HTTPS backend origin, no trailing slash |

These browser variables are compiled into the Next.js bundle at build time; trigger a fresh Vercel deployment after changing the API URL.

## Smoke testing

Use Node.js 22+ on a trusted machine (no passwords required):

```sh
USI_API_URL=https://<actual-render-api> USI_WEB_URL=https://<actual-vercel-site> node scripts/staging-smoke.mjs
```

Checks: `GET /health` returns 200 + `status=ok`; unauthorized `GET /auth/me` returns 401; the five frontend route shells return HTTP 200. Passing these smoke checks does **not** prove Auth/Storage/DB or the 14 functional groups work; run role-based UAT and a real signed file upload/download separately.

## Security and go-live gates

- All 34 application tables have RLS enabled **without public policies**. Direct Supabase browser Data API access is intentionally denied; NestJS authorization is the approved API boundary.
- The Supabase Security Advisor reports `rls_enabled_no_policy` as informational for these protected tables; this is expected, not a reason to grant public table access.
- RLS is not a replacement for strict backend resource-level authorization, because backend database credentials are privileged.
- Enable backups and monitor Supabase/Postgres usage; confirm data retention and privacy policy before pilot with real student documents.
- Confirm Vercel domain, Render API health and DB access, JWT sign-in, course enrollment, challenge workflow, private evidence, immutable submissions, lecturer grading and private notifications with real users.
- Keep Draft PRs open until pilot acceptance. Never confuse the mock home-page metrics with persisted real user data.
