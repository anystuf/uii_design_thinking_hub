# USI Design Thinking Hub — API (Release A)

NestJS 10 + Prisma + PostgreSQL backend. The MVP implementation is being delivered incrementally.

## Configure

1. Set Supabase Auth to use an asymmetric JWT signing key (RS256 or ES256).
2. Copy .env.example to .env and configure DATABASE_URL, DIRECT_URL, FRONTEND_ORIGIN, and SUPABASE_JWT_ISSUER.
3. Install dependencies: npm install
4. Run npm run prisma:generate and npx prisma migrate deploy.
5. Run npm run start:dev.

The frontend requires NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and NEXT_PUBLIC_API_URL in .env.local. Do not expose service-role keys in the browser.

## Security and provisioning

All protected API routes require Authorization: Bearer <Supabase access token>.
GET /auth/me returns the signed-in user and the app role from PostgreSQL.
New identities are provisioned with STUDENT role; token role/user_metadata never
grants LECTURER or ADMIN permissions. Assign elevated roles only through an
authorized database/admin provisioning process, after first login:

    UPDATE "User" SET role = 'LECTURER' WHERE email = 'approved-lecturer@example.edu';

Review and restrict who can execute this SQL. Never expose it as public API.
The old x-user-id/x-user-role headers no longer authenticate requests.
The unused DevAuthGuard file is historical development code only.

## Release A endpoints

- GET /auth/me
- GET /courses; GET /courses/:id
- POST /courses; PUT /courses/:id; DELETE /courses/:id (role and owner restricted)
- GET /courses/my-enrollments (student)
- POST /courses/:id/enroll (student)
- GET /courses/:id/my-progress (student)
- GET /courses/:courseId/lessons; POST /courses/:courseId/lessons
- PUT /lessons/:id; DELETE /lessons/:id
- GET /lessons/:id/progress; PUT /lessons/:id/progress

New lessons start unpublished unless isPublished=true. Use PUT /lessons/:id
with {"isPublished":true} to publish; students require course enrollment
to access lesson content or change their progress.

GET /health remains available without a token.

## Delivery status

Release A is in code review; it is not considered production-ready until
installation, Prisma client generation, migrations, integration tests,
security review, and a real student/lecturer UAT flow have passed.
Design Studio, real file uploads, versioned immutable snapshots and rubric
assessment remain later releases in docs/MVP-IMPLEMENTATION.md.
