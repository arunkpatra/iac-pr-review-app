/*
  Warnings:

  - Added the required column `filePath` to the `PRReviewComment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PRReviewComment" ADD COLUMN     "filePath" TEXT NOT NULL;
