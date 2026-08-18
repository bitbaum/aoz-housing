# FitFoot 2.0

> Swiss sustainable footwear — sold and managed on **our own platform**.

This is the full rebuild of [FitFoot](https://github.com/maonakamoto/fitfoot) as a
single self-contained Next.js app in the **evig architecture**: no MedusaJS, no
Sanity, no Supabase. Catalog, cart, checkout, orders, customers and the CRM all
live in one app on one self-hosted PostgreSQL database that we own.

## What it does

| Surface | Routes | What it does |
|---|---|---|
| **Storefront** | `/`, `/shop`, `/shop/[slug]`, `/about`, `/sustainability`, `/contact` | The original FitFoot brand (gold "Refined Swiss Luxury" palette, Inter + Playfair Display, "Two paths, one mission" new-vs-refurbished story) on live catalog data |
| **Commerce** | `/cart`, `/checkout`, `/checkout/success`, `/account` | Server-side cart (cookie token → DB), transactional checkout with row locks + stock decrement, guest checkout, order history |
| **Auth** | `/login`, `/register` | In-house email+password (bcrypt 12), JWT session cookie, three role tiers: CUSTOMER → STAFF → ADMIN |
| **CRM / Admin** | `/admin`, `/admin/{orders,customers,products,inquiries,newsletter}` | Dashboard KPIs, order queue with an explicit status state machine, customer 360 (orders + inquiries + staff notes), product & variant/stock management, contact-form inbox, newsletter list |

## The evig patterns in here

- **`TABLE_NAMES` SSOT** (`src/config/database.ts`) — every table name is a constant; app enums (categories, roles, statuses) are config + zod, not DB enums.
- **Section registry** (`src/config/sections.ts`) — each admin surface is one entry: path, label, sidebar item, dashboard card in one place.
- **Types derive from schema** — `$inferSelect`/`$inferInsert` pairs in `src/db/schema.ts`; request shapes from zod in `src/lib/validation/schemas.ts`.
- **Layered guards** — coarse middleware on `/admin` + `requireStaff()`/`requireAdmin()` re-checking the DB on every request (a deactivated account dies immediately, token or no token).
- **Transactional checkout** — `SELECT … FOR UPDATE` on cart lines, stock validated and decremented, prices and address snapshotted onto the order, all in one transaction (`src/lib/orders/checkout.ts`).
- **Money is integer Rappen end to end** (`src/lib/money.ts`); prices are VAT-inclusive (Swiss B2C, 8.1%), the VAT share is computed, shown and stored.
- **Order status is a state machine** (`src/lib/orders/status.ts`) — the admin UI renders exactly the legal transitions; illegal ones are unrepresentable.
- **Logger, not console.log** (`src/lib/logger.ts`, enforced by ESLint).
- **Email never throws** (`src/lib/email/`) — template functions returning `{subject, html, text}`; without `EMAIL_ENABLED=true` it logs and no-ops, so orders always succeed.

## Getting started

```bash
cd fitfoot
npm install
cp .env.example .env.local          # set DATABASE_URL + SESSION_SECRET

createdb fitfoot                    # any Postgres 14+
npm run db:migrate                  # apply drizzle/*.sql
npm run db:seed                     # 8 real products, admin account, demo order

npm run dev                         # http://localhost:3005
```

Seed admin login: `admin@fitfoot.ch` / `fitfoot-admin-2026` (override with
`SEED_ADMIN_PASSWORD`). **Change it before any real deployment.**

## Commands

```bash
npm run dev          # dev server (port 3005)
npm run build        # production build
npm run verify       # typecheck + lint + tests
npm run test         # Jest unit tests (money, totals/VAT, status machine, rate limit)
npm run db:generate  # regenerate migrations after schema changes
npm run db:studio    # browse the database
```

## Deliberately not in scope (yet)

- **Payments** — checkout creates `PENDING` orders (payment on invoice). The
  seam for Payrexx (Swiss: Twint/card, the evig choice) is the order status
  machine: a webhook flips `PENDING → PAID`.
- **Email transport** — the seam exists (`src/lib/email`); plug in
  nodemailer/Resend credentials and set `EMAIL_ENABLED=true`.
- **Product photos** — `imageUrl` per product; a branded placeholder renders
  until photos are uploaded.
