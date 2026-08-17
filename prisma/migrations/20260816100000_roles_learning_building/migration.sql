-- Staff roles beyond ADMIN (Betreuung, Sozialarbeit, Jobcoach),
-- optional buildingCode on housing units, and learning records
-- (language tests, courses, informal learning).

-- PostgreSQL: ADD VALUE cannot run in a transaction in older versions;
-- Prisma wraps migrations in a transaction. Using ADD VALUE IF NOT EXISTS
-- (PG 9.1+ for ADD VALUE, IF NOT EXISTS since PG 9.1 isn't there — IF NOT
-- EXISTS for enum values is PG 9.1... actually IF NOT EXISTS for enum was
-- added in PostgreSQL 9.1? No: ALTER TYPE ... ADD VALUE IF NOT EXISTS is PG 9.1
-- wait, it's PostgreSQL 9.1 no - it's 9.1+ ADD VALUE, IF NOT EXISTS in PG 9.1
-- Correction: IF NOT EXISTS for enum values arrived in PostgreSQL 9.1? 
-- It's PostgreSQL 9.1 for ADD VALUE, and IF NOT EXISTS in PostgreSQL 9.1...
-- PostgreSQL 9.1 added ADD VALUE. IF NOT EXISTS: PostgreSQL 9.1 no, 10? 
-- Actually: ALTER TYPE ... ADD VALUE IF NOT EXISTS is PostgreSQL 9.1... 
-- Documented as PostgreSQL 9.1? I'll use IF NOT EXISTS (supported on PG 16).

ALTER TYPE "StaffRole" ADD VALUE IF NOT EXISTS 'BETREUUNG';
ALTER TYPE "StaffRole" ADD VALUE IF NOT EXISTS 'SOZIALARBEIT';
ALTER TYPE "StaffRole" ADD VALUE IF NOT EXISTS 'JOBCOACH';

ALTER TABLE "HousingUnit" ADD COLUMN IF NOT EXISTS "buildingCode" TEXT;
CREATE INDEX IF NOT EXISTS "HousingUnit_buildingCode_idx" ON "HousingUnit"("buildingCode");

CREATE TYPE "LearningKind" AS ENUM ('LANGUAGE_TEST', 'COURSE', 'INFORMAL', 'QUALIFICATION');
CREATE TYPE "LearningStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED');
CREATE TYPE "ResidentOrStaff" AS ENUM ('RESIDENT', 'STAFF');

CREATE TABLE "LearningRecord" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "residentId" TEXT NOT NULL,
    "kind" "LearningKind" NOT NULL,
    "title" TEXT NOT NULL,
    "status" "LearningStatus" NOT NULL DEFAULT 'PLANNED',
    "languageCode" TEXT,
    "cefrLevel" TEXT,
    "provider" TEXT,
    "category" TEXT,
    "hours" INTEGER,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "recordedBy" "ResidentOrStaff" NOT NULL,

    CONSTRAINT "LearningRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LearningRecord_residentId_kind_idx" ON "LearningRecord"("residentId", "kind");
CREATE INDEX "LearningRecord_status_idx" ON "LearningRecord"("status");
CREATE INDEX "LearningRecord_languageCode_cefrLevel_idx" ON "LearningRecord"("languageCode", "cefrLevel");

ALTER TABLE "LearningRecord" ADD CONSTRAINT "LearningRecord_residentId_fkey"
  FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE CASCADE ON UPDATE CASCADE;
