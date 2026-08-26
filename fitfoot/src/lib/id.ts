import { randomBytes } from 'crypto'

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'

/** Collision-resistant, URL-safe id (24 chars, ~124 bits). No external dependency. */
export function createId(): string {
  const bytes = randomBytes(24)
  let out = ''
  for (let i = 0; i < 24; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length]
  }
  return out
}
