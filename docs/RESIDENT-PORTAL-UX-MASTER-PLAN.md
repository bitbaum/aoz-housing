# AOZ Housing — Resident Portal UX Master Plan

## Objective

Make the resident portal fast, clear, and trustworthy across mobile/tablet/desktop, with minimal cognitive load and strong completion rates for core resident tasks.

Primary resident outcomes:
1. Report a problem quickly and correctly
2. Understand current housing/roommate context at a glance
3. Keep preferences updated without friction
4. Manage household tasks with fewer conflicts/escalations

---

## Constraints & Non-Goals

### Constraints
- Mobile-first behavior is mandatory
- Keep existing data model and API contracts stable where possible
- No regression in validation/safety checks
- Keep Swiss German / current label conventions

### Non-Goals (for this phase)
- Re-architecting auth/session model
- New role/permission system
- Major schema migrations

---

## Current UX Gaps (evidence-based)

1. **Reporting flow still has decision friction** (category/type/severity/description from scratch)
2. **Preferences form is long** and can feel heavy on smaller screens
3. **Chore action surface is powerful but cognitively dense**
4. **Dashboard hierarchy can be clearer** (what needs action now vs later)
5. **Portal consistency polish** lags behind recent admin workflow hardening

---

## Plan (Now / Next / Later)

## NOW (Sprint A: high-impact speed)

### A1 — Report fast-entry templates
- Add one-tap templates for common resident reports:
  - Maintenance urgent
  - Lärmkonflikt
  - Sicherheitsbedenken
- Prefill category/type/severity/description with editable defaults
- Keep manual path fully available

**Acceptance criteria**
- Resident can start a complete report from a template in <=2 taps
- Prefill values are always editable before submit
- Validation and backend behavior unchanged

---

### A2 — Preferences mobile completion path
- Add sticky mobile action bar (save/cancel)
- Add section-level helper microcopy and clearer grouping
- Optional compact section collapses if needed after first pass

**Acceptance criteria**
- Save/Cancel always reachable on mobile without long scroll back
- No drop in data completeness

---

### A3 — Chores “quick decisions” simplification
- Add lightweight action prioritization on task cards (primary vs secondary)
- Improve modal entry labels and reduce ambiguity
- Keep all existing actions available

**Acceptance criteria**
- Resident can identify the right next chore action at first glance
- No functional reduction of current API capabilities

---

## NEXT (Sprint B: clarity + confidence)

### B1 — Dashboard “Now / Next / Info” blocks
- Explicitly separate urgent items from informational cards
- Surface top resident tasks at page top (open chores, unresolved reports)

### B2 — Report follow-through transparency
- Improve report status language and timeline hints
- Clarify what happens after submit (expectation setting)

### B3 — Roommates page mobile readability pass
- Tighten card density and compatibility explanation microcopy

---

## LATER (Sprint C: optimization)

### C1 — Resident portal usability instrumentation
- Add low-risk telemetry hooks (completion/failure timings) where allowed

### C2 — Content quality pass
- Plain-language readability pass for all resident-facing labels/messages

### C3 — Cross-page consistency tokens
- Unify repeated card/button/state styling patterns into shared components

---

## Quality Gates (per slice)

1. Lint green
2. Unit tests green
3. Manual mobile QA on key flows (report, preferences, chores)
4. No regression in existing server-side validation

---

## Execution Order (starting now)

1. A1 Report fast-entry templates ✅ start now
2. A2 Preferences mobile completion path
3. A3 Chores quick decisions simplification
4. B1 Dashboard Now/Next/Info

---

## Definition of Done (Resident Portal v1.1 UX)

- Reporting: faster first submission path + lower friction
- Preferences: mobile-friendly completion behavior
- Chores: clearer action hierarchy
- Dashboard: more obvious priorities
- Cross-device behavior verified and stable

