# Changelog

All notable changes to this project are documented here, newest first.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); the
project does not tag semver releases yet — entries are grouped by deploy date
(the product deploys continuously from `master`).

Related documents: [Roadmap](docs/ROADMAP.md) · [Blog](docs/blog/README.md)

## Unreleased

### Changed
- **The org rule catalog now IS the signed AOZ Hausordnung.** The in-app
  AOZ tier of the rule book was rewritten against the official two-page
  Hausordnung every resident signs on paper (Stand Januar 2026). Materially
  corrected rules: visiting hours are 08:00–22:00 with **no overnight
  guests** (previously "with permission"), pets are **not permitted**
  (previously "with permission"), quiet hours now include the midday rest
  12:00–13:00 and Sundays/holidays. Amended rules bump their version, so
  every resident is asked to re-acknowledge exactly the wording that
  changed — nobody stays bound to text they never saw.
- **Real contact channels replace invented ones.** The portal help page and
  every "contact us" fallback now carry the channels from the signed
  document — Bewirtschaftung 044 415 67 31 / bewirtschaftung@aoz.ch
  (office hours 09:00–11:00, 14:00–16:00) and the out-of-hours emergency
  number 044 415 63 30 — sourced from a single new config
  (`src/lib/config/organization.ts`) instead of numbers hardcoded in labels.

### Added
- New AOZ rules covering the previously missing Hausordnung sections: keys
  and entrance doors, unattended cooking, waste & recycling (Züri-Säcke,
  ERZ), daily airing, care of property & repairs, staff access &
  appointments, reachability & absence.
- "Sanktionen und Konsequenzen" section on the portal rule book — the
  enforcement ladder (warning → termination) is shown with the rules it
  enforces.
- Catalog guard test pinning the Hausordnung coverage and the
  non-negotiable rules (`src/lib/config/__tests__/house-rules.test.ts`).
- This changelog, the [roadmap](docs/ROADMAP.md) and the
  [engineering blog](docs/blog/README.md).

## 2026-08-13 — Real deployment + full-product demo

- The live instance switched to REAL mode: one actual shared flat
  (Witikonerstrasse 458) under the `wg` brand, with the demo doors kept
  alongside via prefix-scoped daily reset (#37–#39, #43–#44).
- Reports route to the desk that can act on them: maintenance reports land
  on the maintenance board, conflicts on the incident ladder — residents
  still see one merged list (#43).
- One account, two roles: email+password credentials live on `Account`,
  optionally linked to both a staff and a resident identity (#40, #42).
- Admin megamenu navigation (#41).

## 2026-07 — Governance, expenses, identity

- Two-tier house rules (org floor + house rules), house decisions with
  quorum/threshold snapshots, and the conflict-resolution ladder (#19,
  #21, #24).
- Brand becomes config: `aoz` / `aozh` / `wg` presets, AOZ palette
  preserved byte-for-byte; flat/technical design language re-skin (#22,
  #30, #38).
- Shared expenses (integer Rappen, full-history balances, debt
  simplification), resident self-profiles with photos, apartment profiles
  (#35, #36).
- AI-assisted intake: fill the resident form from prose (#29, #31).
- CI: green PRs merge and deploy themselves; merge queue drains
  oldest-first (#18, #20, #25, #28).

## 2026-06 — Self-hosting and hardening

- Migrated off Vercel/Neon/Supabase to a self-hosted Hetzner box
  (2026-06-12); deploy on push to `master` (#15).
- Security, accessibility, DB performance and i18n hardening across four
  audit sweeps; env validation, `/api/health`, Sentry tagging, JWT schema
  validation.
- E2E gate made real and green (#14, #26).

## 2026-05-28 — Initial build

- Compatibility-based placement: config-driven resident/housing factors,
  directional cleanliness model, weighted scoring with blocking conflicts.
- Staff admin (residents, housing, placements, incidents, matching,
  maintenance) and resident portal (preferences, roommates, chores,
  reports, transfers).
- Jest + Playwright suites, mobile-first design system, German (Swiss) UI.
