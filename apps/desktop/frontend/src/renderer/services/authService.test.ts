// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as auth from './authService'
import { SUPERVISOR, VALID_CREDENTIALS } from './mockData'

const ORIGINAL_PASSWORD = VALID_CREDENTIALS.password

/**
 * Authentication runs through the simulated latency in `store.delay`, so these
 * drive fake timers rather than waiting out ~700ms per case.
 */
async function settle<T>(promise: Promise<T>): Promise<T> {
  const result = promise.then(
    (value) => ({ ok: true as const, value }),
    (error: Error) => ({ ok: false as const, error })
  )
  await vi.advanceTimersByTimeAsync(2000)
  const settled = await result
  if (!settled.ok) throw settled.error
  return settled.value
}

describe('isValidEmail (FR-1.3)', () => {
  it('accepts an ordinary address', () => {
    expect(auth.isValidEmail('r.mendez@site.com')).toBe(true)
    expect(auth.isValidEmail('  r.mendez@site.com  ')).toBe(true)
  })

  it('rejects addresses missing a domain, a user, or an @', () => {
    expect(auth.isValidEmail('r.mendez@site')).toBe(false)
    expect(auth.isValidEmail('r.mendez')).toBe(false)
    expect(auth.isValidEmail('@site.com')).toBe(false)
    expect(auth.isValidEmail('')).toBe(false)
    expect(auth.isValidEmail('a b@site.com')).toBe(false)
  })
})

describe('login', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    VALID_CREDENTIALS.password = ORIGINAL_PASSWORD
  })

  it('returns the supervisor for valid credentials (FR-1.1)', async () => {
    const supervisor = await settle(auth.login(VALID_CREDENTIALS.email, VALID_CREDENTIALS.password))
    expect(supervisor.email).toBe(SUPERVISOR.email)
  })

  it('ignores case and surrounding space in the email', async () => {
    const supervisor = await settle(
      auth.login(`  ${VALID_CREDENTIALS.email.toUpperCase()} `, VALID_CREDENTIALS.password)
    )
    expect(supervisor.employeeId).toBe(SUPERVISOR.employeeId)
  })

  it('never discloses which credential was wrong (FR-1.5)', async () => {
    const wrongPassword = settle(auth.login(VALID_CREDENTIALS.email, 'nope')).catch(
      (e: Error) => e.message
    )
    const wrongEmail = settle(auth.login('someone@else.com', VALID_CREDENTIALS.password)).catch(
      (e: Error) => e.message
    )

    expect(await wrongPassword).toBe('Incorrect email or password. Please try again.')
    // Identical message for both failures — the response cannot enumerate accounts.
    expect(await wrongEmail).toBe(await wrongPassword)
  })

  it('signs in through Google without credentials (FR-1.2)', async () => {
    const supervisor = await settle(auth.loginWithGoogle())
    expect(supervisor.email).toBe(SUPERVISOR.email)
  })

  it('reports password recovery as sent without confirming the account exists (FR-1.7)', async () => {
    const message = await settle(auth.requestPasswordReset('stranger@site.com'))
    expect(message).toContain('stranger@site.com')
    expect(message.toLowerCase()).toContain('if ')
  })
})

describe('changePassword (FR-7.7)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    VALID_CREDENTIALS.password = ORIGINAL_PASSWORD
  })

  it('rejects a wrong current password', async () => {
    await expect(settle(auth.changePassword('wrong', 'Northgate!2026'))).rejects.toThrow(
      'Your current password is incorrect.'
    )
  })

  it('accepts the new password for the next sign-in', async () => {
    await settle(auth.changePassword(VALID_CREDENTIALS.password, 'Northgate!2026'))
    const supervisor = await settle(auth.login(SUPERVISOR.email, 'Northgate!2026'))
    expect(supervisor.email).toBe(SUPERVISOR.email)
  })
})

describe('passwordStrength (UI-8.4)', () => {
  it('scores from too-short up to strong', () => {
    expect(auth.passwordStrength('abc')).toBe(0)
    expect(auth.passwordStrength('abcdefgh')).toBe(1)
    expect(auth.passwordStrength('abcdefghijkl')).toBe(2)
    expect(auth.passwordStrength('Abcdefghijkl')).toBe(3)
    expect(auth.passwordStrength('Abcdefghijk1!')).toBe(4)
  })

  it('never exceeds the label range', () => {
    const score = auth.passwordStrength('Abcdefghijklmnop1!£$%')
    expect(score).toBeLessThanOrEqual(4)
    expect(auth.STRENGTH_LABELS[score]).toBeTruthy()
  })
})
