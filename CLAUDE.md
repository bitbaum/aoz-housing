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
│   │   └── maintenance/   # Maintenance tickets
│   └── portal/            # Resident self-service (simple layout)
├── components/
│   ├── ui/               # Generic UI (Card, Badge, Tabs)
│   ├── forms/            # Config-driven form components
│   ├── layout/           # MobileNav, headers
│   ├── dashboard/        # Dashboard widgets
│   ├── housing/          # Housing-specific components
│   └── residents/        # Resident-specific components
└── lib/
    ├── config/           # SSOT for all config
    │   ├── types.ts
    │   ├── resident-factors.ts
    │   ├── housing-factors.ts
    │   └── thresholds.ts
    ├── compatibility/    # Scoring algorithm
    ├── actions/          # Server actions
    ├── validation/       # Zod schemas
    └── constants/        # Labels (German UI text)
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

### Two User Types

| User | Access | Auth Method |
|------|--------|-------------|
| **Staff** | Full admin interface | Email/password or AOZ SSO |
| **Resident** | Portal only (own data) | Simple code (e.g., RES-001) |

### Staff Authentication (Phase 1)

**What staff can do:**
- View/edit all residents and housing
- Make placements
- Record incidents
- View analytics

**Implementation:**
```
/login              → Staff login page
/api/auth/login     → Verify credentials
/api/auth/logout    → Clear session

Middleware: Check session on all /admin routes
```

**Permission levels (future):**
| Role | Permissions |
|------|-------------|
| Admin | Everything + user management |
| Case Worker | Residents, placements, incidents |
| Viewer | Read-only access |

### Resident Portal (Phase 2)

**What residents can do:**
- View their profile and preferences
- See current roommates
- Update preferences (triggers staff review)
- Report issues (goes to staff queue)
- View help/FAQ

**Implementation:**
```
/portal             → Enter resident code
/portal/dashboard   → After login, see own info
/portal/preferences → Update own preferences
/portal/report      → Submit issue to staff

Session: Store resident code in cookie (httpOnly)
No password needed - code is printed on welcome letter
```

**Security considerations:**
- Codes are semi-public (like a hotel room number)
- Residents can only see/edit their OWN data
- Sensitive actions (transfers, incidents) go to staff for approval
- Rate limiting on code entry to prevent guessing

### Database Changes Needed

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String
  role          Role     @default(CASE_WORKER)
  createdAt     DateTime @default(now())
}

enum Role {
  ADMIN
  CASE_WORKER
  VIEWER
}

// Resident model already has 'code' field for portal login
```

### Auth Status: FULLY IMPLEMENTED

Both authentication systems are live and enforced:

| Component | Status | Location |
|-----------|--------|----------|
| Staff JWT auth | Active | `src/lib/auth/jwt.ts` |
| Middleware enforcement | Active | `src/middleware.ts` |
| Login page | Working | `src/app/login/page.tsx` |
| Registration (invite code) | Working | `src/app/api/auth/register/route.ts` |
| Rate limiting | Active | `src/lib/auth/rate-limit.ts` |
| Role-based access | Active | `src/lib/auth/role-policy.ts` |
| Portal code auth | Active | `src/lib/portal-auth.ts` |
| Portal login/register | Working | `src/app/api/portal/login/route.ts` |
| Session refresh | Active | Middleware handles sliding sessions |
| Audit logging | Active | `src/lib/audit.ts` |

**Staff auth flow:** Email/password → JWT token → httpOnly cookie (`staff_session`)
**Portal auth flow:** Resident code (e.g., `RES-A2B3C4`) → httpOnly cookie (`resident_code`)

**To create initial admin:** Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`, run `npx ts-node prisma/seed-admin.ts`

---

## Testing Strategy

### Unit Tests (Jest) — 704 tests, 31 suites

| Area | Suites | Coverage |
|------|--------|----------|
| Server actions | 8 | All CRUD actions for residents, housing, placements, incidents, maintenance, matching, satisfaction, spots |
| API routes | 8 | Auth (login, register, session, logout), portal (login, register, chores, report, satisfaction, preferences) |
| Compatibility | 3 | Algorithm, conversion, aggregate scoring |
| Auth utilities | 3 | JWT, password, rate limiting, role policy, route boundaries |
| Analytics | 1 | Unit metrics calculation |
| UI components | 2 | BedGrid, style utilities |
| Config | 3 | Labels, formatting, factor config |

### E2E Tests (Playwright) — 50 tests, 11 specs

- Auth flow (login, registration)
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
npm run test             # Run Jest tests (704 tests)
npm run test:e2e         # Run Playwright tests (50 tests)
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
