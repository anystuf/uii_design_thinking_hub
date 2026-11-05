# Release D — Lecturer Review, Rubrics, Notifications

Status: implementation review candidate; not deployed or user-tested with live Supabase accounts.

## Prerequisites

1. Apply migrations A, B, C, D to a non-production test database.
2. Create trusted lecturer accounts with app role LECTURER in PostgreSQL.
3. Set up a Challenge, team, evidence, an immutable SnapshotSubmission (Release C).
4. Keep NestJS service running continuously to run hourly deadline reminders.
5. Use /review for lecturer assessment and /notifications for student inbox.

## Acceptance checklist

- [ ] D01: Student cannot open lecturer's assessment queue.
- [ ] D02: Lecturer only sees submissions from owned courses.
- [ ] D03: Lecturer creates a rubric and draft criteria, 100% total weight.
- [ ] D04: Cannot publish 99%-weighted or empty rubric.
- [ ] D05: Student can view published rubric, not draft rubric.
- [ ] D06: Published rubric cannot be edited in place.
- [ ] D07: New rubric version clones published criteria without mutating old.
- [ ] D08: Reviewer selects a submitted immutable snapshot and compatible rubric.
- [ ] D09: Review must score every criterion exactly once within 0..maxScore.
- [ ] D10: Weighted total correctly normalized to 0–100.
- [ ] D11: Request Revision must have meaningful feedback.
- [ ] D12: Review publishes status, scores and notifications in one DB transaction.
- [ ] D13: Concurrent reviewers cannot publish contradictory decisions on same snapshot.
- [ ] D14: Student sees feedback and criterion scores in submission history.
- [ ] D15: Notifications list only those for authenticated recipient.
- [ ] D16: Mark-as-read cannot alter another student's notification.
- [ ] D17: Feedback notification emitted once per member and submission.
- [ ] D18: Deadline reminder emitted before due time only once per milestone/deadline/user.
- [ ] D19: Cron errors are logged and do not crash backend.
- [ ] D20: PostgreSQL migrations/seed and test suite pass in CI.
- [ ] D21: Full A→B→C→D real-data lecturer/student UAT passes.

## Business rules

- Each SubmissionSnapshot may have at most one published Assessment.
- RubricVersion is immutable after publish; use a new version to edit.
- Milestone-specific rubric cannot grade another milestone's submission.
- The server computes weighted total and verifies all criterion IDs/limits.
- All notifications are private and deduplicated on unique dedupeKey.
- MVP notifications are in-app; email and push are out of scope.

## Operational caveats

- ScheduleModule hourly cron only executes on a running backend process,
  not on static hosting or request-only serverless deployments.
- Automatic deadline reminders cover projects with registered team members/owners.
- A live UAT with student and lecturer identities is required before merging.
