import { MockedProvider } from "@apollo/client/testing/react";

import { TOGGLE_TODO, type Todo } from "@/graphql/operations";

import { TodoItem } from "./TodoItem";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const baseTodo: Todo = {
  __typename: "Todo",
  id: "demo-1",
  title: "Read the Sentry walkthrough",
  notes: "SENTRY.md in the project root explains each concept in order.",
  completed: false,
  priority: "HIGH",
  createdAt: "2026-11-01T09:00:00.000Z",
  updatedAt: "2026-11-01T09:00:00.000Z",
};

/**
 * A feature component rather than a design system primitive. It calls
 * `useMutation`, so it needs Apollo in context — `MockedProvider` supplies
 * that without a server, and returns the canned responses listed in `mocks`.
 */
const meta = {
  title: "Todo/TodoItem",
  component: TodoItem,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={[
          {
            request: { query: TOGGLE_TODO, variables: { id: "demo-1" } },
            result: {
              data: {
                toggleTodo: { ...baseTodo, completed: !baseTodo.completed },
              },
            },
          },
        ]}
      >
        {/* The component renders an <li>, so it needs a list parent to be
            valid HTML — and axe checks exactly that. */}
        <ul role="list" style={{ margin: 0, padding: 0, listStyle: "none" }}>
          <Story />
        </ul>
      </MockedProvider>
    ),
  ],
  args: { todo: baseTodo },
} satisfies Meta<typeof TodoItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Active: Story = {};

export const Completed: Story = {
  args: { todo: { ...baseTodo, completed: true } },
};

export const WithoutNotes: Story = {
  args: { todo: { ...baseTodo, notes: null } },
};

export const LowPriority: Story = {
  args: { todo: { ...baseTodo, priority: "LOW", title: "Swap a design token" } },
};

export const LongTitle: Story = {
  args: {
    todo: {
      ...baseTodo,
      title:
        "A deliberately long title that has to wrap onto several lines without pushing the action buttons off the edge of the card",
    },
  },
};
