import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

/**
 * Sentry Configuration for Teacher Portal
 *
 * This file initializes Sentry for error tracking and performance monitoring.
 * The DSN and environment are set via environment variables.
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
    release: `teacher-portal@${version}`,
    tracesSampleRate: environment === 'development' ? 1.0 : 0.1,
    profilesSampleRate: environment === 'development' ? 1.0 : 0.1,
    integrations: [
      new BrowserTracing({
        routingInstrumentation: Sentry.reactRouterV6Instrumentation(
          (history) => history
        ),
      }),
    ],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    debug: environment === 'development',
  });

  console.log(`[Sentry] Initialized for ${environment} (version: ${version})`);
}

if (typeof window !== 'undefined') {
  initSentry();
}
