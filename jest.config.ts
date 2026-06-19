import type { Config } from 'jest'

const config: Config = {
  projects: [
    // Server-side tests (actions, API routes, utils)
    {
      displayName: 'server',
      preset: 'ts-jest',
      testEnvironment: 'node',
      // Don't crawl the standalone build output — its package.json shares the
      // app's name and triggers a Haste module naming collision warning.
      modulePathIgnorePatterns: ['<rootDir>/.next/'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.ts',
        '<rootDir>/src/**/__tests__/**/*.spec.ts',
      ],
      // jose v6 ships ESM-only; transform its .js files through ts-jest
      transformIgnorePatterns: ['node_modules/(?!jose)'],
      transform: {
        '^.+\\.tsx?$': 'ts-jest',
        '^.+\\.js$': 'ts-jest',
      },
    },
    // Component tests (React, jsdom)
    {
      displayName: 'components',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      modulePathIgnorePatterns: ['<rootDir>/.next/'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.tsx',
        '<rootDir>/src/**/__tests__/**/*.spec.tsx',
      ],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.components.ts'],
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' } }],
      },
    },
  ],
  collectCoverageFrom: [
    'src/lib/**/*.ts',
    'src/app/api/**/*.ts',
    'src/components/**/*.tsx',
    '!src/**/*.d.ts',
    '!src/**/types.ts',
    '!src/lib/db.ts',
    '!src/lib/logger.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 20,
      functions: 10,
      lines: 20,
      statements: 20,
    },
  },
}

export default config
