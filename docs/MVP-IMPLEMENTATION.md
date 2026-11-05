# USI Design Thinking Hub — MVP Delivery Plan

Date: 2026-11-05 | Status: implementation in progress | Source: USI PRD v1.0

## Vision

Evidence-centered, project-based learning. The five Stanford d.school
design-thinking modes are non-linear: Empathize, Define, Ideate, Prototype, Test.

## MVP scope / release gates

| Release | Features | Deliverable | Acceptance gate |
|---|---|---|---|
| A — Learning Foundation | F01 F02 F03 F04 | Trusted auth, courses/lessons, enrollment, real progress | Lecturer creates and publishes a course; student enrolls and persists progress across sessions |
| B — Design Studio | F05 F06 F07 F08 | Challenges, teams, taskboard, 5-mode workspace and activity templates | Student team completes two mode-specific activities, lecturer can inspect work |
| C — Evidence & Versioning | F09 F11 F12 | Private file storage, evidence history, immutable submission snapshots | Upload succeeds, old evidence versions can be reopened, submission remains unchanged after revisions |
| D — Assessment & Readiness | F13 F14 F16 | Review queue, rubric versioning, feedback, deadline alerts | Lecturer scores a submitted version, requests changes, reviews a new version |

### Excluded from MVP

AI Mentor, InnoGallery expansion, real-time whiteboard, peer portfolio,
certificate, payments, video-conference and predictive analytics.

## Epic / stories

### Epic A — F01–F04 (must ship first)

- A-01: Supabase Auth JWT verification and server-side role provisioning.
- A-02: Protect every API endpoint by authenticated identity and resource role.
- A-03: Create/update/publish courses and draft/publish lessons.
- A-04: Student enrollment, uniqueness and enrolled-only lesson access.
- A-05: Real lesson progress, progress aggregate and cross-device persistence.
- A-06: New /learn screen; no fabricated success if the API fails.
- A-07: Automated tests for identity spoofing, course ownership, enrollment and progress.
- A-08: End-to-end UAT and deployment configuration.

### Epic B — F05–F08

- B-01: DesignChallenge entity with Course relationship and status.
- B-02: ChallengeMilestone and deadline/deliverables.
- B-03: Team (one team per student per challenge) and membership invitations.
- B-04: TeamTask with assignee restricted to team members.
- B-05: Five-stage workspace with unrestricted navigation.
- B-06: Five starter ActivityTemplates and activity instances.
- B-07: Server-persisted activity draft with mode and author.

### Epic C — F09, F11, F12

- C-01: Private object-storage adapter with direct upload + complete handshake.
- C-02: MIME, size, quota and ownership validation, signed downloads.
- C-03: EvidenceVersion records with object/checksum snapshot.
- C-04: IterationNote and version timeline.
- C-05: Immutable Submission and SubmissionItem snapshots.
- C-06: Transaction-safe, monotonically increasing version numbers per scope.
- C-07: Late submission policy and submission ownership validation.

### Epic D — F13, F14, F16

- D-01: Lecturer review queue and version-specific feedback.
- D-02: Approve / request revision state machine.
- D-03: Rubric, RubricCriterion and immutable rubric versions.
- D-04: CriterionScore, computed weighted assessment totals.
- D-05: In-app notification center and read state.
- D-06: Deadline reminders with idempotency/deduplication.
- D-07: Privacy, accessibility, performance and audit UAT.

## Design rules

1. Challenge differs from Project: many teams may address one challenge.
2. Five modes are modes, not sequential hard gates.
3. Evidence changes do not mutate submitted snapshots.
4. Rubric updates never alter the scoring rules of a published assessment.
5. Authorization checks must run on backend for every resource, not on UI alone.
6. Only success responses from server may drive completed state.

## Data model evolution

- Reuse: User, Course, Lesson, Enrollment, LessonProgress, Project,
  SprintStage, Evidence, File, Submission, Feedback, ProjectMember, Notification.
- New in B: DesignChallenge, ChallengeMilestone, Team, TeamMember, TeamTask,
  ActivityTemplate, ProjectActivity.
- New in C: EvidenceVersion, IterationNote, SubmissionItem, FileAsset.
- New in D: Rubric, RubricCriterion, RubricVersion, Assessment, CriterionScore, AuditLog.

Release B Prisma schema and migration are checked in on its feature branch; deployment to a real database still requires review. Releases C–D remain planned.

## Pilot metrics / targets (to validate with UII)

- 95%+ of scripted end-to-end user journeys pass.
- 100% of reviewed submissions retain a unique immutable version.
- No cross-team private resource access.
- No unauthorized lecturer/admin role escalation.
- 99%+ valid upload completion and download verification.

## Dependencies / decisions

- Supabase project and asymmetric signing keys; API uses issuer JWKS.
- Host Next.js and NestJS separately; configure allowed frontend origins.
- Invite/provision lecturers securely; browser signup creates STUDENT only.
- Select storage provider and file-retention/privacy policy before Release C.
- UAT roles: one admin, one lecturer, at least two students.

## Current status

Code delivered for Release A on a review branch. Release B Challenge/Team/Activity implementation has passed CI build, migration and unit checks. Release C evidence/versioned submission implementation is on a new stacked review branch; live Storage integration/UAT pending.
It is *not* certified as production-ready. Supabase credentials, backend DB,
CI tests, pilot user testing and deployment verification are still required.
