-- CreateTable
CREATE TABLE "PRReviewComment" (
    "id" SERIAL NOT NULL,
    "provider" TEXT NOT NULL,
    "repo" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "fileSha" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PRReviewComment_pkey" PRIMARY KEY ("id")
);
