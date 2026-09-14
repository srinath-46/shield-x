import { afterEach, vi } from 'vitest'
import { stopLiveFeed } from '@/services/liveFeed'

/**
 * Shared setup for both environments: the pure service suites run under node
 * (`// @vitest-environment node`), so the DOM stubs below are guarded rather
 * than assumed.
 */
const hasDom = typeof window !== 'undefined'

if (hasDom) {
  await import('@testing-library/jest-dom/vitest')

  // components/useElementWidth.ts — the responsive layouts measure their container.
  class ResizeObserverStub implements ResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  vi.stubGlobal('ResizeObserver', ResizeObserverStub)

  // screens/WorkerReportScreen.tsx — CSV download (FR-6.9) and print (FR-6.10).
  Object.defineProperty(URL, 'createObjectURL', { writable: true, value: vi.fn(() => 'blob:mock') })
  Object.defineProperty(URL, 'revokeObjectURL', { writable: true, value: vi.fn() })
  Object.defineProperty(window, 'print', { writable: true, value: vi.fn() })
}

afterEach(async () => {
  if (hasDom) {
    const { cleanup } = await import('@testing-library/react')
    cleanup()
    // FR-1.9 persists the session; without this it would leak into the next test.
    localStorage.clear()
  }
  // The sensor simulation runs on an interval; without this it outlives its test.
  stopLiveFeed()
})
