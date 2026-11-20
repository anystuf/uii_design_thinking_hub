# UII – User Flow and Learning Concierge audit
Draft preview PR #20, 21 November 2026. Do not merge or change the shared staging alias without live-account UAT.

## Journey: landing to learning and feedback

Guest: homepage / → Design Thinking overview and demo content (marked DEMO) → /demo sandbox, no login and no LMS persistence → /learn registration for saved progress. Global Hỏi UII chatbot is present from the first visit.

Registration: /learn → Chưa có tài khoản? Đăng ký → email, password, desired role (STUDENT, LECTURER, MENTOR) → Supabase email confirmation if required → sign in. The desired role is stored as untrusted user metadata requested_role. The NestJS JwtAuthGuard always assigns STUDENT to a new user. No self-registration as ADMIN. A trusted administrator must approve and provision higher roles; the approval UI is not yet implemented.

Student: authenticated /dashboard → /learn discover published course → enroll → resume lesson → Learn / Practice / Apply → quiz or written/project exercise → /studio five modes and team activity → /evidence private submission → feedback in lesson/review notifications → iterate. Student rewards and progress derive from authorized published learning data, not demo.

Lecturer (approved): /dashboard → /learn create course and lessons → author quiz, writing or project assignments → review draft and publish → /studio challenges → /review grade submissions with rubric and feedback.

Mentor: access only invited/permitted projects and collaboration. Admin: inspect accounts and roles via /admin, manage permitted content and review. No public role promotion controls. Signout is available in the workspace menu; backend checks actual role and project access.

## Changes made
- Public registration now has a desired-role selector, with explicit permission safeguards.
- The assistant now mounts once in RootLayout, accessible on homepage, /demo, /learn login, and authenticated routes.
- A curated guide library covers introduction, login, signup, courses, exercises, teacher authoring, grading, studio, evidence, Focus Mode/XP, progress, notifications, demo, admin and platform release state.
- Server POST /api/assistant/chat optionally calls Gemini; API key stays server-only. Without it, or when upstream is unreachable, replies come from verified feature descriptions.
- Verified personalized progress uses bearer token with backend /auth/me and /courses/my-enrollments. No session or unavailable API means no fabricated completion rate.
- Product status explicitly states pilot/UAT and deployed environment, NEVER claims a live GitHub CI state not fetched at runtime.
- The chatbot is read-only and cannot enroll or publish for users. It rate-limits, constrains inputs, filters navigation destinations and does not request secrets.

## Configure optional Gemini
Go to Vercel Project > Settings > Environment Variables. Create GEMINI_API_KEY for Preview (server-only, NEVER NEXT_PUBLIC_). Optional GEMINI_MODEL defaults to gemini-2.5-flash, a supported generateContent text model; model access and costs depend on the Google account. Redeploy the preview. Do not paste secrets in ChatGPT, in GitHub issues, or client environment files. GET /api/assistant/chat reports whether the key is configured without exposing it.

Known security gap before public production: rate limiter is per Node process, not distributed. Use a durable shared limiter and set provider cost ceilings for a production launch. Conversation history is only stored in active React state; provider requests send the last few text exchanges and relevant public feature knowledge. Sensitive LMS details are not sent to Gemini.

## Still pending for production-grade completeness
- Native Lecturer/Mentor application review/approval workflow in Admin.
- AI access to private full course documents or project artifacts via a role-protected retrieval system; assistant currently has curated platform feature descriptions, not an indexed full-document RAG system.
- Persistent conversation state and real-time GitHub/Vercel status integration.
- Real users UAT, Gemini key activation and model/quota validation; do not describe these as completed.
- Real time progress for instructors/mentors beyond the existing authorization-scoped dashboard.

## Mandatory end-to-end acceptance
Guest sees homepage, demo, chatbot and signup; requested Lecturer does not gain elevated rights; student can enroll and show accurate completed lesson count (backend verified); expired token cannot query progress; lecturer can create and review; admin sees only approved roles; chat gracefully handles absent Gemini API key and unavailable backend; public status mentions UAT not production. Check accessibility on 320px and desktop, verify all backend/Playwright CI jobs, and pilot with actual accounts before staging promotion.
