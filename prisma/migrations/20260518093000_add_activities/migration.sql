-- CreateEnum
CREATE TYPE "ActivityCategory" AS ENUM ('SPORT', 'LANGUAGE', 'CULTURE', 'COMMUNITY', 'FAMILY', 'SUPPORT');

-- CreateEnum
CREATE TYPE "ActivityCost" AS ENUM ('FREE', 'REDUCED', 'PAID');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Activity" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" "ActivityCategory" NOT NULL,
  "cost" "ActivityCost" NOT NULL DEFAULT 'FREE',
  "costNote" TEXT,
  "location" TEXT,
  "website" TEXT,
  "phone" TEXT,
  "schedule" TEXT,
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "status" "ActivityStatus" NOT NULL DEFAULT 'DRAFT',
  "highlight" BOOLEAN NOT NULL DEFAULT false,
  "createdByUserId" TEXT,
  "updatedByUserId" TEXT,

  CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Activity_status_category_idx" ON "Activity"("status", "category");

-- CreateIndex
CREATE INDEX "Activity_status_highlight_idx" ON "Activity"("status", "highlight");

-- CreateIndex
CREATE INDEX "Activity_endsAt_idx" ON "Activity"("endsAt");

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
