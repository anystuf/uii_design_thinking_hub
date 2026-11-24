-- Release B: challenge-based studio, teams/tasks and mode-specific activities.
-- Backward compatible: existing Project and ProjectMember records remain linked to Course.
CREATE TYPE "ChallengeStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');
CREATE TYPE "ProjectTaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');
CREATE TYPE "ActivityStatus" AS ENUM ('DRAFT', 'COMPLETED');

CREATE TABLE "DesignChallenge" (
  "id" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "brief" TEXT NOT NULL,
  "learningOutcomes" TEXT,
  "status" "ChallengeStatus" NOT NULL DEFAULT 'DRAFT',
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DesignChallenge_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ChallengeMilestone" (
  "id" TEXT NOT NULL,
  "challengeId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "mode" "SprintStageType",
  "dueAt" TIMESTAMP(3),
  "deliverables" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ChallengeMilestone_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Project" ADD COLUMN "challengeId" TEXT;
ALTER TABLE "ProjectMember" ADD COLUMN "challengeId" TEXT;

CREATE TABLE "ProjectInvitation" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "invitedUserId" TEXT NOT NULL,
  "invitedById" TEXT NOT NULL,
  "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "respondedAt" TIMESTAMP(3),
  CONSTRAINT "ProjectInvitation_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ProjectTask" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" "ProjectTaskStatus" NOT NULL DEFAULT 'TODO',
  "assigneeId" TEXT,
  "createdById" TEXT NOT NULL,
  "dueAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProjectTask_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ActivityTemplate" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "mode" "SprintStageType" NOT NULL,
  "instructions" TEXT NOT NULL,
  "fields" JSONB NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ActivityTemplate_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ChallengeActivity" (
  "id" TEXT NOT NULL,
  "challengeId" TEXT NOT NULL,
  "templateId" TEXT NOT NULL,
  "instructions" TEXT,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChallengeActivity_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ProjectActivity" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "challengeActivityId" TEXT,
  "templateId" TEXT NOT NULL,
  "mode" "SprintStageType" NOT NULL,
  "content" JSONB NOT NULL,
  "status" "ActivityStatus" NOT NULL DEFAULT 'DRAFT',
  "createdById" TEXT NOT NULL,
  "updatedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProjectActivity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DesignChallenge_courseId_status_idx" ON "DesignChallenge"("courseId", "status");
CREATE INDEX "ChallengeMilestone_challengeId_dueAt_idx" ON "ChallengeMilestone"("challengeId", "dueAt");
CREATE INDEX "ProjectInvitation_invitedUserId_status_idx" ON "ProjectInvitation"("invitedUserId", "status");
CREATE INDEX "ProjectTask_projectId_status_idx" ON "ProjectTask"("projectId", "status");
CREATE INDEX "ProjectActivity_projectId_mode_idx" ON "ProjectActivity"("projectId", "mode");
CREATE UNIQUE INDEX "ProjectMember_challengeId_userId_key" ON "ProjectMember"("challengeId", "userId");
CREATE UNIQUE INDEX "ProjectInvitation_projectId_invitedUserId_key" ON "ProjectInvitation"("projectId", "invitedUserId");
CREATE UNIQUE INDEX "ActivityTemplate_slug_key" ON "ActivityTemplate"("slug");
CREATE UNIQUE INDEX "ChallengeActivity_challengeId_templateId_key" ON "ChallengeActivity"("challengeId", "templateId");

ALTER TABLE "DesignChallenge" ADD CONSTRAINT "DesignChallenge_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChallengeMilestone" ADD CONSTRAINT "ChallengeMilestone_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "DesignChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "DesignChallenge"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "DesignChallenge"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProjectInvitation" ADD CONSTRAINT "ProjectInvitation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectInvitation" ADD CONSTRAINT "ProjectInvitation_invitedUserId_fkey" FOREIGN KEY ("invitedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectInvitation" ADD CONSTRAINT "ProjectInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProjectTask" ADD CONSTRAINT "ProjectTask_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectTask" ADD CONSTRAINT "ProjectTask_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProjectTask" ADD CONSTRAINT "ProjectTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChallengeActivity" ADD CONSTRAINT "ChallengeActivity_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "DesignChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChallengeActivity" ADD CONSTRAINT "ChallengeActivity_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ActivityTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProjectActivity" ADD CONSTRAINT "ProjectActivity_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectActivity" ADD CONSTRAINT "ProjectActivity_challengeActivityId_fkey" FOREIGN KEY ("challengeActivityId") REFERENCES "ChallengeActivity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProjectActivity" ADD CONSTRAINT "ProjectActivity_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ActivityTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProjectActivity" ADD CONSTRAINT "ProjectActivity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProjectActivity" ADD CONSTRAINT "ProjectActivity_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
