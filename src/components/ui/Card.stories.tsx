import { Badge } from "./Badge";
import { Button } from "./Button";
import { Card, CardHeader, CardTitle } from "./Card";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta = {
  title: "Design System/Card",
  component: Card,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Padded: Story = {
  args: { children: "A card with the standard inset applied." },
};

/** `padded={false}` when the card holds a flush list or its own header. */
export const WithHeader: Story = {
  args: {
    padded: false,
    children: (
      <>
        <CardHeader>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-3)",
            }}
          >
            <CardTitle>Todos</CardTitle>
            <Badge tone="accent">4 active</Badge>
          </div>
          <Button size="sm" variant="ghost">
            Clear 1 done
          </Button>
        </CardHeader>
        <div style={{ padding: "var(--space-inset-lg)" }}>
          Content sits below the header.
        </div>
      </>
    ),
  },
};
