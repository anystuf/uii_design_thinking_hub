-- Release C: evidence file assets, immutable evidence versions and snapshot submissions.
-- All files live in private Supabase Storage, referenced by immutable random storage keys.

CREATE TYPE "UploadStatus" AS ENUM ('PENDING', 'COMPLETED');
CREATE TYPE "SubmissionKind" AS ENUM ('PROJECT', 'MILESTONE');

ALTER TABLE "Evidence" ADD COLUMN "activeVersion" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "ChallengeMilestone" ADD COLUMN "allowLate" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "UploadIntent" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "storageKey" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "declaredSize" INTEGER NOT NULL,
  "status" "UploadStatus" NOT NULL DEFAULT 'PENDING',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UploadIntent_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "FileAsset" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "uploadedById" TEXT NOT NULL,
  "storageKey" TEXT NOT NULL,
  "bucket" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FileAsset_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "EvidenceVersion" (
  "id" TEXT NOT NULL,
  "evidenceId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "type" "EvidenceType" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "reflection" TEXT,
  "fileAssetId" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EvidenceVersion_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "IterationNote" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "mode" "SprintStageType",
  "reason" TEXT NOT NULL,
  "nextDecision" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IterationNote_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SubmissionSnapshot" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "milestoneId" TEXT,
  "scopeKey" TEXT NOT NULL,
  "kind" "SubmissionKind" NOT NULL,
  "version" INTEGER NOT NULL,
  "submittedById" TEXT NOT NULL,
  "status" "SubmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
  "note" TEXT,
  "isLate" BOOLEAN NOT NULL DEFAULT false,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  CONSTRAINT "SubmissionSnapshot_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SubmissionItem" (
  "id" TEXT NOT NULL,
  "submissionId" TEXT NOT NULL,
  "evidenceVersionId" TEXT NOT NULL,
  CONSTRAINT "SubmissionItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UploadIntent_storageKey_key" ON "UploadIntent"("storageKey");
CREATE INDEX "UploadIntent_projectId_status_idx" ON "UploadIntent"("projectId", "status");
CREATE UNIQUE INDEX "FileAsset_storageKey_key" ON "FileAsset"("storageKey");
CREATE INDEX "FileAsset_projectId_idx" ON "FileAsset"("projectId");
CREATE UNIQUE INDEX "EvidenceVersion_evidenceId_version_key" ON "EvidenceVersion"("evidenceId", "version");
CREATE INDEX "EvidenceVersion_createdAt_idx" ON "EvidenceVersion"("createdAt");
CREATE INDEX "IterationNote_projectId_createdAt_idx" ON "IterationNote"("projectId", "createdAt");
CREATE UNIQUE INDEX "SubmissionSnapshot_projectId_scopeKey_version_key" ON "SubmissionSnapshot"("projectId", "scopeKey", "version");
CREATE INDEX "SubmissionSnapshot_projectId_submittedAt_idx" ON "SubmissionSnapshot"("projectId", "submittedAt");
CREATE UNIQUE INDEX "SubmissionItem_submissionId_evidenceVersionId_key" ON "SubmissionItem"("submissionId", "evidenceVersionId");

ALTER TABLE "UploadIntent" ADD CONSTRAINT "UploadIntent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UploadIntent" ADD CONSTRAINT "UploadIntent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EvidenceVersion" ADD CONSTRAINT "EvidenceVersion_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EvidenceVersion" ADD CONSTRAINT "EvidenceVersion_fileAssetId_fkey" FOREIGN KEY ("fileAssetId") REFERENCES "FileAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EvidenceVersion" ADD CONSTRAINT "EvidenceVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "IterationNote" ADD CONSTRAINT "IterationNote_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IterationNote" ADD CONSTRAINT "IterationNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SubmissionSnapshot" ADD CONSTRAINT "SubmissionSnapshot_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SubmissionSnapshot" ADD CONSTRAINT "SubmissionSnapshot_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "ChallengeMilestone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SubmissionSnapshot" ADD CONSTRAINT "SubmissionSnapshot_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SubmissionItem" ADD CONSTRAINT "SubmissionItem_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "SubmissionSnapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SubmissionItem" ADD CONSTRAINT "SubmissionItem_evidenceVersionId_fkey" FOREIGN KEY ("evidenceVersionId") REFERENCES "EvidenceVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Preserve current legacy Evidence as version 1. Its old mock file references
-- are not treated as authentic uploaded binaries in the new workflow.
INSERT INTO "EvidenceVersion"(
  "id", "evidenceId", "version", "type", "title", "description",
  "reflection", "createdById", "createdAt"
)
SELECT gen_random_uuid()::text, "id", 1, "type", "title", "description",
       "reflection", "createdById", "createdAt"
FROM "Evidence";

-- Supabase exposes public schema via Data API unless protected by RLS.
-- Direct browser Data API reads/writes are denied; the NestJS server is
-- the authorized access layer. Supabase admin DB credentials bypass RLS.
DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'User','Course','Lesson','Enrollment','Project','SprintStage','Evidence',
    'File','Feedback','LessonProgress','ProjectMember','Submission','Post',
    'Comment','Reaction','Notification','DesignChallenge','ChallengeMilestone',
    'ProjectInvitation','ProjectTask','ActivityTemplate','ChallengeActivity',
    'ProjectActivity','UploadIntent','FileAsset','EvidenceVersion',
    'IterationNote','SubmissionSnapshot','SubmissionItem'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
  END LOOP;
END $$;
