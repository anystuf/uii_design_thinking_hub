-- Practice engine: separate exercises and immutable per-student attempts.
CREATE TYPE "ExerciseKind" AS ENUM ('QUIZ', 'WRITTEN', 'PROJECT');
CREATE TYPE "ExerciseAttemptStatus" AS ENUM ('GRADED', 'NEEDS_REVIEW');

CREATE TABLE "LessonExercise" (
  "id" TEXT NOT NULL,
  "lessonId" TEXT NOT NULL,
  "kind" "ExerciseKind" NOT NULL,
  "title" TEXT NOT NULL,
  "instructions" TEXT NOT NULL,
  "items" JSONB NOT NULL,
  "passingScore" INTEGER NOT NULL DEFAULT 70,
  "maxAttempts" INTEGER NOT NULL DEFAULT 3,
  "publishedAt" TIMESTAMP(3),
  "dueAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LessonExercise_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "LessonExercise_lessonId_key" ON "LessonExercise"("lessonId");

CREATE TABLE "ExerciseAttempt" (
  "id" TEXT NOT NULL,
  "exerciseId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "answers" JSONB NOT NULL,
  "score" INTEGER,
  "status" "ExerciseAttemptStatus" NOT NULL DEFAULT 'NEEDS_REVIEW',
  "feedback" TEXT,
  "reviewerId" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExerciseAttempt_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ExerciseAttempt_exerciseId_userId_createdAt_idx" ON "ExerciseAttempt"("exerciseId", "userId", "createdAt");

ALTER TABLE "LessonExercise" ADD CONSTRAINT "LessonExercise_lessonId_fkey"
  FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExerciseAttempt" ADD CONSTRAINT "ExerciseAttempt_exerciseId_fkey"
  FOREIGN KEY ("exerciseId") REFERENCES "LessonExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExerciseAttempt" ADD CONSTRAINT "ExerciseAttempt_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
