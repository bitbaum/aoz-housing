-- Credentials move OFF the identity rows (User, Resident) onto Account, so one
-- human can hold both roles with ONE login. Order matters: create the table,
-- carry existing emails across, and only then drop the old columns.

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "emailVerifiedAt" TIMESTAMP(3),
    "userId" TEXT,
    "residentId" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_email_key" ON "Account"("email");
CREATE UNIQUE INDEX "Account_userId_key" ON "Account"("userId");
CREATE UNIQUE INDEX "Account_residentId_key" ON "Account"("residentId");
CREATE INDEX "Account_userId_idx" ON "Account"("userId");
CREATE INDEX "Account_residentId_idx" ON "Account"("residentId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Account" ADD CONSTRAINT "Account_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Carry known emails across — and the passwords worth carrying.
--
-- Cost-10 hashes ($2b$10$) are leftovers from the retired email/password login
-- (Feb 2026): nobody knows those passwords, and keeping one would report the
-- code as "already registered" and lock its owner out forever. Today's hashes
-- are cost 12 (lib/auth/passwords.ts), so the work factor is an exact, honest
-- discriminator between a dead credential and a live one. A dropped hash leaves
-- the account in its true state — known email, no password — recoverable via
-- /forgot-password, which is precisely the mailbox-control proof it should need.
INSERT INTO "Account" ("id", "createdAt", "updatedAt", "email", "passwordHash", "emailVerifiedAt", "userId")
SELECT
  md5(random()::text || clock_timestamp()::text || "id"),
  now(), now(),
  lower("email"),
  CASE WHEN "passwordHash" LIKE '$2%$10$%' THEN NULL ELSE "passwordHash" END,
  "emailVerifiedAt",
  "id"
FROM "User"
WHERE "email" IS NOT NULL AND "email" <> '';

INSERT INTO "Account" ("id", "createdAt", "updatedAt", "email", "passwordHash", "emailVerifiedAt", "residentId")
SELECT
  md5(random()::text || clock_timestamp()::text || "id"),
  now(), now(),
  lower("email"),
  CASE WHEN "passwordHash" LIKE '$2%$10$%' THEN NULL ELSE "passwordHash" END,
  "emailVerifiedAt",
  "id"
FROM "Resident"
WHERE "email" IS NOT NULL AND "email" <> ''
  -- One email = one account. Where a staff row already claimed it, the resident
  -- code is linked afterwards through /register, which requires the account
  -- password — an automatic merge here would join two identities on a string.
  AND lower("email") NOT IN (SELECT "email" FROM "Account");

-- Reset tokens are single-use and short-lived; re-pointing them across a
-- credential-model change is not worth the risk of mis-linking one.
DELETE FROM "AuthToken";

-- DropForeignKey
ALTER TABLE "AuthToken" DROP CONSTRAINT "AuthToken_residentId_fkey";
ALTER TABLE "AuthToken" DROP CONSTRAINT "AuthToken_userId_fkey";

-- DropIndex
DROP INDEX "AuthToken_residentId_purpose_idx";
DROP INDEX "AuthToken_userId_purpose_idx";
DROP INDEX "Resident_email_key";
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "AuthToken" DROP COLUMN "residentId",
DROP COLUMN "userId",
ADD COLUMN     "accountId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Resident" DROP COLUMN "email",
DROP COLUMN "emailVerifiedAt",
DROP COLUMN "passwordHash";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "email",
DROP COLUMN "emailVerifiedAt",
DROP COLUMN "passwordHash";

-- CreateIndex
CREATE INDEX "AuthToken_accountId_purpose_idx" ON "AuthToken"("accountId", "purpose");

-- AddForeignKey
ALTER TABLE "AuthToken" ADD CONSTRAINT "AuthToken_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
