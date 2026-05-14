import * as Sentry from '@sentry/nextjs';

const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const environment = process.env.NODE_ENV || 'development';

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment,
    release: `student-portal@${process.env.npm_package_version ?? '0.1.0'}`,
    tracesSampleRate: environment === 'development' ? 1.0 : 0.1,
    profilesSampleRate: environment === 'development' ? 1.0 : 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    debug: environment === 'development',
  });
}
