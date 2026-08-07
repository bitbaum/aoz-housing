/**
 * Brand Configuration — SSOT
 *
 * The product is one thing; the organisation whose name is on it is another.
 * Everything user-visible that names an organisation comes from here, so
 * re-badging is a one-line change (`NEXT_PUBLIC_BRAND`) rather than a sweep
 * through 150 files.
 *
 * Why this exists: the software is shown to AOZ under a neutral brand, and can
 * be handed over badged as AOZ if they want it. Both must be first-class —
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
 *
 * Colours are NOT a field here. They live in `globals.css` as the
 * `--color-brand-*` tokens, because a colour belongs in the stylesheet that
 * also has to express it in light mode, dark mode and at 15% opacity. A brand
 * that wants a different palette adds a `:root[data-brand='<id>']` block; a
 * brand that wants the default palette (AOZH) adds nothing at all.
 */

export type BrandId = 'aoz' | 'aozh'

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
   * Prefix for NEWLY generated staff login codes. Never applied retroactively —
   * login resolves a code by exact string, so codes issued under a previous
   * brand keep working. A rebrand must not lock anyone out.
   */
  codePrefix: string
}

export const BRANDS: Record<BrandId, Brand> = {
  // The original. Preserved exactly — the `:root` palette in globals.css is the
  // AOZ palette byte-for-byte, so handing the product to AOZ is lossless rather
  // than a reconstruction.
  aoz: {
    id: 'aoz',
    shortName: 'AOZ',
    codePrefix: 'AOZ-',
  },

  // The neutral badge. Same palette as AOZ by design — the brief was to keep
  // AOZ's colours and change only the name and the design language.
  aozh: {
    id: 'aozh',
    shortName: 'AOZH',
    codePrefix: 'AOZH-',
  },
}

export const DEFAULT_BRAND_ID: BrandId = 'aozh'

/**
 * Every code prefix any brand has ever issued.
 *
 * Consumers that must recognise codes across a rebrand — log redaction, code
 * parsing — read this rather than the active brand. Codes outlive the brand
 * that issued them, so anything matching on `BRAND.codePrefix` alone silently
 * stops working the day the name changes. That is exactly how the log
 * redactor's hardcoded /AOZ-…/ pattern would have started leaking staff codes.
 */
export const ALL_CODE_PREFIXES: readonly string[] = Object.values(BRANDS).map(
  (brand) => brand.codePrefix
)

function resolveBrandId(): BrandId {
  const configured = process.env.NEXT_PUBLIC_BRAND
  if (configured && configured in BRANDS) return configured as BrandId
  return DEFAULT_BRAND_ID
}

/** The brand this deployment runs under. Set `NEXT_PUBLIC_BRAND=aoz` to re-badge. */
export const BRAND: Brand = BRANDS[resolveBrandId()]
