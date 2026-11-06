import { Badge } from "./Badge";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta = {
  title: "Design System/Badge",
  component: Badge,
  parameters: { layout: "centered" },
  argTypes: {
    tone: {
      control: "select",
      options: ["neutral", "accent", "success", "warning", "danger"],
    },
    withDot: { control: "boolean" },
  },
  args: { children: "Medium", tone: "neutral" },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Neutral: Story = {};
export const Accent: Story = { args: { tone: "accent", children: "Medium" } };
export const Success: Story = { args: { tone: "success", children: "Done" } };
export const Warning: Story = { args: { tone: "warning", children: "Due" } };
export const Danger: Story = { args: { tone: "danger", children: "High" } };

/**
 * Tones carry meaning that colour alone cannot convey to someone who cannot
 * distinguish them, so the text always says what the colour implies.
 */
export const AllTones: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
      <Badge tone="neutral">Low</Badge>
      <Badge tone="accent" withDot>
        Medium
      </Badge>
      <Badge tone="success" withDot>
        Done
      </Badge>
      <Badge tone="warning" withDot>
        Due soon
      </Badge>
      <Badge tone="danger" withDot>
        High
      </Badge>
    </div>
  ),
};
