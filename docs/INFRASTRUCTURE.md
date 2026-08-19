# Where AOZ Begleitung actually runs

created_date: 2026-08-17
last_modified_date: 2026-08-19
last_modified_summary: Document fleet AI keys (Groq → OpenRouter); staff chat no longer uses Anthropic.

This file exists because a gitignored laptop `.env` still named a decommissioned Neon host, Prisma loaded it, and an agent treated that timeout as "the production database is unreachable". It was never the production database.

## Production (the only live instance)

| Fact | Value |
|------|--------|
| Public site | https://aoz.orangecat.ch |
| Host | Hetzner box `bitbaum`, `root@167.233.22.31` |
| App directory | `/opt/aoz-wohnen/` (releases under `current/`, env under `shared/.env`) |
| systemd | `aoz-wohnen-app.service` |
| Database | PostgreSQL 17 **on that box**, listening on `127.0.0.1:5432` |
| Database name | `aoz_wohnen` |
| Brand | `NEXT_PUBLIC_BRAND=wg` (in the box env, inlined at build) |
| Env SSOT | `/opt/aoz-wohnen/shared/.env` on the box — not GitHub secrets, not this repo, not a laptop `.env` |

The public badge and public domain can change without renaming the runtime. The
Hetzner app path, service name and database identifier still use the historical
`aoz-wohnen` address, and that is intentional.

Postgres on the box is loopback-only. There is no public `DATABASE_URL`. There is no cloud pooler.

## What this is not

Neon, Vercel and hosted Supabase were left on 2026-06-12 (see `CHANGELOG.md`). They are not a fallback. They are not "the other database". A URL containing `neon.tech`, `neondb`, `vercel.app` as the app host, or a Vercel OIDC token is **stale local debris**.

Do not:

- Restore those URLs into `.env`
- Treat Prisma's "loaded env from .env" line as proof of where production lives
- Run `prisma migrate` against whatever happens to be in a gitignored file without reading the host
- Invent a tunnel and then confuse this laptop's Postgres (`aoz_housing`, old scratch DBs) with `aoz_wohnen` on the box

## How code reaches the box

Push to `master` → `.github/workflows/deploy.yml` → reusable
`maonakamoto/fleetcrown/.github/workflows/selfhost-deploy.yml`.

That pipeline waits for this commit's CI, pulls `/opt/aoz-wohnen/shared/.env`
from the box (the box stays env SSOT), runs `prisma migrate deploy` against
`aoz_wohnen` over the deploy tunnel, builds, rsyncs, health-checks.

If CI on `master` is red, deploy is blocked. Auto-merge must set
`deploy_workflow: deploy.yml` so the next sweep retries once the tip is green
instead of leaving git ahead of the box. Observed 2026-08-17: #71 merged, CI
on that squash was red, deploy stopped at the CI gate, and without the
reconciler the box stayed on the 16 Aug release.

Manual rebuild (brand switch, stuck job):

```bash
gh workflow run deploy.yml -R maonakamoto/aoz-housing
```

Uncommitted work on a laptop is not in production. Neither is a branch that is not `master`.

## How to talk to the live database

From the box, with the box env:

```bash
ssh root@167.233.22.31
# then, as the app:
cd /opt/aoz-wohnen/current
# DATABASE_URL is already aoz_wohnen@localhost
npx prisma migrate status
```

Do not point this laptop's Prisma at Neon. Do not assume `localhost:5432` on the laptop is `aoz_wohnen` — that database lives on the box.

Local development uses a **local** Postgres and `.env.example` as the template (`aoz_wohnen` as the name so it matches production). Copy credentials from the box only when you are deliberately tunnelling, and rewrite the host/port to the tunnel — never keep a `neon.tech` host "for convenience".

## AI (fleet keys — same as Kivvi / FleetCrown)

All AI surfaces share one provider chain in `src/lib/ai/provider.ts`:

1. **`GROQ_API_KEY`** — free, fleet default (`llama-3.3-70b-versatile` or whatever `GROQ_MODEL` names)
2. **`OPENROUTER_API_KEY`** — fallback when Groq is down or rate-limited (`OPENROUTER_MODEL`, default `openai/gpt-oss-20b:free`)

Surfaces:

| Surface | Route / module | Package |
|---------|----------------|---------|
| Staff chat assistant | `/api/ai/chat` → `runStaffChat()` | tool-use loop, OpenAI-compatible API |
| Form assist ("Aus Text ausfüllen") | `/api/ai/form-assist` | `@fleet/ai-forms` → `completeText()` |

**Anthropic is not used.** Do not add `ANTHROPIC_API_KEY` to the box env for this app.

Production SSOT: copy `GROQ_API_KEY` and/or `OPENROUTER_API_KEY` from the same place as the other OrangeCat apps into `/opt/aoz-wohnen/shared/.env`. Without at least one key, both endpoints answer 503 with an explicit message.

The `@fleet/ai-forms` package (github:maonakamoto/ai-forms) is the shared form-fill engine — field registry stays server-side, keys stay in the host app. Extracting/publishing it further is optional product work; this repo already consumes it.

## Languages (so this is not re-litigated)

`src/lib/i18n/` dictionaries and `LanguageSwitcher` are the **resident portal**. Staff surfaces stay German. Admins speak Swiss state languages plus English; Tigrinya, Arabic, Farsi and the other origin languages are not loaded on `(admin)`. See `src/lib/i18n/locales.ts`.
