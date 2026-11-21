# Release A — UAT checklist

## Setup

- Configure Supabase Auth with asymmetric JWT signing keys.
- Set root .env.local and backend .env per example files.
- Install both frontend and backend dependencies, generate Prisma client and apply migrations.
- Create test Student and Lecturer accounts through Supabase.
- First log in with lecturer account, then grant LECTURER in User database by trusted admin.
- Configure FRONTEND_ORIGIN to match the site. Never expose service-role keys.

## Scripted acceptance tests

- [ ] UAT-A01: Anonymous GET /courses returns 401.
- [ ] UAT-A02: Forged x-user-role: ADMIN does not confer role; without bearer token returns 401.
- [ ] UAT-A03: Student cannot create or update courses (403).
- [ ] UAT-A04: Lecturer creates a DRAFT course, sees it privately.
- [ ] UAT-A05: Lecturer publishes course and student sees it in catalog.
- [ ] UAT-A06: Another lecturer cannot update an unowned course (403).
- [ ] UAT-A07: Lecturer creates a DRAFT lesson; student cannot read it.
- [ ] UAT-A08: Lecturer publishes lesson; student cannot read course lessons without enrollment (403).
- [ ] UAT-A09: Student enrolls; a repeat enrollment does not create duplicate records.
- [ ] UAT-A10: Student reads published lessons and marks one completed.
- [ ] UAT-A11: After sign out and sign in from another browser, completion persists.
- [ ] UAT-A12: Progress aggregation denominator excludes unpublished lessons.
- [ ] UAT-A13: User cannot read arbitrary other user's profile.
- [ ] UAT-A14: No successful UI response for a failed API mutation.
- [ ] UAT-A15: Unexpected CORS origin is rejected.
- [ ] UAT-A16: Missing/expired/incorrect-audience JWT is rejected.
- [ ] UAT-A17: Credential and secret files are not checked in.
- [ ] UAT-A18: Production build, Prisma validation and migrations pass on clean install.

## Release decision

Status remains PENDING until all checks complete and a lecturer/student pilot
is signed off. Automated unit and integration tests should be added before merge.
