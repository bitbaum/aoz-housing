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
│   │   └── transfer-requests/ # Staff transfer approval queue
│   ├── portal/            # Resident self-service (simple layout)
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
    ├── actions/          # Server actions (auth-guarded)
    ├── email/            # Email service (Resend) + templates
    ├── export/           # CSV export (papaparse)
    ├── validation/       # Zod schemas
    └── constants/        # Labels (German UI text)
```

---

## Design System

**Tailwind v3** — config at `tailwind.config.ts`. All design tokens live in `src/app/globals.css` as CSS custom properties; `tailwind.config.ts` only references them (zero literal hex). Both light and dark themes share the same Tailwind class surface — only the CSS-var values flip.

### CSS Custom Properties (SSOT — `src/app/globals.css`)

Colors are stored as **space-separated RGB channels** (e.g. `230 57 70`) so Tailwind's opacity modifier (`bg-aoz-primary/15`) works.

```css
:root {
  /* UI surface tokens */
  --color-ui-canvas:        250 250 250;
  --color-ui-surface:       255 255 255;
  --color-ui-elevated:      255 255 255;
  --color-ui-subtle:        250 250 250;
  --color-ui-border:        229 229 229;
  --color-ui-border-strong: 212 212 212;
  --color-ui-text:          17 17 17;
  --color-ui-muted:         102 102 102;
  --color-ui-on-accent:     255 255 255;

  /* AOZ brand */
  --color-aoz-primary:       230 57 70;   /* red/coral — AOZ logo, CTAs */
  --color-aoz-secondary:     25 82 82;    /* dark teal — secondary brand */
  --color-aoz-accent:        235 244 243; /* mint — backgrounds */

  /* Compatibility score (5-tier) */
  --color-score-excellent: 34 197 94;     /* 80-100 Sehr gut */
  --color-score-good:      132 204 22;    /* 60-79  Gut */
  --color-score-medium:    245 158 11;    /* 40-59  Mittel */
  --color-score-low:       249 115 22;    /* 20-39  Niedrig */
  --color-score-critical:  239 68 68;     /* 0-19   Kritisch */
  /* Paired *-text variants ship dark readable shades for use on tinted backgrounds */

  /* Status */
  --color-status-success: 34 197 94;
  --color-status-warning: 245 158 11;
  --color-status-error:   239 68 68;
  --color-status-info:    59 130 246;

  /* Severity */
  --color-severity-low: 156 163 175;
  --color-severity-medium: 251 191 36;
  --color-severity-high: 249 115 22;
  --color-severity-critical: 239 68 68;

  /* Shadows — `none` in light keeps modern flat look; dark uses ring */
  --shadow-card:       none;
  --shadow-card-hover: 0 0 0 1px rgb(0 0 0 / 0.06);
}
```

Dark mode (`[data-theme='dark']` or `prefers-color-scheme: dark`) overrides the same tokens with darker values. **Never** branch on `dark:` in components except for color-bound utilities Tailwind can't auto-derive (rare).

### Component classes (SSOT in `src/app/globals.css`)

**Cards** — always prefer these over hand-built equivalents.
```
.card        → bg-ui-surface text-ui-text rounded-lg shadow-card border border-ui-border p-4 sm:p-5
.card-hover  → card + hover:shadow-card-hover hover:border-ui-border-strong cursor-pointer
```

**Buttons** — all variants enforce `min-h-[44px]` touch target.
```
.btn           → px-4 py-2.5 rounded-md text-sm font-medium focus-ring min-h-[44px] inline-flex
.btn-primary   → btn + bg-ui-text text-ui-inverse hover:bg-ui-text/85          (neutral CTA)
.btn-secondary → btn + bg-aoz-primary text-ui-on-accent hover:bg-aoz-primary-dark (brand CTA)
.btn-outline   → btn + border bg-ui-surface hover:bg-ui-subtle
.btn-ghost     → btn + text-ui-muted hover:bg-ui-subtle hover:text-ui-text
.btn-danger    → btn + bg-status-error text-ui-on-accent
.btn-warning   → btn + bg-status-warning text-ui-on-accent
.btn-icon      → 44x44 icon-only square — use for close (X) etc.
```

Note: `.btn-primary` is the NEUTRAL dark button (used everywhere as the default action); `.btn-secondary` is the BRAND-COLORED red button (used for emphasis). The naming is historical; do not assume "primary = brand color."

**Form elements**
```
.input → w-full px-3 py-2.5 border rounded-md min-h-[44px] focus-ring
.label → block text-sm font-medium text-ui-muted mb-1.5
```

**Badges** (rounded-md, subtle ring background)
```
.badge        → inline-flex px-2 py-0.5 rounded-md text-xs font-medium ring-1
.badge-active / .badge-success / .badge-pending / .badge-info / .badge-ended / .badge-alert
```

**Chips** (rounded-full pills, tinted fill)
```
.chip         → inline-flex px-2 py-0.5 rounded-full text-xs font-medium
.chip-success / .chip-warning / .chip-error / .chip-info / .chip-neutral
```

**Alerts** (inline banner surface for forms, error messages)
```
.alert         → p-3 rounded-lg text-sm flex items-start gap-2 ring-1
.alert-error / .alert-success / .alert-warning / .alert-info
```

**Avatars** (circle with brand fill for initials/numbers)
```
.avatar     → w-10 h-10 rounded-full bg-aoz-primary text-ui-on-accent font-medium
.avatar-sm  → w-8 h-8 text-sm
.avatar-lg  → w-12 h-12 text-lg
```

**Score indicators**
```
.score-excellent  → bg-score-excellent text-ui-on-accent
.score-good       → bg-score-good text-ui-on-accent
.score-medium     → bg-score-medium text-score-contrast
.score-low        → bg-score-low text-ui-on-accent
.score-critical   → bg-score-critical text-ui-on-accent
```

**Icon containers** (square, subtle background — for category icons inside cards)
```
.icon-container     → w-10 h-10 rounded-md bg-ui-subtle text-ui-muted ring-1 ring-ui-border
.icon-container-sm  → w-8 h-8
.icon-container-lg  → w-12 h-12
```

**iOS safe-area utilities** (for sticky/fixed bottom CTAs)
```
.pb-safe  → padding-bottom: max(1rem, env(safe-area-inset-bottom))
.mb-safe  → margin-bottom: max(0px, env(safe-area-inset-bottom))
```

**Other**
```
.explainable-number → cursor-pointer underline decoration-dotted hover:decoration-aoz-primary
```

### Layout primitives (`src/components/ui/Page.tsx`)

```tsx
<PageShell>     → max-width container with vertical rhythm
<PageHeader     → page title + optional description, eyebrow, actions, backHref/backLabel
  title="..."
  description="..."
  backHref="/path"
  backLabel="Zurück"
  actions={<Button>...</Button>}
/>
<Toolbar>       → filter/action toolbar row
<EmptyState>    → dashed-border empty state with title/description/action
<ListShell>     → rounded list container with overflow-hidden
```

`<PageHeader>` is the SSOT for h1 — use it on every page. The `backHref` prop renders a `lucide-react` ChevronLeft + label above the title.

### SSOT rules — never violate

1. **All design tokens live in `globals.css` only.** `tailwind.config.ts` references CSS vars (`'rgb(var(--color-x) / <alpha-value>)'`), never literal values.
2. **Components use semantic Tailwind classes.** Never `bg-[#hex]`, `text-[#hex]`, `style={{ color: '#hex' }}`.
3. **Use existing component classes.** Don't rebuild `.card`, `.btn`, `.input`, `.badge`, `.chip`, `.alert`, `.avatar` patterns from primitives.
4. **Touch targets ≥ 44px on mobile.** Don't override `.btn-*` padding with `py-1` etc. Use `.btn-icon` for icon-only buttons.
5. **Use `shadow-card-hover` not raw `hover:shadow-md`** — raw Tailwind shadows don't compose with the dark-mode ring strategy.

**Audit commands:**
```
grep -rn '\[#' src/                              # hex in className violations
grep -rn 'rounded-full.*text-xs.*bg-status' src/ # missed chip migrations
grep -rn 'hover:shadow-md\|hover:shadow-sm' src/ # missed shadow migrations
grep -rn 'w-10 h-10.*bg-aoz-primary.*rounded-full' src/ # missed avatar migrations
```

---

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
| Lifestyle | 30% | Sleep schedule, noise tolerance, cleanliness |
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

## Authentication Roadmap

### Unified Code-Based Authentication

Both staff and residents log in with a single code input at `/login`.

| User | Code Format | Access | Session Cookie |
|------|-------------|--------|----------------|
| **Staff** | `AOZ-XXXXXX` | Full admin interface | `staff_session` (JWT) |
| **Resident** | `RES-XXXXXX` | Portal only (own data) | `resident_code` |

**Single role: ADMIN** — all staff have full access.

### Login Flow

```
/login              → Single code input (no email/password)
/api/auth/login     → loginByCode() routes by prefix:
                        AOZ-* → staff JWT session
                        RES-* → resident cookie session
/api/auth/logout    → Clears both cookies
/api/auth/register  → Admin-only staff provisioning (POST { name, code? })
```

- Code is trimmed and uppercased before lookup
- Rate limiting on login attempts (per IP)
- Staff users get JWT in `staff_session` httpOnly cookie
- Residents get code in `resident_code` httpOnly cookie
- Users with both cookies see role-switching links in nav

### Staff Provisioning

New staff users are created by admins via `POST /api/auth/register`:
- Requires authenticated admin session
- Takes `{ name: string, code?: string }` — code auto-generated if omitted
- Code must start with `AOZ-`
- No email/password needed

### Resident Portal

**What residents can do:**
- View their profile and preferences
- See current roommates
- Update preferences (triggers staff review)
- Report issues (goes to staff queue)
- Request transfer to different housing (goes to staff approval queue)
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
  id            String    @id @default(cuid())
  code          String    @unique  // AOZ-XXXXXX login code
  email         String?   @unique  // Optional, for reference
  passwordHash  String?            // Deprecated
  name          String
  role          StaffRole @default(ADMIN)
  active        Boolean   @default(true)
  lastLoginAt   DateTime?
  // ...
  @@index([code])
}
```

### Auth Status: FULLY IMPLEMENTED

| Component | Status | Location |
|-----------|--------|----------|
| Unified code login | Active | `src/lib/auth/index.ts` (`loginByCode()`) |
| Staff JWT auth | Active | `src/lib/auth/jwt.ts` |
| Middleware enforcement | Active | `src/middleware.ts` |
| Login page (unified) | Working | `src/app/login/page.tsx` |
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

### Unit Tests (Jest) — 2069 tests, 106 suites

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

### E2E Tests (Playwright) — 168 tests, 18 specs

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
npm run test             # Run Jest tests (2069 tests)
npm run test:e2e         # Run Playwright tests (168 tests)
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

**Last Updated**: 2026-07-16
