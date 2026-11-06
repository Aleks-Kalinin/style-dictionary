import { withSentryConfig } from "@sentry/nextjs/config";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * better-sqlite3 is a native module and Prisma's client loads files at
   * runtime. Listing them here keeps the bundler from trying to inline them.
   */
  serverExternalPackages: [
    "better-sqlite3",
    "@prisma/adapter-better-sqlite3",
    "@prisma/client",
  ],
};

/**
 * `withSentryConfig` wraps the Next build to:
 *   - generate source maps and upload them, so stack traces in Sentry show
 *     your original TypeScript rather than minified bundle output
 *   - instrument server code for tracing
 *   - optionally proxy events through your own domain (`tunnelRoute`) so that
 *     ad blockers do not silently swallow them
 *
 * Source map upload needs credentials. Without SENTRY_AUTH_TOKEN it is
 * skipped, so `npm run build` works on a fresh clone with no Sentry account.
 */
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },

  // Route Sentry traffic through your own origin to dodge ad blockers.
  tunnelRoute: "/monitoring",

  // Only narrate source map upload in CI.
  silent: !process.env.CI,
});
