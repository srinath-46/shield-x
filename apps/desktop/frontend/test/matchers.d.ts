/**
 * Registers jest-dom's matchers with Vitest's `expect` for the typechecker.
 * They are installed at runtime by test/setup.ts; this makes `tsc` aware of
 * them, since that import happens dynamically there.
 */
import '@testing-library/jest-dom/vitest'
