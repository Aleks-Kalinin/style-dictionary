/**
 * Sentry initialisation for the browser. Next.js loads this file automatically
 * on the client — it is the client-side counterpart to instrumentation.ts.
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  environment: process.env.NODE_ENV,

  /**
   * Connects a browser trace to the server trace it triggers, so one timeline
   * in Sentry spans the click, the GraphQL request and the database query.
   * Only same-origin requests get the tracing header.
   */
  tracePropagationTargets: [/^\//],

  /**
   * Deliberately NOT enabled, to stay inside the free Developer plan and keep
   * this setup minimal:
   *   Sentry.replayIntegration()   - Session Replay (records the DOM)
   *   Sentry.feedbackIntegration() - the user feedback widget
   * Each is a one-line addition here if you want to explore it later.
   */
  integrations: [],

  // Discard structured logs, which are metered separately from errors.
  beforeSendLog: () => null,
});

/** Reports slow or failed App Router client-side navigations. */
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
