import * as Sentry from "@sentry/nextjs";
import { GraphQLError } from "graphql";

import { builder } from "@/graphql/builder";
import { prisma } from "@/lib/prisma";

/**
 * Deliberate failure modes, so you can watch each one land in Sentry.
 *
 * This file exists purely for learning. Delete it (and its import in
 * src/graphql/schema.ts) once you no longer need the demo.
 */

const FailureKind = builder.enumType("FailureKind", {
  description: "Which way the server should break.",
  values: {
    UNHANDLED: {
      description: "A plain Error nobody caught. The common case.",
    },
    EXPECTED: {
      description:
        "A GraphQLError with code BAD_USER_INPUT. Deliberately NOT sent to Sentry.",
    },
    DATABASE: {
      description: "A query against a row that does not exist.",
    },
    NESTED: {
      description: "An error thrown inside a nested span.",
    },
  } as const,
});

builder.queryField("failServer", (t) =>
  t.field({
    type: "String",
    description: "Throws on the server in the way you choose.",
    args: { kind: t.arg({ type: FailureKind, required: true }) },
    resolve: async (_root, args) => {
      // A tag makes these demo events easy to find — and to filter out.
      Sentry.setTag("demo_failure_kind", args.kind);

      switch (args.kind) {
        case "EXPECTED":
          // The Yoga plugin skips BAD_USER_INPUT, so this reaches the client
          // but never reaches Sentry. Compare the two in the dashboard.
          throw new GraphQLError("That input was not acceptable.", {
            extensions: { code: "BAD_USER_INPUT", field: "kind" },
          });

        case "DATABASE":
          // Prisma throws when `update` matches no row.
          await prisma.todo.update({
            where: { id: "definitely-not-a-real-id" },
            data: { title: "never happens" },
          });
          return "unreachable";

        case "NESTED":
          return Sentry.startSpan(
            { name: "demo.outerWork", op: "function" },
            () =>
              Sentry.startSpan(
                { name: "demo.innerWork", op: "function" },
                () => {
                  throw new Error("Failed two spans deep on the server.");
                },
              ),
          );

        case "UNHANDLED":
        default:
          throw new Error("Unhandled server error from a GraphQL resolver.");
      }
    },
  }),
);

builder.queryField("slowOperation", (t) =>
  t.field({
    type: "String",
    description:
      "Does artificial work in three nested spans, to show a trace waterfall.",
    args: {
      milliseconds: t.arg.int({ required: false, defaultValue: 600 }),
    },
    resolve: async (_root, args) => {
      const total = Math.min(Math.max(args.milliseconds ?? 600, 0), 5000);
      const slice = Math.floor(total / 3);

      const wait = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

      // Three sibling spans inside the GraphQL operation. In Sentry these
      // render as stacked bars, which is how you spot the slow step.
      await Sentry.startSpan({ name: "demo.validate", op: "function" }, () =>
        wait(slice),
      );

      await Sentry.startSpan({ name: "demo.fetchRows", op: "db.query" }, () =>
        Promise.all([wait(slice), prisma.todo.count()]),
      );

      await Sentry.startSpan({ name: "demo.serialize", op: "function" }, () =>
        wait(total - slice * 2),
      );

      return `Finished in roughly ${total}ms across three spans.`;
    },
  }),
);
