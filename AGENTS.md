# AGENTS.md — aoz-housing

Compatibility-based housing placement for AOZ (reduce roommate conflicts, improve
refugee wellbeing). Serves a vulnerable population — see `CLAUDE.md` for the full
mission, ethical boundaries (never track medical/immigration/religion), and the
design-system + Swiss-German UI rules. This file is the quick operational map.

## Stack

Next.js 14 (App Router) · TypeScript (strict) · PostgreSQL + Prisma · Zod (SSOT
for types) · Tailwind v3 · Jest + Playwright. Deployed on Vercel.

## Everyday commands

```bash
npm run dev       # Next.js dev server (default :3000)
npm run verify    # SSOT gate: lint + typecheck + unit tests (with coverage)
npm run build     # prisma generate && next build
npm test          # Jest unit tests only
npm run test:e2e  # Playwright E2E (needs a running Postgres)
```

## verify — the single source of truth for checks

`npm run verify` runs the exact pre-build check chain: `next lint` →
`tsc --noEmit` → `jest --coverage` (Jest enforces `coverageThreshold` from
`jest.config.ts`). CI (`.github/workflows/ci.yml`) calls `npm run verify`
verbatim, so a green local `verify` means a green CI check stage. Run it before
committing. Never re-list these checks inline — change them here (`package.json`)
only.

CI stages: **verify** → **build** → **e2e** (Playwright against a real Postgres
service container). `build` and `e2e` are gated on `verify` passing.

## Prisma / database

- Schema (SSOT): `prisma/schema.prisma`. Migrations: `prisma/migrations/`.
- Dev schema change: edit schema → `npx prisma migrate dev --name <change>` →
  `npm run prisma:generate` → restart dev server.
- Production migrations run automatically at deploy (see below); never edit an
  already-applied migration — always add a new one.
- Seed admin: `npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-admin.ts`
  (default login code `AOZ-ADMIN1`).

## Deploy path

Vercel. `vercel.json` sets `buildCommand: "npm run prisma:migrate && npm run build"`,
so `prisma migrate deploy` applies pending migrations against the production DB on
every deploy. A daily cron hits `/api/cron/notifications` (08:00). Push to
`master` triggers the deploy; watch it to `Ready` before calling a change shipped.

## Guardrails

- Config is SSOT: factors in `src/lib/config/`, German UI labels in
  `src/lib/constants/labels/`, design tokens in `src/app/globals.css`. Adding a
  factor should touch ≤2 files (config + schema).
- Swiss German everywhere in UI: always umlauts (ä/ö/ü), `ss` never `ß`.
- Mobile-first; touch targets ≥44px. Full detail in `CLAUDE.md`.
