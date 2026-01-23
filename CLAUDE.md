# CLAUDE.md - AI Assistant Context for AOZ Housing
---
created_date: 2025-01-22
last_modified_date: 2025-01-23
last_modified_summary: "Added config-driven architecture, health/support fields, satisfaction tracking, and mandatory engineering principles"
---

## Project Overview

**AOZ Housing** is an intelligent placement system for Asylorganisation Zürich (AOZ) that reduces conflicts and improves wellbeing by replacing random housing assignments with compatibility-based matching.

**Core Workflow**: Data Ingestion → Compatibility Analysis → Placement Recommendations

### The Problem
- Housing shortage in Zürich forces multiple refugees into shared accommodations
- Current placement is random and disruptive
- Refugees are already vulnerable; instability worsens mental health
- Conflicts cost AOZ and taxpayers money in interventions
- No prevention - only reactive problem-solving

### The Solution
1. **Assess** compatibility factors (non-invasive, dignity-preserving)
2. **Predict** potential conflicts before they occur
3. **Recommend** optimal placements that maximize harmony
4. **Track** outcomes to continuously improve the algorithm

## Tech Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Validation**: Zod
- **Testing**: Jest + Playwright

## Project Structure
```
/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── page.tsx           # Dashboard
│   │   ├── residents/         # Resident management
│   │   ├── housing/           # Housing unit management
│   │   ├── placements/        # Placement history
│   │   ├── incidents/         # Incident tracking
│   │   ├── matching/          # Compatibility matching UI
│   │   ├── analytics/         # Outcome tracking
│   │   └── portal/            # Resident self-service
│   ├── components/
│   │   ├── ui/               # Generic UI components
│   │   └── forms/            # Form components (config-driven)
│   │       ├── DynamicFormField.tsx   # Renders any factor type
│   │       ├── DynamicFormSection.tsx # Renders form sections
│   │       ├── ResidentFormFields.tsx # Resident form
│   │       └── HousingFormFields.tsx  # Housing form
│   └── lib/
│       ├── config/           # ⭐ SINGLE SOURCE OF TRUTH
│       │   ├── types.ts      # Factor type definitions
│       │   ├── resident-factors.ts  # All resident factors
│       │   ├── housing-factors.ts   # All housing factors
│       │   └── index.ts      # Exports
│       ├── compatibility/    # Scoring algorithm
│       │   ├── types.ts      # Compatibility types
│       │   ├── scoring.ts    # Core scoring logic
│       │   └── index.ts      # Exports
│       ├── actions/          # Server actions
│       │   ├── residents.ts  # Resident CRUD
│       │   ├── housing.ts    # Housing CRUD
│       │   ├── placements.ts # Placement actions
│       │   ├── satisfaction.ts # Check-in tracking
│       │   └── index.ts      # Exports
│       ├── constants/        # Static labels
│       │   └── labels.ts     # German UI text
│       ├── utils/            # Helper functions
│       └── db.ts             # Prisma client singleton
├── prisma/
│   └── schema.prisma         # Database models
├── tests/                    # Test files
└── docs/                     # Documentation
```

## Key Commands
```bash
npm run dev              # Start development server
npm run build            # Production build
npm run lint             # Run ESLint
npm run test             # Run Jest tests
npm run test:e2e         # Run Playwright E2E tests
npm run prisma:generate  # Generate Prisma client
npm run prisma:push      # Push schema to database
npm run prisma:studio    # Open database browser
```

## Data Model

### Residents (non-identifying compatibility factors)
- **Demographics**: Age range, gender, family status
- **Lifestyle**: Sleep schedule, noise tolerance, cleanliness (1-5)
- **Social**: Introversion/extroversion, languages, cultural region
- **Practical**: Smoking, dietary needs, mobility, medical equipment
- **Preferences**: Pets, shared spaces, privacy level (1-5)
- **Health/Support** (functional, not diagnostic):
  - Room sharing status (can share / prefers private / needs private)
  - Night disturbances (boolean)
  - Needs quiet environment (boolean)
  - Sleep equipment (boolean)
  - Support level (standard / elevated / intensive)

### Housing Units
- Capacity (beds, rooms, shared vs private)
- Facilities (bathrooms, kitchen arrangements)
- Accessibility (ground floor, wheelchair, elevator)
- Rules (smoking, pets, quiet hours)
- Location factors (transport, health services, schools)

### Placements
- Resident-to-unit assignments with dates
- Compatibility scores at placement time
- Outcome tracking (conflicts, transfers, satisfaction)

### Satisfaction Check-Ins
- Linked to placement
- Check-in type (initial, regular, ad-hoc, exit)
- Ratings: overall, roommates, facility, safety (1-5)
- Qualitative: concerns, improvements, positives
- Week number since placement start

## Compatibility Algorithm

### Scoring Dimensions (weights configurable)
| Dimension | Weight | Factors |
|-----------|--------|---------|
| Lifestyle | 30% | Sleep schedule, noise tolerance, cleanliness |
| Social | 25% | Language overlap, social style, privacy needs |
| Practical | 25% | Smoking, dietary, shared space preferences |
| Risk | 20% | Conflict indicators (inverted - lower = better) |

### Output
- Overall score (0-100)
- Per-dimension breakdown
- Strengths (what makes them compatible)
- Concerns (potential issues)
- Recommendations (mitigations if placed together)

### Score Interpretation
| Score | Label | Action |
|-------|-------|--------|
| 80-100 | Sehr gut | Recommend placement |
| 60-79 | Gut | Good option |
| 40-59 | Mittel | Consider with mitigations |
| 20-39 | Niedrig | Avoid if alternatives exist |
| 0-19 | Kritisch | Do not place together |

## Ethical Principles

### What We Track
- Compatibility-relevant preferences only
- Self-reported data where possible
- Anonymized outcomes for improvement

### What We Don't Track
- Medical diagnoses or mental health details
- Immigration status details
- Political or religious beliefs (only practical needs)
- Personal history beyond housing relevance

### Privacy by Design
- Minimal data collection
- Purpose limitation
- Resident access to own data
- No external data sharing
- Regular data review and deletion

## Development Guidelines

### Code Style
- TypeScript strict mode
- Functional components with hooks
- Tailwind for styling (no inline styles)
- German UI labels, English code/comments

### Progressive Disclosure
- Dashboard shows overview, drill down for details
- Forms reveal complexity progressively
- Scores show summary first, details on expand

---

## ⚠️ MANDATORY: Engineering Principles

**These rules are NON-NEGOTIABLE. Violating them creates technical debt.**

### Pre-Implementation Checklist

Before writing ANY code, answer these questions:

1. **Will this change frequently?**
   - If YES → Make it configuration-driven, not hardcoded
   - If NO → Hardcoding is acceptable

2. **Does similar code exist elsewhere?**
   - If YES → Extract to shared component/function
   - If NO → Consider if it WILL exist elsewhere soon

3. **Who will maintain this?**
   - Non-engineers → Must be config files, not code changes
   - Engineers → Code is acceptable but still prefer config

4. **What happens when requirements change?**
   - Design for the change, not just current requirements

### Architecture Patterns (MUST FOLLOW)

#### 1. Configuration Over Code

**For data that changes:** Use config files, not hardcoded values.

```
WRONG:
  const labels = { ACTIVE: 'Aktiv', PLACED: 'Platziert' }  // in component

RIGHT:
  // src/lib/config/resident-factors.ts
  export const RESIDENT_FACTORS = {
    status: {
      options: ['ACTIVE', 'PLACED'],
      labels: { ACTIVE: 'Aktiv', PLACED: 'Platziert' }
    }
  }
```

#### 2. Single Source of Truth (SSOT)

**Each piece of data lives in ONE place:**

| Data Type | Source Location |
|-----------|-----------------|
| Resident factors | `src/lib/config/resident-factors.ts` |
| Housing factors | `src/lib/config/housing-factors.ts` |
| Compatibility rules | `src/lib/config/resident-factors.ts` (in each factor) |
| UI labels | Derived from config, or `src/lib/constants/labels.ts` |
| Types | `src/lib/config/types.ts` or `src/lib/compatibility/types.ts` |

**Never duplicate.** If you need data in two places, import from the source.

#### 3. Separation of Concerns

```
src/lib/
├── config/          # WHAT exists (factor definitions)
├── compatibility/   # HOW to score (algorithm logic)
├── actions/         # Server actions (data mutations)
├── constants/       # Static labels not in config
└── utils/           # Pure helper functions

src/components/
├── forms/           # Form components (render from config)
└── ui/              # Generic UI components
```

#### 4. Change Impact Analysis

Before adding a field, trace where it needs to exist:

```
New Factor Checklist:
□ src/lib/config/resident-factors.ts (definition)
□ prisma/schema.prisma (storage)
□ src/lib/actions/residents.ts (extraction)
□ src/lib/compatibility/types.ts (if used in scoring)
□ src/lib/compatibility/scoring.ts (if affects compatibility)

If you're editing MORE than these files, you're doing it wrong.
```

#### 5. Form Generation

**Forms MUST be generated from config, not hardcoded:**

```
WRONG:
  <select name="ageRange">
    <option value="YOUNG_ADULT">18-25</option>
    <option value="ADULT">26-40</option>
  </select>

RIGHT:
  const factor = RESIDENT_FACTORS.ageRange
  <select name={factor.id}>
    {factor.options.map(opt => (
      <option key={opt} value={opt}>{factor.optionLabels[opt]}</option>
    ))}
  </select>
```

### Questions to Ask Before Implementing

1. "If a social worker asks to add a new field tomorrow, how many files change?"
   - **Target: 2 files** (config + schema)
   - **Red flag: 5+ files**

2. "If labels need translation, where do I change them?"
   - **Target: 1 file**
   - **Red flag: Scattered across components**

3. "Can I explain this architecture in one sentence?"
   - **Target: Yes** ("Config defines factors, forms render from config, scoring reads config")
   - **Red flag: "It's complicated..."**

4. "What's the blast radius of changing this?"
   - **Target: Isolated to one module**
   - **Red flag: Changes cascade through codebase**

### Anti-Patterns to AVOID

| Anti-Pattern | Why It's Bad | Do This Instead |
|--------------|--------------|-----------------|
| Labels in components | Can't translate, duplicated | Import from config/constants |
| Options hardcoded in JSX | Can't reuse, hard to maintain | Generate from config |
| Business logic in components | Can't test, can't reuse | Move to lib/ |
| Copying existing bad code | Multiplies debt | Fix the pattern first |
| "Make it work now, fix later" | Later never comes | Design first, then code |

### When to Stop and Redesign

If you find yourself:
- Copying the same code to a third location → Extract to shared module
- Adding a field requires 5+ file changes → Architecture is wrong
- Editing component code to add data → Should be config
- Writing "temporary" workarounds → Fix the root cause

**STOP. Refactor first. Then continue.**

---

## Current Status
- [x] Project scaffolding
- [x] Prisma schema design
- [x] Compatibility algorithm core
- [x] Basic dashboard UI
- [x] Config-driven factor system
- [x] Resident management (list, detail, create, edit)
- [x] Housing management (list, detail, create, edit)
- [x] Incident tracking
- [x] Matching interface
- [x] Placement management (create, end)
- [x] Health/support needs (functional, not diagnostic)
- [x] Satisfaction tracking model
- [ ] Satisfaction check-in UI
- [ ] Analytics dashboard
- [ ] Algorithm refinement from data

## Success Metrics
- **Conflict rate**: Fewer disputes per housing unit
- **Transfer reduction**: Less involuntary moves
- **Satisfaction**: Resident self-reported wellbeing
- **Cost savings**: Reduced intervention expenses
- **Staff efficiency**: Faster placement decisions

## Notes for AI Assistant

### Non-Negotiable Principles
1. **READ THE ENGINEERING PRINCIPLES SECTION ABOVE BEFORE CODING**
2. **ASK** "How often will this change?" before hardcoding anything
3. **STOP** if you find yourself editing 5+ files to add a simple field
4. **REFACTOR** bad patterns before adding to them

### Domain Principles
- Prioritize dignity and non-invasiveness in all features
- Keep UI simple for overworked caseworkers
- German language for user-facing text
- Consider cultural sensitivity in all design decisions

### Technical Principles
- All factors defined in `src/lib/config/` (SSOT)
- Forms generated from config, not hardcoded
- Labels in config or constants, never in components
- Adding a factor = 2 files (config + schema), not 5+

### Before Implementing Any Feature
1. Check if config-driven solution exists
2. If not, create config structure first
3. Then implement feature using config
4. Never hardcode what could be configured
