# Changelog

All notable changes to this project are documented here, newest first.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); the
project does not tag semver releases yet — entries are grouped by deploy date
(the product deploys continuously from `master`).

Related documents: [Roadmap](docs/ROADMAP.md) · [Blog](docs/blog/README.md)

created_date: 2026-01-15
last_modified_date: 2026-08-19
last_modified_summary: Report form SSOT via portal-report config + i18n; uk/ar dictionary completion; AI chat thinking mode removed.

## Unreleased

### Changed
- **Fleet AI provider for all surfaces.** Staff chat and form assist now use Groq → OpenRouter (OpenAI-compatible API). Anthropic removed. Same keys as other OrangeCat apps on the box.
- **Resident report flow uses SSOT i18n.** Form values live in `lib/config/portal-report.ts`; copy lives in `de.ts` and is built via `buildReportFormLabels()`. Contact fallback pulls phone numbers from `ORG_CONTACT`. Emojis stay in components, not translation strings.
- **Public positioning now matches the expanded product.** The public narrative no longer treats the software as only a placement or housing tool. It is framed through four operational pillars: Stability, Capability, Participation and Guidance.
- **Infrastructure SSOT.** Production is Postgres on Hetzner (`aoz_wohnen` on bitbaum). Docs, `.env.example` and `src/lib/db.ts` describe that host. A leftover laptop `.env` pointing at Neon is not the database. i18n dictionaries stay on the resident portal; staff UI stays German.
- **Resident portal chrome.** Header keeps brand, a compact language select, and an account dropdown (Profil, Einstellungen, Hilfe, Abmelden). Destinations moved into a **collapsible left sidebar** on desktop and the same accordion in the mobile Mehr sheet. Wohnung and Mitbewohner pages are gone from the menu — they had no profiles behind the names; old bookmarks redirect to Übersicht.
- **AOZ and WG are different surfaces of the same product.** On AOZ/AOZH the portal pins Übersicht, Melden, Regeln, Hilfe — not chores/expenses/votes. Login opens on the code first; email stays the other door. Matching opens in compact Top-3 mode.
- **Staff roles are no longer one ADMIN blob.** Leitung (DB name `ADMIN`), Betreuung, Sozialarbeit and Jobcoach each have a permission set. Nav, invites, export/import and the algorithm page follow it. Existing JWTs keep working.
- **Complete languages are offered before a native speaker vouches.** Arabic, Farsi, Tigrinya, Ukrainian, Russian and Turkish appear in the picker when the dictionary is finished. Help, report and rules chrome are translated; the signed Hausordnung body stays German.
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
- **Public roadmap and changelog routes.** Blog already existed; roadmap and changelog are now first-class public pages too, so product direction and shipped changes are readable from the site itself.
- **Integration research framework.** `docs/INTEGRATION-RESEARCH-FRAMEWORK.md` defines the broader scientific basis beyond housing alone: stability, capability, participation and guidance.
- **New blog post on the four-pillar model.** The public blog now explains why the product expanded beyond pure housing operations.
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
- **Learning records** on the resident profile — language tests, courses, informal learning, qualifications. Residents can add their own; Sozialarbeit and Jobcoach see a queue (`/learning`) and missing Deutsch tests.
- **Room-level matching.** Placement scores the Zimmer, not only the Wohnung average, and the fast-place action uses that bed.
- **Short intake** as the default: sleep, noise, directional cleanliness, smoking, languages, mobility first; the rest behind "Weitere Angaben".
- **Gebäudecode** on housing units — enough to group a Standort without a Building CRUD.
- **Pilot evidence** on the staff dashboard: baseline vs now for the mission KPIs.
- **Care team** on the resident file and in the portal: Wohnen/Betreuung, Sozialarbeit, Jobcoach — one named person per seat.
- **Care workspace** on the resident file: appointments (Zurich wall-clock) and catalog-driven work attributes per domain. Adding a field is a line in `CARE_ATTRIBUTE_CATALOG`, not a migration. Residents see team + upcoming appointments.
- **Learning achievements** in the portal: completed tests, courses, qualifications, volunteering and community-service hours, plus language activity offers next to existing Aktivitäten.

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
