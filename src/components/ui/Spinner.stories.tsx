import { Spinner } from "./Spinner";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta = {
  title: "Design System/Spinner",
  component: Spinner,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Carries role=\"status\" and a visually hidden label, so the loading state is announced rather than being a silent spinning box. It also honours prefers-reduced-motion via the reset.",
      },
    },
  },
  args: { label: "Loading todos" },
} satisfies Meta<typeof Spinner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
