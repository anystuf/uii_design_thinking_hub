# Learning Quest — Five-mode compass & accessible focus mode

## Purpose
A calmer, action-oriented learning journey for students who benefit from clear next steps, including some learners with ADHD. This is a user-experience accommodation, not an ADHD treatment or a claim of clinical effectiveness.

## Five modes (non-linear)
Empathize, Define, Ideate, Prototype, Test are **modes**, not locked levels. The "Bạn ở đây" pointer is selected by the student and saved locally per user/course. It does not grant grades or bypass academic requirements. All five modes link to the existing Design Studio.

## Micro-tasks and focus
- Learn → Practice → Apply: an optional one-task-at-a-time view in the lesson player.
- Students can switch tasks, change mode or exit focus instantly. Selected task gets keyboard focus and is scrolled into view without forced animation.
- While focusing, hide the large mode grid, XP panel and lesson outline; show only a compact pointer and active content. Respect reduced-motion preferences.
- No mandatory countdown, daily login streak, public leaderboard, shame message or penalization for breaks.

## Verified points
An authenticated GET `/courses/:id/my-rewards` calculates:
- 20 XP per unique published lesson marked complete in the backend.
- 40 XP per unique published exercise with at least one graded passing attempt.
- Retrying a quiz, reopening a lesson or clicking the Design Thinking mode pointer cannot create extra XP.
- Progress is account-scoped and only available to students enrolled in the course. No new reward database table is needed.

XP is **engagement feedback**, not a formal grade or proof of mastery. Content understanding is assessed by quizzes and reviewed exercises.

## Privacy & safety
- Existing authenticated NestJS/Prisma service scopes data to the authorized user and enrollment.
- Supabase practice migration has RLS enabled and removes direct browser access to new tables. Correct quiz answers must remain on the trusted backend.
- UI hides XP fetch errors rather than showing fake values. The learner can continue the course when the rewards API is unavailable.
- No personal ADHD status is inferred, stored or requested.

## Deployment and acceptance
This branch is stacked on the practice engine (PR #18), so it requires that branch's migrations plus compatible backend deployment **before a real authenticated staging preview**. Render staging currently tracks the earlier readiness branch. Apply only after staging backup and owner approval of the migration and release branch. Do not touch production.

Release criteria:
- Staging backend and DB schema match frontend revision.
- Real Student/Lecturer/Admin sessions validate enrollment, quiz, grading, XP and private data isolation.
- Test at 320, 375, 768 and 1440px plus keyboard and screen reader.
- Pilot with representative learners, including consenting users who prefer low-distraction design; measure discoverability, task completion, satisfaction and ability to resume after interruption.
- No production merge or deployment until release gates pass.
