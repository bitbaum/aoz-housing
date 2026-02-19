# AOZ Housing — Workflow Readiness Matrix (v1)

## Purpose

Provide a clear status view of employee workflows after recent UX/engineering hardening.

Legend:
- ✅ **Done** = operationally strong for v1
- ⚠️ **Needs polish** = usable but has notable friction
- 🚨 **Risk** = can impact correctness/speed/reliability if left as-is

---

## 1) Resident Intake & Profile

**Status:** ✅ Done

### What works well
- Create/edit flows are clear and structured.
- Mobile sticky action bars + large touch targets.
- Validation UX improved (inline summary + scroll to invalid field).
- Immediate handoff to matching after creation.

### Remaining minor polish
- Add explicit success toasts on save where useful (optional).

---

## 2) Housing Unit Setup & Spot Management

**Status:** ⚠️ Needs polish

### What works well
- Create/edit flows improved for mobile and consistency.
- Spot management exists (single + bulk room/bed creation).
- Archive/restore logic protected.

### Gaps
- Spot setup page still dense in places on small screens.
- Some action patterns on spots page are less aligned with new form standards.

### Next
- Mobile-first cleanup of `/housing/[id]/spots` interactions and submit bars.

---

## 3) Matching & Initial Placement

**Status:** ⚠️ Needs polish

### What works well
- Search/filter in matching panel added.
- “Best match” quick action exists.
- Explainability sections are present.

### Gaps
- Matching screen remains information-heavy under pressure.
- We still need a tighter “fast path” for high-volume placement sessions.

### Next
- Add compact mode / triage mode for power users.
- Strengthen visual prioritization (Top 1 / Top 3 recommendations).

---

## 4) Transfer & Placement End

**Status:** ✅ Done

### What works well
- One-click transfer entry from resident profile.
- Transfer/end summaries before commit.
- Keyboard shortcuts for power users.
- Blocking checks and eligibility guardrails in place.

### Remaining minor polish
- Add clearer post-action confirmation banners (optional).

---

## 5) Placements Triage (active/ended/overdue/conflicts)

**Status:** ✅ Done

### What works well
- Search and quick filters added.
- Overdue and conflict-focused views available.
- Good operational page for daily queue handling.

### Remaining minor polish
- Add saved filter presets for frequent supervisors (optional).

---

## 6) Incident Workflow (create → follow-up → resolve)

**Status:** ⚠️ Needs polish

### What works well
- Full lifecycle exists with follow-up tracking.
- Validation UX added to key forms.
- Detail page made more mobile-safe.

### Gaps
- Multi-step incident handling can still feel long in urgent scenarios.
- Follow-up timeline density may still be high on very small screens.

### Next
- Add “quick incident” fast-entry pattern for urgent cases.
- Add compact timeline presentation toggle.

---

## 7) Maintenance Workflow (create → assign → progress → done)

**Status:** ✅ Done

### What works well
- Lifecycle complete with assignment and status updates.
- New/detail forms responsive and consistent.
- Validation UX and action hierarchy improved.

### Remaining minor polish
- Improve assignee input ergonomics (suggestions/autocomplete) later.

---

## 8) Dashboard & Operational Command Surface

**Status:** ⚠️ Needs polish

### What works well
- ActionDashboard gives meaningful triage (critical incidents, overdue check-ins, etc.).
- Quick actions are mobile-improved.

### Gaps
- Still room to reduce cognitive load in high-alert situations.
- Could benefit from stronger prioritization visuals and alert grouping.

### Next
- Add explicit “Now / Next / Monitor” sections.
- Collapse lower-priority tiles by default on mobile.

---

## 9) Archive / Protected Delete Operations

**Status:** ✅ Done (parked)

### What works well
- Archive-first strategy implemented.
- Hard-delete protected with strict safeguards + blocker report.
- Audit-friendly copy/export and clear warnings.

### Note
- This is not a daily core workflow; maintain but de-prioritize further enhancements.

---

## 10) Cross-Cutting Engineering Quality

**Status:** ⚠️ Needs polish (infra)

### Current
- Lint and unit tests are consistently green.
- Regression risk lowered for edited workflows.

### Risk
- Local E2E/browser run reliability hampered by environment constraints (EMFILE/dev watcher limits).
- Production build in this environment intermittently interrupted by process limits.

### Next
- Stabilize QA runtime strategy (build/start or CI-hosted e2e runner).
- Add structured manual QA checklist where automation is currently constrained.

---

## Priority Queue (recommended next sprint)

1. **Matching fast-path + visual prioritization**
2. **Spot management mobile UX cleanup** (`/housing/[id]/spots`)
3. **Incident fast-entry + compact timeline mode**
4. **Dashboard cognitive-load reduction (Now/Next/Monitor)**
5. **E2E execution stability plan**

---

## Overall Readiness

- Core operational workflows are now in good shape for v1 usage.
- Highest remaining gains are in **speed under pressure** (matching/incidents) and **QA runtime stability**.

