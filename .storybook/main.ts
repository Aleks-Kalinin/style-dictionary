import type { StorybookConfig } from "@storybook/nextjs-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],

  addons: [
    // Renders the auto-generated docs page for each component.
    "@storybook/addon-docs",
    // Runs axe-core against the rendered story and reports violations.
    "@storybook/addon-a11y",
    // Lets stories double as tests, so a11y checks can run headlessly in CI.
    "@storybook/addon-vitest",
  ],

  framework: {
    name: "@storybook/nextjs-vite",
    options: {},
  },

  /**
   * Everything here is open source. Chromatic — Storybook's paid hosted
   * visual-testing service — is deliberately not installed.
   */
};

export default config;
