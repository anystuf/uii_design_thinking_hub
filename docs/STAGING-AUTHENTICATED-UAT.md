# Authenticated staging acceptance

The suite in `e2e-staging` uses real Supabase authentication and the dedicated staging API and Storage. It creates courses, a lesson, a challenge, a team, evidence bytes, immutable submissions, a rubric, assessments and notifications. Records are labeled UAT and retained so version integrity can be inspected. Run it with dedicated test accounts.

## Setup

Create four real Supabase Auth test accounts (Student A, Student B, Lecturer, Admin) in staging project `dpapvhvceuoegztxfuuu`. Sign in once to create each application profile. A trusted operator must provision the matching STUDENT, LECTURER and ADMIN roles. Current inspection found only one ADMIN application account. No Student or Lecturer credentials were available in the execution environment.

Set these values in ignored `.env.uat.local`, the process environment, or GitHub environment secrets for `staging-uat`:

```dotenv
E2E_SUPABASE_PUBLISHABLE_KEY=<staging publishable key>
E2E_STUDENT_EMAIL=<dedicated student>
E2E_STUDENT_PASSWORD=<secret>
E2E_STUDENT_B_EMAIL=<different dedicated student>
E2E_STUDENT_B_PASSWORD=<secret>
E2E_LECTURER_EMAIL=<dedicated lecturer>
E2E_LECTURER_PASSWORD=<secret>
E2E_ADMIN_EMAIL=<dedicated admin>
E2E_ADMIN_PASSWORD=<secret>
```

Use the staging frontend containing the current branch for browser verification. The configuration pins the staging URLs and turns off traces, video and automatic screenshots. Keep local failure contexts private as they may contain test-account information. The manual CI workflow runs under `staging-uat`, which the repository owner should protect with reviewers and approved branch rules before enabling secrets.

Run `npm run test:staging`. Missing configuration causes a failure, so an unconfigured run cannot be reported as accepted. No mutation is retried automatically. A failed run may leave partial UAT data, and a later run creates a uniquely labeled journey.

## Assertions

- Student, Lecturer and Admin sign in through the browser, retain their DB-derived role after refresh and sign out. The `/users` API denies non-admin accounts.
- Lecturer creates/publishes a course and lesson. Student enrolls and persists completion. Student course creation receives 403.
- Student creates a challenge team and uploads known TXT bytes to private Storage. Completion succeeds, the signed download returns identical bytes, and the anonymous public object URL fails.
- Submission v1 freezes the original evidence version after a revision.
- Lecturer publishes a rubric, requests revision, and publishes a normalized score. Student can read it, resubmit a higher version and receive an approval notification.

## Remaining acceptance work

The suite is implemented and type-checked. Its first execution failed on missing credential configuration before authentication or content creation. Real role journeys and file byte checks remain unverified until a configured run passes. Add two-student cross-team denial, invitation acceptance, upload mismatch/concurrency, concurrent snapshot allocation, mobile authenticated journey and second-browser session tests before release. A successful API journey alone does not establish student usability.

## Production acceptance sprint follow-up (2026-11-18)

The journey now requires Student B before creating records. Both students enroll in the course and own separate challenge teams. Assertions cover cross-team project/evidence/submission reads, upload presign/completion, signed-download issuance, evidence revision, foreign file association, foreign evidence snapshots and cross-user notification reads/marking. These new checks are implemented, not yet live-verified. The course journey also checks the bulk next-lesson summary. Use the matching backend review revision first; the older deployed API does not implement the new summaries/milestone endpoint. Real concurrency, signed-URL expiry, MIME/size mismatch, invitations and multi-browser/device scenarios remain additional coverage.
