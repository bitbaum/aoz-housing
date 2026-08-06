/**
 * Staff code generation — Single Source of Truth
 * Shared by /api/auth/register and /api/auth/invite
 */
import { BRAND } from '@/lib/config/brand'

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_PREFIX = `${BRAND.shortName}-`
const CODE_LENGTH = 6

export function generateStaffCode(): string {
  let code = CODE_PREFIX
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  }
  return code
}
