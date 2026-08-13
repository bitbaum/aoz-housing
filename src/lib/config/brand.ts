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

export type BrandId = 'aoz' | 'aozh' | 'wg'

export interface Brand {
  id: BrandId
  /**
   * The acronym driving all compound German copy ("AOZ-Regel",
   * "AOZ-Verwaltung"). One token, many strings. Deliberately not accompanied
   * by per-string fields: config nobody reads is config that drifts, and a
   * field you can set with no visible effect is a trap.
   */
  shortName: string
  /**
   * Prefix for NEWLY generated staff login codes. Never applied retroactively —
   * login resolves a code by exact string, so codes issued under a previous
   * brand keep working. A rebrand must not lock anyone out.
   */
  codePrefix: string
  /** Product name in the chrome, login page and page titles. */
  productName: string
  /** The register line under the product name (login page, titles). */
  tagline: string
  /** Meta description — the org brands sell placement, the WG brand doesn't. */
  metaDescription: string
  /**
   * The RULE-ISSUING ORGANIZATION — distinct from the product. The org-rule
   * catalog, the rule hierarchy copy ("AOZ-Regel", "AOZ-Thema") and the org
   * contact info all name this organization, not the product: the WG-branded
   * product still runs under AOZ's rules. Governance copy must use `orgName`,
   * never `shortName`.
   */
  orgName: string
}

export const BRANDS: Record<BrandId, Brand> = {
  // The original. Preserved exactly — the `:root` palette in globals.css is the
  // AOZ palette byte-for-byte, so handing the product to AOZ is lossless rather
  // than a reconstruction.
  aoz: {
    id: 'aoz',
    shortName: 'AOZ',
    codePrefix: 'AOZ-',
    productName: 'AOZ Wohnen',
    tagline: 'Platzierungssystem',
    metaDescription:
      'Konflikte reduzieren und Wohlbefinden verbessern durch kompatibilitätsbasierte Wohnplatzierung',
    orgName: 'AOZ',
  },

  // The neutral badge. Same palette as AOZ by design — the brief was to keep
  // AOZ's colours and change only the name and the design language.
  aozh: {
    id: 'aozh',
    shortName: 'AOZH',
    codePrefix: 'AOZH-',
    productName: 'AOZH Wohnen',
    tagline: 'Platzierungssystem',
    metaDescription:
      'Konflikte reduzieren und Wohlbefinden verbessern durch kompatibilitätsbasierte Wohnplatzierung',
    orgName: 'AOZH',
  },

  // Real shared-flat deployments (first: Witikonerstrasse 458). Same product,
  // different register: nobody in a WG is "placed" by a "system".
  wg: {
    id: 'wg',
    shortName: 'WG',
    codePrefix: 'WG-',
    productName: 'WG Wohnen',
    tagline: 'Gemeinsam wohnen',
    metaDescription:
      'Gemeinsam wohnen, fair geteilt: Ausgaben, Aufgaben und Absprachen für die ganze Wohnung',
    // The WG-branded product runs under AOZ's rule catalog: the product is
    // WG, the organization behind the rules is AOZ.
    orgName: 'AOZ',
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
