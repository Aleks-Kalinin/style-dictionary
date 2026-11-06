import { ThemeToggle } from "@/components/ThemeToggle";

import styles from "./SiteHeader.module.css";

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div>
        <h1 className={styles.title}>Todos</h1>
        <p className={styles.subtitle}>
          Next.js and GraphQL, instrumented with Sentry.
        </p>
      </div>
      <ThemeToggle />
    </header>
  );
}
