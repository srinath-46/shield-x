import type { Supervisor } from '@/types'
import { SUPERVISOR, VALID_CREDENTIALS } from './mockData'
import { delay } from './store'

export class AuthError extends Error {}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** FR-1.3 — checked before credentials are ever submitted. */
export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim())
}

/**
 * FR-1.1. The error is deliberately generic: the specification requires that a
 * failure never reveals which of the two credentials was wrong (FR-1.5).
 */
export async function login(email: string, password: string): Promise<Supervisor> {
  await delay(null, 700)
  const matches =
    email.trim().toLowerCase() === VALID_CREDENTIALS.email &&
    password === VALID_CREDENTIALS.password
  if (!matches) {
    throw new AuthError('Incorrect email or password. Please try again.')
  }
  return SUPERVISOR
}

/** FR-1.2 — the OAuth handshake is stubbed until the provider is wired up. */
export async function loginWithGoogle(): Promise<Supervisor> {
  await delay(null, 900)
  return SUPERVISOR
}

/**
 * FR-1.9 — resolves a restored session back to its account. Synchronous because
 * a session is restored during the first render, before anything is painted; a
 * real backend would validate the stored token here instead and this becomes an
 * async call guarded by a loading state.
 */
export function supervisorForEmail(email: string): Supervisor | null {
  return email.trim().toLowerCase() === SUPERVISOR.email.toLowerCase() ? SUPERVISOR : null
}

/** FR-1.7 — always reports success so the response cannot enumerate accounts. */
export async function requestPasswordReset(email: string): Promise<string> {
  await delay(null, 600)
  return `If ${email.trim()} is a registered supervisor account, reset instructions are on their way.`
}

/** FR-7.7 */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await delay(null, 600)
  if (currentPassword !== VALID_CREDENTIALS.password) {
    throw new AuthError('Your current password is incorrect.')
  }
  VALID_CREDENTIALS.password = newPassword
}

export type PasswordStrength = 0 | 1 | 2 | 3 | 4

export function passwordStrength(password: string): PasswordStrength {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score++
  return Math.min(score, 4) as PasswordStrength
}

export const STRENGTH_LABELS = [
  'Too short',
  'Weak password',
  'Fair password',
  'Good password',
  'Strong password'
]
