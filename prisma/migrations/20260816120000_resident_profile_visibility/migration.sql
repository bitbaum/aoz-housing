-- Who may see a resident's self-chosen profile.
--
-- The default is ROOMMATES, which is exactly what the photo endpoint already
-- enforced in code: self plus the people you currently live with. Choosing it
-- as the default means nobody's profile becomes MORE visible the moment this
-- migration runs — a privacy setting whose rollout widens existing exposure
-- would be the opposite of what it is for.
CREATE TYPE "ProfileVisibility" AS ENUM ('PRIVATE', 'ROOMMATES', 'RESIDENTS');

ALTER TABLE "Resident"
  ADD COLUMN "profileVisibility" "ProfileVisibility" NOT NULL DEFAULT 'ROOMMATES';
