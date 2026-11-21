# UII Hub frontend — Build → Measure → Learn → Improve

## Scope
UII frontend information architecture: `/` is the public four-pillar ecosystem homepage; `/dashboard` is the live authenticated, role-aware Learning Hub. The prototype role selector is not mounted on any public route. Existing releases A/B/C/D retain their operational routes (`/learn`, `/studio`, `/evidence`, `/review`, `/notifications`).

## Product rules preserved
- Student / Lecturer / Admin identity comes exclusively from `GET /auth/me` after JWT verification and database role lookup.
- The original demo role switcher is no longer mounted at `/`.
- Lecturer/Admin-only review entry points are not shown to students.
- Backend authorization remains the source of truth. Hiding a button does not secure an endpoint.
- All dashboard counts are derived from the authenticated API responses; unavailable metrics display an em dash rather than a fabricated zero.
- The five Design Thinking modes remain non-linear and revisitable.
- Challenge, Project, and Submission remain distinct resources.
- No mock evidence, public gallery, AI mentor, e-commerce, or fictitious leaderboard is introduced.
- Private evidence and immutable submissions/rubrics remain enforced by existing backend flows.
- Existing core feature pages are retained; this change does not claim they passed UAT.

## Build: pilot hypothesis
A clear role-aware dashboard with a single next action reduces first-session navigation confusion and increases the share of learners completing a real learning-to-submission journey.

## Measure: instrumentation & evidence
Avoid inventing adoption metrics. Pilot facilitator records anonymized aggregate attempts, successes, and time spent. Do not put personal learner details into analytics.

| Signal | Definition | Initial collection |
| --- | --- | --- |
| Activation rate | Users who enroll in a published course / new accounts | Pilot UAT cohort count |
| Time-to-first-action | Seconds between authenticated `/dashboard` landing and first successful course enrollment / entering an enrolled challenge | Observed scripted user test |
| Successful first task | Learners completing one lesson / users attempting it | Supabase persisted LessonProgress + UAT |
| Journey success | Critical E2E scenarios passed / scenarios attempted | Release A–D UAT sheets, target >=95% |
| Submission traceability | Reviewed submissions with immutable version trace / all reviewed submissions | API and DB audit, target 100% |
| Access integrity | Successful unauthorized tests | Must be zero |
| Upload reliability | Valid upload+download completions / attempts | Release C UAT, target >=99% |
| Error incidence | Failed requests by route and status | Sanitized Render/Vercel logs |

These are targets and a measurement plan, **not measured results**. No third-party telemetry is enabled by this UI change.

## Learn: test matrix
- [ ] Anonymous `/` shows all four pillars, honest available/planned states and clear Learning Hub CTA; no role switch.
- [ ] Student signup/login continues at `/learn`; student `/dashboard` role is STUDENT.
- [ ] Student `/` loads enrollment, project and notifications without fabricated counts.
- [ ] Student can open `/studio` and `/evidence`; `/review` restricts reviewer tools.
- [ ] Student POST `/courses`, GET `/users`, GET `/assessments/queue` receive 403.
- [ ] Logout immediately returns to public state; session does not reappear on refresh.
- [ ] Lecturer dashboard exposes `/review`; lecturer can edit *owned* course and no other.
- [ ] Admin dashboard uses authoritative ADMIN role, not frontend toggle.
- [ ] Errors/partial failures are displayed with retry, not fake success.
- [ ] Mobile sidebar works; keyboard navigation and focus rings work.
- [ ] Core workflows A–D pass their corresponding UAT and data persists cross-session.

## Improve: feedback loop
1. Run two student pilot sessions and one lecturer session with tasks from release UAT docs.
2. Record blockers with page, user role, steps, observed outcome, expected outcome, severity.
3. Prioritize security/data-loss blockers first, then first-task friction, then polish.
4. Create actionable backlog items with owner and acceptance criteria; repeat the same tests after each fix.
5. Do not mark production ready until the release gate passes and UII signs off.

## Release safety
Use the dedicated Vercel **staging project** only. Do not merge to main or alter production services in this frontend sprint.

## Four-pillar ecosystem (product direction)

1. **Training & Education — available for staged MVP UAT**: course, lesson, enrollment, progress.
2. **Innovation Lab — available for staged MVP UAT**: challenge, team, five modes, evidence and iterations.
3. **Incubation Program — roadmap only**: discovery, Problem–Solution Fit, Product–Customer Fit, Go-to-Market & Growth.
4. **Work with UII — roadmap only**: academic, industry and partnership opportunities.

Do not mistake a planned pillar for an operational program; no invented metrics, testimonials, partner logos or signup forms.

## Navigation design

- `/` public four-pillar overview; all users can understand product scope.
- `/dashboard` authenticated user workspace; derives role from backend `GET /auth/me` (JWT + DB).
- `/learn` shared signup/login and course workflows, `/studio` challenge/team/modes, `/evidence` private proof and submissions, `/review` lecturer/admin tools, `/notifications` private notices.
- Existing staging Vercel project and URL are legacy infrastructure IDs; all visible brand copy is **UII Design Thinking Hub**.

## Next UAT metrics & hypotheses

1. Observe whether prospective students understand the four pillars and find the Learning Hub in under one minute (measured, not assumed).
2. After sign-in, verify that the student sees `STUDENT` on `/dashboard` and has **no** Assessment link; backend endpoints still reject unauthorized requests.
3. Lecturer login should show `/review`; if there is no lecturer test account, record this as blocked instead of passed.
4. Measure an end-to-end learner journey via lessons, challenge, evidence, submission and feedback; record drop-offs, latency and error rates.
5. Collect three brief interviews: what confused them, what they expected, and what they would try next.
