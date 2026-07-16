-- Migrate all existing users to ADMIN role
UPDATE "User" SET "role" = 'ADMIN' WHERE "role" != 'ADMIN';

-- Remove old enum values (PostgreSQL: recreate enum).
-- The default must be dropped before the column type changes — Postgres
-- cannot cast a default expression to the new enum automatically.
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TYPE "StaffRole" RENAME TO "StaffRole_old";
CREATE TYPE "StaffRole" AS ENUM ('ADMIN');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "StaffRole" USING "role"::text::"StaffRole";
DROP TYPE "StaffRole_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'ADMIN';
