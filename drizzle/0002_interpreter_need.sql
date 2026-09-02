CREATE TYPE "public"."InterpreterNeed" AS ENUM('NONE', 'FOR_COMPLEX', 'ALWAYS');--> statement-breakpoint
ALTER TABLE "Resident" ADD COLUMN "interpreterNeed" "InterpreterNeed" DEFAULT 'NONE' NOT NULL;--> statement-breakpoint
CREATE INDEX "Resident_interpreterNeed_idx" ON "Resident" USING btree ("interpreterNeed");