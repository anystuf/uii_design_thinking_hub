# UII Design Thinking Hub — English-first classroom language policy

## Default language and scope
English is the primary interface language of the lecturer and student pilot. The root document sets `lang="en"`. Navigation, sign-in, password recovery, the Chapter 10 First Findings worksheet, Evidence, Submission Review, Studio, learning pathway, course authoring, pilot instructions, assistant UI, homepage, quizzes, and demo canvas labels use English.

Use simple, action-led English. Preserve globally recognized Design Thinking method names (Empathize, Define, Ideate, Prototype, Test, Crazy 8s, How Might We, POV, Gallery Walk). Prefer **Save evidence**, **Submit snapshot**, **Request revision**, **Approve** and **Next step**. Avoid mixed Vietnamese/English labels such as “Lưu evidence” or “Courses chưa có lessons”. Distinguish saved drafts from submissions and rubric decisions. 
Do not translate data fetched from the database or lecturer-authored content without explicit editorial approval. A Vietnamese student or lecturer note must retain its original language and meaning.

## Safety and backwards compatibility
- The historical `FIRST_FINDINGS_TITLE` identifier is deliberately unchanged because it identifies existing persisted evidence. Visible text can be English while storage keys remain stable.
- Do not change route paths, enum values, role names, snapshot states, or Supabase auth callback assumptions merely to translate UI.
- Login, reset-password, and email confirmation links must be tested on approved UII origins. Supabase Site URL and redirect allowlist for the new pilot alias remain an operator check; email delivery has not been verified by source translation.
- The default public demo saves nothing to the LMS. Never copy real student records or identifiable interview data into demo content.
- Published course content and previously saved assignments are user data, not translation targets.

## Pilot QA
- Verify home, `/pilot`, `/demo`, `/learn`, `/forgot-password`, `/reset-password`, `/classroom`, `/classroom/first-findings`, `/studio`, `/evidence`, `/review`, and mobile 320px layouts.
- Validate button, confirmation, toast, error, loading, and empty-state copy as English; avoid translating developer/API error identifiers that are needed for recovery detection.
- Run dedicated English assertion tests in `e2e/pilot-instructions.spec.ts`, `e2e/student-feedback-learning.spec.ts`, and `e2e/classroom-first-findings.spec.ts`. Smoke tests are not authenticated UAT.
- Backend availability, three-role login, reset email, two-team isolation, and real submission → revision → approval remain release gates; no full-class rollout solely because Vercel build is ready.

## Style decisions
Use Sentence case for labels, one primary next action per workspace, “Lecturer” rather than “Teacher” in permission-related UI, “Course” for LMS courses, “Classroom” for the scheduled activity, and “Evidence” for saved artifacts. Use "Submit" only after a server-confirmed immutable snapshot. USI may appear in legacy hostnames; user-facing brand is **UII Design Thinking Hub** for this pilot. The curriculum itself follows cô Thanh’s source slides (Activity 2, slides 64–65), with two problems, one summary slide, and a two-minute presentation.
