-- Unified code-based authentication
-- Replace email/password login with code-based login for staff users.
-- Staff codes: AOZ-XXXXXX, Resident codes: RES-XXXXXX (already exist on Resident model).

-- Step 1: Add code column as nullable first
ALTER TABLE "User" ADD COLUMN "code" TEXT;

-- Step 2: Generate codes for existing users (AOZ- prefix + first 6 chars of id)
UPDATE "User" SET "code" = 'AOZ-' || UPPER(SUBSTRING(REPLACE(id, '-', '') FROM 1 FOR 6))
WHERE "code" IS NULL;

-- Step 3: Make code NOT NULL and add unique constraint + index
ALTER TABLE "User" ALTER COLUMN "code" SET NOT NULL;
ALTER TABLE "User" ADD CONSTRAINT "User_code_key" UNIQUE ("code");
CREATE INDEX "User_code_idx" ON "User"("code");

-- Step 4: Make email optional (drop NOT NULL)
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;

-- Step 5: Drop old email index, keep unique constraint
DROP INDEX IF EXISTS "User_email_idx";
