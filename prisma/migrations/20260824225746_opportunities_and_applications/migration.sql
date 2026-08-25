-- CreateEnum
CREATE TYPE "OpportunityKind" AS ENUM ('VOLUNTEERING', 'COMMUNITY_SERVICE');

-- CreateEnum
CREATE TYPE "PermitRequirement" AS ENUM ('NONE', 'EMPLOYER_NOTIFIES', 'PERMIT_REQUIRED');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ApplicationStage" AS ENUM ('INTERESTED', 'APPLIED', 'INTERVIEW', 'ACCEPTED', 'STARTED', 'ENDED', 'DECLINED');

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "kind" "OpportunityKind" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "organisation" TEXT NOT NULL,
    "location" TEXT,
    "schedule" TEXT,
    "hoursPerWeek" INTEGER,
    "seats" INTEGER,
    "germanLevel" TEXT,
    "permitRequirement" "PermitRequirement" NOT NULL DEFAULT 'NONE',
    "requirementNote" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "website" TEXT,
    "status" "OpportunityStatus" NOT NULL DEFAULT 'DRAFT',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpportunityApplication" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "residentId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "stage" "ApplicationStage" NOT NULL DEFAULT 'INTERESTED',
    "stageChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "createdBy" "ResidentOrStaff" NOT NULL,
    "supportedByUserId" TEXT,
    "learningRecordId" TEXT,

    CONSTRAINT "OpportunityApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Opportunity_status_kind_idx" ON "Opportunity"("status", "kind");

-- CreateIndex
CREATE INDEX "Opportunity_endsAt_idx" ON "Opportunity"("endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "OpportunityApplication_learningRecordId_key" ON "OpportunityApplication"("learningRecordId");

-- CreateIndex
CREATE INDEX "OpportunityApplication_stage_idx" ON "OpportunityApplication"("stage");

-- CreateIndex
CREATE INDEX "OpportunityApplication_opportunityId_stage_idx" ON "OpportunityApplication"("opportunityId", "stage");

-- CreateIndex
CREATE INDEX "OpportunityApplication_residentId_idx" ON "OpportunityApplication"("residentId");

-- CreateIndex
CREATE UNIQUE INDEX "OpportunityApplication_residentId_opportunityId_key" ON "OpportunityApplication"("residentId", "opportunityId");

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityApplication" ADD CONSTRAINT "OpportunityApplication_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityApplication" ADD CONSTRAINT "OpportunityApplication_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityApplication" ADD CONSTRAINT "OpportunityApplication_supportedByUserId_fkey" FOREIGN KEY ("supportedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityApplication" ADD CONSTRAINT "OpportunityApplication_learningRecordId_fkey" FOREIGN KEY ("learningRecordId") REFERENCES "LearningRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;
