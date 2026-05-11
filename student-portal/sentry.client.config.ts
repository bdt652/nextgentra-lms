import * as Sentry from '@sentry/nextjs';

/**
 * Sentry Configuration for Student Portal
 *
 * This file initializes Sentry for error tracking and performance monitoring.
 * The DSN and environment are set via environment variables.
 *
 * Setup instructions:
 * 1. Create a Sentry account at https://sentry.io
 * 2. Create a new Next.js project
 * 3. Copy the DSN to your .env.local as NEXT_PUBLIC_SENTRY_DSN
 * 4. Set NODE_ENV to 'development', 'staging', or 'production'
 */

export function initSentry() {
  const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  const environment = process.env.NODE_ENV || 'development';
  const version = process.env.npm_package_version || '0.1.0';

  if (!sentryDsn) {
    if (environment !== 'test') {
      console.warn(
        '[Sentry] NEXT_PUBLIC_SENTRY_DSN not set - error tracking disabled'
      );
    }
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment,
    release: `student-portal@${version}`,
    // Sample rate for transactions (performance monitoring)
    tracesSampleRate: environment === 'development' ? 1.0 : 0.1, // 100% in dev, 10% in prod
    // Sample rate for error profiling
    profilesSampleRate: environment === 'development' ? 1.0 : 0.1,
    // Replay settings (session replay)
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of error sessions
    // Debug mode (development only)
    debug: environment === 'development',
  });

  console.log(`[Sentry] Initialized for ${environment} (version: ${version})`);
}

/**
 * Initialize Sentry on client-side
 * This is called in the client entry point (app/layout.tsx)
 */
if (typeof window !== 'undefined') {
  initSentry();
}
