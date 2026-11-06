"use client";

import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";
import { useState } from "react";

import type { ReactNode } from "react";

function createApolloClient() {
  return new ApolloClient({
    link: new HttpLink({
      uri: "/api/graphql",
      // Lets Sentry stitch the browser trace to the server trace.
      fetchOptions: { cache: "no-store" },
    }),

    /**
     * InMemoryCache stores results normalised by __typename + id. Because
     * every Todo carries an id, a mutation that returns an updated Todo
     * refreshes every component showing that todo with no extra work.
     */
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            // Results differ per filter, so cache them per argument set
            // instead of letting a filtered list overwrite the full one.
            todos: { keyArgs: ["status", "search"] },
          },
        },
      },
    }),

    devtools: { enabled: process.env.NODE_ENV === "development" },
  });
}

export function ApolloWrapper({ children }: { children: ReactNode }) {
  // useState keeps one client instance across re-renders without putting it
  // in a module-level variable, which would leak between requests on the server.
  const [client] = useState(createApolloClient);

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
