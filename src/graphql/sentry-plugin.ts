import * as Sentry from "@sentry/nextjs";
import { getOperationAST } from "graphql";

import type { Plugin } from "graphql-yoga";

/**
 * Errors the client is expected to handle. Reporting these to Sentry would
 * bury real defects under a pile of "user typed nothing in the title box",
 * so they are deliberately skipped. Deciding what is *not* worth reporting is
 * most of the work of keeping an error dashboard useful.
 */
const EXPECTED_ERROR_CODES = new Set(["BAD_USER_INPUT", "NOT_FOUND"]);

/**
 * A Yoga (envelop) plugin that connects GraphQL execution to Sentry.
 *
 * Without this, every operation would appear in Sentry as `POST /api/graphql`,
 * because that is the only thing HTTP-level instrumentation can see. GraphQL
 * puts the interesting part — which operation ran — in the request body.
 */
export function sentryGraphQLPlugin(): Plugin {
  return {
    onExecute({ args }) {
      const operation = getOperationAST(args.document, args.operationName);
      const operationType = operation?.operation ?? "query";
      const operationName = args.operationName ?? "anonymous";
      const label = `${operationType} ${operationName}`;

      // Group traces by GraphQL operation instead of by URL.
      Sentry.getCurrentScope().setTransactionName(`GraphQL ${label}`);

      // Structured context shows up as its own panel on the Sentry issue page.
      Sentry.setContext("graphql", {
        operation: operationType,
        operationName,
        variables: args.variableValues ?? {},
      });

      // Breadcrumbs are the timeline of "what happened before the error".
      Sentry.addBreadcrumb({
        category: "graphql",
        message: label,
        level: "info",
      });

      return {
        onExecuteDone({ result }) {
          // Incremental delivery (@defer/@stream) yields an async iterator
          // rather than a single result; this app does not use it.
          if (!("errors" in result) || !result.errors?.length) return;

          for (const error of result.errors) {
            if (EXPECTED_ERROR_CODES.has(String(error.extensions?.code))) {
              continue;
            }

            Sentry.captureException(error.originalError ?? error, {
              tags: { graphql_operation: operationName },
              extra: { path: error.path?.join("."), label },
            });
          }
        },
      };
    },
  };
}
