# AOZ Housing — Auth Boundary Model (Resident vs Staff)

## User Types

1. **Resident user**
   - Entry: `/portal`
   - Auth: `resident_code` cookie
   - Scope: resident self-service only (`/portal/*`, `/api/portal/*`)

2. **Staff user**
   - Entry: `/login`
   - Auth: `staff_session` JWT cookie
   - Scope: admin/staff operations (`/`, `/residents`, `/housing`, ...)

---

## Boundary Rules

- Resident auth does **not** grant staff access.
- Staff auth does **not** grant resident API access unless resident cookie exists.
- Public routes remain public (`/portal`, `/login`, `/portal/help`, health/auth endpoints).
- Unauthorized resident API access returns **401 JSON** (not redirect HTML).

---

## Expected Behaviors

### Resident side
- Missing resident cookie on `/portal/*` page -> redirect to `/portal`.
- Missing resident cookie on `/api/portal/*` -> `401 { success:false, error:'Nicht angemeldet' }`.

### Staff side
- Missing/invalid staff JWT on protected staff routes -> redirect to `/login?from=...` and clear invalid cookie.

---

## Security Notes

- Middleware does fast boundary checks; route handlers still perform full validation.
- Resident cookie presence is only an entry check; DB existence checks happen in route/auth helpers.
- Rate limiting exists on resident login (`/api/portal/login`).

---

## Next hardening steps

1. Add explicit automated auth-boundary tests for:
   - resident -> staff route denied
   - unauth -> portal API gets 401 JSON
   - repeated invalid resident login -> rate_limited
2. Add minimal staff role gate smoke checks for sensitive staff actions.
3. Add session-expiry/logout edge-case tests for both user types.
