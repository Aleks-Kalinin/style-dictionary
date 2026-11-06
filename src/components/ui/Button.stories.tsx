import { Button } from "./Button";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta = {
  title: "Design System/Button",
  component: Button,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "The variants are a closed set on purpose. A caller picks `danger`, never a specific red — which is what keeps the palette consistent and makes theming possible.",
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "ghost", "danger", "dangerGhost"],
    },
    size: { control: "inline-radio", options: ["sm", "md"] },
    disabled: { control: "boolean" },
    fullWidth: { control: "boolean" },
  },
  args: {
    children: "Add todo",
    variant: "secondary",
    size: "md",
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { variant: "primary" },
};

export const Secondary: Story = {};

export const Ghost: Story = {
  args: { variant: "ghost" },
};

export const Danger: Story = {
  args: { variant: "danger", children: "Delete" },
};

export const DangerGhost: Story = {
  args: { variant: "dangerGhost", children: "Delete" },
};

export const Disabled: Story = {
  args: { variant: "primary", disabled: true },
};

export const Small: Story = {
  args: { size: "sm", variant: "primary" },
};

/** Every variant side by side — the quickest way to spot an odd one out. */
export const AllVariants: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
      <Button {...args} variant="primary">
        Primary
      </Button>
      <Button {...args} variant="secondary">
        Secondary
      </Button>
      <Button {...args} variant="ghost">
        Ghost
      </Button>
      <Button {...args} variant="danger">
        Danger
      </Button>
      <Button {...args} variant="dangerGhost">
        Danger ghost
      </Button>
    </div>
  ),
};

/**
 * An icon-only button has no text, so it needs an explicit `aria-label`.
 * Remove that label and the accessibility check on this story fails.
 */
export const IconOnly: Story = {
  args: {
    iconOnly: true,
    variant: "ghost",
    "aria-label": "Delete todo",
    children: (
      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
        <path
          d="M4 4l8 8M12 4l-8 8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
};
