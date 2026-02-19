# AOZ Housing

Intelligent housing placement system for AOZ. Uses compatibility-based matching to reduce conflicts and improve wellbeing when placing asylum seekers in shared housing.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Database | PostgreSQL + Prisma |
| Styling | Tailwind CSS (mobile-first) |
| Validation | Zod |
| Auth | JWT sessions (bcryptjs + jose) |
| Testing | Jest (unit) + Playwright (E2E) |
| Monitoring | Sentry (optional) |

## Prerequisites

- Node.js 20+
- PostgreSQL 16+ (local) or [Neon](https://neon.tech) (hosted)

## Setup

```bash
# Clone and install
git clone <repo-url> && cd aoz-housing
npm install

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL and DIRECT_URL

# Initialize database
npx prisma db push

# Start development server
npm run dev
```

The app runs at **http://localhost:3001** by default.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server (port 3001) |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |
| `npm test` | Jest unit tests |
| `npm run test:e2e` | Playwright E2E tests |
| `npx tsc --noEmit` | TypeScript type check |
| `npm run prisma:push` | Push schema changes to DB |
| `npm run prisma:studio` | Visual database browser |
| `npm run prisma:seed` | Seed sample data |

## Project Structure

```
src/
  app/
    (admin)/        Staff interface (sidebar layout)
    portal/         Resident self-service portal
    api/            API routes (auth, residents, housing, etc.)
    login/          Login/registration page
  components/
    ui/             Generic UI (Card, Badge, Tabs, Toast)
    forms/          Config-driven form components
    layout/         Navigation, headers
    dashboard/      Dashboard widgets
    housing/        Housing-specific components
    residents/      Resident-specific components
    matching/       Compatibility matching UI
    portal/         Portal-specific components
  lib/
    config/         Factor definitions, thresholds (SSOT)
    compatibility/  Scoring algorithm
    matching/       Matching logic
    actions/        Server actions
    validation/     Zod schemas
    auth/           Authentication helpers
    constants/      German UI labels
    utils/          Shared utilities
prisma/
  schema.prisma     Database schema (source of truth)
tests/
  *.spec.ts         Playwright E2E tests
  helpers.ts        Shared test utilities
  auth.setup.ts     Global setup (registers test user)
```

## Key Concepts

### Staff Login

Staff members access the admin interface at `/login`. Registration requires an **invite code** (default: `0000`, configurable via `STAFF_INVITE_CODE` env var).

Default test credentials:
- Email: `e2e.staff@aoz.test`
- Password: `Password123!`

### Resident Portal

Residents access `/portal` using a personal code (format: `RES-XXXXXX`) printed on their welcome letter. No password required.

### Compatibility Scoring

The system scores how well a new resident fits with existing roommates across four dimensions:

| Dimension | Weight | Examples |
|-----------|--------|---------|
| Lifestyle | 30% | Sleep schedule, noise tolerance, cleanliness |
| Social | 25% | Languages, social style, privacy needs |
| Practical | 25% | Smoking, dietary, shared spaces |
| Risk | 20% | Historical conflict indicators |

Scores range from 0-100 with thresholds: green (80+), blue (60-79), yellow (40-59), orange (20-39), red (0-19).

### Config-Driven Architecture

All factor definitions, labels, and options live in `src/lib/config/`. Adding a new compatibility factor requires editing at most 2 files (config + Prisma schema).

### UI Language

The interface is in **Swiss German** (ss not ss, proper umlauts). Code and comments are in English.
