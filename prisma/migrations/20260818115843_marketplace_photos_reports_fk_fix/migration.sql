-- DropForeignKey
ALTER TABLE "MarketplacePost" DROP CONSTRAINT "MarketplacePost_postedById_fkey";

-- AlterTable
ALTER TABLE "MarketplacePost" ALTER COLUMN "postedById" DROP NOT NULL;

-- CreateTable
CREATE TABLE "MarketplacePostPhoto" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "postId" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "mimeType" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MarketplacePostPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceReport" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "postId" TEXT NOT NULL,
    "reportedById" TEXT,
    "reason" TEXT NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "resolution" TEXT,

    CONSTRAINT "MarketplaceReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarketplacePostPhoto_postId_idx" ON "MarketplacePostPhoto"("postId");

-- CreateIndex
CREATE INDEX "MarketplaceReport_postId_idx" ON "MarketplaceReport"("postId");

-- CreateIndex
CREATE INDEX "MarketplaceReport_resolvedAt_idx" ON "MarketplaceReport"("resolvedAt");

-- AddForeignKey
ALTER TABLE "MarketplacePost" ADD CONSTRAINT "MarketplacePost_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "Resident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplacePostPhoto" ADD CONSTRAINT "MarketplacePostPhoto_postId_fkey" FOREIGN KEY ("postId") REFERENCES "MarketplacePost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceReport" ADD CONSTRAINT "MarketplaceReport_postId_fkey" FOREIGN KEY ("postId") REFERENCES "MarketplacePost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceReport" ADD CONSTRAINT "MarketplaceReport_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "Resident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceReport" ADD CONSTRAINT "MarketplaceReport_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
