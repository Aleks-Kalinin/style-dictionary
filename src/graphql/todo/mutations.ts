import * as Sentry from "@sentry/nextjs";
import { GraphQLError } from "graphql";

import { builder } from "@/graphql/builder";
import { prisma } from "@/lib/prisma";
import { PriorityEnum, assertValidTitle } from "@/graphql/todo/types";

const CreateTodoInput = builder.inputType("CreateTodoInput", {
  fields: (t) => ({
    title: t.string({ required: true }),
    notes: t.string({ required: false }),
    priority: t.field({ type: PriorityEnum, required: false }),
  }),
});

const UpdateTodoInput = builder.inputType("UpdateTodoInput", {
  description: "Only the fields you provide are changed.",
  fields: (t) => ({
    title: t.string({ required: false }),
    notes: t.string({ required: false }),
    completed: t.boolean({ required: false }),
    priority: t.field({ type: PriorityEnum, required: false }),
  }),
});

/**
 * Prisma throws a generic error when `where` matches no row. Turning that into
 * a typed GraphQL error gives the client something actionable, and attaching
 * the id to the Sentry scope means the report in the dashboard says *which*
 * todo was missing rather than just "record not found".
 */
async function requireTodo(id: string) {
  const todo = await prisma.todo.findUnique({ where: { id } });

  if (!todo) {
    Sentry.setContext("todo", { id });
    throw new GraphQLError(`No todo exists with id "${id}".`, {
      extensions: { code: "NOT_FOUND", id },
    });
  }

  return todo;
}

builder.mutationField("createTodo", (t) =>
  t.prismaField({
    type: "Todo",
    args: { input: t.arg({ type: CreateTodoInput, required: true }) },
    resolve: (query, _root, args) =>
      Sentry.startSpan({ name: "todo.create", op: "db.query" }, () =>
        prisma.todo.create({
          ...query,
          data: {
            title: assertValidTitle(args.input.title),
            notes: args.input.notes?.trim() || null,
            priority: args.input.priority ?? "MEDIUM",
          },
        }),
      ),
  }),
);

builder.mutationField("updateTodo", (t) =>
  t.prismaField({
    type: "Todo",
    args: {
      id: t.arg.id({ required: true }),
      input: t.arg({ type: UpdateTodoInput, required: true }),
    },
    resolve: async (query, _root, args) => {
      const id = String(args.id);
      await requireTodo(id);

      return Sentry.startSpan({ name: "todo.update", op: "db.query" }, () =>
        prisma.todo.update({
          ...query,
          where: { id },
          data: {
            ...(args.input.title != null && {
              title: assertValidTitle(args.input.title),
            }),
            ...(args.input.notes !== undefined && {
              notes: args.input.notes?.trim() || null,
            }),
            ...(args.input.completed != null && {
              completed: args.input.completed,
            }),
            ...(args.input.priority != null && {
              priority: args.input.priority,
            }),
          },
        }),
      );
    },
  }),
);

builder.mutationField("toggleTodo", (t) =>
  t.prismaField({
    type: "Todo",
    description: "Flips the completed flag.",
    args: { id: t.arg.id({ required: true }) },
    resolve: async (query, _root, args) => {
      const id = String(args.id);
      const existing = await requireTodo(id);

      return Sentry.startSpan({ name: "todo.toggle", op: "db.query" }, () =>
        prisma.todo.update({
          ...query,
          where: { id },
          data: { completed: !existing.completed },
        }),
      );
    },
  }),
);

builder.mutationField("deleteTodo", (t) =>
  t.field({
    type: "ID",
    description: "Deletes a todo and returns the id that was removed.",
    args: { id: t.arg.id({ required: true }) },
    resolve: async (_root, args) => {
      const id = String(args.id);
      await requireTodo(id);

      await Sentry.startSpan({ name: "todo.delete", op: "db.query" }, () =>
        prisma.todo.delete({ where: { id } }),
      );

      return id;
    },
  }),
);

builder.mutationField("clearCompleted", (t) =>
  t.field({
    type: "Int",
    description: "Deletes every completed todo and returns how many were removed.",
    resolve: async () => {
      const { count } = await Sentry.startSpan(
        { name: "todo.clearCompleted", op: "db.query" },
        () => prisma.todo.deleteMany({ where: { completed: true } }),
      );

      return count;
    },
  }),
);
