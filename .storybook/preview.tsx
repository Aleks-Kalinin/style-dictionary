import { useEffect } from "react";

// Brings in the token layer and the reset. Without this, every story would
// render with no design tokens defined and fall back to browser defaults.
import "../src/app/globals.css";

import type { Preview } from "@storybook/nextjs-vite";

const preview: Preview = {
  parameters: {
    /**
     * Fail a story's test when axe-core finds an accessibility violation.
     *
     *   'off'   - no checks
     *   'todo'  - violations show as warnings in the UI, and are INVISIBLE in CI
     *   'error' - violations fail the story, in the UI and in CI
     *
     * 'error' is the only setting that actually enforces anything.
     */
    a11y: { test: "error" },

    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },

  /**
   * A toolbar switch for the theme. Because every component reads semantic
   * tokens rather than literal colours, flipping this re-themes all of them —
   * and lets axe re-check colour contrast in both themes.
   */
  globalTypes: {
    theme: {
      description: "Design system theme",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        items: [
          { value: "light", title: "Light", icon: "sun" },
          { value: "dark", title: "Dark", icon: "moon" },
        ],
        dynamicTitle: true,
      },
    },
  },

  initialGlobals: {
    theme: "light",
  },

  decorators: [
    (Story, context) => {
      const theme = (context.globals.theme as string) ?? "light";

      useEffect(() => {
        // The same attribute the real ThemeToggle sets. tokens.css reassigns
        // the semantic layer under [data-theme="dark"].
        document.documentElement.dataset.theme = theme;
        // globals.css styles `body`, but Storybook's canvas needs it too.
        document.body.style.background = "var(--color-surface-base)";
        document.body.style.color = "var(--color-text-primary)";
        document.body.style.padding = "var(--space-4)";
      }, [theme]);

      return <Story />;
    },
  ],
};

export default preview;
