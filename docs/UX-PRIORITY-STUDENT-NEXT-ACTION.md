# UII UX priority P0 — One clear next action

**Decision:** Prioritize the student journey from enrollment to evidence-based application before adding more UI features.

## Why this wins over feature expansion

The platform already contains courses, progress, lesson practice, Design Thinking prompts, Design Studio, evidence and feedback. The principal risk is not insufficient functionality but **fragmentation of the user's next action**. A learner encountering several overlapping CTAs must infer the correct workflow, increasing cognitive load and abandonment. This is especially important on mobile and for attention-sensitive learners.

**Target mental model:** **Enroll → Learn → Practice → Apply in Studio → Capture evidence → Review → Improve.** Modes can be revisited non-linearly; the model is a support for discovery, not a mandatory lock-step progression.

## Implemented in the release candidate

1. Student Course Overview shows one emphasized `StudentNextAction`, derived from actual enrollment, loaded lessons and server progress. It replaces competing "Enroll" and generic "Start / Resume" buttons.
2. Not enrolled → **Ghi danh khóa học**.
3. Enrolled, lessons available and some not completed → **Học tiếp bài này** (first incomplete lesson).
4. Enrolled but no available lessons → an honest empty state with an alternative to browse the catalog.
5. All currently visible lessons completed → **Đến Design Studio**, preserving the course context.
6. Progress bar only uses a valid backend progress percentage. If unavailable, UI explicitly says it cannot confirm progress; it never guesses.
7. The existing lesson Compass continues to support Learn → Practice → Apply, Focus Mode, and stage-linked Studio tools. UII chatbot knowledge includes instructions for this journey.
8. Brand enforcement: no deprecated brand text in active frontend/backend source, server health identity, or manifest; a Playwright test guards against regression. A new UII-only staging alias exists. The actual Render deployment and Auth redirect allow-list still need coordinated acceptance before retiring older infrastructure URLs.

## Why these architectural choices

- **Derived action, not separate DB state:** Avoids inconsistencies between curriculum, completion and the recommended action.
- **One primary CTA:** Reduces decision time, but secondary content remains discoverable.
- **Server-sourced progress:** Prevents fabricated achievements and preserves user trust.
- **Scoped Studio link:** Retains course context rather than losing the learner at a generic project landing page.
- **Explicit missing-data state:** Disconnection should never masquerade as course completion.
- **No gamified pressure:** No forced streaks or timers; Focus Mode remains optional.

## Quantitative research hypotheses — targets, not observed results

- 90% of tested students can identify the next action within 10 seconds of opening a course.
- Median time from choosing a course to entering the next lesson is under 30 seconds.
- Improve the proportion of enrolled students who complete at least one practice activity and create a Studio artifact.
- Reduce backtracking from the course screen to the dashboard/catalog before entering a lesson.
- 100% of tested students can distinguish demo examples from persisted LMS data.

## Acceptance and limitations

- [ ] CI passes on the final feature SHA, including authenticated enrollment/progress fixtures and mobile 320px browser checks.
- [ ] Preview deployed under UII-only alias; alias verified by deployment ID and SHA.
- [ ] Real-user UAT with two students (new vs returning) verifies correct progress and next lesson routing.
- [ ] Confirm signup/verification allow-list for the UII staging alias before changing canonical Auth callbacks.
- [ ] Do not merge to main or promote the feature alias to production until the separate Render API and Community schema compatibility gates pass.
- [ ] Measure the hypotheses in pilot research; no claimed improvement until observations exist.

**Owner:** UII product/engineering. **Priority:** P0. **Status:** source implementation and test rollout; production not approved.
