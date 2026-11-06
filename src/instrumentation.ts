/**
 * Next.js calls `register()` once, before the first request, in each runtime.
 * This is the officially supported place to start server-side monitoring.
 */
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

/**
 * Catches errors thrown in Server Components, route handlers and middleware.
 * Without this hook those errors are logged to the terminal and never reach
 * Sentry, which is the single most common gap in a Next.js setup.
 */
export const onRequestError = Sentry.captureRequestError;
