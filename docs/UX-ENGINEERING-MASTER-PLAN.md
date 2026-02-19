# AOZ Housing — UX/Engineering Master Plan

## 1) Objective

Perfect the core AOZ employee workflows end-to-end so that:
- daily operations are fast and low-friction,
- critical mistakes are prevented by design,
- UI remains clear and mobile-first,
- engineering quality is stable (no regressions, testable changes).

This plan explicitly focuses on **workflow quality**, not role/permission design (deferred).

---

## 2) Constraints & Non-goals

### Constraints
- Mobile-first UX is mandatory (CLAUDE.md).
- Swiss German copy rules apply for all user-facing text.
- No hidden algorithm decisions: keep explanations transparent.
- Server-side validations remain source of truth for safety.
- Incremental rollout: small safe slices, tested each step.

### Non-goals (for now)
- Role-based access control redesign.
- Multi-tenant architecture changes.
- Large data model migrations unless required for workflow safety.

---

## 3) Workflow Inventory (scope)

1. Resident intake and profile management
2. Housing unit and spot management
3. Matching and placement
4. Transfer and placement ending
5. Check-ins and satisfaction tracking
6. Incident creation/follow-up/resolution
7. Maintenance request lifecycle
8. Cross-workflow operational overview (dashboard/lists)

---

## 4) Quality bar (Definition of Done per workflow)

A workflow is considered “done” only if all are true:

1. **Happy path is 3 clicks/steps or less where feasible**
2. **Failure states are explicit** (no silent errors)
3. **Guardrails prevent destructive mistakes**
4. **Keyboard + touch usability** (44px targets, shortcuts where valuable)
5. **Server-validated data integrity** (no trust in client-only assumptions)
6. **Lint + unit tests green**
7. **At least one E2E coverage path exists or is documented with manual fallback**
8. **Copy is clear, Swiss German compliant, and action-oriented**

---

## 5) Execution phases

## Phase 0 — Baseline & instrumentation (fast)

### Deliverables
- Baseline metrics for current UX friction and operational throughput.
- Error/timeout hotspots recorded.
- One canonical workflow checklist for QA runs.

### Tasks
- Define baseline KPIs (time-to-place, transfer completion time, unresolved incidents age, overdue check-ins).
- Add a compact manual QA script for each workflow in `docs/`.
- Stabilize local test command protocol (lint, unit, e2e/manual fallback).

### Acceptance
- KPI set agreed and written.
- Repeatable QA checklist exists and is usable in <15 min.

---

## Phase 1 — High-impact friction removal (now)

### Deliverables
- Faster placement/transfer operations.
- Reduced navigation overhead.
- Clearer in-context actions.

### Tasks
- Matching page productivity:
  - Add resident search/filter in left panel.
  - Add quick “best match” CTA for unplaced residents.
  - Improve card hierarchy so top 3 options are visually obvious.
- Resident detail action ergonomics:
  - Deep-link actions (transfer/end) and keep context after action.
  - Strengthen empty-state guidance for no-eligible-transfer case.
- Placements list:
  - Add search by resident/unit code.
  - Add quick filters for overdue check-ins and conflict-ended history.

### Acceptance
- Users can complete "find resident → transfer" without leaving resident context.
- Matching decision time reduced subjectively and by baseline spot checks.

---

## Phase 2 — Safety and explainability hardening

### Deliverables
- Safer critical actions.
- Better decision confidence for employees.

### Tasks
- Add explicit pre-submit summaries for transfer/end actions (what changes now).
- Add consistent “why this recommendation” blocks across matching and transfer.
- Standardize warning severity language and visual levels.
- Ensure all blocking conditions surface before submit.

### Acceptance
- No critical action can be executed without explicit context preview.
- Recommendation logic is understandable without opening dev tools/docs.

---

## Phase 3 — Cross-workflow coherence

### Deliverables
- Uniform UX patterns and reduced cognitive switching.

### Tasks
- Unify filter/search bars and card action zones across residents/housing/placements/incidents/maintenance.
- Standardize badge semantics (status, urgency, risk) and legend usage.
- Introduce a lightweight “operational inbox” section on dashboard (overdue check-ins + urgent incidents + urgent maintenance).

### Acceptance
- Staff can identify top priorities from one screen in <30 seconds.
- Visual language is consistent across modules.

---

## Phase 4 — Engineering excellence pass

### Deliverables
- Sustained reliability under iteration.

### Tasks
- Add/extend tests for new workflow behaviors.
- Remove flaky e2e startup bottlenecks; document reliable CI strategy.
- Type safety tightening where workflow-critical components use weak typing.
- Add regression checklist for any workflow-affecting PR.

### Acceptance
- Green lint/tests consistently on workflow changes.
- Critical flows have stable automated coverage (or documented manual protocol with owner).

---

## 6) Prioritized backlog (first 10 items)

1. Matching left-panel search/filter + active state clarity
2. One-click best-match action (safe mode)
3. Placements list search + overdue/conflict quick filters
4. Transfer form pre-submit summary
5. End-placement pre-submit summary
6. Unified warning/alert component semantics
7. Dashboard operational inbox
8. Incident follow-up queue shortcuts
9. Maintenance quick status transitions with confirmation copy
10. E2E stabilization for local webServer timeout behavior

---

## 7) Testing protocol (per iteration)

1. `npm run lint`
2. `npm test -- --runInBand`
3. Targeted manual mobile checks (375px + 768px + desktop)
4. E2E run when environment supports webServer stability; otherwise manual checklist must be executed and recorded

---

## 8) Decision log

### Decision A
Keep role model out of scope for now.
- Why: fastest path to operational value is workflow polish, not permission complexity.

### Decision B
Prioritize transfer/matching ergonomics first.
- Why: highest-frequency and highest-risk daily actions for AOZ housing staff.

### Decision C
Use incremental, test-verified slices.
- Why: protects continuity in a live operational domain with vulnerable residents.

---

## 9) Next action (immediate)

Start Phase 1 now with these concrete implementations:
1. Matching page: resident search/filter + quick best-match CTA
2. Placements page: search/filter for overdue/conflict
3. Transfer/end actions: pre-submit summaries

