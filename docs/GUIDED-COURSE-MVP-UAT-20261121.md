# UII guided Design Thinking MVP — handoff / acceptance (2026-11-21)

## Intent and scope
This draft PR is stacked on PR #19 (Quest Compass, verified XP and Focus Mode), #18 (lesson practice) and #17 (course player). It improves the five audit weaknesses with **no new schema migration**, so it can be previewed against the currently compatible staging API.

### Implemented
1. **Content quality:** five original learning modules (Empathize / Define / Ideate / Prototype / Test), each with objective, explained lesson, real-world mission, deliverable, hints and quick self-check.
2. **Authoring:** authorized Lecturer/Admin can generate a *draft* Foundations course with 5 server-stored WORKSHOP lessons and 5 server-stored QUIZ exercises via existing API; chapter labels are visually grouped by `M01`–`M05` prefixes. Lecturer can also insert an individual authored template in the existing editor.
3. **Learn → Practice → Apply:** lesson practice still uses server grading; ungraded self-check explains the answer without XP. The Apply CTA links to `/studio?mode=...&course=...`, and Studio validates requested course against the authorized course list before selecting it. Mode is non-linear and user-selectable, never grade-gated.
4. **Context guide:** deterministic role-aware chat now supports stage-specific questions and stuck-step hints. It is not a generative AI system, does not claim to know arbitrary lesson text and does not collect student ADHD status.
5. **Accessibility/mobile:** Focus Mode shows one step at a time, accessible next-step controls, stage pointer in Studio, reduced panel padding on 320px for Studio/Evidence/Review, and avoids fetching lesson practice until the practice step is selected while in Focus Mode.

### Not yet included
- Persistent `CourseModule` entity, rich-text WYSIWYG, video captions, media asset management and downloadable author-upload pipeline. Visual five-chapter headings here use explicitly tagged original lesson titles, not a new database entity.
- Generative, retrieval-grounded AI Learning Coach. It needs a reviewed provider, server-side secrets, per-course authorized retrieval, cost controls, evaluations and consent/privacy review.
- Automated end-to-end live UAT with real Student/Lecturer/Admin accounts, real challenge/evidence/grading, or production readiness certification.
- Performance medians/p95 on real mobile networks and cold-start baselines. Render Free cold starts are an infrastructure constraint; no paid upgrade without explicit owner approval.
- Publishing a sample course on the live staging instance: draft creation is a lecturer-initiated action because the assistant is not authorized to impersonate an account.

## Minimum staging UAT (manual, authenticated)
1. Use the isolated Vercel preview and compatible Render staging API; verify backend `/health/ready` and role authorization.
2. Sign in as Lecturer, open `/learn`, expand course authoring, click **Tạo khóa học mẫu 5 bài + quiz** once. Expect a new **DRAFT** course and 5 lessons. If an API call fails, the page reports partial creation and warns against repeat creation. Do not click again before inspecting.
3. Verify 5 exercises exist, their answers are not exposed to Student before submission; review lesson text. Approve publication of the course only when ready.
4. Sign in as Student, enroll, complete quiz (grade and explanation), switch Focus Mode, inspect hint and self-check. Verify self-check does not create XP, and only first graded pass yields +40 XP (other published lesson completion +20 XP), never repeated retries.
5. Click Apply on `M02`, confirm Studio selects `DEFINE` and the authorized course; use a team challenge to save a real activity. Repeat on 320px and 375px; check no clipped controls, keyboard-only interactions, reduced-motion and screen readers.
6. Complete the established Evidence → Submission → Lecturer Review → Revision chain on authorized staging accounts and verify cross-user denial.
7. Only after this UAT and explicitly approved release gates should anyone reassign the shared staging alias or merge draft PRs.

## Safety / rollback
No production schemas, custom domains, roles, billing, provider secrets or user data are changed by this PR. Preview URLs are isolated. Existing courses and grading flows are preserved.
