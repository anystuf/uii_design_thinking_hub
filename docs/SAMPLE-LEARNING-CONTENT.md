# Sample learning catalog

This is a staging-only, clearly labeled starter catalog for trying the learning, challenge, and studio workflows. The practice scenarios are fictional. They are not interviews, user research, course completion, feedback, grades, or outcomes.

## Included

- Three published starter courses with 9 lessons: foundations, empathy/research, and prototype/test/iterate.
- Two official IDEO U videos embedded from YouTube, plus public Stanford d.school and IDEO learning resources.
- One campus study-space design challenge with five sprint milestones.
- Five activity templates: interview notes, point of view/HMW, idea cards, prototype plan, and test reflection.
- Optionally, one fictional draft project with three practice tasks, linked to a real staging student account when `SAMPLE_STUDENT_USER_ID` is provided.
- The web lesson editor supports article, video, workshop, template and assignment types; HTTPS YouTube links embed in a privacy-enhanced player.

No student progress, project submissions, assessment, fake feedback, storage uploads, or roles are created or changed by the catalog seeder. The optional project fixture is explicitly labeled fictional and remains a draft.

## Seed safely

Use only a staging `DATABASE_URL` and an existing Supabase-auth-backed lecturer/admin. Never use `backend/prisma/seed.ts`; it is a legacy seed with fake users. The new script refuses to run without `--apply` and `SAMPLE_LECTURER_USER_ID`, and it does not alter roles.

From `backend`, after verifying the selected database is staging:

```powershell
$env:SAMPLE_LECTURER_USER_ID = "<existing lecturer UUID>"
$env:SAMPLE_STUDENT_USER_ID = "<existing staging student UUID>" # optional project demo
npx ts-node prisma/seed-samples.ts --apply
```

It is idempotent by course/activity slugs and lesson/challenge names. It creates or updates only records carrying the `SAMPLE ·` label (plus their explicitly named templates). It does not enroll the instructor or learner.

## Try it in the app

1. Sign in with an existing student account and open **Learning Foundation**.
2. Choose a `SAMPLE ·` course and use **Ghi danh khóa học**. The student should then see lessons and video players.
3. Mark a lesson complete to try the saved progress indicator. This creates real progress for that signed-in account, so reset it through the UI if you are using a test account.
4. Open **Design Studio** to create a project from the challenge and add actual team members. Use the sample activity templates as practice, not as collected evidence.
5. Sign in as the lecturer to create/edit courses and publish lessons. Use an instructor test account for course editing.

Posts/community feed and comments are not presently exposed as a complete supported workflow in this staging MVP; the seed does not create misleading social posts or comments.

## Public learning resources

- [IDEO U: What is Design Thinking?](https://www.youtube.com/watch?v=ldYzbV0NDp8)
- [IDEO U: The Design Thinking Process Broken Down Step-by-Step](https://www.youtube.com/watch?v=McTh-xzxfRE)
- [Stanford d.school Design Thinking Bootleg](https://dschool.stanford.edu/tools/design-thinking-bootleg)
- [IDEO Design Thinking methodology](https://www.ideo.com/methodology/design-thinking)
