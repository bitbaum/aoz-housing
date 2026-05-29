export async function register() {
  // Fail fast at boot if required env vars are missing or malformed.
  // Importing the module runs the Zod parse once per server start.
  await import('./lib/env')

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config')
  }
}
