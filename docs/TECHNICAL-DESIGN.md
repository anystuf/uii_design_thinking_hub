# USI Design Thinking Hub — Technical Design v0.1

Status: proposed target architecture, **not an implementation claim**.

## Architecture

\`\`\`mermaid
flowchart TD
  Browser["Next.js (Student / Lecturer / Admin)"] --> API["NestJS modular monolith / REST"]
  Browser --> Auth["Supabase Auth"]
  API --> AuthJWKS["Supabase JWKS JWT verification"]
  AuthJWKS --> Auth
  API --> Prisma["Prisma ORM"]
  Prisma --> DB["PostgreSQL"]
  API --> Storage["Private object storage (Release C)"]
  API --> Jobs["Notification scheduler (Release D)"]
\`\`\`

### Backend domains

- Auth & Users: real authentication, server-side app roles, resource scopes.
- Courses & Learning: course/lesson state, enrollment and progress.
- Challenges & Teams: challenge brief, milestone, team and tasks.
- Project Studio: five non-linear modes and activity instances.
- Evidence & Storage: artifact metadata, private objects, version history.
- Submissions: immutable snapshots and atomic version numbering.
- Assessment: review decisions and versioned rubrics.
- Notifications: recipient-specific events and deadlines.

## Domain cardinality

- Course 1:N Lesson; Course 1:N Enrollment; Course 1:N DesignChallenge.
- DesignChallenge 1:N Team; Team 1:1 Project for a given challenge.
- Project 1:N ProjectActivity, Evidence and Submission.
- Evidence 1:N EvidenceVersion; Submission 1:N SubmissionItem.
- SubmissionItem N:1 EvidenceVersion (reference frozen at submission).
- Submission 1:N Assessment (or revisions/graded attempts under policy).
- RubricVersion 1:N RubricCriterion.
- Assessment 1:N CriterionScore.
- User 1:N Notification.

## State transitions

Course: DRAFT -> PUBLISHED -> ARCHIVED.

Lesson: DRAFT <-> PUBLISHED (publishedAt is a provisional flag in Release A).

Submission: SUBMITTED -> UNDER_REVIEW -> APPROVED or REVISION_REQUESTED.
When a revision is requested, create a new immutable version; do not modify the old.

Rubric: DRAFT -> PUBLISHED; a published rubric cannot be mutated in place.

## Security boundaries

1. Supabase Auth verifies user credentials in the browser.
2. NestJS verifies JWT signatures, expiry, audience and issuer using JWKS.
3. The PostgreSQL User record determines STUDENT/LECTURER/ADMIN roles.
4. Resource ownership and enrollment checks run inside services as well as role guards.
5. Storage files are private; signed URLs are short lived.
6. No API accepts userId/role in a request header as identity.
7. Separate development seed data from production identities.

## Next technical decisions

- Backend and frontend deployment providers.
- Supabase project ownership, staff provisioning and first-login policy.
- Challenge/Project data migration (existing Project currently references Course).
- Evidence versioning/snapshot strategy before Release C.
- File limit, encryption and retention policy before enabling upload.
- Deadline scheduler and notification deduplication design.

## Release A API contract

All endpoints besides /health require a Bearer access token.

| Endpoint | Role | Resource policy |
|---|---|---|
| GET /auth/me | All | Self |
| GET /courses | All | Published, plus own drafts for lecturers |
| POST /courses | Lecturer/Admin | Creates draft by default |
| PUT /courses/:id | Lecturer/Admin | Owner/Admin |
| GET /courses/:id | All | Published, own draft for lecturer |
| POST /courses/:id/enroll | Student | Published course |
| GET /courses/my-enrollments | Student | Own enrollments |
| GET /courses/:id/my-progress | Student | Enrolled |
| GET /courses/:id/lessons | All | Student must be enrolled |
| POST /courses/:id/lessons | Lecturer/Admin | Course owner/Admin |
| PUT /lessons/:id | Lecturer/Admin | Course owner/Admin |
| GET /lessons/:id/progress | Student | Own, enrolled, published lesson |
| PUT /lessons/:id/progress | Student | Own, enrolled, published lesson |

Security and functional tests are required before Release A can be marked Done.
