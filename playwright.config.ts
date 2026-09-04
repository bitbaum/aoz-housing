import { defineConfig, devices } from '@playwright/test'
import path from 'path'

const STAFF_STATE_PATH = path.join(__dirname, 'tests', '.auth', 'staff.json')

export default defineConfig({
  testDir: './tests',
  globalSetup: './tests/auth.setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // `fullyParallel` was already on, but `workers: 1` made it a no-op — the suite
  // ran strictly serially and was the single longest job in CI (494s of a 822s
  // pipeline). The specs that write data already mint unique keys
  // (`E2E-${Date.now()}`), so they do not collide; the rest only read.
  // 3 (not 4) on a 4-vCPU runner leaves a core for the Next dev server, which
  // compiles routes on demand and is itself CPU-bound.
  // Local stays at 1: this laptop runs many sessions at once, and a dev who
  // wants to reproduce CI can set CI=1.
  workers: process.env.CI ? 3 : 1,
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
    command: 'pnpm run dev -- --port 3101',
    url: 'http://localhost:3101',
    reuseExistingServer: true,
    timeout: 180_000,
    env: Object.fromEntries(
      Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] != null),
    ),
  },
})
