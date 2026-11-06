import { Checkbox } from "./Checkbox";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta = {
  title: "Design System/Checkbox",
  component: Checkbox,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "The native input stays in the DOM for keyboard and screen reader support and is visually hidden; the styled box is a label bound to it. That is why `label` is a required prop — a checkbox with no accessible name is unusable with a screen reader.",
      },
    },
  },
  args: { label: "Mark as done" },
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {};

export const Checked: Story = {
  args: { defaultChecked: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const DisabledChecked: Story = {
  args: { disabled: true, defaultChecked: true },
};
