import * as Sentry from "@sentry/nextjs";
import { GraphQLError } from "graphql";

import { builder } from "@/graphql/builder";

/**
 * SQLite has no enum column type, so `Todo.priority` is stored as text.
 * This list is the single source of truth for the allowed values and is
 * reused by the GraphQL enum, the parser, and the UI.
 */
export const PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;

export type Priority = (typeof PRIORITIES)[number];

export function parsePriority(value: string): Priority {
  if ((PRIORITIES as readonly string[]).includes(value)) {
    return value as Priority;
  }

  // A row holding something outside the enum means the database and the schema
  // have drifted. That is worth knowing about, so report it to Sentry instead
  // of silently coercing — but still return a usable value so one bad row
  // does not fail the whole query.
  Sentry.captureMessage("Todo.priority outside the allowed enum", {
    level: "warning",
    extra: { value },
  });

  return "MEDIUM";
}

export const PriorityEnum = builder.enumType("Priority", {
  description: "How urgent a todo is.",
  values: PRIORITIES,
});

export const TodoStatusEnum = builder.enumType("TodoStatus", {
  description: "Filter for which todos to return.",
  values: ["ALL", "ACTIVE", "COMPLETED"] as const,
});

/**
 * `prismaObject` ties this GraphQL type to the Prisma model of the same name.
 * Pothos uses that link to turn a GraphQL selection set into an efficient
 * `select` clause rather than over-fetching every column.
 */
export const TodoType = builder.prismaObject("Todo", {
  description: "A single todo item.",
  fields: (t) => ({
    id: t.exposeID("id"),
    title: t.exposeString("title"),
    notes: t.exposeString("notes", { nullable: true }),
    completed: t.exposeBoolean("completed"),
    priority: t.field({
      type: PriorityEnum,
      // The column is a String; map it onto the real GraphQL enum.
      resolve: (todo) => parsePriority(todo.priority),
    }),
    createdAt: t.field({ type: "DateTime", resolve: (todo) => todo.createdAt }),
    updatedAt: t.field({ type: "DateTime", resolve: (todo) => todo.updatedAt }),
  }),
});

/** Shared input validation, so queries and mutations reject the same things. */
export function assertValidTitle(title: string): string {
  const trimmed = title.trim();

  if (trimmed.length === 0) {
    throw new GraphQLError("Title cannot be empty.", {
      extensions: { code: "BAD_USER_INPUT", field: "title" },
    });
  }

  if (trimmed.length > 200) {
    throw new GraphQLError("Title cannot exceed 200 characters.", {
      extensions: { code: "BAD_USER_INPUT", field: "title" },
    });
  }

  return trimmed;
}
