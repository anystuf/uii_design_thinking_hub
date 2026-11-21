# UII Public Editorial Homepage + Interactive Demo (2026-11-21)

## Purpose and boundaries
This implementation is an isolated, explicitly fictional UI showcase at / and /demo, stacked on PR #20. It must not populate Supabase/Prisma without a separately reviewed seeding plan.

- Public homepage/demo use lib/demo-content.ts: six courses, 36 lessons, 36 demo exercises, eight projects, ten tools, four sample events and three fictional demo quotations.
- Hero counts are computed from these demo arrays, never fabricated learner or success statistics.
- Quiz answers and reflections are kept in React component state and are cleared on refresh. No auth, API mutation, upload, enrollment or XP is issued by the public sandbox.
- Lecturer example buttons fill the practice form only. Publishing and persistence require an explicit save action by an authorized lecturer.
- The authenticated Course, Lesson, Exercise, Evidence and Rubric APIs are unchanged. Course thumbnails in /learn are only visual.

## Visual reference
Inspired by Stanford d.school's bold editorial typography, playful forms and practice-based pedagogy; no brand, logos or proprietary layouts were copied.

## Image source information
Photos are externally served from Unsplash URLs, with descriptive alt text and original CSS fallback when images are blocked. Pages used for verified sourcing:
- Sticky note board: https://unsplash.com/photos/a-white-board-with-sticky-notes-attached-to-it-BuD00MfwvFY (Walls.io).
- Chalkboard brainstorming: https://unsplash.com/photos/two-people-brainstorming-on-a-chalkboard-wall-xNMveo-61Us (Vitaly Gariev).
- Design team meeting: https://unsplash.com/photos/people-in-a-design-meeting-in-an-office-boardroom-pzFzd1AD8Ow (Mapbox; attribution required).
- Collaborative meeting: https://unsplash.com/photos/group-of-people-having-a-meeting-VBLHICVh-lI (Mario Gogh).
- Other source IDs: photo-1521737711867-e3b97375f902, photo-1556761175-b413da4baf72 (review metadata before public production launch).
- License: https://unsplash.com/license

## Acceptance
1. / opens without login; hero has a real photo, large editorial headline, 5 modes, 6 course cards, 10 tools, 8 demo project cards, sample feedback and 4 mock events.
2. At 320px, no horizontal scroll; all images have accessible alternative text.
3. /demo lets a visitor answer a quiz, view correct/incorrect feedback, write reflection, read prototype tasks, and interact with a Crazy 8s prompt.
4. Demo state is explicitly nonpersistent; never claim real learning XP or attendance.
5. /learn retains real role checks, course access, enrollments and server grading; teachers may prefill quiz/written/project examples, which are not saved until submitted.
6. Global sketch cursor must be visible during mouse movement and suppressed in Focus Mode.
7. Run CI including Playwright and manually verify the protected Vercel preview on actual Chrome/Windows before assigning shared staging alias.

## Release
PR #20 remains draft. No production data/schema migration, secret changes, or staging alias reassignment is authorized by this update.
