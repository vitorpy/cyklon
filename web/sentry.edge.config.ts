import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://773fd9bc5b4d5d1ff4d35335fce01b3c@o4508075926618112.ingest.de.sentry.io/4508075930484816",

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for tracing.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,

  // ...

  // Note: if you want to override the automatic release value, do not set a
  // `release` value here - use the environment variable `SENTRY_RELEASE`, so
  // that it will also get attached to your source maps
});
