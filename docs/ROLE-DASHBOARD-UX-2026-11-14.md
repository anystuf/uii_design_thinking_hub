# Role dashboard redesign — 2026-11-14

Base: PR #13 (`00b2638`), retaining PR #12 navigation, course editor, security patches and learning progress. Reviewed both open draft PR descriptions, branch heads, source and HCI audit before implementation.

## Implemented

- Student: first action is Continue Learning, linked to the enrolled course; real published-lesson progress, enrolled courses, project stages, team milestone dates and recipient-scoped notifications follow. New learners receive a three-step starting instruction. No promotional dashboard hero.
- Lecturer: actual assessment queue first. An empty queue offers course management, rather than sending the lecturer into an empty review screen. Owned courses and authorized projects remain accessible.
- Admin: direct user-directory action, authorized course/project overview. Operational metrics and role-edit tools are not fabricated; no privileged backend behavior changes.
- Dashboard and all existing workflow pages now share WorkspaceNav, with desktop sidebar, mobile native disclosure, active destination, skip link and Vietnamese task labels. Existing screens retain their functionality.
- Course query links are validated against the authorized course list and open the selected curriculum/progress. Notifications, projects and review cards link to their existing workflows.
- Primary data sources load in parallel after server-derived identity. Progress and project milestone reads then run in parallel; one profile lookup is asserted per dashboard mount. Cross-route session/profile deduplication remains open.

## Expert scorecard

Scores are design-review estimates, not usability-study measurements. Before is the earlier expert audit; after is source inspection plus local fixture checks. Target 8.5/10 has **not** been established.

| Nielsen heuristic | Before | After estimate | Evidence / remaining issue |
|---|---:|---:|---|
| System status | 5 | 7 | Skeleton, partial errors, retry; real cold API behavior pending |
| Real-world match | 4 | 8 | Vietnamese task-oriented dashboard/navigation; workflow body terminology remains |
| User control | 5 | 7 | Existing logout, back navigation and course selection preserved; authoring unsaved-work guards pending |
| Consistency | 3 | 8 | One shared sidebar/mobile navigation across workflow routes |
| Error prevention | 6 | 7 | Server guards unchanged, query course checked against authorized list |
| Recognition | 4 | 8 | Role-specific first action, progress, project and deadline information |
| Efficiency | 4 | 6 | Parallel read phases; cross-route profile reuse and per-course progress pending |
| Minimalism | 5 | 8 | Removed hero/module promotion; contextual help collapsed |
| Error recovery | 5 | 7 | Failed sources distinguish unavailable from empty; retry remains |
| Help | 3 | 7 | Starting steps and contextual learning-to-project explanation |

Unweighted expert average: 7.3/10 after, versus 4.4/10 in the earlier ten-item audit. The mission's provisional overall 5.5 baseline uses a different rubric and is not directly comparable. Real first-task timing and satisfaction remain unmeasured.

ISO 9241-11: effectiveness/efficiency/satisfaction require observed representative tasks. Pilot script: Student identifies current course and resumes under 60 seconds; Lecturer with/without pending work chooses an appropriate action; Admin locates the user directory. Record task completion, errors, elapsed time and post-task satisfaction. Do not replace this with automated tests.

WCAG 2.2 AA: local Axe assertions, overflow, semantic headings, progress values and navigation checks are regression evidence. Manual keyboard, screen-reader, target-spacing, zoom and real authenticated coverage remain necessary; conformance is not claimed. Hick: one dominant role action. Fitts: primary actions at least 44px high. Progressive disclosure: help and mobile menu.

## Benchmarks checked

- [Khan Academy course-home guidance](https://support.khanacademy.org/hc/en-us/articles/115003342971-How-do-I-edit-the-My-Courses-section-on-my-Home-page): current course, resume context and progress.
- [Coursera course example](https://www.coursera.org/learn/learning-how-to-learn): recognizable curriculum/modules and course orientation.
- [Stanford d.school Bootleg](https://dschool.stanford.edu/tools/design-thinking-bootleg): preserve revisitable modes and practical experimentation. No mandatory linear stage gate introduced.

## Verification and screenshots

Local production frontend build and TypeScript passed. Lint: zero errors, 19 existing warnings. Full browser suite: 14 passed (64 anonymous route/width combinations plus 24 role-fixture combinations, local editor and onboarding, mobile performance). All three role-fixture desktop Axe assertions passed. Backend: 50 tests passed; Nest build passed.

Role fixture assertions verify one profile lookup, Student progress and course link, Lecturer empty-queue fallback, Admin directory link, role-limited navigation and overflow at 320/360/375/390/430/768/1024/1440. These fixtures live only in tests, never production data. No real authenticated backend integration acceptance is claimed.

[Earlier baseline screenshot directory](screenshots/2026-11-14/before/) contains anonymous deployed screens. Authenticated before screenshots were not available; those anonymous images must not be treated as a controlled authenticated comparison. After captures below use synthetic local identities, labelled here explicitly. Real authenticated before/after capture remains an acceptance gate.

| Local role fixture | Mobile | Desktop |
|---|---|---|
| Student | [320px](screenshots/2026-11-14/role-dashboard/STUDENT-320.png) | [1440px](screenshots/2026-11-14/role-dashboard/STUDENT-1440.png) |
| Lecturer | [320px](screenshots/2026-11-14/role-dashboard/LECTURER-320.png) | [1440px](screenshots/2026-11-14/role-dashboard/LECTURER-1440.png) |
| Admin | [320px](screenshots/2026-11-14/role-dashboard/ADMIN-320.png) | [1440px](screenshots/2026-11-14/role-dashboard/ADMIN-1440.png) |

## Open release gates

- Dedicated real Student/Lecturer/Admin credentials remain unavailable; run the existing staging UAT suite once supplied through local/CI secrets. Upload, submission, assessment, notification and cross-user negative cases still require real verification.
- Student resume currently uses the first returned enrollment. Exact next-unfinished-lesson selection, progress per course, course thumbnails, richer Lecturer student-progress overview, deep links to individual team/review items and Admin activity/operations reporting remain further work.
- Milestone panel displays configured dates, including past dates, rather than claiming submitted/completed status that the response does not provide. Team milestone reads fan out across accessible project teams; pagination/aggregation is a performance follow-up for large cohorts.
- Missing project-list data prevents milestone discovery; both panels report unavailable data and offer retry.
- INP, authenticated API latency, warm/cold measurements, real-device testing and real-user time-to-first-task remain unmeasured in this change. Existing anonymous performance harness does not establish these.
- Remaining dependency advisories, backend staging deployment, monitoring and backup restoration remain recorded in the security/release reports.

No main merge or production deployment. This is a reviewable implementation milestone; the complete mission's user-validation and production gates remain open.
