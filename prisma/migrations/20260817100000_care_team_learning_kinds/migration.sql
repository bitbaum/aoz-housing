-- Care team (Wohnen / Sozialarbeit / Jobcoach) and two extra learning kinds
-- for volunteering hours and community service.

ALTER TYPE "LearningKind" ADD VALUE IF NOT EXISTS 'VOLUNTEERING';
ALTER TYPE "LearningKind" ADD VALUE IF NOT EXISTS 'COMMUNITY_SERVICE';

CREATE TYPE "CareRole" AS ENUM ('HOUSING', 'SOCIAL', 'JOB');

CREATE TABLE "CareAssignment" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "residentId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "role" "CareRole" NOT NULL,

    CONSTRAINT "CareAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CareAssignment_residentId_role_key" ON "CareAssignment"("residentId", "role");
CREATE INDEX "CareAssignment_staffId_idx" ON "CareAssignment"("staffId");

ALTER TABLE "CareAssignment" ADD CONSTRAINT "CareAssignment_residentId_fkey"
    FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CareAssignment" ADD CONSTRAINT "CareAssignment_staffId_fkey"
    FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
