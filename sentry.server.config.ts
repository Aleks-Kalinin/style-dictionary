/**
 * Sentry initialisation for the Node.js server runtime.
 * Loaded by src/instrumentation.ts before any request is handled.
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  // With no DSN the SDK initialises and then does nothing — no network calls.
  // That keeps the app runnable before you have created a Sentry project.
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Fraction of requests recorded as performance traces.
  // 1.0 locally so every action shows up while you are learning; lower this in
  // production, where it is the main driver of your event quota.
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // Prints what the SDK is doing to the terminal. Invaluable while setting up,
  // noisy afterwards.
  debug: false,

  environment: process.env.NODE_ENV,

  /**
   * Staying inside the free Developer plan:
   *  - Profiling needs @sentry/profiling-node plus a profiling integration.
   *    Not installed, so it cannot run.
   *  - Structured Logs need a logging integration. Not added, and this
   *    discards any log the SDK might still try to send.
   */
  beforeSendLog: () => null,
});
