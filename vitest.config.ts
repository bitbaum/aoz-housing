import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

/**
 * Replaces jest.config.ts, which used jest `projects` to run two suites with
 * different environments. vitest calls the same idea `projects`.
 *
 *   server     — 133 *.test.ts under src/**\/__tests__, node environment
 *   components — 63 *.test.tsx, jsdom, with the React plugin and the setup file
 *
 * The transformIgnorePatterns list (jose, @fleet/ai-forms, bip-kit, ai-kit) is
 * GONE rather than translated: jest ran CJS and had to transform ESM-only
 * packages to require them at all. vitest loads ESM natively, which is the
 * entire reason that list existed.
 *
 * `globals: true` keeps describe/it/expect/vi available without imports, so the
 * migration touched the jest.* API names and nothing else.
 */
const alias = [{ find: /^@\//, replacement: path.resolve(__dirname, './src') + '/' }]

export default defineConfig({
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: 'server',
          globals: true,
          environment: 'node',
          include: ['src/**/__tests__/**/*.{test,spec}.ts'],
        },
      },
      {
        plugins: [react()],
        resolve: { alias },
        test: {
          name: 'components',
          globals: true,
          environment: 'jsdom',
          include: ['src/**/__tests__/**/*.{test,spec}.tsx'],
          setupFiles: ['./vitest.setup.components.ts'],
        },
      },
    ],
  },
})
