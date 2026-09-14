// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest'
import {
  ABSOLUTE_TIMEOUT_MS,
  IDLE_TIMEOUT_MS,
  SESSION_KEY,
  type SessionStore,
  endSession,
  expiresAt,
  isExpired,
  memoryStore,
  parseSession,
  readSession,
  startSession,
  touchSession
} from './sessionService'

const EMAIL = 'r.mendez@site.com'
const T0 = new Date(2026, 7, 13, 9, 0, 0).getTime()

let store: SessionStore

beforeEach(() => {
  store = memoryStore()
})

describe('startSession / readSession (FR-1.9)', () => {
  it('restores the session that was stored', () => {
    startSession(EMAIL, T0, store)
    const state = readSession(T0 + 60_000, store)
    expect(state.status).toBe('active')
    expect(state.status === 'active' && state.session.email).toBe(EMAIL)
  })

  it('reports no session when nothing was ever stored', () => {
    expect(readSession(T0, store).status).toBe('none')
  })

  it('never persists the password', () => {
    startSession(EMAIL, T0, store)
    expect(store.getItem(SESSION_KEY)).not.toContain('shieldx')
  })
})

describe('expiry', () => {
  it('ends the session once the idle timeout passes', () => {
    startSession(EMAIL, T0, store)
    expect(readSession(T0 + IDLE_TIMEOUT_MS - 1000, store).status).toBe('active')
    expect(readSession(T0 + IDLE_TIMEOUT_MS, store).status).toBe('expired')
  })

  it('distinguishes a timeout from never having signed in', () => {
    // The Login screen shows an explanation for one and not the other.
    startSession(EMAIL, T0, store)
    expect(readSession(T0 + IDLE_TIMEOUT_MS, store).status).toBe('expired')
  })

  it('reports expiry once, then falls back to none', () => {
    // Reading clears the dead record, so the notice cannot repeat on every render.
    startSession(EMAIL, T0, store)
    expect(readSession(T0 + IDLE_TIMEOUT_MS, store).status).toBe('expired')
    expect(readSession(T0 + IDLE_TIMEOUT_MS, store).status).toBe('none')
  })

  it('caps the session even while activity keeps arriving', () => {
    startSession(EMAIL, T0, store)
    // Touch it every 10 minutes for a full day; the absolute clock still wins.
    for (let t = T0; t < T0 + ABSOLUTE_TIMEOUT_MS; t += 10 * 60_000) {
      touchSession(t, store)
    }
    expect(readSession(T0 + ABSOLUTE_TIMEOUT_MS, store).status).toBe('expired')
  })

  it('takes whichever deadline comes first', () => {
    const session = { email: EMAIL, issuedAt: T0, lastSeenAt: T0 }
    expect(expiresAt(session)).toBe(T0 + IDLE_TIMEOUT_MS)

    // Late in a long session the absolute cap is the nearer of the two.
    const old = { email: EMAIL, issuedAt: T0, lastSeenAt: T0 + ABSOLUTE_TIMEOUT_MS - 60_000 }
    expect(expiresAt(old)).toBe(T0 + ABSOLUTE_TIMEOUT_MS)
  })

  it('pins the timeouts themselves', () => {
    expect(IDLE_TIMEOUT_MS).toBe(30 * 60_000)
    expect(ABSOLUTE_TIMEOUT_MS).toBe(12 * 60 * 60_000)
  })
})

describe('touchSession', () => {
  it('defers the idle deadline', () => {
    startSession(EMAIL, T0, store)
    touchSession(T0 + 20 * 60_000, store)
    // Without the touch this instant would be past the deadline.
    expect(readSession(T0 + 40 * 60_000, store).status).toBe('active')
  })

  it('cannot revive a session that already expired', () => {
    startSession(EMAIL, T0, store)
    touchSession(T0 + IDLE_TIMEOUT_MS + 1, store)
    expect(readSession(T0 + IDLE_TIMEOUT_MS + 2, store).status).toBe('none')
  })

  it('does nothing when there is no session', () => {
    touchSession(T0, store)
    expect(readSession(T0, store).status).toBe('none')
  })
})

describe('endSession (FR-7.8)', () => {
  it('ends the session immediately', () => {
    startSession(EMAIL, T0, store)
    endSession(store)
    expect(readSession(T0 + 1000, store).status).toBe('none')
  })

  it('reports a logout as none, not as a timeout', () => {
    startSession(EMAIL, T0, store)
    endSession(store)
    expect(readSession(T0 + 1000, store).status).not.toBe('expired')
  })
})

describe('parseSession', () => {
  it('rejects anything that is not a well-formed record', () => {
    // Storage is untrusted: stale versions, hand edits, other apps' keys.
    for (const raw of [
      null,
      '',
      'not json',
      '[]',
      'null',
      '"a string"',
      '{}',
      '{"email":"a@b.c"}',
      '{"email":"","issuedAt":1,"lastSeenAt":1}',
      '{"email":"a@b.c","issuedAt":"soon","lastSeenAt":1}'
    ]) {
      expect(parseSession(raw)).toBeNull()
    }
  })

  it('accepts a complete record', () => {
    expect(parseSession(JSON.stringify({ email: EMAIL, issuedAt: T0, lastSeenAt: T0 }))).toEqual({
      email: EMAIL,
      issuedAt: T0,
      lastSeenAt: T0
    })
  })

  it('treats a corrupt record as no session rather than crashing', () => {
    store.setItem(SESSION_KEY, '{ broken')
    expect(readSession(T0, store).status).toBe('none')
  })
})

describe('isExpired', () => {
  it('is exclusive at the boundary instant', () => {
    const session = { email: EMAIL, issuedAt: T0, lastSeenAt: T0 }
    expect(isExpired(session, T0 + IDLE_TIMEOUT_MS - 1)).toBe(false)
    expect(isExpired(session, T0 + IDLE_TIMEOUT_MS)).toBe(true)
  })
})

describe('no storage available', () => {
  it('degrades to a session that simply does not persist', () => {
    // Storage can be disabled by policy; sign-in must still work in-memory.
    expect(() => startSession(EMAIL, T0, null)).not.toThrow()
    expect(readSession(T0, null).status).toBe('none')
    expect(() => endSession(null)).not.toThrow()
  })
})
