/**
 * Login code prefixes — pure re-exports, safe to import from anywhere.
 *
 * This module exists SEPARATELY from `auth/constants.ts` on purpose. That file
 * throws at module load when `SESSION_SECRET` is missing in production — a
 * correct fail-fast for the server, but fatal if the module is ever pulled
 * into the client bundle, because the browser has no `SESSION_SECRET` and the
 * throw takes the whole page down during hydration.
 *
 * The German UI strings need the prefix ("Codes beginnen mit AOZ- oder KL-"),
 * and label modules are imported by client components. So the prefixes are
 * reached through here, with no side effects, and nothing a client component
 * can touch ever reaches the server's env guard. `config/brand.ts` is equally
 * side-effect-free (its only input is the build-inlined `NEXT_PUBLIC_BRAND`)
 * and is already in the client bundle via the navigation config.
 */

import { ALL_RESIDENT_CODE_PREFIXES, BRAND, LEGACY_RESIDENT_CODE_PREFIXES } from '../config/brand'

/**
 * Prefix on NEWLY ISSUED client/resident login codes, for the brand this
 * deployment runs under.
 *
 * This used to be a hardcoded `'RES-'` here, on the reasoning that "residents
 * are not the organisation". That confused the ORG's name with the PRODUCT's
 * vocabulary: the code is the person's identity on every staff list and every
 * login screen, and each register has its own word for that person —
 * Klient*in at AOZ, Mitbewohner*in in a shared flat. `RES-` was neither, and
 * being outside `brand.ts` meant it silently escaped every rebrand.
 *
 * GENERATION ONLY. Anything that must RECOGNISE a code — login, parsing,
 * redaction, cleanup — uses `ALL_RESIDENT_CODE_PREFIXES`, because codes
 * outlive the brand that issued them.
 */
export const RESIDENT_CODE_PREFIX = BRAND.residentCodePrefix

export { ALL_RESIDENT_CODE_PREFIXES, LEGACY_RESIDENT_CODE_PREFIXES }
