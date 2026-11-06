import { Alert } from "./Alert";
import { Button } from "./Button";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta = {
  title: "Design System/Alert",
  component: Alert,
  parameters: { layout: "padded" },
  argTypes: {
    tone: { control: "inline-radio", options: ["danger", "warning", "info"] },
  },
  args: {
    title: "Could not add todo",
    detail: "Title cannot be empty.",
    tone: "danger",
  },
} satisfies Meta<typeof Alert>;

export default meta;

type Story = StoryObj<typeof meta>;

/** role="alert", so a screen reader announces it as soon as it appears. */
export const Danger: Story = {};

export const Warning: Story = {
  args: {
    tone: "warning",
    title: "No DSN set, so nothing will be sent",
    detail: "Add NEXT_PUBLIC_SENTRY_DSN to .env and restart the dev server.",
  },
};

export const Info: Story = {
  args: {
    tone: "info",
    title: "Finished in roughly 600ms across three spans.",
    detail: undefined,
  },
};

export const WithAction: Story = {
  args: {
    title: "Could not load todos",
    detail: "Failed to fetch",
    action: (
      <Button size="sm" variant="secondary">
        Retry
      </Button>
    ),
  },
};
