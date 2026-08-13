/**
 * The app's public base URL — SSOT for every absolute link the server
 * generates (email links must be absolute; relative URLs die in inboxes).
 */
export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
}
