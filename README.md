# USI Design Thinking Hub

A Next.js + TypeScript visual Design Thinking learning prototype, plus a NestJS +
Prisma/PostgreSQL backend. The platform is being evolved into an evidence-centered
LMS and project studio.

## Two frontend experiences

- / : existing high-fidelity visual concept with sample data.
- /learn : **Release A live API vertical slice**, using real authentication,
  courses, lessons, enrollment and progress.

Do not confuse mock metrics shown in the visual concept with backend data.

## Local setup (Release A)

1. Create a Supabase project. Enable asymmetric JWT signing (RS256/ES256).
2. Copy .env.example to .env.local and fill in NEXT_PUBLIC_SUPABASE_URL,
   NEXT_PUBLIC_SUPABASE_ANON_KEY and NEXT_PUBLIC_API_URL.
3. Copy backend/.env.example to backend/.env and configure database and
   SUPABASE_JWT_ISSUER.
4. In backend: npm install; npm run prisma:generate;
   npx prisma migrate deploy; npm run start:dev.
5. In repo root: npm install; npm run dev.
6. Open http://localhost:3000/learn, sign up or sign in.
7. New users are STUDENT. Provision lecturers using a trusted database admin
   after their first login; see backend/README.md.

The root package-lock.json includes the Supabase client dependency; use npm ci
for reproducible frontend installation.

## Documentation

- docs/PRD-SUMMARY.md — 14 selected MVP features and requirements.
- docs/MVP-IMPLEMENTATION.md — release scope, backlog and gates.
- docs/TECHNICAL-DESIGN.md — architecture and API boundary.
- docs/RELEASE-A-UAT.md — release A checklist.
- backend/README.md — backend setup, authentication and endpoints.

## Delivery state

Release A code is a review candidate, not a certified production deployment.
Requires CI pass, full backend integration testing, live Supabase configuration,
and lecturer/student UAT. Releases B-D have not been implemented.
