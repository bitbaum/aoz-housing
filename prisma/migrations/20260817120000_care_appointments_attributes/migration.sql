-- Appointments and catalog-driven care attributes (Wohnen / Sozialarbeit / Jobcoach).

CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "residentId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "domain" "CareRole" NOT NULL,
    "title" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "location" TEXT,
    "notes" TEXT,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Appointment_residentId_startsAt_idx" ON "Appointment"("residentId", "startsAt");
CREATE INDEX "Appointment_staffId_startsAt_idx" ON "Appointment"("staffId", "startsAt");
CREATE INDEX "Appointment_status_idx" ON "Appointment"("status");

ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_residentId_fkey"
    FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_staffId_fkey"
    FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "CareAttribute" (
    "id" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "residentId" TEXT NOT NULL,
    "domain" "CareRole" NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,

    CONSTRAINT "CareAttribute_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CareAttribute_residentId_domain_key_key" ON "CareAttribute"("residentId", "domain", "key");
CREATE INDEX "CareAttribute_residentId_domain_idx" ON "CareAttribute"("residentId", "domain");

ALTER TABLE "CareAttribute" ADD CONSTRAINT "CareAttribute_residentId_fkey"
    FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CareAttribute" ADD CONSTRAINT "CareAttribute_updatedById_fkey"
    FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
