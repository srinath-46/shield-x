/**
 * FR-1.9 — session lifetime.
 *
 * The supervisor stays signed in across reloads and app restarts until they log
 * out or the session expires. Two clocks run at once, and whichever fires first
 * ends the session:
 *
 *   - an idle timeout, refreshed by user activity, because this runs on a shared
 *     site terminal that gets walked away from;
 *   - an absolute cap, so a session cannot be kept alive indefinitely by a page
 *     left open on a desk for the length of a shift.
 *
 * Only the account's email and two timestamps are persisted. No password, no
 * token, nothing that would be worth reading out of local storage — when a real
 * backend arrives it issues the token and this module stores that instead.
 */

export interface StoredSession {
  email: string
  /** When the supervisor signed in. */
  issuedAt: number
  /** Last observed activity; the idle clock counts from here. */
  lastSeenAt: number
}

export type SessionState =
  { status: 'active'; session: StoredSession } | { status: 'expired' } | { status: 'none' }

/** Minimal slice of the Storage API, so tests can pass a plain object. */
export type SessionStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export const SESSION_KEY = 'shieldx.session'
export const IDLE_TIMEOUT_MS = 30 * 60_000
export const ABSOLUTE_TIMEOUT_MS = 12 * 60 * 60_000

/** localStorage where it exists; null under the node test environment. */
export function defaultStore(): SessionStore | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    // Storage can throw outright when disabled by policy; treat that as absent.
    return null
  }
}

/** An in-memory store, for tests and for the no-storage fallback. */
export function memoryStore(): SessionStore {
  const data = new Map<string, string>()
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key)
  }
}

/**
 * Anything in storage is untrusted input — it may be from an older version, or
 * hand-edited. A record that is not exactly the shape below is treated as no
 * session at all rather than partially believed.
 */
export function parseSession(raw: string | null): StoredSession | null {
  if (!raw) return null
  try {
    const value: unknown = JSON.parse(raw)
    if (typeof value !== 'object' || value === null) return null
    const { email, issuedAt, lastSeenAt } = value as Record<string, unknown>
    if (typeof email !== 'string' || email.length === 0) return null
    if (!Number.isFinite(issuedAt) || !Number.isFinite(lastSeenAt)) return null
    return { email, issuedAt: issuedAt as number, lastSeenAt: lastSeenAt as number }
  } catch {
    return null
  }
}

/** The moment this session stops being valid — the earlier of the two clocks. */
export function expiresAt(session: StoredSession): number {
  return Math.min(session.lastSeenAt + IDLE_TIMEOUT_MS, session.issuedAt + ABSOLUTE_TIMEOUT_MS)
}

export function isExpired(session: StoredSession, now: number = Date.now()): boolean {
  return now >= expiresAt(session)
}

/** Records a new session. Called on every successful sign-in. */
export function startSession(
  email: string,
  now: number = Date.now(),
  store: SessionStore | null = defaultStore()
): StoredSession {
  const session: StoredSession = { email, issuedAt: now, lastSeenAt: now }
  store?.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

/**
 * Reads the stored session, distinguishing "timed out" from "never signed in"
 * so the Login screen can explain which one happened. An expired record is
 * cleared here, so expiry is reported exactly once.
 */
export function readSession(
  now: number = Date.now(),
  store: SessionStore | null = defaultStore()
): SessionState {
  const session = parseSession(store?.getItem(SESSION_KEY) ?? null)
  if (!session) return { status: 'none' }
  if (isExpired(session, now)) {
    store?.removeItem(SESSION_KEY)
    return { status: 'expired' }
  }
  return { status: 'active', session }
}

/**
 * Pushes the idle clock forward. Does nothing once the session has expired, so
 * activity arriving after the deadline cannot resurrect it.
 */
export function touchSession(
  now: number = Date.now(),
  store: SessionStore | null = defaultStore()
): void {
  const state = readSession(now, store)
  if (state.status !== 'active') return
  store?.setItem(SESSION_KEY, JSON.stringify({ ...state.session, lastSeenAt: now }))
}

/** FR-7.8 — an explicit logout ends the session immediately. */
export function endSession(store: SessionStore | null = defaultStore()): void {
  store?.removeItem(SESSION_KEY)
}
