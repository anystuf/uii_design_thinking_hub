-- Release D: versioned rubrics, lecturer review and deduplicated notifications.
CREATE TYPE "RubricStatus" AS ENUM ('DRAFT', 'PUBLISHED');
CREATE TYPE "AssessmentStatus" AS ENUM ('PUBLISHED');
CREATE TYPE "ReviewDecision" AS ENUM ('APPROVED', 'REVISION_REQUESTED');

ALTER TABLE "Notification" ADD COLUMN "dedupeKey" TEXT;
CREATE UNIQUE INDEX "Notification_dedupeKey_key" ON "Notification"("dedupeKey");

CREATE TABLE "Rubric" (
  "id" TEXT NOT NULL,
  "challengeId" TEXT NOT NULL,
  "milestoneId" TEXT,
  "title" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Rubric_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "RubricVersion" (
  "id" TEXT NOT NULL,
  "rubricId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "status" "RubricStatus" NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "publishedAt" TIMESTAMP(3),
  CONSTRAINT "RubricVersion_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "RubricCriterion" (
  "id" TEXT NOT NULL,
  "rubricVersionId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "weight" INTEGER NOT NULL,
  "maxScore" INTEGER NOT NULL DEFAULT 4,
  "orderIndex" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "RubricCriterion_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Assessment" (
  "id" TEXT NOT NULL,
  "submissionId" TEXT NOT NULL,
  "reviewerId" TEXT NOT NULL,
  "rubricVersionId" TEXT NOT NULL,
  "status" "AssessmentStatus" NOT NULL DEFAULT 'PUBLISHED',
  "decision" "ReviewDecision" NOT NULL,
  "feedback" TEXT,
  "totalScore" DOUBLE PRECISION NOT NULL,
  "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CriterionScore" (
  "id" TEXT NOT NULL,
  "assessmentId" TEXT NOT NULL,
  "criterionId" TEXT NOT NULL,
  "score" DOUBLE PRECISION NOT NULL,
  "comment" TEXT,
  CONSTRAINT "CriterionScore_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Rubric_challengeId_idx" ON "Rubric"("challengeId");
CREATE UNIQUE INDEX "RubricVersion_rubricId_version_key" ON "RubricVersion"("rubricId", "version");
CREATE INDEX "RubricCriterion_rubricVersionId_orderIndex_idx" ON "RubricCriterion"("rubricVersionId", "orderIndex");
CREATE UNIQUE INDEX "Assessment_submissionId_key" ON "Assessment"("submissionId");
CREATE INDEX "Assessment_reviewerId_createdAt_idx" ON "Assessment"("reviewerId", "createdAt");
CREATE UNIQUE INDEX "CriterionScore_assessmentId_criterionId_key" ON "CriterionScore"("assessmentId", "criterionId");

ALTER TABLE "Rubric" ADD CONSTRAINT "Rubric_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "DesignChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Rubric" ADD CONSTRAINT "Rubric_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "ChallengeMilestone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Rubric" ADD CONSTRAINT "Rubric_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RubricVersion" ADD CONSTRAINT "RubricVersion_rubricId_fkey" FOREIGN KEY ("rubricId") REFERENCES "Rubric"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RubricCriterion" ADD CONSTRAINT "RubricCriterion_rubricVersionId_fkey" FOREIGN KEY ("rubricVersionId") REFERENCES "RubricVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "SubmissionSnapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_rubricVersionId_fkey" FOREIGN KEY ("rubricVersionId") REFERENCES "RubricVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CriterionScore" ADD CONSTRAINT "CriterionScore_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CriterionScore" ADD CONSTRAINT "CriterionScore_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "RubricCriterion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Block direct Data API access to assessments without explicit RLS policies.
ALTER TABLE "Rubric" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RubricVersion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RubricCriterion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Assessment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CriterionScore" ENABLE ROW LEVEL SECURITY;
