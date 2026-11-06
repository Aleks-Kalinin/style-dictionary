/**
 * A Server Component that throws while rendering.
 *
 * This is the case `onRequestError` in src/instrumentation.ts exists for.
 * Without that hook the error is printed in the terminal and Sentry never
 * hears about it, which is the most common blind spot in a Next.js setup.
 */
export default async function ServerCrashPage() {
  // `await` so the throw happens during the async render, the way a failing
  // data fetch would.
  await Promise.resolve();

  throw new Error("Server Component threw while rendering.");
}

// Opt out of caching so the page throws on every visit rather than once.
export const dynamic = "force-dynamic";
