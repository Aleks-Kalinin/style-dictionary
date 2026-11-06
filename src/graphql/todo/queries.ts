import * as Sentry from "@sentry/nextjs";

import { builder } from "@/graphql/builder";
import { prisma } from "@/lib/prisma";
import { TodoStatusEnum } from "@/graphql/todo/types";

import type { Prisma } from "@/generated/prisma/client";

/** Translates the GraphQL filter arguments into a Prisma `where` clause. */
function buildWhere(
  status: "ALL" | "ACTIVE" | "COMPLETED",
  search?: string | null,
): Prisma.TodoWhereInput {
  const where: Prisma.TodoWhereInput = {};

  if (status === "ACTIVE") where.completed = false;
  if (status === "COMPLETED") where.completed = true;

  const term = search?.trim();
  if (term) {
    where.OR = [{ title: { contains: term } }, { notes: { contains: term } }];
  }

  return where;
}

builder.queryField("todos", (t) =>
  t.prismaField({
    type: ["Todo"],
    description: "All todos, newest first, optionally filtered.",
    args: {
      status: t.arg({ type: TodoStatusEnum, defaultValue: "ALL" }),
      search: t.arg.string({ required: false }),
    },
    // `query` is Pothos' generated `select`/`include` for the requested fields.
    resolve: (query, _root, args) => {
      // A GraphQL default value does not narrow the generated TypeScript type,
      // so the fallback is repeated here.
      const status = args.status ?? "ALL";

      // A manual span makes the database call show up as its own bar inside
      // the request's trace in Sentry, separate from GraphQL overhead.
      return Sentry.startSpan(
        {
          name: "todo.findMany",
          op: "db.query",
          attributes: { status, hasSearch: Boolean(args.search) },
        },
        () =>
          prisma.todo.findMany({
            ...query,
            where: buildWhere(status, args.search),
            orderBy: { createdAt: "desc" },
          }),
      );
    },
  }),
);

builder.queryField("todo", (t) =>
  t.prismaField({
    type: "Todo",
    nullable: true,
    description: "A single todo by id, or null if it does not exist.",
    args: { id: t.arg.id({ required: true }) },
    resolve: (query, _root, args) =>
      Sentry.startSpan({ name: "todo.findUnique", op: "db.query" }, () =>
        prisma.todo.findUnique({ ...query, where: { id: String(args.id) } }),
      ),
  }),
);

const TodoStats = builder.simpleObject("TodoStats", {
  description: "Aggregate counts used by the list header.",
  fields: (t) => ({
    total: t.int(),
    active: t.int(),
    completed: t.int(),
  }),
});

builder.queryField("todoStats", (t) =>
  t.field({
    type: TodoStats,
    resolve: () =>
      Sentry.startSpan({ name: "todo.stats", op: "db.query" }, async () => {
        const [total, completed] = await Promise.all([
          prisma.todo.count(),
          prisma.todo.count({ where: { completed: true } }),
        ]);

        return { total, completed, active: total - completed };
      }),
  }),
);
