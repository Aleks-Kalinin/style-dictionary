import { ApolloWrapper } from "@/lib/apollo";
import { SiteHeader } from "@/components/SiteHeader";
import { THEME_INIT_SCRIPT } from "@/lib/theme-script";

import "./globals.css";
import styles from "./layout.module.css";

import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Todos — Next.js + GraphQL + Sentry",
  description:
    "A small CRUD app built with GraphQL Yoga, Pothos, Prisma and Sentry.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Must run before paint, so it cannot be a React effect. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        {/* Apollo keeps its cache in React state, so the provider has to be a
            Client Component. Everything below it can still be a Server
            Component unless it uses a hook. */}
        <ApolloWrapper>
          <div className={styles.shell}>
            <SiteHeader />
            <main className={styles.main}>{children}</main>
            <footer className={styles.footer}>
              <a href="/api/graphql">GraphiQL</a>
              <span aria-hidden="true">·</span>
              <a href="/sentry-demo">Sentry demo</a>
            </footer>
          </div>
        </ApolloWrapper>
      </body>
    </html>
  );
}
