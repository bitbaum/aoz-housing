/**
 * Zod schemas for the account flows (register, email login, password reset).
 * SSOT for auth input validation — routes parse with these, never by hand.
 */

import { z } from 'zod'
import { PASSWORD_MIN_LENGTH } from '@/lib/auth/passwords'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .email(ERROR_MESSAGES.AUTH_EMAIL_INVALID)

const passwordField = z
  .string()
  .min(PASSWORD_MIN_LENGTH, ERROR_MESSAGES.AUTH_PASSWORD_TOO_SHORT)
  // bcrypt truncates at 72 bytes — refuse silently-truncated passwords.
  .max(72, ERROR_MESSAGES.AUTH_PASSWORD_TOO_LONG)

export const registerSchema = z.object({
  code: z.string().trim().toUpperCase().min(1, ERROR_MESSAGES.AUTH_CODE_REQUIRED),
  email: emailField,
  password: passwordField,
})

export const emailLoginSchema = z.object({
  email: emailField,
  password: z.string().min(1),
})

export const forgotPasswordSchema = z.object({
  email: emailField,
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordField,
})

export type RegisterInput = z.infer<typeof registerSchema>
export type EmailLoginInput = z.infer<typeof emailLoginSchema>
