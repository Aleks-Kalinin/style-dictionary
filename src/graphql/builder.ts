import SchemaBuilder from "@pothos/core";
import PrismaPlugin from "@pothos/plugin-prisma";
import SimpleObjectsPlugin from "@pothos/plugin-simple-objects";
import { DateTimeResolver } from "graphql-scalars";

import { getDatamodel } from "@/generated/pothos-types";
import type PrismaTypes from "@/generated/pothos-types";
import { prisma } from "@/lib/prisma";

/** Values available to every resolver via the third argument. */
export interface GraphQLContext {
  /** Correlates a GraphQL operation with its Sentry trace. */
  requestId: string;
}

/**
 * The Pothos schema builder.
 *
 * Pothos is "code-first": instead of writing SDL by hand and hoping the
 * resolvers match, the schema is constructed in TypeScript and the types are
 * inferred. `PrismaTypes` is generated from schema.prisma, so renaming a
 * column surfaces as a compile error here rather than a runtime surprise.
 */
export const builder = new SchemaBuilder<{
  PrismaTypes: PrismaTypes;
  Context: GraphQLContext;
  // Pothos v4 defaults fields to nullable. Overriding that needs both this
  // type parameter and the matching option below.
  DefaultFieldNullability: false;
  Scalars: {
    DateTime: { Input: Date; Output: Date };
  };
}>({
  plugins: [PrismaPlugin, SimpleObjectsPlugin],
  // Fields are non-null unless a resolver opts out with `nullable: true`.
  // GraphQL defaults the other way, which quietly pushes null-checks onto
  // every consumer of the API.
  defaultFieldNullability: false,
  prisma: {
    client: prisma,
    // Tells Pothos about tables/indexes so it can build efficient queries.
    dmmf: getDatamodel(),
    // Use `///` doc comments from schema.prisma as GraphQL descriptions.
    exposeDescriptions: true,
    filterConnectionTotalCount: true,
    // Warns in development when a resolver ignores Pothos' query planning.
    onUnusedQuery: process.env.NODE_ENV === "production" ? null : "warn",
  },
});

builder.addScalarType("DateTime", DateTimeResolver);

// Every schema needs these root types declared once before fields are added.
builder.queryType({});
builder.mutationType({});
