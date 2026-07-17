-- Catch-up migration: these objects existed in schema.prisma but were never
-- captured in a migration (applied to some environments via `db push`).
-- IF NOT EXISTS guards keep this safe on databases that already have them.

-- AlterTable
ALTER TABLE "Incident" ADD COLUMN IF NOT EXISTS "mediationMinutes" INTEGER;

-- CreateTable
CREATE TABLE IF NOT EXISTS "SystemConfig" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "pilotBaselineIncidentsPerMonth" DOUBLE PRECISION,
    "pilotBaselineRelocationsPerMonth" DOUBLE PRECISION,
    "pilotBaselineMediationHoursPerWeek" DOUBLE PRECISION,
    "pilotStartDate" TIMESTAMP(3),

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);
