-- One conversation per resident with the staff team.
--
-- `residentId` is UNIQUE: a resident has exactly one thread, created on first
-- use. Threads-per-topic would ask the person with a question to decide which
-- of their concerns is "the same conversation" as another, which is filing work
-- we would be handing to them.
CREATE TABLE "MessageThread" (
  "id" TEXT NOT NULL,
  "residentId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MessageThread_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MessageThread_residentId_key" ON "MessageThread"("residentId");
-- A staff inbox sorts by "waiting longest", so this index is what keeps that
-- query from reading every thread's messages.
CREATE INDEX "MessageThread_updatedAt_idx" ON "MessageThread"("updatedAt");

CREATE TABLE "Message" (
  "id" TEXT NOT NULL,
  "threadId" TEXT NOT NULL,
  "authorResidentId" TEXT,
  "authorUserId" TEXT,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "readAt" TIMESTAMP(3),

  CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Message_threadId_createdAt_idx" ON "Message"("threadId", "createdAt");

-- Exactly one author. A message with neither is unattributable and a message
-- with both is a lie about who said it; the database refuses both rather than
-- trusting every future caller to remember.
ALTER TABLE "Message" ADD CONSTRAINT "Message_one_author"
  CHECK (("authorResidentId" IS NOT NULL) <> ("authorUserId" IS NOT NULL));

-- Deleting a resident removes their thread, but NOT the authorship of what
-- anyone said: Restrict on the author columns means a person cannot be erased
-- out from under a conversation staff may have to account for later.
ALTER TABLE "MessageThread" ADD CONSTRAINT "MessageThread_residentId_fkey"
  FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Message" ADD CONSTRAINT "Message_threadId_fkey"
  FOREIGN KEY ("threadId") REFERENCES "MessageThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Message" ADD CONSTRAINT "Message_authorResidentId_fkey"
  FOREIGN KEY ("authorResidentId") REFERENCES "Resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Message" ADD CONSTRAINT "Message_authorUserId_fkey"
  FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
