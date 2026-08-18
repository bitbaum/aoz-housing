-- CreateEnum
CREATE TYPE "HouseEventCategory" AS ENUM ('HOUSE_MEETING', 'SOCIAL', 'CULTURE', 'SUPPORT');

-- CreateEnum
CREATE TYPE "HouseEventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EventRsvpStatus" AS ENUM ('GOING', 'MAYBE', 'DECLINED');

-- CreateEnum
CREATE TYPE "MarketplacePostKind" AS ENUM ('GIVE_AWAY', 'LEND', 'WANTED');

-- CreateEnum
CREATE TYPE "MarketplacePostCategory" AS ENUM ('FURNITURE', 'KITCHEN', 'CLOTHING', 'ELECTRONICS', 'KIDS', 'OTHER');

-- CreateEnum
CREATE TYPE "MarketplacePostStatus" AS ENUM ('OPEN', 'CLAIMED', 'CLOSED');

-- AlterEnum
ALTER TYPE "CareRole" ADD VALUE 'VOLUNTEERING';

-- AlterEnum
ALTER TYPE "StaffRole" ADD VALUE 'FREIWILLIGENARBEIT';

-- CreateTable
CREATE TABLE "HouseEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "housingUnitId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "HouseEventCategory" NOT NULL DEFAULT 'SOCIAL',
    "location" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "status" "HouseEventStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdByStaffId" TEXT,
    "createdByResidentId" TEXT,

    CONSTRAINT "HouseEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventRsvp" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventId" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "status" "EventRsvpStatus" NOT NULL DEFAULT 'GOING',

    CONSTRAINT "EventRsvp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplacePost" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "housingUnitId" TEXT NOT NULL,
    "postedById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "kind" "MarketplacePostKind" NOT NULL,
    "category" "MarketplacePostCategory" NOT NULL DEFAULT 'OTHER',
    "status" "MarketplacePostStatus" NOT NULL DEFAULT 'OPEN',
    "claimedById" TEXT,
    "closedAt" TIMESTAMP(3),
    "hiddenByStaff" BOOLEAN NOT NULL DEFAULT false,
    "hiddenReason" TEXT,

    CONSTRAINT "MarketplacePost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HouseEvent_housingUnitId_startsAt_idx" ON "HouseEvent"("housingUnitId", "startsAt");

-- CreateIndex
CREATE INDEX "HouseEvent_status_startsAt_idx" ON "HouseEvent"("status", "startsAt");

-- CreateIndex
CREATE INDEX "EventRsvp_eventId_idx" ON "EventRsvp"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "EventRsvp_eventId_residentId_key" ON "EventRsvp"("eventId", "residentId");

-- CreateIndex
CREATE INDEX "MarketplacePost_housingUnitId_status_idx" ON "MarketplacePost"("housingUnitId", "status");

-- CreateIndex
CREATE INDEX "MarketplacePost_postedById_idx" ON "MarketplacePost"("postedById");

-- AddForeignKey
ALTER TABLE "HouseEvent" ADD CONSTRAINT "HouseEvent_housingUnitId_fkey" FOREIGN KEY ("housingUnitId") REFERENCES "HousingUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseEvent" ADD CONSTRAINT "HouseEvent_createdByStaffId_fkey" FOREIGN KEY ("createdByStaffId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseEvent" ADD CONSTRAINT "HouseEvent_createdByResidentId_fkey" FOREIGN KEY ("createdByResidentId") REFERENCES "Resident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRsvp" ADD CONSTRAINT "EventRsvp_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "HouseEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRsvp" ADD CONSTRAINT "EventRsvp_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplacePost" ADD CONSTRAINT "MarketplacePost_housingUnitId_fkey" FOREIGN KEY ("housingUnitId") REFERENCES "HousingUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplacePost" ADD CONSTRAINT "MarketplacePost_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "Resident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplacePost" ADD CONSTRAINT "MarketplacePost_claimedById_fkey" FOREIGN KEY ("claimedById") REFERENCES "Resident"("id") ON DELETE SET NULL ON UPDATE CASCADE;
