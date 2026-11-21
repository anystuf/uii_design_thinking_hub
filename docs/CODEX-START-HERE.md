# Codex task — UII Design Thinking Hub

You are the lead full-stack engineer and QA owner for UII Design Thinking Hub.

Repository: https://github.com/anystuf/uii_design_thinking_hub
Integration branch: `chore/mvp-staging-readiness-20261106`.
Handover: `docs/CODEX-HANDOVER-2026-11-08.md`.

**Read the handover document in full first**, then `README.md`, `docs/PRD-SUMMARY.md`, `docs/MVP-IMPLEMENTATION.md`, `docs/TECHNICAL-DESIGN.md`, `docs/FRONTEND-BUILD-MEASURE-LEARN.md`, all Release A–D UAT docs, and the actual Next.js/NestJS code. Treat live status as something to verify, not assume.

## Mission

Build a reliable, evidence-centered **UII** Design Thinking Hub with public four-pillar ecosystem homepage and separate authenticated Learning Hub. Preserve the 14 selected MVP features and execute the plan as **Build → Measure → Learn → Improve**.

## Mandatory first task (P0)

The user can log in with Supabase, but both `/dashboard` and `/learn` fail to load verified profile and course data. `/dashboard` reports an API timeout after 25 seconds calling `GET /auth/me`. Reproduce and diagnose actual cause, then fix with the smallest safe, tested changes.

Check: correct Vercel API URL, Supabase session/token, CORS preflight, Render process readiness/cold start, API request arrival/logging, JWT/JWKS validation, Prisma pooler connection, Postgres prepared statement code 26000, timeout/error handling and React auth lifecycle. The 25-second UI timeout is not the root-cause fix.

Implement safe diagnostics with timestamps/route/request-id only, no credentials or JWTs. Run frontend/backend build/tests, compare timings, and perform authenticated manual staging UAT. Do not falsely report success.

## Continue after P0 gate

1. Release A: security and role-based authorization, enrollment and persistence.
2. Release B: challenges/teams/two activities, non-linear five-mode workspace.
3. Release C: private file bytes, version history, immutable snapshots.
4. Release D: lecturer rubric scoring, review/feedback, reminders.
5. Public UII ecosystem UX, role-based dashboard UX, accessibility and analytics plans.
6. Full UAT and pilot measurement. No production release without explicit approval.

## Constraints

- UII user-facing brand, NOT USI. Legacy staging infrastructure identifiers may still contain `usi` and should not be casually renamed.
- No new out-of-scope features, fake data, invented metrics or role switchers.
- No destructive DB changes, real-user data exports or disclosure of environment secrets.
- Keep changes on a new fix branch based on the staging integration branch; prepare PR for review, not main merge.
- Backend enforces resource authorization. Private evidence and immutable submission/rubric history stay protected.
- Report each milestone with: root cause, changed files, tests, deployed staging commit/URL, before/after measurement, residual risks and next action.
- Stop and ask for explicit authorization before production actions, migrations affecting live data, adding paid services, or access to unavailable secrets.

**Start now:** inspect the current staged deployment and investigate `/auth/me` timing. Don't spend the initial iteration redesigning the UI.
