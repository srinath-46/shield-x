import { resolve } from 'path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

/**
 * Renderer tests only — the main and preload processes are thin enough that the
 * Electron smoke run (scripts/smoke.cjs) covers them end to end.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer')
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['src/renderer/**/*.test.{ts,tsx}'],
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reportsDirectory: 'artifacts/coverage',
      include: ['src/renderer/**/*.{ts,tsx}'],
      exclude: ['src/renderer/**/*.test.{ts,tsx}', 'src/renderer/main.tsx'],
      // The service layer is pure and carries the requirement logic, so it is
      // the one place a regression in coverage should fail the run.
      thresholds: {
        'src/renderer/services/**': {
          lines: 80,
          functions: 80,
          statements: 80,
          branches: 70
        }
      }
    }
  }
})
