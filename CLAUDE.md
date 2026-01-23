# AOZ Housing

@~/.claude/CLAUDE.md

---

## Overview

**AOZ Housing** is an intelligent placement system for Asylorganisation Zürich (AOZ) that reduces conflicts and improves wellbeing through compatibility-based housing matching.

**Core Workflow**: Data Ingestion → Compatibility Analysis → Placement Recommendations

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS |
| Database | PostgreSQL with Prisma |
| Validation | Zod |
| Testing | Jest + Playwright |

---

## Project Structure

```
src/
├── app/                    # Next.js pages
│   ├── residents/         # Resident management
│   ├── housing/           # Housing units
│   ├── placements/        # Placement history
│   ├── incidents/         # Incident tracking
│   └── matching/          # Compatibility UI
├── components/
│   ├── ui/               # Generic UI
│   └── forms/            # Config-driven forms
└── lib/
    ├── config/           # SSOT for factors
    │   ├── types.ts
    │   ├── resident-factors.ts
    │   └── housing-factors.ts
    ├── compatibility/    # Scoring algorithm
    ├── actions/          # Server actions
    └── constants/labels.ts
```

---

## Critical: Config-Driven Factor System

**SSOT for Factors**: `src/lib/config/`

```typescript
// All factors defined in config
export const RESIDENT_FACTORS = {
  ageRange: {
    id: 'ageRange',
    type: 'select',
    options: ['YOUNG_ADULT', 'ADULT', 'MIDDLE_AGED', 'SENIOR'],
    labels: { YOUNG_ADULT: '18-25', ADULT: '26-40', ... },
    weight: 0.15,
  },
  // ...
};

// Forms GENERATED from config
const factor = RESIDENT_FACTORS.ageRange;
<select name={factor.id}>
  {factor.options.map(opt => (
    <option key={opt} value={opt}>{factor.labels[opt]}</option>
  ))}
</select>
```

**Adding a Factor** (2 files only):
1. `src/lib/config/resident-factors.ts` (definition)
2. `prisma/schema.prisma` (storage)

---

## Compatibility Algorithm

### Scoring Dimensions

| Dimension | Weight | Factors |
|-----------|--------|---------|
| Lifestyle | 30% | Sleep schedule, noise tolerance, cleanliness |
| Social | 25% | Language overlap, social style, privacy |
| Practical | 25% | Smoking, dietary, shared space |
| Risk | 20% | Conflict indicators (inverted) |

### Score Interpretation

| Score | Label | Action |
|-------|-------|--------|
| 80-100 | Sehr gut | Recommend placement |
| 60-79 | Gut | Good option |
| 40-59 | Mittel | Consider with mitigations |
| 20-39 | Niedrig | Avoid if alternatives |
| 0-19 | Kritisch | Do not place together |

---

## Ethical Principles

### What We Track (functional, non-invasive)
- Compatibility-relevant preferences
- Self-reported data
- Anonymized outcomes

### What We DON'T Track
- Medical diagnoses
- Immigration status details
- Political/religious beliefs
- Personal history beyond housing

---

## Language Rules

- **UI Labels**: German
- **Code/Comments**: English
- Use config for all user-facing text

---

## Quick Start

```bash
npm run dev              # Development server
npm run prisma:generate  # Generate Prisma client
npm run prisma:push      # Push schema to database
npm run prisma:studio    # Open database browser
```

---

## Don't

- Hardcode factor options in JSX (use config)
- Track medical diagnoses (track functional needs only)
- Scatter labels in components (use config/constants)
- Edit 5+ files to add a factor (should be 2)

---

**Last Updated**: 2026-01-23
