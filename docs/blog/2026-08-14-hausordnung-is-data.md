# The Hausordnung is now data

*2026-08-14*

Every AOZ resident signs a two-page paper Hausordnung on moving in. Until
today, the app's org-level rule catalog was a plausible *approximation* of
it — written from domain knowledge, not from the document. Approximation is
the wrong relationship for a rule book to have with reality. Three examples
of what "plausible" got wrong:

| Topic | App said | Signed document says |
|---|---|---|
| Overnight guests | allowed with permission | **no overnight guests** |
| Pets | allowed with written permission | **not permitted** |
| Quiet hours | 22:00–07:00 | 22:00–07:00 **and 12:00–13:00 and Sun/holidays** |

A resident who reads a softer rule in the app than the one they signed is
being set up for a warning — or worse, for a conflict with a neighbor who
knows the real rule. In a product whose entire job is preventing
conflicts, the rule book being wrong is not a content bug; it is a product
bug.

## What shipped

- The org catalog (`ORG_RULE_CATALOG`) was rewritten section-by-section
  against the signed document (Stand Januar 2026): Ruhezeiten, Besucher,
  Sauberkeit (incl. daily airing), Gemeinschaftsräume (appliances, laundry
  drying), Abfall/Recycling (Züri-Säcke, ERZ), Ausbau & Geräte, Sicherheit
  & Feuerschutz (incl. unattended cooking, entrance doors, keys),
  Haustiere, Meldewege & Kostenfolgen, Zutrittsregelung, Erreichbarkeit.
- **Nobody is silently re-bound.** Amended wording bumps the rule's
  version; the acknowledgement system asks every affected resident to read
  exactly the rules that changed. That machinery existed before today —
  this is the event it was built for.
- **The delegation hierarchy survived contact with reality.** The paper
  document is all obligations, but the layered model still fits: quiet
  hours and guest rules stay `UNIT_MAY_STRENGTHEN` (a house may go
  stricter, never looser), cleaning organization stays with the house, and
  the non-negotiables (`pets`, keys, cooking supervision) are `FIXED` —
  pinned by a new test so a refactor can't quietly soften them.
- **Real phone numbers.** The help page used to show invented-but-plausible
  contact details. It now shows the channels from the signed document —
  Bewirtschaftung 044 415 67 31 / bewirtschaftung@aoz.ch (09:00–11:00,
  14:00–16:00), emergency 044 415 63 30 outside office hours — from one
  config (`src/lib/config/organization.ts`). A resident in trouble will
  dial whatever number we print; printing a guessed one is worse than
  printing none.
- **Consequences ship with the rules.** The Sanktionen ladder (warning →
  fristlose Kündigung) from the document now renders at the bottom of the
  portal rule book. A consequence nobody was told about is not a
  consequence, it is a surprise.

## The platform lesson

Nothing in this change touched application code paths — it edited two
config files, one label file, and one page section. That is the test the
architecture is supposed to pass: an organization's actual rulebook, with
its city-specific details (blue Züri bags, ERZ collection points), is a
*seed*, not a feature. The next organization brings its own signed
document, and it should land the same way: as data.
