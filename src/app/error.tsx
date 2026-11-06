"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

import styles from "./error.module.css";

/**
 * Route-level error boundary. Next.js renders this instead of the page when
 * a Client Component throws during render, or a Server Component throws and
 * the error reaches this segment.
 *
 * Next.js does NOT report these to Sentry by itself — the captureException
 * below is what makes them visible.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <Card>
      <Alert
        title="Something broke on this page"
        detail={
          // In production Next.js replaces the message with a digest, so show
          // whichever is available.
          error.message || error.digest || "No further detail available."
        }
      />
      <div className={styles.actions}>
        <Button variant="primary" onClick={reset}>
          Try again
        </Button>
        <Link href="/" className={styles.backLink}>
          Back to todos
        </Link>
      </div>
    </Card>
  );
}
