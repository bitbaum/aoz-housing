-- Which PLACES a staff member is responsible for.
--
-- `role` says which care domain, `scope` says how many domains, and neither
-- answers "which houses". Every staff member could list every resident in every
-- building, which is invisible at one apartment and wrong at AOZ's actual
-- scale: 31 sites, 16 of them in the city, a portfolio that turns over every
-- few years (Schärenmoos closed, Ettenfeld opened in its place, Mittelleimbach
-- from 2026), and a `Springer*in` role advertised as "kein fester Arbeitsort" —
-- one person covering some sites but not others.
--
-- NOBODY'S ACCESS CHANGES TODAY. Every existing row defaults to ALL_UNITS,
-- which is exactly what they had before this column existed — the same
-- discipline the ADMIN→scope migration used. Narrowing a person is then a
-- deliberate act, never a side effect of a deploy.
CREATE TYPE "SiteAccess" AS ENUM ('ALL_UNITS', 'ASSIGNED_UNITS');

ALTER TABLE "User"
  ADD COLUMN "siteAccess" "SiteAccess" NOT NULL DEFAULT 'ALL_UNITS';

-- A join, not a `String[]` of unit ids on User: a unit that closes must take
-- its access rows with it, or a churning portfolio accumulates ids pointing at
-- nothing. Cascade both ways — this table is pure access wiring and holds no
-- history worth keeping once either side is gone.
CREATE TABLE "StaffUnit" (
  "id"            TEXT NOT NULL,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "staffId"       TEXT NOT NULL,
  "housingUnitId" TEXT NOT NULL,

  CONSTRAINT "StaffUnit_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "StaffUnit"
  ADD CONSTRAINT "StaffUnit_staffId_fkey"
  FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StaffUnit"
  ADD CONSTRAINT "StaffUnit_housingUnitId_fkey"
  FOREIGN KEY ("housingUnitId") REFERENCES "HousingUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- One row per (person, unit). Assigning twice is the same fact, not two.
CREATE UNIQUE INDEX "StaffUnit_staffId_housingUnitId_key" ON "StaffUnit"("staffId", "housingUnitId");
CREATE INDEX "StaffUnit_housingUnitId_idx" ON "StaffUnit"("housingUnitId");
