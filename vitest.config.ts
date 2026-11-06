import path from "node:path";
import { fileURLToPath } from "node:url";

import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const configDir = path.join(dirname, ".storybook");

/**
 * Runs every story as a test in a real headless Chromium, with axe-core
 * checking accessibility. Because `a11y: { test: "error" }` is set in
 * .storybook/preview.tsx, a violation fails the run.
 *
 * Two projects, one per theme. Colour contrast is the most common violation
 * and it depends entirely on which palette is active, so checking only the
 * light theme would miss half of the problems.
 *
 * `defineConfig` is given an async factory rather than using top-level await,
 * which this config file cannot use (it is bundled to CommonJS).
 */
async function themeProject(theme: "light" | "dark") {
  return {
    extends: true as const,
    plugins: [await storybookTest({ configDir, initialGlobals: { theme } })],
    test: {
      name: `storybook-${theme}`,
      browser: {
        enabled: true,
        headless: true,
        // Vitest 5 takes a provider object here, not the string "playwright".
        provider: playwright(),
        // On a cold cache Vite has to pre-bundle dependencies before the
        // first story iframe is ready. The 60s default can expire during
        // that first run, especially with two browser projects at once.
        connectTimeout: 120_000,
        // Each instance needs a unique name across all projects.
        instances: [{ browser: "chromium" as const, name: `chromium-${theme}` }],
      },
    },
  };
}

export default defineConfig(async () => ({
  resolve: {
    alias: {
      "@": path.join(dirname, "src"),
    },
  },
  test: {
    projects: [await themeProject("light"), await themeProject("dark")],
  },
}));
