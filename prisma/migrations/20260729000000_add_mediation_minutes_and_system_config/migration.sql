-- Repair schema drift: these objects exist in schema.prisma (and in databases
-- updated via `prisma db push`) but were never captured in a migration, so
-- fresh replays (CI/E2E, new envs) were missing them. IF NOT EXISTS makes this
-- a no-op on databases that already have them.

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
