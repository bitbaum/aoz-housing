# Implementation Summary — superseded

created_date: 2026-01-24
last_modified_date: 2026-09-07
last_modified_summary: Retired. It was a point-in-time snapshot of "everything built so far", and it had drifted into stating the opposite of the truth about the live database.

**This file no longer describes the product.** It was written as a snapshot of
work completed for what was then an "intelligent matching system", and a
snapshot is stale the day after it is taken. What replaced it:

| Question | Where the answer lives |
|---|---|
| What shipped, and when | [CHANGELOG.md](CHANGELOG.md) — also the public `/changelog` |
| What the product is and does | [README.md](README.md) |
| Where it runs | [docs/INFRASTRUCTURE.md](docs/INFRASTRUCTURE.md) |
| Where it is going | [docs/ROADMAP.md](docs/ROADMAP.md) — also the public `/roadmap` |
| How to work in this repo | [CLAUDE.md](CLAUDE.md) |

## Why it was retired rather than updated

Two of its claims had become actively misleading, and one of them was unsafe.

**It said the database holds no real people.** Under "What's NOT Included" it
listed:

> ❌ **Real AOZ data** — All data is demo/fictional for presentation

That stopped being true on **2026-08-13**, when the live instance switched to
REAL mode. `aoz.orangecat.ch` holds real clients in a real apartment
(Witikonerstrasse 458). A document telling a reader the data is fictional is
the kind of thing somebody acts on — by wiping it, by screenshotting it, by
running a destructive script against it. That is a safeguarding problem, not a
documentation one.

**It described the product as a matching system.** Placement and compatibility
are now the base layer of an integration operations tool that also covers
labour-market integration, volunteering, learning, house governance, shared
expenses, a marketplace, and the admin facts a client keeps about themselves.
Naming the base layer as the whole thing undersells it and misdirects whoever
reads it first.

The original text remains in git history if it is ever needed as a record of
what the product looked like in January 2026.
