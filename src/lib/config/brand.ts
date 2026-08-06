/**
 * Brand Configuration — SSOT
 *
 * The product is one thing; the organisation whose name is on it is another.
 * Everything user-visible that names an organisation comes from here, so
 * re-badging is a one-line change (`NEXT_PUBLIC_BRAND`) rather than a sweep
 * through 150 files.
 *
 * Why this exists: the software is shown to AOZ under a neutral brand, and can
 * be handed over branded as AOZ if they want it. Both must be first-class —
 * neither is a "fork" or a patch of the other.
 *
 * What is deliberately NOT in here:
 *  - infrastructure identifiers (repo, deploy app `aoz-wohnen`, domain, the
 *    `aoz_wohnen` database, systemd units). Those are addresses, not branding;
 *    renaming them means DNS, Caddy and service churn for zero user benefit.
 *  - existing resident codes. `codePrefix` applies to NEWLY generated codes
 *    only; login resolves a code by exact string, so codes issued under a
 *    previous brand keep working forever. Nobody is locked out by a rebrand.
 *  - `JWT_ISSUER` ('aoz-housing') and the theme storage key ('aoz-theme').
 *    Rebranding those would invalidate every live session and silently reset
 *    everyone's light/dark preference — a cosmetic change must not log people
 *    out. They are opaque identifiers that users never read.
 */

export type BrandId = 'aoz' | 'aoch'

export interface Brand {
  id: BrandId
  /**
   * The acronym, and the only word that changes across the UI. Every piece of
   * German copy is of the form "AOZ-Regel" / "AOZ-Verwaltung" / "AOZ Wohnen",
   * so one token drives all of it. Deliberately not accompanied by separate
   * productName/emailTag/ruleLabel fields: config nobody reads is config that
   * drifts, and a field you can set with no visible effect is a trap.
   */
  shortName: string
  /**
   * Prefix for NEWLY generated login codes. Never applied retroactively —
   * login resolves a code by exact string, so codes issued under a previous
   * brand keep working. A rebrand must not lock anyone out.
   */
  codePrefix: string
}

export const BRANDS: Record<BrandId, Brand> = {
  // The original. Preserved exactly — colours in globals.css are unchanged and
  // remain the default palette, so switching back is lossless.
  aoz: {
    id: 'aoz',
    shortName: 'AOZ',
    codePrefix: 'AOZ-',
  },

  aoch: {
    id: 'aoch',
    shortName: 'AOCH',
    codePrefix: 'AOCH-',
  },
}

export const DEFAULT_BRAND_ID: BrandId = 'aoch'

function resolveBrandId(): BrandId {
  const configured = process.env.NEXT_PUBLIC_BRAND
  if (configured && configured in BRANDS) return configured as BrandId
  return DEFAULT_BRAND_ID
}

/** The brand this deployment runs under. Set `NEXT_PUBLIC_BRAND=aoz` to re-badge. */
export const BRAND: Brand = BRANDS[resolveBrandId()]
