# CLAUDE.md - AI Assistant Context for AOZ Housing
---
created_date: 2025-01-22
last_modified_date: 2025-01-22
last_modified_summary: "Initial project setup with compatibility algorithm"
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
│   ├── app/                    # Next.js app router
│   │   ├── page.tsx           # Dashboard
│   │   ├── residents/         # Resident management
│   │   ├── housing/           # Housing unit management
│   │   ├── placements/        # Placement recommendations
│   │   ├── matching/          # Compatibility matching UI
│   │   └── analytics/         # Outcome tracking
│   ├── components/            # React components
│   │   ├── ui/               # Core UI (buttons, cards, inputs)
│   │   ├── forms/            # Data entry forms
│   │   └── matching/         # Compatibility displays
│   └── lib/
│       ├── db.ts             # Prisma client singleton
│       └── compatibility/    # Matching algorithm
│           ├── types.ts      # Type definitions
│           ├── scoring.ts    # Core scoring logic
│           └── index.ts      # Exports
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

### DRY / SSOT Principles
- Single source of truth for types in `lib/compatibility/types.ts`
- Reusable UI components in `components/ui/`
- Algorithm weights stored in database, not hardcoded
- Shared constants in dedicated files

### Progressive Disclosure
- Dashboard shows overview, drill down for details
- Forms reveal complexity progressively
- Scores show summary first, details on expand

## Current Status
- [x] Project scaffolding
- [x] Prisma schema design
- [x] Compatibility algorithm core
- [x] Basic dashboard UI
- [ ] Resident intake form
- [ ] Housing management
- [ ] Matching interface
- [ ] Outcome tracking
- [ ] Algorithm refinement from data

## Success Metrics
- **Conflict rate**: Fewer disputes per housing unit
- **Transfer reduction**: Less involuntary moves
- **Satisfaction**: Resident self-reported wellbeing
- **Cost savings**: Reduced intervention expenses
- **Staff efficiency**: Faster placement decisions

## Notes for AI Assistant
- Prioritize dignity and non-invasiveness in all features
- Keep UI simple for overworked caseworkers
- German language for user-facing text
- Test compatibility algorithm edge cases
- Consider cultural sensitivity in all design decisions
- Follow existing patterns in sibling projects (datacat, solon, orangecat)
