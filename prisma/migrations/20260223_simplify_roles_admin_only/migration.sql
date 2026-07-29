-- Migrate all existing users to ADMIN role
UPDATE "User" SET "role" = 'ADMIN' WHERE "role" != 'ADMIN';

-- Drop the default before the type change: Postgres cannot auto-cast an
-- existing default when the column type changes (error 42804 on fresh replay)
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;

-- Remove old enum values (PostgreSQL: recreate enum)
ALTER TYPE "StaffRole" RENAME TO "StaffRole_old";
CREATE TYPE "StaffRole" AS ENUM ('ADMIN');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "StaffRole" USING "role"::text::"StaffRole";
DROP TYPE "StaffRole_old";

-- Restore the default on the new enum type
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'ADMIN';
