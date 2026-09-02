import path from 'node:path'
import { defineConfig } from 'vitest/config'

// Test runner config — Vitest 4 replaces jest (fleet-wide runner uniformity).
// Two projects mirror the old jest `projects` split: server tests run in node,
// component tests in jsdom with the RTL setup file. The `@/` alias mirrors
// tsconfig `paths`. No transformIgnorePatterns equivalent is needed: Vitest
// runs ESM natively, so the ESM-only git deps (ai-kit, @fleet/ai-forms,
// bip-kit, jose) just work.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    testTimeout: 30_000,
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts', 'src/app/api/**/*.ts', 'src/components/**/*.tsx'],
      exclude: ['src/**/*.d.ts', 'src/**/types.ts', 'src/lib/db.ts', 'src/lib/logger.ts'],
      thresholds: {
        branches: 20,
        functions: 10,
        lines: 20,
        statements: 20,
      },
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'server',
          environment: 'node',
          include: ['src/**/__tests__/**/*.test.ts', 'src/**/__tests__/**/*.spec.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'components',
          environment: 'jsdom',
          include: ['src/**/__tests__/**/*.test.tsx', 'src/**/__tests__/**/*.spec.tsx'],
          setupFiles: ['./vitest.setup.components.ts'],
        },
      },
    ],
  },
})
