# AOZ Housing

Intelligent compatibility-based housing placement for refugees. Reduces conflicts through algorithmic matching across 38 factors and 4 dimensions.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![Jest](https://img.shields.io/badge/Tests-212%20unit-green.svg)](https://jestjs.io/)
[![Playwright](https://img.shields.io/badge/E2E-45%20tests-green.svg)](https://playwright.dev/)

## What It Does

- **Scores compatibility** between residents across 4 dimensions (lifestyle, social, practical, risk) before placement
- **Detects blocking conflicts** (e.g., smoker placed with asthmatic) and flags them before they happen
- **Evaluates apartment-level fit**, not just pairwise -- a new resident is matched against the entire existing group
- **Predicts conflict timelines** (e.g., "High probability cleanliness conflict in weeks 2-4")
- **Audits every placement** with who, what, when, why, and the compatibility score at decision time

---

## Ethical Boundaries

This section comes first because it defines what this system is and is not.

Housing placement for refugees carries real power over real lives. The algorithm must be constrained by principle, not just by code. We draw a hard line.

### What We Track (Functional Only)

- **Compatibility-relevant preferences**: sleep schedule, noise tolerance, cleanliness standards
- **Languages spoken**: for communication matching, not profiling
- **Mobility needs**: ground floor, wheelchair access -- functional requirements, not diagnoses
- **Medical equipment needs**: CPAP, dialysis -- only when it requires space or power, never the underlying condition
- **Self-reported preferences**: residents define their own needs
- **Anonymized conflict outcomes**: to improve the algorithm, never to profile individuals

### What We Never Track

- Medical diagnoses
- Immigration status or case details
- Political or religious beliefs
- Personal history beyond housing relevance
- Any factor that could enable discrimination

> "Collect minimum data. Never track immigration status, religion, or medical diagnoses."

This is not a disclaimer. It is a design constraint enforced in code. If a factor cannot be justified by direct housing relevance, it does not enter the system.

---

## Architecture

### Config-Driven Design (2-File Changes)

All factor definitions, labels, options, thresholds, and colors live in `src/lib/config/`. Adding a new compatibility factor requires editing at most 2 files: config + Prisma schema. Forms, scoring, display, and validation auto-generate from config.

Key config files:
- `resident-factors.ts` (550+ lines) -- 38 resident factors organized by form section (basic, lifestyle, social, practical, household, health, preferences, notes)
- `housing-factors.ts` -- 20+ housing unit factors by category
- `thresholds.ts` (150+ lines) -- all numeric boundaries, score colors, display limits, problem detection
- `apartment-thresholds.ts` -- blocking conflict definitions (cleanliness, noise, sleep schedule)
- `scoring-scales.ts` -- weight adjustments per dimension

### 4-Dimensional Compatibility Scoring

`src/lib/compatibility/scoring.ts` (676 lines)

| Dimension | Weight | What It Measures |
|-----------|--------|------------------|
| Lifestyle | 35% | Sleep schedule, noise tolerance, cleanliness |
| Social | 25% | Languages, social style, privacy needs |
| Practical | 25% | Smoking, dietary needs, shared spaces, chores |
| Risk | 20% | Age gap, language barrier, smoking mismatch |

Score range: 0--100. Thresholds: Excellent (80+), Good (60-79), Moderate (40-59), Low (20-39), Critical (0-19).

### Apartment Aggregate Matching

`src/lib/compatibility/aggregate.ts` (400+ lines)

A new resident is evaluated against the entire apartment profile, not just individual pairwise scores:

- Calculates apartment averages for noise, cleanliness, chores, privacy
- Identifies dominant sleep schedule and social style
- Detects common languages across current residents
- Classifies conflicts: BLOCKING (cannot place), HIGH (needs review), MEDIUM (flag), LOW (acceptable)
- Small group bonus: +5 points for groups of 2 or fewer (easier integration)

### Lingua Franca Support

German/English speakers score 75+ even without an exact language match. In the refugee context, a common bridge language matters more than perfect overlap.

### Conflict Prediction

The system detects when conflicts are likely to emerge and estimates timeframes. A placement that looks acceptable on day one may degrade -- the algorithm surfaces this before it happens.

### Audit Trail

`src/lib/audit.ts` -- all placements logged with who, what, when, why. Compatibility scores recorded at placement time. Override reasons tracked. Non-blocking: failures are logged but never throw.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Database | PostgreSQL 16 + Prisma |
| Styling | Tailwind CSS (mobile-first) |
| Validation | Zod |
| Auth | JWT sessions (bcryptjs + jose) |
| Testing | Jest (212 unit) + Playwright (45 E2E) |
| CI/CD | GitHub Actions |

---

<details>
<summary><strong>Quick Start</strong></summary>

### Prerequisites

- Node.js 18+
- PostgreSQL 16
- pnpm (recommended)

### Setup

```bash
git clone <repo-url> && cd aoz-housing
pnpm install
cp .env.example .env.local    # configure DATABASE_URL and secrets
pnpm prisma migrate deploy
pnpm dev
```

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Session signing key |
| `NEXTAUTH_URL` | Application URL |

</details>

---

## Testing

Testing is not an afterthought. The compatibility algorithm makes placement decisions that affect people's daily lives. Every scoring path, every threshold boundary, every conflict classification is tested.

### Unit Tests: 212 tests across 36 suites

| Area | Suites | What They Cover |
|------|--------|-----------------|
| Server Actions | 9 | CRUD for residents, housing, placements, incidents, maintenance, matching, satisfaction, spots, transfers |
| API Routes | 9 | Auth, portal, cron, CSV export/import |
| Compatibility | 3 | Scoring algorithm, conversion, aggregate matching |
| Auth | 3 | JWT handling, rate limiting, role policy, route boundaries |
| Email | 2 | German content/structure, cron notifications |
| CSV | 3 | Export generation, routing, import validation |
| Analytics | 1 | Unit metrics calculation |
| UI | 2 | BedGrid component, style utilities |
| Config | 3 | Labels, formatting, factor configuration |

### E2E Tests: 45 tests across 11 Playwright specs

- Auth flow, resident creation, matching workflow, incident reporting
- Placement check-in, housing detail, dashboard, navigation
- Mobile responsiveness (375px, 414px, 768px, 1024px+)
- Accessibility via axe-core

### CI Pipeline

`.github/workflows/ci.yml` runs on every push:

1. **Lint + Type Check** -- ESLint + TypeScript strict mode
2. **Unit Tests** -- Jest with coverage reporting
3. **Build** -- Next.js production build
4. **E2E Tests** -- Playwright against PostgreSQL 16 service container

---

## Project Structure

```
src/
  app/                    # Next.js App Router pages and API routes
  lib/
    config/               # Factor definitions, thresholds, scoring scales
    compatibility/        # Scoring engine, aggregate matching, conflict detection
    audit.ts              # Placement audit trail
    auth/                 # JWT sessions, role policy, rate limiting
  components/             # UI components (mobile-first)
prisma/
  schema.prisma           # Single source of truth for data model
tests/
  unit/                   # 212 unit tests (36 suites)
  e2e/                    # 45 Playwright specs (11 files)
.github/
  workflows/ci.yml        # Lint, test, build, E2E pipeline
```

---

## License

MIT
