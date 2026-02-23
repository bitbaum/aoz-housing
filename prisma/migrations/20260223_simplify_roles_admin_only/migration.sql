-- Migrate all existing users to ADMIN role
UPDATE "User" SET "role" = 'ADMIN' WHERE "role" != 'ADMIN';

-- Update the default value
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'ADMIN';

-- Remove old enum values (PostgreSQL: recreate enum)
ALTER TYPE "StaffRole" RENAME TO "StaffRole_old";
CREATE TYPE "StaffRole" AS ENUM ('ADMIN');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "StaffRole" USING "role"::text::"StaffRole";
DROP TYPE "StaffRole_old";
