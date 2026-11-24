# UII Design Thinking Hub — MVP PRD Summary

Version: 1.0. Source: approved MVP PRD and 46 user stories, 2026-11-05.

## Audience / roles

Student: learn, enroll, join team, practice, submit, receive feedback.
Lecturer: create courses/challenges, manage learning, review and grade.
Admin: provision accounts, apply access policies and support operations.

## The 14 selected MVP functions

| ID | Function | Release | Primary acceptance criterion |
|---|---|---|---|
| F01 | Login and role-based access | A | Server verifies JWT and denies cross-role operations |
| F02 | Course management | A | Owner creates draft, edits and publishes |
| F03 | Lessons and resources | A | Owner publishes lessons and enrolled learners can read |
| F04 | Enrollment and progress | A | Progress persists cross-device, no duplicate enrollment |
| F05 | Design Challenge | B | One brief is available to many student teams |
| F06 | Teams and task assignment | B | Tasks assigned only to eligible members |
| F07 | Five modes workspace | B | Non-linear revisit, no lost work |
| F08 | Mode-specific activities/templates | B | At least one working template per mode |
| F09 | Real private evidence storage | C | File bytes persist with authorized download |
| F11 | Iteration and version history | C | New evidence version never overwrites old version |
| F12 | Versioned submissions | C | Immutable snapshot with atomic version allocation |
| F13 | Lecturer feedback and review | D | Approve or request revision for a specific version |
| F14 | Rubric-based assessment | D | Weighted score tied to immutable rubric version |
| F16 | Notifications and deadlines | D | Recipient-specific, deduplicated in-app reminders |

## Complete student journey

Login -> enroll -> study lessons -> receive challenge -> join team ->
practice across five modes -> upload evidence -> iterate -> submit version ->
receive review -> revise -> resubmit -> receive approval.

## Explicit non-goals

AI Mentor, open community feed, e-commerce, real-time whiteboard,
certificate, public portfolio and native mobile app.

## Business rules

- Design modes are not mandatory ordered gates.
- Challenge and project are distinct concepts.
- Files private by default.
- Submission and published rubric versions are immutable.
- Backend response, never localStorage, is the source of truth.
- Error must be visible and retryable; no false-success UI.

## KPIs proposed for pilot

- >=95% critical end-to-end UAT journey pass rate.
- 100% submitted versions traceable.
- 0 successful unauthorized access in defined security tests.
- >=99% valid file uploads retrievable after completion.

## Status

Release A under implementation; B/C/D planned. This document is not a
claim that all 14 functions are implemented.
