import { builder } from "@/graphql/builder";

// Importing these modules is what registers their fields on the builder.
import "@/graphql/todo/types";
import "@/graphql/todo/queries";
import "@/graphql/todo/mutations";

// Deliberate failure modes for the Sentry walkthrough. Safe to delete
// together with src/graphql/debug once you are done exploring.
import "@/graphql/debug/resolvers";

export const schema = builder.toSchema();
