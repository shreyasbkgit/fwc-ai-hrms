-- DropIndex
DROP INDEX "Application_userId_jobId_key";

-- AlterTable
ALTER TABLE "Application" ADD COLUMN "aiScore" REAL;
ALTER TABLE "Application" ADD COLUMN "aiSummary" TEXT;
ALTER TABLE "Application" ADD COLUMN "resumeUrl" TEXT;
