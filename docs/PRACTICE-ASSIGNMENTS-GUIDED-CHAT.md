# Practice, Assignments & Guided Chat — Implementation Note

## Scope
- One exercise per lesson: QUIZ (single-choice, 1–20 questions, automatic grading), WRITTEN (text response, lecturer grading) or PROJECT (text response linked to an authorized Design Studio project). Project files remain in the existing private Evidence workflow.
- Lecturer/Admin authoring and grading. Students must be enrolled in a published course and lesson; answer keys are never sent before submission.
- Immutable attempt history, attempt limits, passing score, optional deadline. Content and answer keys cannot be edited after any attempt.
- The Learning Player includes the exercise. A role-aware conversational guided chatbot is visible across workspace routes, with no external AI provider and no chat history persistence.

## Protected API
- GET/PUT /lessons/:lessonId/exercise
- POST /exercises/:exerciseId/attempts
- GET /exercises/:exerciseId/attempts/me
- GET /exercises/:exerciseId/attempts (teacher/admin)
- PATCH /exercise-attempts/:attemptId/review (teacher/admin)

## Staging deployment gate
Do not release this frontend without deploying a matching backend.
1. Review staging DB backup and apply migration 202611200001_lesson_practice with prisma migrate deploy.
2. Deploy backend from this feature branch or an approved integration branch. Render staging is currently pinned to an older commit with auto-deploy disabled.
3. Authenticate with dedicated staging Student, Lecturer and Admin accounts; verify answer secrecy, progress, grading and cross-course access denial.
4. Create an isolated Vercel Preview. Do not overwrite the shared staging alias until all checks pass.
5. Production security, monitoring, backup restore and real HCI pilot remain distinct gates.

## Limitations
- Quiz supports only one correct choice per question; no randomized question bank or high-stakes test security.
- Project exercises reference a project that the student is authorized to access; files still require separate Evidence uploads.
- This guided chat is deterministic FAQ/navigation, not an AI coach. A future generative assistant requires secure backend keys, source-scoped retrieval, quotas and evaluation.
- Attempt count enforcement is server-side but not concurrency-serialized; high-stakes exams need stronger transaction/idempotency controls.