import { SelectField, TextAreaField, TextField } from "./Field";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta = {
  title: "Design System/Field",
  component: TextField,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Every control generates its own id with useId and wires the label to it, so a label can never drift away from its input. `hideLabel` keeps the label for screen readers while hiding it visually.",
      },
    },
  },
  args: { label: "Title", placeholder: "What needs doing?" },
} satisfies Meta<typeof TextField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Text: Story = {};

export const WithHint: Story = {
  args: { hint: "Up to 200 characters." },
};

/** aria-invalid plus role="alert" on the message, not colour alone. */
export const WithError: Story = {
  args: { error: "Title cannot be empty.", defaultValue: "" },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "Cannot edit this" },
};

/**
 * The label is still in the DOM, just visually hidden. Deleting it would
 * leave an unlabelled input and fail the accessibility check.
 */
export const HiddenLabel: Story = {
  args: { hideLabel: true, label: "Search todos", placeholder: "Search..." },
};

export const TextArea: Story = {
  render: () => (
    <TextAreaField
      label="Notes"
      placeholder="Optional detail"
      rows={3}
      hint="Markdown is not supported."
    />
  ),
};

export const Select: Story = {
  render: () => (
    <SelectField label="Priority" defaultValue="MEDIUM">
      <option value="LOW">Low</option>
      <option value="MEDIUM">Medium</option>
      <option value="HIGH">High</option>
    </SelectField>
  ),
};

export const AllFields: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-4)",
        maxWidth: "24rem",
      }}
    >
      <TextField label="Title" placeholder="What needs doing?" />
      <TextAreaField label="Notes" placeholder="Optional detail" rows={2} />
      <SelectField label="Priority" defaultValue="MEDIUM">
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
      </SelectField>
    </div>
  ),
};
