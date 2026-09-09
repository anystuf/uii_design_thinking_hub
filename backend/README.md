# UII Design Thinking Learning Hub Backend

Dedicated NestJS backend for the UII Design Thinking Learning Hub.

## Stack

- NestJS
- PostgreSQL
- Prisma
- Microsoft Entra ID later
- SharePoint file storage later

## Local setup

Install dependencies:

```bash
npm install
```

Create `.env` from `.env.example`:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/uii_learning_hub?schema=public"
PORT=4000
NODE_ENV=development
MICROSOFT_TENANT_ID=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
SHAREPOINT_SITE_ID=
SHAREPOINT_DRIVE_ID=
JWT_SECRET=
```

Validate the Prisma schema:

```bash
npm run prisma:validate
```

Generate the Prisma client:

```bash
npm run prisma:generate
```

Run the backend:

```bash
npm run start:dev
```

Health check:

```bash
curl http://localhost:4000/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "uii-learning-hub-backend"
}
```

## Temporary development authentication

Sprint 2 uses a temporary local-only authentication guard. It does not verify Microsoft Entra ID tokens yet.

Protected routes read these headers:

```bash
x-user-id
x-user-email
x-user-name
x-user-role
```

Allowed roles:

```text
STUDENT
LECTURER
MENTOR
ADMIN
```

Student dev user:

```bash
curl -H "x-user-id: dev-user-1" -H "x-user-email: student@ueh.edu.vn" -H "x-user-name: Development Student" -H "x-user-role: STUDENT" http://localhost:4000/auth/dev-me
```

Current user:

```bash
curl -H "x-user-id: dev-user-1" -H "x-user-email: student@ueh.edu.vn" -H "x-user-name: Development Student" -H "x-user-role: STUDENT" http://localhost:4000/users/me
```

Student forbidden from user list:

```bash
curl -i -H "x-user-id: dev-user-1" -H "x-user-email: student@ueh.edu.vn" -H "x-user-name: Development Student" -H "x-user-role: STUDENT" http://localhost:4000/users
```

Admin allowed to list users:

```bash
curl -H "x-user-id: admin-1" -H "x-user-email: admin@ueh.edu.vn" -H "x-user-name: Development Admin" -H "x-user-role: ADMIN" http://localhost:4000/users
```

Replace this temporary guard with Microsoft Entra ID JWT verification before production.

## Sprint 1 scope

This scaffold includes:

- NestJS app structure
- PostgreSQL Prisma schema
- Environment config validation
- `GET /health`
- Health and database foundations

SharePoint uploads, assignments, evidence, portfolio, gallery, AI Mentor, analytics, community, notifications, rubrics, and ratings are outside Lean MVP Sprint 3.

## Sprint 2 scope

Sprint 2 adds:

- Users module foundation
- Auth module foundation
- Temporary development auth guard
- Role-based access control guard
- `@CurrentUser()` decorator
- `@Roles()` decorator
- `GET /auth/dev-me`
- `GET /users/me`
- `GET /users/:id`
- `GET /users` for `ADMIN` only

## Sprint 3 courses and learning studio

Sprint 3 keeps the temporary development auth guard and adds course, lesson, and enrollment foundations.

Apply the Sprint 3 database migration after configuring `DATABASE_URL`:

```bash
npx prisma migrate dev --name add_courses_lessons_enrollments
```

This creates a development migration, applies it to PostgreSQL, and regenerates the Prisma client. Commit the generated `prisma/migrations` directory with the code.

Create a published course as lecturer:

```bash
curl -X POST http://localhost:4000/courses \
  -H "Content-Type: application/json" \
  -H "x-user-id: lecturer-1" \
  -H "x-user-email: lecturer@ueh.edu.vn" \
  -H "x-user-name: Development Lecturer" \
  -H "x-user-role: LECTURER" \
  -d "{\"title\":\"Design Thinking Foundations\",\"slug\":\"design-thinking-foundations\",\"description\":\"Core studio course\",\"status\":\"PUBLISHED\",\"level\":\"Foundation\",\"sprintPhase\":\"FULL_SPRINT\"}"
```

Student cannot create courses:

```bash
curl -i -X POST http://localhost:4000/courses \
  -H "Content-Type: application/json" \
  -H "x-user-id: dev-user-1" \
  -H "x-user-email: student@ueh.edu.vn" \
  -H "x-user-name: Development Student" \
  -H "x-user-role: STUDENT" \
  -d "{\"title\":\"Student Course\",\"level\":\"Foundation\"}"
```

Admin can create courses:

```bash
curl -X POST http://localhost:4000/courses \
  -H "Content-Type: application/json" \
  -H "x-user-id: admin-1" \
  -H "x-user-email: admin@ueh.edu.vn" \
  -H "x-user-name: Development Admin" \
  -H "x-user-role: ADMIN" \
  -d "{\"title\":\"Prototype Lab\",\"description\":\"Prototype sprint course\",\"status\":\"PUBLISHED\",\"level\":\"Intermediate\",\"sprintPhase\":\"PROTOTYPE\"}"
```

Student can list published courses:

```bash
curl http://localhost:4000/courses \
  -H "x-user-id: dev-user-1" \
  -H "x-user-email: student@ueh.edu.vn" \
  -H "x-user-name: Development Student" \
  -H "x-user-role: STUDENT"
```

Student can enroll in a published course:

```bash
curl -X POST http://localhost:4000/courses/COURSE_ID/enroll \
  -H "x-user-id: dev-user-1" \
  -H "x-user-email: student@ueh.edu.vn" \
  -H "x-user-name: Development Student" \
  -H "x-user-role: STUDENT"
```

Create a lesson as the course lecturer or admin:

```bash
curl -X POST http://localhost:4000/courses/COURSE_ID/lessons \
  -H "Content-Type: application/json" \
  -H "x-user-id: lecturer-1" \
  -H "x-user-email: lecturer@ueh.edu.vn" \
  -H "x-user-name: Development Lecturer" \
  -H "x-user-role: LECTURER" \
  -d "{\"title\":\"Frame a How Might We Question\",\"description\":\"Turn evidence into a focused design challenge.\",\"orderIndex\":1,\"durationMinutes\":36,\"contentType\":\"VIDEO\"}"
```

List course lessons:

```bash
curl http://localhost:4000/courses/COURSE_ID/lessons \
  -H "x-user-id: dev-user-1" \
  -H "x-user-email: student@ueh.edu.vn" \
  -H "x-user-name: Development Student" \
  -H "x-user-role: STUDENT"
```

## Sprint 4 design thinking workspace

Apply the Sprint 4 migration after configuring `DATABASE_URL`:

```bash
npx prisma migrate dev --name add_design_thinking_workspace
```

Create a project as an enrolled student. The response includes the five automatically created sprint stages; keep the relevant stage `id` for evidence creation.

```bash
curl -X POST http://localhost:4000/projects \
  -H "Content-Type: application/json" \
  -H "x-user-id: dev-user-1" \
  -H "x-user-email: student@ueh.edu.vn" \
  -H "x-user-name: Development Student" \
  -H "x-user-role: STUDENT" \
  -d "{\"courseId\":\"COURSE_ID\",\"title\":\"Campus Mobility Challenge\",\"description\":\"Improve the student commute experience.\"}"
```

Add evidence with a mocked SharePoint attachment:

```bash
curl -X POST http://localhost:4000/projects/PROJECT_ID/evidence \
  -H "Content-Type: application/json" \
  -H "x-user-id: dev-user-1" \
  -H "x-user-email: student@ueh.edu.vn" \
  -H "x-user-name: Development Student" \
  -H "x-user-role: STUDENT" \
  -d "{\"sprintStageId\":\"STAGE_ID\",\"type\":\"INTERVIEW\",\"title\":\"Student commuter interview\",\"reflection\":\"Waiting time creates the most frustration.\",\"files\":[{\"fileName\":\"interview-notes.pdf\",\"mimeType\":\"application/pdf\",\"size\":48210}]}"
```

Submit the project:

```bash
curl -X POST http://localhost:4000/projects/PROJECT_ID/submit \
  -H "x-user-id: dev-user-1" \
  -H "x-user-email: student@ueh.edu.vn" \
  -H "x-user-name: Development Student" \
  -H "x-user-role: STUDENT"
```

Move a submitted project into review as the course lecturer:

```bash
curl -X PUT http://localhost:4000/projects/PROJECT_ID \
  -H "Content-Type: application/json" \
  -H "x-user-id: lecturer-1" \
  -H "x-user-email: lecturer@ueh.edu.vn" \
  -H "x-user-name: Development Lecturer" \
  -H "x-user-role: LECTURER" \
  -d "{\"status\":\"UNDER_REVIEW\"}"
```

Add lecturer feedback:

```bash
curl -X POST http://localhost:4000/projects/PROJECT_ID/feedback \
  -H "Content-Type: application/json" \
  -H "x-user-id: lecturer-1" \
  -H "x-user-email: lecturer@ueh.edu.vn" \
  -H "x-user-name: Development Lecturer" \
  -H "x-user-role: LECTURER" \
  -d "{\"comment\":\"Strong interview evidence. Clarify the primary need statement.\"}"
```

Approve a project under review:

```bash
curl -X PUT http://localhost:4000/projects/PROJECT_ID \
  -H "Content-Type: application/json" \
  -H "x-user-id: lecturer-1" \
  -H "x-user-email: lecturer@ueh.edu.vn" \
  -H "x-user-name: Development Lecturer" \
  -H "x-user-role: LECTURER" \
  -d "{\"status\":\"APPROVED\"}"
```

SharePoint operations use `MockUploadProvider`; no file bytes are uploaded and no Microsoft Graph calls are made in Sprint 4.

## Supabase MVP setup

1. Create a free Supabase project.
2. Copy `backend/.env.example` to `backend/.env`.
3. Set `DATABASE_URL` to the Supabase transaction pooler URL (port 6543).
4. Set `DIRECT_URL` to the direct/session pooler URL (port 5432).
5. Apply the checked-in migration and seed demo data:

```bash
npm run prisma:generate
npx prisma migrate deploy
npm run prisma:seed
npm run start:dev
```

The frontend reads `NEXT_PUBLIC_API_URL` from the root `.env.local`; use `http://localhost:4000` locally.

Implemented MVP APIs include lesson progress, versioned project submissions, community feed/posts/comments/reactions, and the existing course/project/evidence/feedback routes. Development auth headers remain temporary; replace them with Supabase JWT verification before production.
