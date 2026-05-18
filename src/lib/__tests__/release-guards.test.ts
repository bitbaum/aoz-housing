import { readFileSync } from 'fs'
import { join } from 'path'

const root = process.cwd()

function read(path: string) {
  return readFileSync(join(root, path), 'utf8')
}

describe('release guards', () => {
  it('does not ship a hardcoded resident activity catalog', () => {
    const activityConfig = read('src/lib/config/activities.ts')

    expect(activityConfig).not.toContain('export const ACTIVITIES')
    expect(activityConfig).not.toContain('https://www.stadt-zuerich.ch')
    expect(activityConfig).not.toContain('GZ Wipkingen')
  })

  it('does not expose one-click demo credentials on the production login page', () => {
    const loginPage = read('src/app/login/page.tsx')

    expect(loginPage).not.toContain('DEMO_ADMIN_CODE')
    expect(loginPage).not.toContain('DEMO_RESIDENT_CODE')
    expect(loginPage).not.toContain('RES-001')
    expect(loginPage).not.toContain('AOZ-ADMIN1')
  })
})
