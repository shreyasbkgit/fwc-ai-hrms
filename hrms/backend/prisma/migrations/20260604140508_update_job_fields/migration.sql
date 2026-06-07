/*
  Warnings:

  - Added the required column `employmentType` to the `Job` table without a default value. This is not possible if the table is not empty.
  - Added the required column `experienceRequired` to the `Job` table without a default value. This is not possible if the table is not empty.
  - Added the required column `openings` to the `Job` table without a default value. This is not possible if the table is not empty.
  - Added the required column `salaryRange` to the `Job` table without a default value. This is not possible if the table is not empty.
  - Added the required column `skillsRequired` to the `Job` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "skillsRequired" TEXT NOT NULL,
    "experienceRequired" TEXT NOT NULL,
    "salaryRange" TEXT NOT NULL,
    "employmentType" TEXT NOT NULL,
    "openings" INTEGER NOT NULL,
    "location" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Job" ("createdAt", "description", "id", "location", "title") SELECT "createdAt", "description", "id", "location", "title" FROM "Job";
DROP TABLE "Job";
ALTER TABLE "new_Job" RENAME TO "Job";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
