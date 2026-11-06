import { createYoga } from "graphql-yoga";

import { schema } from "@/graphql/schema";
import { sentryGraphQLPlugin } from "@/graphql/sentry-plugin";

import type { GraphQLContext } from "@/graphql/builder";

/**
 * GraphQL Yoga is built on the standard Request/Response objects, which is
 * exactly what a Next.js route handler is — so mounting it takes no adapter.
 *
 * Visiting /api/graphql in a browser serves GraphiQL, an interactive explorer
 * for the schema. That is the fastest way to learn what the API can do.
 */
/**
 * The second argument Next.js passes to a route handler. Yoga calls it the
 * "server context" and forwards it to the GraphQL context factory.
 */
type RouteContext = { params: Promise<unknown> };

const { handleRequest } = createYoga<RouteContext, GraphQLContext>({
  schema,
  graphqlEndpoint: "/api/graphql",
  // Next.js supplies the Web Response implementation.
  fetchAPI: { Response },
  plugins: [sentryGraphQLPlugin()],
  context: () => ({ requestId: crypto.randomUUID() }),
  graphiql: { title: "Todo API" },
});

/**
 * Next.js 16 type-checks the exported handlers against its own signature, so
 * `handleRequest` is wrapped rather than exported directly.
 *
 * GET serves GraphiQL and supports GET-based queries; POST carries normal
 * operations; OPTIONS answers CORS preflight requests.
 */
async function handler(request: Request, context: RouteContext) {
  return handleRequest(request, context);
}

export { handler as GET, handler as POST, handler as OPTIONS };

// Prisma and better-sqlite3 are Node APIs; they cannot run on the edge runtime.
export const runtime = "nodejs";
