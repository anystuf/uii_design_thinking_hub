-- Standalone community questions coexist with existing one-post-per-project showcases.
-- Nullable projectId retains the existing UNIQUE constraint for actual project posts.
ALTER TABLE "Post" ALTER COLUMN "projectId" DROP NOT NULL;
ALTER TABLE "Post"
  ADD COLUMN "title" TEXT,
  ADD COLUMN "topic" TEXT,
  ADD COLUMN "acceptedCommentId" TEXT;
CREATE INDEX "Post_topic_publishedAt_idx" ON "Post"("topic", "publishedAt");
