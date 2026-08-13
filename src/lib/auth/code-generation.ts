/**
 * Login-code generation — Single Source of Truth
 * Shared by /api/auth/register, /api/auth/invite and the seed scripts.
 *
 * Relative imports on purpose: prisma/seed-real.ts runs under ts-node,
 * which does not resolve tsconfig path aliases.
 */
import { BRAND } from '../config/brand'
import { RESIDENT_CODE_PREFIX } from './code-prefixes'

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 6

function randomCode(prefix: string): string {
  let code = prefix
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  }
  return code
}

export function generateStaffCode(): string {
  return randomCode(BRAND.codePrefix)
}

export function generateResidentCode(): string {
  return randomCode(RESIDENT_CODE_PREFIX)
}
