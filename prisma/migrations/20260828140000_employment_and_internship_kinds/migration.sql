-- Work becomes something this product can hold.
--
-- `Opportunity` had two kinds, VOLUNTEERING and COMMUNITY_SERVICE, both unpaid
-- by definition. So the job coach role, the JOB care domain and the job_goal /
-- work_status attributes all shipped while the object their work is about did
-- not exist, and `PermitRequirement` — plainly built for employment — only ever
-- decorated unpaid volunteering, the one case where it cannot matter.
--
-- Added to BOTH enums in one migration on purpose: a started application
-- becomes a LearningRecord of the same kind with no translation table, so a
-- value present on one side and absent on the other fails as a Prisma enum
-- error at the exact moment a coach is recording real work.

ALTER TYPE "OpportunityKind" ADD VALUE IF NOT EXISTS 'EMPLOYMENT';
ALTER TYPE "OpportunityKind" ADD VALUE IF NOT EXISTS 'INTERNSHIP';

ALTER TYPE "LearningKind" ADD VALUE IF NOT EXISTS 'EMPLOYMENT';
ALTER TYPE "LearningKind" ADD VALUE IF NOT EXISTS 'INTERNSHIP';
