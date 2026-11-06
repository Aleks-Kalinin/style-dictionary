"use client";

import { useLazyQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";
import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { readableError } from "@/lib/graphql-error";

import styles from "./page.module.css";

const FAIL_SERVER = gql`
  query FailServer($kind: FailureKind!) {
    failServer(kind: $kind)
  }
`;

const SLOW_OPERATION = gql`
  query SlowOperation($milliseconds: Int) {
    slowOperation(milliseconds: $milliseconds)
  }
`;

type FailureKind = "UNHANDLED" | "EXPECTED" | "DATABASE" | "NESTED";

interface FailServerData {
  failServer: string;
}
interface FailServerVars {
  kind: FailureKind;
}
interface SlowOperationData {
  slowOperation: string;
}
interface SlowOperationVars {
  milliseconds?: number;
}

interface DemoProps {
  title: string;
  what: string;
  where: string;
  children: React.ReactNode;
}

function Demo({ title, what, where, children }: DemoProps) {
  return (
    <div className={styles.demo}>
      <div className={styles.demoText}>
        <div className={styles.demoTitle}>{title}</div>
        <p className={styles.demoWhat}>{what}</p>
        <p className={styles.demoWhere}>
          <strong>In Sentry:</strong> {where}
        </p>
      </div>
      <div className={styles.demoAction}>{children}</div>
    </div>
  );
}

export default function SentryDemoPage() {
  const [renderCrash, setRenderCrash] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  /**
   * Apollo Client 4 dropped the onError/onCompleted callbacks from
   * useLazyQuery. The execute function returns a promise with the result
   * instead, so the outcome is handled where it is triggered.
   */
  const [failServer] = useLazyQuery<FailServerData, FailServerVars>(
    FAIL_SERVER,
    { fetchPolicy: "no-cache" },
  );

  const [slowOperation, { loading: slowRunning }] = useLazyQuery<
    SlowOperationData,
    SlowOperationVars
  >(SLOW_OPERATION, { fetchPolicy: "no-cache" });

  async function runFailServer(kind: FailureKind) {
    clearMessages();

    const { error } = await failServer({ variables: { kind } });

    if (error) {
      setProblem(readableError(error));
    } else {
      setNote("The server call unexpectedly succeeded.");
    }
  }

  async function runSlowOperation() {
    clearMessages();

    const { data, error } = await slowOperation({
      variables: { milliseconds: 600 },
    });

    if (error) {
      setProblem(readableError(error));
    } else if (data) {
      setNote(data.slowOperation);
    }
  }

  // Thrown during render, so React's error boundary (app/error.tsx) catches it.
  if (renderCrash) {
    throw new Error("Client render crashed on purpose.");
  }

  const dsnConfigured = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);

  function clearMessages() {
    setNote(null);
    setProblem(null);
  }

  return (
    <div className={styles.page}>
      <div className={styles.intro}>
        <h2 className={styles.heading}>Sentry demo</h2>
        <p className={styles.lede}>
          Each button triggers one failure mode. Read SENTRY.md alongside this
          page — it explains what each one teaches.
        </p>
        {dsnConfigured ? (
          <Badge tone="success" withDot>
            DSN configured
          </Badge>
        ) : (
          <Alert
            tone="warning"
            title="No DSN set, so nothing will be sent"
            detail="Add NEXT_PUBLIC_SENTRY_DSN to .env and restart the dev server. The buttons still work — the errors just stay local."
          />
        )}
      </div>

      {note ? (
        <Alert
          tone="info"
          title={note}
          action={
            <Button size="sm" variant="ghost" onClick={clearMessages}>
              Dismiss
            </Button>
          }
        />
      ) : null}

      {problem ? (
        <Alert
          title="The server returned an error"
          detail={problem}
          action={
            <Button size="sm" variant="ghost" onClick={clearMessages}>
              Dismiss
            </Button>
          }
        />
      ) : null}

      <Card padded={false}>
        <CardHeader>
          <CardTitle>Browser</CardTitle>
        </CardHeader>

        <Demo
          title="Uncaught error in an event handler"
          what="Throws synchronously inside onClick. Nothing catches it."
          where="Appears as an unhandled error. The breadcrumb trail shows the click that preceded it."
        >
          <Button
            variant="danger"
            onClick={() => {
              throw new Error("Uncaught error from a click handler.");
            }}
          >
            Throw
          </Button>
        </Demo>

        <Demo
          title="Crash during render"
          what="Throws while React renders, which trips the nearest error boundary."
          where="Captured by app/error.tsx, which calls captureException and shows a recovery UI."
        >
          <Button variant="danger" onClick={() => setRenderCrash(true)}>
            Crash render
          </Button>
        </Demo>

        <Demo
          title="Unhandled promise rejection"
          what="Rejects a promise with no catch attached."
          where="Reported through the browser's unhandledrejection event. A frequent source of invisible bugs."
        >
          <Button
            variant="danger"
            onClick={() => {
              void Promise.reject(
                new Error("Promise rejected with nobody listening."),
              );
            }}
          >
            Reject
          </Button>
        </Demo>

        <Demo
          title="Caught error, reported on purpose"
          what="try/catch around the failure, then captureException with extra context attached."
          where="Same issue grouping as an uncaught error, but the app keeps working. This is the pattern for degraded-but-alive code paths."
        >
          <Button
            variant="secondary"
            onClick={() => {
              try {
                JSON.parse("{ not json }");
              } catch (error) {
                Sentry.captureException(error, {
                  tags: { area: "demo" },
                  extra: { attemptedInput: "{ not json }" },
                });
                setNote("Error captured and sent. The app carried on.");
              }
            }}
          >
            Capture
          </Button>
        </Demo>

        <Demo
          title="A message, not an error"
          what="captureMessage records something noteworthy that is not an exception."
          where="Shows up as an issue with the level you set, here 'warning'. Useful for 'this should not happen' branches."
        >
          <Button
            variant="secondary"
            onClick={() => {
              Sentry.captureMessage("Someone pressed the demo message button", {
                level: "warning",
              });
              setNote("Message sent at warning level.");
            }}
          >
            Send message
          </Button>
        </Demo>
      </Card>

      <Card padded={false}>
        <CardHeader>
          <CardTitle>Server (through GraphQL)</CardTitle>
        </CardHeader>

        <Demo
          title="Unhandled error in a resolver"
          what="A resolver throws a plain Error. The Yoga plugin in src/graphql/sentry-plugin.ts reports it."
          where="Tagged with the GraphQL operation name, so it does not get lumped in with every other POST /api/graphql."
        >
          <Button
            variant="danger"
            onClick={() => {
              void runFailServer("UNHANDLED");
            }}
          >
            Throw on server
          </Button>
        </Demo>

        <Demo
          title="Expected error, deliberately not reported"
          what="A GraphQLError with code BAD_USER_INPUT. The plugin skips these."
          where="Nothing. That is the point — validation failures are not defects, and reporting them buries the real ones."
        >
          <Button
            variant="secondary"
            onClick={() => {
              void runFailServer("EXPECTED");
            }}
          >
            Expected failure
          </Button>
        </Demo>

        <Demo
          title="Database error"
          what="Updates a row that does not exist, so Prisma throws."
          where="The stack trace runs from the resolver down into Prisma, showing which query failed."
        >
          <Button
            variant="danger"
            onClick={() => {
              void runFailServer("DATABASE");
            }}
          >
            Break the query
          </Button>
        </Demo>

        <Demo
          title="Error inside nested spans"
          what="Throws two startSpan levels deep."
          where="The trace shows which span was open when it failed, not just the final stack frame."
        >
          <Button
            variant="danger"
            onClick={() => {
              void runFailServer("NESTED");
            }}
          >
            Fail deep
          </Button>
        </Demo>

        <Demo
          title="Server Component crash"
          what="A page that throws while rendering on the server."
          where="Caught by onRequestError in src/instrumentation.ts — the hook most Next.js setups forget to add."
        >
          {/* A link, not a button: it navigates. Styled to match so the row
              reads consistently, rather than nesting an <a> inside a
              <button>, which is invalid HTML. */}
          <Link href="/sentry-demo/server-crash" className={styles.linkButton}>
            Open crashing page
          </Link>
        </Demo>
      </Card>

      <Card padded={false}>
        <CardHeader>
          <CardTitle>Tracing (no error involved)</CardTitle>
        </CardHeader>

        <Demo
          title="Slow operation with nested spans"
          what="Three sequential spans on the server, roughly 600ms in total."
          where="Under Traces rather than Issues. Expand the trace to see the browser click, the GraphQL request and each span inside it on one timeline."
        >
          <Button
            variant="primary"
            disabled={slowRunning}
            onClick={() => {
              // A span on the browser side, so the trace starts at the click
              // rather than at the network request.
              Sentry.startSpan(
                { name: "demo.clickSlowOperation", op: "ui.action" },
                () => {
                  void runSlowOperation();
                },
              );
            }}
          >
            {slowRunning ? "Running..." : "Run slow query"}
          </Button>
        </Demo>
      </Card>
    </div>
  );
}
