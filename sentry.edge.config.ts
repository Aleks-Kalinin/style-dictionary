/**
 * Sentry initialisation for the Edge runtime (middleware and any route that
 * opts into `runtime = "edge"`). It is a separate file because the edge
 * runtime is a different JavaScript environment with its own globals.
 *
 * This app's GraphQL route runs on Node, so in practice this config only
 * matters if you add middleware later.
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
  environment: process.env.NODE_ENV,
  // Same free-plan stance as the server config.
  beforeSendLog: () => null,
});
