# AOZ Housing

@~/.claude/CLAUDE.md

---

## Why This Matters for AOZ

### The Problem AOZ Faces Today

AOZ staff place asylum seekers into shared housing based on **gut feeling and availability**. This leads to:

- **Frequent conflicts** between incompatible roommates (noise, cleanliness, lifestyle clashes)
- **Staff time wasted** mediating disputes and relocating residents
- **Resident stress** from living with incompatible people during an already difficult time
- **High turnover** in problematic units, creating instability

### What This System Does

**Compatibility-based matching** - Instead of random placement, the system:

1. **Captures preferences** - Sleep schedule, noise tolerance, cleanliness level, social style
2. **Calculates compatibility** - Scores how well a new resident fits with existing roommates
3. **Recommends placements** - Shows best matches first, flags potential conflicts
4. **Tracks outcomes** - Records incidents to improve future recommendations

### Measuring Success - What AOZ Should Track

**Before pilot (baseline - 1 month):**
| Metric | How to Measure | Example |
|--------|----------------|---------|
| Incidents per month | Count all roommate conflicts reported | 15 incidents |
| Relocations due to conflict | Count moves caused by incompatibility | 4 relocations |
| Staff hours on mediation | Log time spent resolving disputes | 12 hours/week |
| Time to place new resident | Average days from arrival to placement | 2 days |

**After pilot (3 months with system):**
| Metric | Target | Proves Value If... |
|--------|--------|---------------------|
| Incidents per month | -30% | 15 → 10 incidents |
| Relocations due to conflict | -50% | 4 → 2 relocations |
| Staff hours on mediation | -40% | 12 → 7 hours/week |
| Placement decision time | Same or faster | No slower than before |

**Cost of NOT solving this:**
- 1 relocation = ~2 staff hours (packing, transport, paperwork) = CHF 100+
- 1 conflict mediation = ~1 staff hour = CHF 50+
- 4 relocations + 15 incidents/month = **CHF 1,150/month minimum**
- Plus: resident stress, staff burnout, reputation risk

**ROI calculation:**
If system reduces incidents by 30% and relocations by 50%:
- Savings: ~CHF 400-500/month per housing location
- Staff can focus on support instead of firefighting

### Pilot Proposal for AOZ

**Phase 1 (1 month):** Baseline measurement
- Track incidents, relocations, staff time manually
- No system changes yet

**Phase 2 (3 months):** Pilot at 1-2 locations
- Use system for all new placements
- Continue tracking same metrics
- Compare to baseline

**Phase 3:** Decision
- If metrics improve → roll out to more locations
- If no improvement → analyze why, adjust algorithm

### Example Workflow

**Before**: Staff member has a new resident. Checks which beds are free. Places them wherever.

**After**: Staff member enters resident preferences. System shows "Unit A: 85% compatible (similar sleep schedule, shared language)" vs "Unit B: 40% compatible (smoker with non-smokers, conflicting schedules)". Staff makes informed decision.

---

## First Principles

This system serves **vulnerable populations** (asylum seekers). Every decision must prioritize:

1. **Human Dignity** - People are not data points. Track only what's needed for housing compatibility.
2. **Harm Reduction** - Reduce conflicts, don't optimize for efficiency at the cost of wellbeing.
3. **Transparency** - Decisions must be explainable. No black-box algorithms.
4. **Privacy** - Collect minimum data. Never track immigration status, religion, or medical diagnoses.

---

## Core Mission

**Reduce housing conflicts and improve wellbeing** through compatibility-based placement.

**NOT**: Maximize occupancy, minimize costs, or optimize throughput.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS (mobile-first) |
| Database | PostgreSQL + Prisma |
| Validation | Zod (SSOT for types) |
| Testing | Jest + Playwright |

---

## Project Structure

```
src/
├── app/                    # Next.js pages (App Router)
│   ├── (admin)/           # Staff interface (sidebar layout)
│   │   ├── residents/     # Resident CRUD
│   │   ├── housing/       # Housing units
│   │   ├── placements/    # Placement history
│   │   ├── incidents/     # Conflict tracking
│   │   ├── matching/      # Compatibility UI
│   │   ├── maintenance/   # Maintenance tickets
│   │   ├── rules/         # AOZ rule catalog + staff decision queue
│   │   └── transfer-requests/ # Staff transfer approval queue
│   ├── portal/            # Resident self-service (simple layout)
│   │   ├── rules/         # House rule book + acknowledgement
│   │   ├── decisions/     # Proposals and voting
│   │   ├── expenses/      # Shared expenses: split, balances, settle up
│   │   ├── apartment/     # Apartment profile (resident-named, rooms, people)
│   │   ├── profile/       # Resident self-profile (name, photo, bio)
│   │   └── transfer/      # Resident transfer request
│   └── api/
│       ├── cron/          # Daily notification cron
│       ├── export/        # CSV export routes
│       └── import/        # CSV import routes
├── components/
│   ├── ui/               # Generic UI (Card, Badge, Tabs)
│   ├── forms/            # Config-driven form components
│   ├── layout/           # MobileNav, headers
│   ├── dashboard/        # Dashboard widgets
│   ├── housing/          # Housing-specific components
│   ├── portal/           # Portal-specific components
│   └── residents/        # Resident-specific components
└── lib/
    ├── config/           # SSOT for all config
    │   ├── types.ts
    │   ├── resident-factors.ts
    │   ├── housing-factors.ts
    │   └── thresholds.ts
    ├── compatibility/    # Scoring algorithm
    ├── expenses/         # Shared-expense money/split/balance logic (pure, tested)
    ├── governance/       # House rules, decisions, conflict ladder (pure logic)
    ├── actions/          # Server actions (auth-guarded)
    ├── email/            # Email service (Resend) + templates
    ├── export/           # CSV export (papaparse)
    ├── validation/       # Zod schemas
    └── constants/        # Labels (German UI text)
```

---

## Branding (re-badging is config, not code)

The product ships under a neutral brand and can be handed to AOZ badged as AOZ.
Neither is a fork; both are presets.

```bash
NEXT_PUBLIC_BRAND=aoz    # hand it to AOZ — restores the AOZ wording
NEXT_PUBLIC_BRAND=aozh   # default (neutral pitch badge)
NEXT_PUBLIC_BRAND=wg     # real shared-flat deployments — "WG Wohnen /
                         # Gemeinsam wohnen", no placement-system register.
                         # The live instance runs this since 2026-08-13.
```

AOZH ships the **same palette** as AOZ deliberately — the brief was to keep
AOZ's colours and change only the name and the design language — so it defines
no colour override at all. Only the acronym differs.

**Switching the live deployment** — `NEXT_PUBLIC_*` is inlined at build time, so
this needs a redeploy, not a restart. The box holds the authoritative runtime
env and the deploy pulls it into the build:

```bash
# 1. set the brand in the box's env (the SSOT the build reads)
ssh root@167.233.22.31 \
  "grep -q '^NEXT_PUBLIC_BRAND=' /opt/aoz-wohnen/shared/.env \
     && sed -i 's/^NEXT_PUBLIC_BRAND=.*/NEXT_PUBLIC_BRAND=aoz/' /opt/aoz-wohnen/shared/.env \
     || echo 'NEXT_PUBLIC_BRAND=aoz' >> /opt/aoz-wohnen/shared/.env"

# 2. rebuild + redeploy
gh workflow run deploy.yml -R maonakamoto/aoz-housing

# 3. confirm what a user actually sees
curl -s https://aoz-wohnen.orangecat.ch/login | grep -oE 'AOZH?' | sort -u
```

- **SSOT**: `src/lib/config/brand.ts`. Six fields, each with a direct visible
  effect: `shortName` (product compound copy), `codePrefix`, `productName`,
  `tagline`, `metaDescription`, and **`orgName` — the rule-issuing
  organization, distinct from the product**: the WG-branded product runs under
  AOZ's rule catalog, so ALL governance copy ("AOZ-Regel", "AOZ-Thema", org
  contact info) reads `orgName`, never `shortName`. A config field you can set
  with no visible effect is a trap; don't add speculative ones.
  `APP_LABELS`/`LOGIN_LABELS` derive from `BRAND` — never restate brand copy.
- **`ALL_CODE_PREFIXES`** is the list of every prefix any brand has ever
  issued. Anything that must recognise codes *across* a rebrand — log
  redaction, code parsing — reads that, never `BRAND.codePrefix`. Codes outlive
  the brand that issued them: the log redactor matched a literal `/AOZ-…/` and
  would have silently stopped redacting staff codes the day this shipped.
- **Colours**: the `:root` palette in `globals.css` is the **original AOZ
  palette, byte-for-byte** and stays the default, so switching back is lossless
  rather than a reconstruction. A brand overrides only `--color-brand-*` inside
  `:root[data-brand='<id>']`. `<html data-brand>` is stamped in `layout.tsx`.
- Components use semantic `brand-primary` / `brand-secondary` / `brand-accent`
  classes. **Never** reintroduce `aoz-*` class names or hardcode a hex.

### What must NOT be rebranded

These are identifiers, not branding — renaming them breaks live things for zero
user benefit:

| Thing | Why it stays |
|---|---|
| Repo, deploy app `aoz-wohnen`, domain, DB `aoz_wohnen`, systemd units | Addresses. Renaming means DNS/Caddy/service churn. |
| `JWT_ISSUER` (`aoz-housing`) | Changing it invalidates every live session. |
| Theme key `aoz-theme` | Changing it silently resets everyone's light/dark choice. |
| **Existing resident codes** | `codePrefix` applies to NEW codes only; login resolves by exact string, so old `AOZ-` codes keep working forever. |

---

## Design System

**Design language:** technical, flat, high-contrast — the register of x.ai /
SpaceX / Tesla, carrying AOZ's colours. Concretely that means four decisions,
and every one of them is a token, not a component edit:

| Decision | Where it lives |
|---|---|
| **Near-square geometry** — `rounded-lg` is 4px, not 8px | `--radius-*` |
| **No shadows on in-page surfaces** — hairline borders separate everything | only `--shadow-overlay` exists |
| **Tight display type, wide micro-labels** | `--tracking-*`, `.eyebrow` |
| **Mono tabular figures for all data** | `.numeric`, `.metric` |

Colour is *rationed*: brand red marks the one action that matters on a screen
and nothing else. That is what keeps warning/error legible as signals in a tool
whose whole job is surfacing conflict.

**Tailwind v3** — config at `tailwind.config.ts`, which holds **zero** literal
design values; it only maps utilities onto CSS vars. Both themes share one
class surface — only the var values flip.

### CSS Custom Properties (SSOT — `src/app/globals.css`)

Colors are space-separated RGB channels (e.g. `230 57 70`) so Tailwind's
opacity modifier (`bg-brand-primary/15`) works.

```css
:root {
  /* Surfaces — canvas and surface are BOTH pure white: cards are separated
     by their border, not by floating above a tinted background. */
  --color-ui-canvas:        255 255 255;
  --color-ui-surface:       255 255 255;
  --color-ui-subtle:        246 246 246;
  --color-ui-border:        226 226 226;
  --color-ui-border-strong: 168 168 168;
  --color-ui-text:           10  10  10;
  --color-ui-muted:         112 112 112;

  /* Brand — THE ORIGINAL AOZ PALETTE, BYTE-FOR-BYTE. Do not edit.
     Guarded by src/lib/__tests__/design-system.test.ts. */
  --color-brand-primary:    230 57 70;   /* red   — CTAs, active marks */
  --color-brand-secondary:   25 82 82;   /* teal  */
  --color-brand-accent:     235 244 243; /* mint  */

  /* Geometry — near-square. `rounded-lg` is the workhorse (200+ uses), so
     this one line re-skins the whole product. */
  --radius-sm: 2px;  --radius-md: 3px;  --radius-lg: 4px;
  --radius-xl: 6px;  --radius-2xl: 8px;

  /* Typography — the gap between display and label is the hierarchy. */
  --tracking-display: -0.032em;   --tracking-heading: -0.02em;
  --tracking-label:    0.08em;    --tracking-eyebrow:  0.14em;

  /* Depth — the ONLY shadow in the system, for content that genuinely
     floats (menus, dialogs, drawers). In-page surfaces are flat. */
  --shadow-overlay: 0 8px 24px -6px rgb(0 0 0 / 0.12), 0 0 0 1px rgb(0 0 0 / 0.06);

  /* Score / status / severity tokens — see the file for the full set.
     Paired *-text variants ship readable shades for tinted backgrounds. */
}
```

Dark mode (`[data-theme='dark']` or `prefers-color-scheme: dark`) is a **true
black** canvas and overrides the same tokens. The brand red holds 5.0:1 against
black, so the palette needs no per-theme hue shift — only the surfaces move.
**Never** branch on `dark:` in components.

### Component classes (SSOT in `src/app/globals.css`)

**Typographic primitives** — the two signature moves.
```
.eyebrow  → text-2xs font-semibold uppercase tracking-eyebrow text-ui-muted
.numeric  → font-mono tabular-nums tracking-tight   (anything compared down a column)
.metric   → numeric + text-3xl font-semibold        (the big number in a stat block)
```

**Surfaces** — flat. A hover affordance is a border/fill change, never a shadow.
```
.card          → bg-ui-surface rounded-lg border border-ui-border p-4 sm:p-5
.card-hover    → card + hover:border-ui-border-strong hover:bg-ui-subtle
.overlay-panel → bg-ui-elevated border rounded-lg shadow-overlay  (menus/dialogs ONLY)
.scrim         → fixed inset-0 bg-black/50  (the modal dimmer — one definition)
.chrome-bar    → sticky translucent header with a hairline underline
```

**Buttons** — all variants enforce `min-h-[44px]`.
```
.btn-primary   → NEUTRAL near-black button — the default action everywhere
.btn-secondary → BRAND-COLOURED button — for emphasis
.btn-outline / .btn-ghost / .btn-danger / .btn-warning / .btn-icon
```
The naming is historical and 121 files depend on it: **primary ≠ brand colour.**

**Navigation** — one definition of "where am I", shared by the admin megamenu,
the mobile drawer and the portal nav.
```
.nav-item / .nav-item-active
```

**Badges (outline) & chips (tinted fill)** — both near-square, uppercase
micro-type, so they read as machine states rather than prose. Colours come from
the `status-*` tokens; never Tailwind's raw palette.
```
.badge-active / -success / -pending / -info / -ended / -alert
.chip-success / -warning / -error / -info / -neutral
```

**Meters** — occupancy, capacity, score and fairness bars.
```
.meter / .meter-lg  → the track          .meter-fill → the filled portion
```
Square-ended on purpose: a rounded cap misreports the value, because at 3% the
pill is all cap and reads as more than nothing.

**Alerts** `.alert-error|success|warning|info` · **Avatars** `.avatar[-sm|-lg]`
(square, not circular — initials are data like anything else) · **Icon
containers** `.icon-container[-sm|-lg]` · **Scores** `.score-excellent…critical`

**`rounded-full` is now reserved for true circles only** — status dots, timeline
markers, notification counters. Pills and bars are square. If you are reaching
for it on something with padding, you want `.chip` or `.meter`.

### Layout primitives (`src/components/ui/Page.tsx`)

```tsx
<PageShell>      → max-width container with vertical rhythm
<PageHeader      → SSOT for <h1>: eyebrow, display title, description, actions, backHref
<SectionHeader   → SSOT for <h2> inside a page — never hand-roll one, never skip a level
<Toolbar>        → filter/action row
<EmptyState>     → dashed-hairline empty state
<ListShell>      → hairline list container
```

### SSOT rules — never violate

1. **All design tokens live in `globals.css` only.** `tailwind.config.ts`
   references CSS vars; it contains no hex, no `rgb()` triple, no literal.
2. **Components use semantic classes.** Never `bg-[#hex]`, never a raw Tailwind
   palette colour (`text-gray-500`), never `style={{ color: '#hex' }}`.
3. **Use the existing component classes** rather than rebuilding `.card`,
   `.btn`, `.badge`, `.chip`, `.alert`, `.avatar`, `.scrim` from primitives.
4. **Touch targets ≥ 44px.** Don't override `.btn-*` padding; use `.btn-icon`.
5. **No shadow but `shadow-overlay`,** and only on genuinely floating content.
6. **Email is the one exception** — mail clients can't read CSS vars, so email
   colour is literal hex confined to `src/lib/email/tokens.ts`.

All six are enforced by **`src/lib/__tests__/design-system.test.ts`**, which
also verifies that every `var(--x)` in the Tailwind config actually exists (an
unresolvable CSS variable is invisible to both tsc and ESLint) and that the AOZ
palette has not drifted. Run it with `npm run test` — not a style opinion, a
gate.

⚠️ `npm run verify` does **not** run `next build`. A `'use client'` placed below
an import passes lint, typecheck and Jest, and fails only at build. Run a build
before declaring UI work done; `src/lib/__tests__/use-client-directive.test.ts`
guards that specific class.

## Mobile-First Design (MANDATORY)

All UI must work on mobile FIRST, then enhance for larger screens.

### Breakpoint Strategy

```
Mobile:    < 640px   (default styles, no prefix)
Tablet:    >= 640px  (sm:)
Desktop:   >= 768px  (md:)
Large:     >= 1024px (lg:)
```

### Required Patterns

**1. Touch Targets**
```tsx
// WRONG - too small for touch
<button className="p-1 text-xs">Click</button>

// RIGHT - minimum 44x44px
<button className="min-h-[44px] min-w-[44px] p-3">Click</button>
```

**2. Responsive Navigation**
```tsx
// Desktop: horizontal nav or sidebar
// Mobile: hamburger menu with drawer
<nav className="hidden sm:flex">...</nav>        // Desktop
<button className="sm:hidden">Menu</button>     // Mobile trigger
```

**3. Responsive Grids**
```tsx
// Always start with single column
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
```

**4. Responsive Typography**
```tsx
<h1 className="text-xl sm:text-2xl lg:text-3xl">
```

**5. Responsive Spacing**
```tsx
<div className="p-4 sm:p-6 lg:p-8">
<div className="gap-4 sm:gap-6">
```

### Testing Checklist

Before marking any UI task complete:
- [ ] Test at 375px width (iPhone SE)
- [ ] Test at 414px width (iPhone Plus)
- [ ] Test at 768px width (iPad portrait)
- [ ] Test at 1024px+ (desktop)
- [ ] All touch targets >= 44px
- [ ] No horizontal scroll on mobile
- [ ] Text readable without zooming

---

## Config-Driven Architecture (SSOT)

### Factor System

All compatibility factors live in `src/lib/config/`:

```typescript
// src/lib/config/resident-factors.ts
export const RESIDENT_FACTORS = {
  ageRange: {
    id: 'ageRange',
    type: 'select',
    options: ['YOUNG_ADULT', 'ADULT', 'MIDDLE_AGED', 'SENIOR'],
    labels: { YOUNG_ADULT: '18-25', ADULT: '26-40', ... },
    weight: 0.15,
  },
  // ... all other factors
}
```

### Adding a New Factor

**Maximum 2 files to change:**
1. `src/lib/config/resident-factors.ts` - Define factor
2. `prisma/schema.prisma` - Add column

**If you need to edit more files, the architecture is wrong.**

### Labels (German UI)

All user-facing text in `src/lib/constants/labels.ts`:

```typescript
// WRONG - hardcoded in component
<span>Aktiv</span>

// RIGHT - from constants
import { STATUS_LABELS } from '@/lib/constants/labels'
<span>{STATUS_LABELS.ACTIVE}</span>
```

---

## Compatibility Algorithm

### Scoring Dimensions

| Dimension | Weight | Factors |
|-----------|--------|---------|
| Lifestyle | 30% | Sleep schedule, noise tolerance, cleanliness (3 dimensions), guests |
| Social | 25% | Languages, social style, privacy needs |
| Practical | 25% | Smoking, dietary, shared space preferences |
| Risk | 20% | Historical conflict indicators |

### Score Thresholds

| Score | Level | UI Color | Action |
|-------|-------|----------|--------|
| 80-100 | Sehr gut | Green | Recommend |
| 60-79 | Gut | Blue | Good option |
| 40-59 | Mittel | Yellow | Review carefully |
| 20-39 | Niedrig | Orange | Avoid if possible |
| 0-19 | Kritisch | Red | Do not place |

### Cleanliness is directional (not a difference)

Cleanliness is **three** fields, because a single scale conflates things that
behave differently:

| Field | Meaning |
|-------|---------|
| `cleanlinessPractice` | How much order this person keeps themselves |
| `cleanlinessExpectation` | How much they expect from the people they live with |
| `chaosTolerance` | How much mess and disorder they can live with |

Friction is computed **per direction**: `max(0, expectation(A) − practice(B))`,
damped by A's `chaosTolerance`. A pair scores as its *unhappier* member; a
household scores by its *worst pairing*, never the average — averaging hides the
one pairing that generates the incidents.

Why it must not be symmetric:
- tidy but relaxed + messy → **no friction** (nobody's expectation goes unmet),
  yet an absolute-difference model calls it the worst possible match
- two equally messy people, one demanding → **standing conflict**, yet a
  difference model calls it a perfect match

Staff also get the *direction* (who will be bothered by whom), plus
`hasDoubleStandard` (expects more than they contribute) and `isHighMaintenance`.

**Never** reintroduce `Math.abs(a.cleanliness - b.cleanliness)`.
@see `src/lib/compatibility/cleanliness.ts`

---

## House Rules & Decisions (Governance)

Two tiers, one rule book. `src/lib/governance/` holds the pure logic; server
actions and API routes only do I/O.

### The hierarchy is real, not two lists

Every AOZ rule declares how much room a house has on that topic:

| `delegation` | Meaning |
|--------------|---------|
| `FIXED` | Non-negotiable. No house rule may attach. |
| `UNIT_MAY_STRENGTHEN` | AOZ rule is the minimum; a house may go stricter (staff confirm). |
| `UNIT_DECIDES` | AOZ names the topic only; the house sets the norm. |

A unit rule **always** points at the AOZ rule it specialises (`parentRuleId`),
so every house rule is traceable to the topic that permits it. `checkUnitLegislation()`
is the gate, and it runs when a proposal is *created* — never after a week of
voting. "Stricter, never looser" cannot be verified on free text, so those cases
route to a human instead of pretending to validate.

### Who decides what

`CATEGORY_DECISION_MODE` in `lib/config/decisions.ts` is the SSOT:

- `RESIDENT_BINDING` — everyday life together (kitchen, cleaning, quiet times)
- `RESIDENT_ADVISORY` — consequences beyond the house (guests, costs); staff confirm
- `STAFF_ONLY` — **safety and non-discrimination are never put to a vote.** A
  majority must not be able to vote away a minority's safety. Proposals on these
  topics are still created, and staff must answer them.

Decisions snapshot their policy (`threshold`, `quorumPercent`, `approvalPercent`,
`eligibleVoterCount`) when voting opens, so a past decision stays explainable
after the policy changes. Every tally carries a plain-German explanation that
residents and staff both see — no black-box outcomes.

A `BLOCK` (veto) stops a **consensus** proposal; under a majority threshold it
counts as a No and raises a mediation flag, but does not veto — otherwise any
one resident could block every house decision.

**A vote threshold is only shown where a vote actually happens.**
`DECISION_MODE_IS_VOTED` gates it: a `STAFF_ONLY` proposal used to render
"Mehrheit — mehr als die Hälfte der abgegebenen Stimmen" directly beside "Die
Betreuung entscheidet", promising residents a majority that will never be
counted, on precisely the topics where a majority must not decide. Pinned by
`src/lib/config/__tests__/decision-mode-voting.test.ts`.

### Acknowledgement (the cheapest prevention)

Acknowledgements are per **rule version**. Amending a rule bumps its version and
asks everyone bound by it to read it again — nobody is held to wording they never
saw. Unit coverage is the *leading* indicator for norm conflicts; incidents are
the lagging one.

### Conflict resolution is a ladder

`REPORTED → SELF_RESOLUTION → PEER_MEDIATION → STAFF_MEDIATION → FORMAL_MEASURE → CLOSED`

Two hard limits, both deliberate:
1. **Safety never starts at the bottom.** Safety reports and high/critical
   incidents enter at staff level. Nobody is asked to negotiate with someone who
   threatened them (`determineEntryStage`).
2. **Escalation is not punishment.** Moving up a rung means the previous step did
   not hold; it says nothing about fault.

Each rung ends in a `ConflictAgreement` — concrete terms, named parties, a review
date, and an explicit *did it hold?*. A broken agreement escalates; one that held
closes the conflict and can seed a house rule. A free-text resolution note cannot
be followed up on, which is why "resolved" used to mean nothing.

### A report goes to the desk that can act on it

A resident report is **not** always an incident. `/api/portal/report` routes on
category (`src/lib/reports/routing.ts` is the SSOT for the mapping):

| Category | Lands as | Worked on |
|---|---|---|
| `MAINTENANCE` | `MaintenanceRequest` | the staff maintenance board |
| everything else | `Incident` | the conflict ladder |

Filing a dripping tap as an `Incident` cost twice, and both showed up in
production: it never appeared on the board built to fix it, and it inflated the
incident count — **the single number the AOZ pilot is judged on**. A broken
appliance is not a conflict, and counting it as one corrupts the metric.

The resident still sees ONE list. `mergeResidentReports()` folds both tables
into "Deine Meldungen" and carries `resolution` with it — **an answer stored and
never rendered is the same as no answer**. Never re-split that list by table:
residents do not know which desk works their report, and must not have to.

---

## Shared Expenses, Resident Profiles & Apartment Profiles

Splitwise-style expense sharing per housing unit, plus optional self-chosen
identity. `src/lib/expenses/` holds the pure logic; routes only do I/O.

### Money rules (non-negotiable)

- **Integer Rappen end to end.** Parse once at the input boundary
  (`chfToRappen`), format once at display (`formatRappen`). No floats, ever.
- **Shares always sum to the total.** `splitEqually` distributes Rappen
  remainders deterministically (+1 to the first ids in sorted order).
- **Balances are computed over the FULL history** — a balance over a
  paginated slice is a wrong number. `computeBalances` sums to exactly zero;
  `simplifyDebts` yields a stable ≤ n−1 transfer plan (greedy, id-tiebreak).
- **Resident FKs are `Restrict`, not `Cascade`** — deleting a payer would
  silently change everyone else's balance. Residents exit via status.
- Categories are **config, not a Prisma enum** (`lib/config/expenses.ts`):
  a new category is a config change, never a migration.

Who may do what: any current unit member records expenses (also on behalf of
the payer) and settlements (always `from = self`). Only the payer or creator
may delete an expense. Everything unit-scoped via `getPortalAuth()`.

### Resident self-profile (privacy by design)

Residents have **no name field by default** — the code is the identity. The
portal lets them OPTIONALLY set `displayName`, `bio` and a photo:

- `residentName()` / `residentInitials()` in `lib/utils/resident-name.ts` are
  the SSOT for display — never inline `displayName || code`, and never render
  `resident.code` directly. Both helpers already fall back to the code, so the
  privacy default is preserved for free. **Selecting only `{ code: true }` in
  Prisma causes the same bug one layer earlier** — spread `RESIDENT_NAME_SELECT`
  into any query whose rows reach the UI, and use `ResidentSummary` (which
  carries `displayName`) for compatibility cards.
  This is enforced by `src/lib/__tests__/resident-name-ssot.test.ts`: it failed
  on 50+ surfaces, because rendering a bare code type-checks, lints and looks
  fine — it just tells Georgy that "RES-LCCM7A" did the dishes instead of Ihor,
  and shows AOZ staff codes for people whose names sat in the same row. The few
  places where the login code *is* the point (the portal's own "your code" card,
  the staff breadcrumb) opt out with a `resident-code-intentional` comment, so
  showing a code stays a decision rather than an accident.
  **The rule is a DENYLIST of things that own a code without being a person**
  (units, spots, rooms, staff). Its first version listed the resident-ish
  accessor names instead and reported all-clear while missing `candidate.code`
  in the agreements panel — an allowlist cannot catch the name nobody thought
  of. Any new non-person code holder goes in that list; everything else must
  use the helpers.
- Photos live in `ResidentPhoto` (separate table so Bytes never load on list
  queries), client-resized via canvas before upload, server-capped at 500 KB,
  and served ONLY to self + current roommates by
  `/api/portal/residents/[id]/photo` (404 for everyone else — no existence
  leak). `ResidentAvatar` renders photo-or-initials everywhere.

### Apartment profile

`HousingUnit.nickname` is the resident-chosen apartment name (e.g.
"Singapur") — any current resident may set it from `/portal/apartment`
(audited). The page shows rooms (from the spot hierarchy), occupants and
profiles.

### Real deployments vs demo

`prisma/seed-real.ts` seeds a REAL apartment from `prisma/real/*.ts` config
(layout + who lives where; login codes are generated at runtime and printed
once — never committed). `--wipe` converts a demo instance in place. A real
instance must run with `DEMO_ACCESS_ENABLED=false` and the reset timer
disabled — the daily demo reset would truncate real data. The production
instance `aoz-wohnen.orangecat.ch` runs in REAL mode since 2026-08-13
(Witikonerstrasse 458); the demo remains fully env-switchable for a future
dedicated demo deployment.

---

### Blocking Conflicts

Some incompatibilities are **blocking** (cannot place together):
- Wheelchair user + no wheelchair access
- Smoker in non-smoking unit
- Extreme lifestyle mismatch (diff > threshold)

---

## Ethical Boundaries

### What We Track (Functional Only)

- Compatibility-relevant preferences (sleep, noise, cleanliness)
- Languages spoken (for communication)
- Mobility needs (for unit matching)
- Self-reported preferences
- Anonymized conflict outcomes

### What We NEVER Track

- Medical diagnoses (only functional needs like "needs ground floor")
- Immigration status or case details
- Political or religious beliefs
- Personal history beyond housing relevance
- Anything that could be used for discrimination

### Audit Trail

All placements logged with:
- Who made the decision
- Compatibility scores at time of placement
- Any override reasons
- Timestamp

---

## Code Quality Standards

### TypeScript

```typescript
// Types derived from Zod schemas (SSOT)
const residentSchema = z.object({...})
type Resident = z.infer<typeof residentSchema>

// No separate type definitions that can drift
```

### Component Patterns

```typescript
// Props interface at top
interface CardProps {
  title: string
  children: React.ReactNode
}

// Functional component
export function Card({ title, children }: CardProps) {
  return (...)
}
```

### File Organization

```
ComponentName/
├── index.tsx      # Main component (or just ComponentName.tsx)
├── types.ts       # Types if complex
└── utils.ts       # Helper functions if needed
```

---

## Language Rules

| Context | Language |
|---------|----------|
| UI labels, buttons, messages | German (Swiss) |
| Code, comments, docs | English |
| Variable/function names | English |
| Error messages (user-facing) | German (Swiss) |
| Error messages (logs) | English |

### Swiss German Spelling (MANDATORY)

All user-facing German text MUST use correct **Swiss German** spelling:

- **Always use umlauts**: ä, ö, ü, Ä, Ö, Ü — NEVER skip them
  - Menü (NOT Menu), Übersicht (NOT Ubersicht), Rückzugsort (NOT Ruckzugsort), Wünsche (NOT Wunsche), für (NOT fur), öffnen (NOT offnen)
- **Swiss German uses `ss` instead of `ß`**: schliessen (NOT schließen), Strasse (NOT Straße), grösser (NOT größer), Aussenbereich (NOT Außenbereich)
- **Common aria-label mistakes to avoid**: "Menü öffnen" (NOT "Menu öffnen"), "Menü schliessen" (NOT "Menu schliessen")

**Pre-commit check**: Before writing ANY German text, verify every word has correct umlauts. If unsure, check against a German dictionary.

---

## Authentication

### One human, one login, one or two roles

The CODE is the root identity and works forever; an **`Account`** (one email,
one password) is optional credentials laid ON TOP of it. Registration never
creates identities — provisioning (staff invites, resident intake) stays where
it is. `src/lib/auth/account.ts` holds the flows; passwords are bcrypt cost 12
(`lib/auth/passwords.ts`), reset/verify tokens are single-use SHA-256-at-rest
rows belonging to the ACCOUNT (`lib/auth/tokens.ts`, `AuthToken.accountId`).

| Role | Root identity | Session cookie |
|------|--------------|----------------|
| **Staff** | `AOZ-XXXXXX` / `WG-XXXXXX` code → `User` | `staff_session` (JWT) |
| **Resident** | `RES-XXXXXX` code → `Resident` | `resident_code` |

**An account may carry BOTH.** `Account.userId` and `Account.residentId` are
each unique and each optional. The person running a real shared flat is its
admin *and* one of its flatmates; a caseworker may live in one of the houses.
Credentials on the identity rows forced them to pick one, and guaranteed two
password hashes for one human that would drift apart — so **never put `email`
or `passwordHash` back on `User` or `Resident`.**

Linking needs no separate flow, no invite and no admin: **register again with
your second code and the same email.** A finished account must prove itself
with its own password before absorbing another identity
(`AUTH_LINK_PASSWORD_MISMATCH`) — holding a stray code is not enough to attach
yourself to someone else's login. A role slot that is already filled refuses
(`AUTH_ROLE_ALREADY_LINKED`).

`establishSessions()` (`lib/auth/sessions.ts`) is the SSOT for "you are now
signed in": it sets every cookie the account's identities call for and reports
`roles`. Staff wins the landing page (bigger surface); the nav offers the
switch. A deactivated staff identity grants nothing but must **not** cost the
person their resident access — they are different roles.

**Single staff role: ADMIN** — all staff have full access. One email namespace
across the whole product, because there is exactly one `Account.email` unique
index; email login can never guess which table you meant.

### Flows

```
/login                       → email+password (primary) or code (toggle); demo doors
/register                    → claim your code: { code, email, password } → auto-login
/forgot-password             → request reset link (generic success, no enumeration)
/reset-password?token=…      → set new password (also verifies the email)
/api/auth/login              → { email, password } or { code } — same endpoint
/api/auth/signup             → registration (public, rate-limited)
/api/auth/forgot-password    → 503 LOUDLY when RESEND_API_KEY missing (never a
                               fake "sent" — that is a silent lockout)
/api/auth/reset-password     → token + password
/api/auth/verify-email       → GET, redirects /login?verified=1|0
/api/auth/logout             → Clears both cookies
/api/auth/register           → Admin-only staff provisioning (POST { name, code? })
/api/auth/invite             → Admin-only staff invite by email (sends code)
```

- Codes trimmed + uppercased; emails trimmed + lowercased (zod, `lib/validation/auth.ts`)
- Rate limiting per IP on every public auth route (`getClientIp` SSOT)
- Login failures are ONE generic message — anything specific is an enumeration oracle
- Email login for a resident sets the same `resident_code` cookie: the portal
  is unchanged, and demo residents can register/reset too (daily reset wipes them)
- A code-only account with a known email (the seeded admin) bootstraps its
  first password via forgot-password — mailbox control is the proof

### Email transport

Resend (`lib/email/service.ts`), fleet key, sender on the verified
`fleetcrown.orangecat.ch` domain. `EMAIL_CONFIG.enabled` is false without
`RESEND_API_KEY` — notification emails then no-op quietly, but the
password-reset flow REFUSES loudly (see above). Absolute links come from
`NEXT_PUBLIC_APP_URL` (`lib/config/app-url.ts`).

### Demo Access (fleet standard: no-account product tour)

The demo is **not a separate product** — it is the real tool behind a door
that needs no account. SSOT: `src/lib/demo/` (config, one shared narrative,
two reset scopes).

- **One demo world, one narrative**: BOTH scopes seed the same AOZ
  presentation narrative (`lib/demo/seed-data.ts`: 5 units, 15 residents,
  incidents, expenses — the full placement story). Every code it creates
  carries a demo prefix (`DEMO-` units, `RES-DEMO` residents; pinned by
  `seed-data.test.ts`) — an unprefixed code would leak a row the scoped
  reset can never clean up. The demo resident login is Fatima, PLACED in the
  success unit, so the portal tour shows a lived-in flat with expenses.
- **An empty page reads as a missing feature.** `lib/demo/seed-governance.ts`
  fills the surfaces that shipped blank — chores (with an uneven completion
  record, because an even one shows nothing), maintenance, and proposals at
  every stage. **The proposal timing is the load-bearing part**: voting opens
  only after a 3-day discussion window and the demo world is wiped nightly, so
  a proposal created fresh can *never* reach a ballot in a demo. The seeded
  vote is therefore backdated and already open, with one seat deliberately
  empty — the visitor casts the deciding vote. Outcome text comes from the real
  `tallyVotes()`; a demo that explains a result differently from the product is
  a demo of something that does not exist.
- **Server-driven buttons**: the login page asks `GET /api/auth/demo` which
  doors exist; there is **no build-time flag**, so one build serves any demo
  configuration and a button only appears when pressing it can succeed.
- **Opt-in per deployment**: `DEMO_ACCESS_ENABLED=true` (server env only).
- **Two reset scopes** (`DEMO_RESET_SCOPE`, default `unit`):
  - **`unit` (default, safe)** — the demo world lives ALONGSIDE real data;
    the portal's unit scoping isolates it. The daily reset deletes by
    PREFIX, never by table, in explicit Restrict-FK order (incidents →
    placements → units → `RES-DEMO*` residents; `lib/demo/scoped-reset.ts`)
    — it can never truncate. This is what runs on the live instance.
  - **`full`** — truncate everything except the keep-list, then the same
    narrative (`lib/demo/reset.ts`). Dedicated demo deployments only.
- **The staff demo is a full ADMIN session** (dedicated account, upserted by
  every reset). George explicitly wants testers to see the Verwaltung side,
  so the live instance runs `DEMO_STAFF_CODE=WG-DEMO01` — accepted trade-off:
  demo admins can see/edit the real flat's data. Sessions of deactivated
  users die immediately: `getCurrentUser()` re-checks `User.active` on every
  request.
- **Reset endpoint**: `POST /api/cron/reset-demo` (Bearer `CRON_SECRET`),
  refuses without `DEMO_ACCESS_ENABLED=true`, advisory-locked. Timer:
  `appcron-aoz-wohnen-reset-demo.timer` (04:05 UTC).
- Live instance since 2026-08-13: real data (Witikonerstrasse 458) + both
  demo doors (`WG-DEMO01` staff, `RES-DEMO1` resident = Fatima in the demo
  success unit), scope `unit`.

### Resident Portal

**What residents can do:**
- View their profile and preferences
- See current roommates
- Update preferences (triggers staff review)
- Report issues (goes to staff queue)
- Request transfer to different housing (goes to staff approval queue), **and
  read the decision when it comes back** — `/portal/transfer` loads the LATEST
  request whatever its status, not just a `PENDING` one. Filtering to `PENDING`
  meant every approval or denial vanished from the resident's view the instant
  staff made it, `staffNotes` included: they were told "du wirst benachrichtigt"
  and then never were. Same rule as reports — an answer stored and never
  rendered is the same as no answer.
- Manage chore assignments
- View help/FAQ

**Implementation:**
```
/portal             → Resident dashboard (redirects to /login if no code)
/portal/preferences → Update own preferences
/portal/roommates   → See current roommates
/portal/chores      → View/manage chore assignments
/portal/housing     → Browse available housing
/portal/transfer    → Request transfer (if placed)
/portal/report      → Submit issue to staff
/portal/help        → FAQ and help info
```

**Security considerations:**
- Codes are semi-public (like a hotel room number)
- Residents can only see/edit their OWN data
- Sensitive actions (transfers, incidents) go to staff for approval
- Rate limiting on code entry to prevent guessing

### Database Model

```prisma
model User {
  id           String    @id @default(cuid())
  code         String    @unique  // AOZ-XXXXXX login code — the identity
  name         String
  role         StaffRole @default(ADMIN)
  active       Boolean   @default(true)
  lastLoginAt  DateTime?
  account      Account?           // credentials, if this person claimed them
  // ...
  @@index([code])
}

// One human's credentials. Either side may be absent; both may be present,
// which is how one login carries both a staff and a resident role.
model Account {
  id              String    @id @default(cuid())
  email           String    @unique
  passwordHash    String?            // null = known email, not claimed yet
  emailVerifiedAt DateTime?
  userId          String?   @unique
  residentId      String?   @unique
  authTokens      AuthToken[]
}
```

### Auth Status: FULLY IMPLEMENTED

| Component | Status | Location |
|-----------|--------|----------|
| Email+password login | Active | `src/lib/auth/account.ts` (`loginWithEmail()`) |
| Registration (claim code) | Active | `src/app/api/auth/signup/route.ts` + `/register` |
| Password reset | Active | `src/lib/auth/{account,tokens}.ts` + `/forgot-password`, `/reset-password` |
| Email verification | Active | `src/app/api/auth/verify-email/route.ts` |
| Unified code login | Active | `src/lib/auth/index.ts` (`loginByCode()`) |
| Staff JWT auth | Active | `src/lib/auth/jwt.ts` |
| Middleware enforcement | Active | `src/middleware.ts` |
| Login page (unified) | Working | `src/app/(auth)/login/page.tsx` |
| Staff provisioning | Working | `src/app/api/auth/register/route.ts` |
| Rate limiting | Active | `src/lib/auth/rate-limit.ts` |
| Role-based access | Active | `src/lib/auth/role-policy.ts` |
| Portal code auth | Active | `src/lib/portal-auth.ts` |
| Session refresh | Active | Middleware handles sliding sessions |
| Audit logging | Active | `src/lib/audit.ts` |
| Role switching | Active | UserMenu + PortalNav show cross-links |

**To create initial admin:** Run `npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-admin.ts` (default code: `AOZ-ADMIN1`)

---

## Testing Strategy

### Unit Tests (Jest) — 2527 tests, 136 suites

Representative coverage by area (not an exhaustive suite list):

| Area | Coverage |
|------|----------|
| Server actions | All CRUD actions for residents, housing, placements, incidents, maintenance, matching, satisfaction, spots, transfers |
| API routes | Auth (login, register, session, logout), portal (logout, chores, report, satisfaction, preferences, transfer), cron notifications, CSV export, CSV import |
| Compatibility | Algorithm, conversion, aggregate scoring, unit fit-concerns / blocking logic |
| Auth utilities | JWT (create/verify/refresh), rate limiting, role policy, route boundaries, code generation |
| Email | Templates (German content, structure), Brevo send service (retry/no-op), cron notifications (auth, triggering) |
| CSV export/import | CSV generation (papaparse), export routes (auth, content type), import routes (validation, duplicates) |
| Analytics | Unit metrics calculation |
| UI components | Dialogs (a11y), filters, BedGrid, style utilities |
| Config | Labels, formatting, factor config |

### E2E Tests (Playwright) — 173 tests, 18 specs

- Auth flow (code-based login)
- Resident creation
- Matching workflow
- Incident reporting + detail
- Placement check-in
- Housing detail
- Dashboard
- Navigation
- Mobile responsiveness
- Accessibility

### Manual Testing

- Mobile responsiveness (real devices preferred)
- Screen reader accessibility
- Keyboard navigation

---

## Performance Guidelines

### Database

- Select only needed columns
- Use proper indexes (already defined in schema)
- Paginate lists (default 20 items)
- Avoid N+1 queries (use includes)

### Frontend

- Server components by default
- Client components only when needed (interactivity)
- Lazy load heavy components
- Optimize images with next/image

---

## Quick Reference

### Commands

```bash
npm run dev              # Development server (port 3001)
npm run build            # Production build
npm run prisma:generate  # Regenerate Prisma client
npm run prisma:migrate   # Run pending migrations (production)
npm run prisma:push      # Push schema changes (development only)
npm run prisma:studio    # Database browser
npm run prisma:seed      # Seed demo data
npm run test             # Run Jest tests (2527 tests)
npm run test:e2e         # Run Playwright tests (173 tests)
```

### Key Files

| Purpose | Location |
|---------|----------|
| Resident factors | `src/lib/config/resident-factors.ts` |
| Housing factors | `src/lib/config/housing-factors.ts` |
| Score thresholds | `src/lib/config/thresholds.ts` |
| German labels | `src/lib/constants/labels/` |
| Error messages | `src/lib/constants/error-messages.ts` |
| Compatibility calc | `src/lib/compatibility/index.ts` |
| Email service | `src/lib/email/service.ts` |
| Email templates | `src/lib/email/templates.ts` |
| CSV export | `src/lib/export/csv.ts` |
| Export column config | `src/lib/export/config.ts` |
| Transfer actions | `src/lib/actions/transfers.ts` |
| Auth guards | `src/lib/auth/index.ts` (`requireStaffAuth()`) |
| Route boundaries | `src/lib/auth/route-boundaries.ts` |
| Prisma schema | `prisma/schema.prisma` |

---

## Don'ts

- Hardcode labels in JSX → Use `lib/constants/labels/`
- Hardcode error messages → Use `lib/constants/error-messages.ts`
- Hardcode factor options → Use `lib/config/`
- Track medical diagnoses → Track functional needs only
- Edit 5+ files for new factor → Should be 2 max
- Desktop-first CSS → Always mobile-first
- Skip mobile testing → Test at 375px minimum
- Use `any` type → Use proper types or `unknown`
- Commit without testing → Verify in browser

---

## Troubleshooting

### Schema changes workflow
1. Edit `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name describe-change` to create migration
3. Run `npm run prisma:generate` to update client types
4. Restart dev server

### "Column not found" errors after schema change
1. Run `npm run prisma:generate`
2. Restart dev server (clears column cache)

### Mobile nav not showing
- Check for `sm:hidden` / `hidden sm:flex` patterns
- Verify hamburger button has `sm:hidden`

### Compatibility scores seem wrong
- Check `lib/config/thresholds.ts` for current values
- Verify weights in factor config
- Check for blocking conflicts

---

**Last Updated**: 2026-02-23
