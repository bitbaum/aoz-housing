# Witikon setup — superseded

created_date: 2026-01-24
last_modified_date: 2026-09-07
last_modified_summary: Retired. It described a January demo fixture (WITIKON-440, 8 beds, 8 invented residents) that the real deployment replaced; every figure in it was wrong.

**This file described a demonstration fixture, not the deployment.** It
documented an apartment `WITIKON-440` at "Witikonerstrasse 440" with 4 rooms,
8 beds and 8 residents created by `scripts/create-witikon-residents.ts`.

None of that is what runs. Verified against the production database on
2026-09-07:

| | Reality |
|---|---|
| Live apartment | `WIT-458` — Witikonerstrasse 458, 8053 Zürich |
| Capacity | 5 beds, 3 currently occupied |
| Everything else | 117 further `WIT-*` units, all `CLOSED` with 0 beds — imported building stock, not places anyone lives |

## Where the truth lives

- **The apartment itself:** `scripts/db/real/witikonerstrasse-458.ts` — layout
  and who lives where, as config. This is the SSOT; a doc that restates it just
  becomes a second copy that drifts, which is exactly what happened here.
- **Seeding a real instance:** `scripts/db/seed-real.ts` (with `--wipe` to
  convert a demo instance in place). Login codes are generated at runtime and
  printed once — never committed, and never in a document.
- **Where it runs:** [docs/INFRASTRUCTURE.md](docs/INFRASTRUCTURE.md).

## The part worth remembering

A real instance must run with `DEMO_ACCESS_ENABLED` understood: the live
deployment keeps the demo doors open alongside real data, which is safe only
because the daily reset deletes strictly by CODE PREFIX and never truncates a
table. See `src/lib/demo/scoped-reset.ts`, and CLAUDE.md's "Demo Access"
section, before changing anything about that.

The original text remains in git history.
