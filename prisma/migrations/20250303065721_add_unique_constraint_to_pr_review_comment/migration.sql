/*
  Warnings:

  - A unique constraint covering the columns `[provider,repo,owner,filePath]` on the table `PRReviewComment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PRReviewComment_provider_repo_owner_filePath_key" ON "PRReviewComment"("provider", "repo", "owner", "filePath");
