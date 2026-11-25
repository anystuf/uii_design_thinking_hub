# Student-feedback UX implementation — 25 Nov 2026

## Scope and evidence
Source: lecturer's feedback workbook `[4-pm] 26C1TEC55005979.xlsx`, tab `Feedback-DTHub` (50 student rows, 27 filled comment cells), reviewing the earlier deployment `7ff4c2c`.
The comments are overlapping qualitative observations, not independent vote totals. Frequent themes: overwhelming choices, unclear starting point, distracting red cursor trails, generic practice hints, language/typography inconsistency, unclear learning payoff, and unmet storage/interaction expectations.

This change set delivers the **first safe frontend slice** of the agreed plan. It intentionally does **not** imply that auth recovery, real student submissions, backend security, or Gallery Walk are accepted.

## Changes
- P0: Remove automatic red pointer-trail injection from the root layout; update the existing focus-mode regression and add a no-trail test.
- P0: Replace competing student hero CTAs with one primary action, **Xem nhiệm vụ hôm nay**, targeting `/classroom`. Preserve the actual server-derived course-resume link elsewhere.
- P0: Group secondary student navigation under **Tiện ích khác**, keeping core task destinations visible. Lecturer/admin navigation remains unchanged.
- P0: Display the server-derived classroom next-step block above overview and optional modules. No locally fabricated completion status.
- P1 small, safe improvement: enlarge the AI assistant reading panel on desktop; mobile width remains viewport-limited.
- P1: Replace repeated generic demo questions with eighteen scenario-based quiz items across six course themes, each with a distinct explanation and context-specific hint.
- P1: Replace non-interactive Crazy 8s placeholders with editable, method-matched activity canvases (Crazy 8s / Empathy Map / HMW / Storyboard / Feedback Canvas). All demo entries remain ephemeral, explicitly **not** persisted to the LMS.
- P1: Use green for correct selected quiz options and amber for incorrect options, instead of treating successful answers as red errors.
- Add regression coverage for scenario differentiation, color semantics, and direct editing.

## No-go boundaries
- **Do not** switch canonical staging aliases or roll out to 50 real students until the release runbook's real authenticated gates pass.
- A Vercel READY build does not prove the Render backend, Supabase Auth callbacks, migrations, file permissions, versioned evidence, teacher rubric review, or Gallery Walk works.
- Do not import private student roster into code/tests or publish interview personal data.
- Keep the main branch, production environment, and database schema untouched in this UX branch.

## Acceptance checklist
- [ ] Vercel preview READY for the exact feature commit.
- [ ] Existing lint/build + focused Playwright tests pass on this commit (new UI tests are committed but require a Playwright runner).
- [ ] At desktop and 320px width, a first-time student finds a single dominant action leading to `/classroom`.
- [ ] Cursor trail is not rendered on homepage, demo, course, and classroom routes, including reduced-motion.
- [ ] Student navigation still exposes all routes using disclosure; teachers retain Review and Console.
- [ ] Existing resume-course deep link still points to actual next lesson when data is available.
- [ ] Two synthetic student accounts and one lecturer complete real `/classroom/first-findings` → `/evidence` → `/review` → revise → approve loop; verify cross-team evidence isolation.
- [ ] Auth email links and actual reset-password recovery path pass in the intended staging origin.
- [ ] Lecturer approves a small pilot; no automatic mass onboarding.

## Follow-on priorities
1. P0 Auth / alias correctness; complete real authenticated staging UAT with original backend and Supabase project.
2. P0 Observe novice students finding and completing the Chapter 10 task without explanation; remove redundant sections if navigation remains slow.
3. P1 Expand the now-contextual **demo** quiz approach into persisted lecturer-authored LMS exercises; require an applied artifact or reflection in the authenticated workflow.
4. P1 Gallery Walk as an explicitly approved, privacy-respecting version-scoped review workflow.
5. P2 Controlled, opt-in microfeedback, semantic visuals, language consistency and larger usability test. Avoid intrusive global animation.
