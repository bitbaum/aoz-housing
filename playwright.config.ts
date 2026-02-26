import { defineConfig, devices } from '@playwright/test'
import path from 'path'

const STAFF_STATE_PATH = path.join(__dirname, 'tests', '.auth', 'staff.json')

export default defineConfig({
  testDir: './tests',
  globalSetup: './tests/auth.setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:3101',
    trace: 'on-first-retry',
    storageState: STAFF_STATE_PATH,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev -- --port 3101',
    url: 'http://localhost:3101',
    reuseExistingServer: true,
    timeout: 180_000,
    env: Object.fromEntries(
      Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] != null),
    ),
  },
})
