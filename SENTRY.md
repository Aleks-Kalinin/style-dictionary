# Sentry, from scratch

A walkthrough written for someone who has never used Sentry. Read it next to
the running app with `/sentry-demo` open in a browser tab.

Everything here stays inside the **free Developer plan**. The features that
cost money are called out at the end so you know what you are *not* using.

---

## 1. What Sentry actually is

Three products share one SDK, and it helps to keep them separate in your head:

| Product | Question it answers | Where it shows up |
|---|---|---|
| **Error Monitoring** | What broke, for whom, and what was the stack trace? | *Issues* |
| **Tracing** (performance) | Why was that slow, and which step took the time? | *Traces* / *Performance* |
| **Session Replay** | What did the user actually see and click? | *Replays* |

This project uses the first two. Replay is deliberately left off (see §9).

The mental model: your app sends **events** to Sentry over HTTPS. An event is
either an *error* (something threw) or a *transaction* (a timed unit of work,
containing nested *spans*). Sentry groups similar errors into an **issue**, so
one bug hitting 4,000 users is one row in your dashboard, not 4,000.

---

## 2. Getting a DSN

The app runs fine without one — the SDK initialises and then does nothing, so
there are no network calls and no errors. To see real data:

1. Create a free account at <https://sentry.io>.
2. Create a project, platform **Next.js**.
3. Copy the **DSN** from *Settings → Projects → [your project] → Client Keys (DSN)*.
4. Put it in `.env`:
   ```
   NEXT_PUBLIC_SENTRY_DSN="https://abc123@o12345.ingest.de.sentry.io/678910"
   ```
5. Restart `npm run dev`. Environment variables are read at startup.

> **Why `NEXT_PUBLIC_`?** The browser needs the DSN too, and Next.js only
> exposes variables with that prefix to client code. A DSN is not a secret —
> it is a write-only ingest address. The thing you must keep private is the
> *auth token* (§8).

---

## 3. The files that wire it up

Five files, each with a distinct job. This is the part that is genuinely
confusing the first time, because Next.js runs your code in three different
environments.

| File | Runtime | Purpose |
|---|---|---|
| `src/instrumentation-client.ts` | Browser | `Sentry.init` for client code. Next.js loads it automatically. |
| `sentry.server.config.ts` | Node | `Sentry.init` for server code. |
| `sentry.edge.config.ts` | Edge | `Sentry.init` for middleware and edge routes. |
| `src/instrumentation.ts` | Node + Edge | Next.js calls `register()` once at startup; it imports whichever config matches the runtime. Also exports `onRequestError`. |
| `next.config.ts` | Build time | `withSentryConfig` wraps the build for source maps and tracing. |

### The one line people forget

```ts
// src/instrumentation.ts
export const onRequestError = Sentry.captureRequestError;
```

Without it, errors thrown in **Server Components, route handlers and
middleware** are printed to your terminal and never reach Sentry. Everything
looks fine in the dashboard while your server is on fire. Try the
*Server Component crash* button on the demo page and watch it arrive.

---

## 4. Four ways an error reaches Sentry

Open `/sentry-demo`. Each button demonstrates one path.

**1. Automatic (global handlers).** The SDK hooks `window.onerror` and
`unhandledrejection`. You write no code. This covers uncaught throws in event
handlers and floating promise rejections.

**2. React error boundaries.** React swallows render errors and hands them to
the nearest boundary — it does *not* re-throw them to `window.onerror`. So a
boundary has to report them itself:

```tsx
// src/app/error.tsx
useEffect(() => {
  Sentry.captureException(error);
}, [error]);
```

`src/app/global-error.tsx` does the same for failures in the root layout.

**3. Explicit capture.** When you catch something but still want to know:

```ts
try {
  risky();
} catch (error) {
  Sentry.captureException(error, {
    tags: { area: "import" },        // searchable, low-cardinality
    extra: { fileName: file.name },  // arbitrary detail, not searchable
  });
}
```

**4. Server-side, via the GraphQL plugin.** See §6.

---

## 5. Making an error report useful

A stack trace alone often is not enough. The SDK gives you four tools, and the
difference between them matters:

```ts
// TAG — indexed and searchable. Keep the set of values small.
Sentry.setTag("subscription_tier", "free");

// CONTEXT — structured data shown as a panel on the issue page.
Sentry.setContext("graphql", { operationName, variables });

// BREADCRUMB — the timeline of what happened before the error.
Sentry.addBreadcrumb({ category: "ui.action", message: "Submitted new todo" });

// USER — who hit it, so you can see how many people are affected.
Sentry.setUser({ id: user.id });
```

Rule of thumb: **tags** are for things you will filter by, **context** is for
things you will read while debugging. Do not put a user id in a tag — thousands
of distinct values make the index useless.

This app adds breadcrumbs on todo actions (`TodoForm.tsx`, `TodoItem.tsx`), so
when something fails you can see the exact sequence that led there.

---

## 6. Instrumenting GraphQL

This is the part worth understanding, because the default instrumentation is
nearly useless for a GraphQL API.

HTTP-level tracing sees only `POST /api/graphql`. Every query, every mutation,
every error — one endpoint. The interesting detail is in the request *body*.

`src/graphql/sentry-plugin.ts` is a Yoga plugin that fixes this:

```ts
onExecute({ args }) {
  const operationName = args.operationName ?? "anonymous";

  // Group by operation instead of by URL.
  Sentry.getCurrentScope().setTransactionName(`GraphQL query ${operationName}`);
  Sentry.setContext("graphql", { operationName, variables: args.variableValues });

  return {
    onExecuteDone({ result }) {
      for (const error of result.errors ?? []) {
        if (EXPECTED_ERROR_CODES.has(String(error.extensions?.code))) continue;
        Sentry.captureException(error.originalError ?? error);
      }
    },
  };
}
```

### Not reporting expected errors

The `continue` above is the most important line in the file.

GraphQL returns validation failures in the same `errors` array as genuine
crashes. "Title cannot be empty" is not a defect — it is the API working. If
you report those, your dashboard fills with noise and real bugs get buried.

So resolvers throw a typed `GraphQLError` for expected problems:

```ts
throw new GraphQLError("Title cannot be empty.", {
  extensions: { code: "BAD_USER_INPUT", field: "title" },
});
```

and the plugin skips `BAD_USER_INPUT` and `NOT_FOUND`. Press
**Expected failure** on the demo page: you get an error in the browser and
nothing in Sentry. That is correct behaviour.

The same split exists on the client, in `src/lib/graphql-error.ts`.

---

## 7. Tracing

A **transaction** is a timed unit of work; **spans** are the steps inside it.
Sentry draws them as a waterfall, which is how you find the slow step.

Spans are created explicitly:

```ts
Sentry.startSpan(
  { name: "todo.findMany", op: "db.query" },
  () => prisma.todo.findMany({ where }),
);
```

`op` is a category (`db.query`, `http.client`, `ui.action`) that Sentry uses for
grouping and colouring. Every resolver in `src/graphql/todo/` wraps its database
call this way, so a trace reads:

```
POST /api/graphql                        620ms
└─ GraphQL query GetTodos                615ms
   ├─ todo.findMany        (db.query)     12ms
   └─ todo.stats           (db.query)      8ms
```

### Connecting browser to server

`tracePropagationTargets: [/^\//]` in `src/instrumentation-client.ts` tells the
browser SDK to attach a trace header to same-origin requests. The server
continues that trace rather than starting a new one, so one timeline covers the
click, the network request, and the database query.

Press **Run slow query** on the demo page to see a three-span waterfall.

### Sample rates

```ts
tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
```

`1.0` records every transaction — right while learning. In production this is
the main driver of your quota; `0.1` records 10%. Errors are **not** sampled by
this setting; `sampleRate` controls those, and it defaults to `1.0`.

---

## 8. Source maps

Production JavaScript is minified, so a stack trace reads
`a.b is not a function at chunk-4f2.js:1:28471`. Source maps let Sentry show
your original TypeScript instead.

`withSentryConfig` in `next.config.ts` uploads them at build time. It needs
credentials:

```
SENTRY_ORG="your-org-slug"
SENTRY_PROJECT="your-project-slug"
SENTRY_AUTH_TOKEN="sntrys_..."
```

Create the token at *Settings → Developer Settings → Auth Tokens* with the
`project:releases` scope.

**Keep `SENTRY_AUTH_TOKEN` out of git.** Unlike the DSN, it grants write access
to your Sentry org. In CI, set it as a secret.

Without the token, upload is skipped and the build still succeeds — that is the
`sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN }` line.

---

## 9. What this project deliberately does not use

Staying inside the free Developer plan, and keeping the setup small:

| Feature | Status | To enable |
|---|---|---|
| **Session Replay** | Off | Add `Sentry.replayIntegration()` to `integrations` in `src/instrumentation-client.ts`. The free plan includes a small monthly allowance; it is metered separately from errors. |
| **Profiling** | Off | Needs `@sentry/profiling-node` plus an integration. Not installed. |
| **Structured Logs** | Off | `beforeSendLog: () => null` in all three configs discards them. Metered separately. |
| **User Feedback widget** | Off | Add `Sentry.feedbackIntegration()`. |
| **Cron / Uptime monitors** | Off | Configured in the Sentry UI, not in code. |

Error monitoring and tracing are both included in the free plan, with a monthly
event quota. The demo buttons will consume a little of it — that is what it is
for, but do not leave a script hammering them.

### Keeping your quota under control

- `tracesSampleRate` below 1.0 in production.
- `ignoreErrors: [/ResizeObserver loop/]` in `Sentry.init` filters known noise.
- `beforeSend(event) { return shouldSend ? event : null }` drops events
  programmatically.
- Set a **spike protection** limit in *Settings → Subscription*.

---

## 10. Try this now

With a DSN set and `npm run dev` running:

1. Open `/sentry-demo`. Press **Throw** → within a minute the issue is in
   *Issues*. Open it and look at the breadcrumbs.
2. Press **Expected failure** → confirm nothing appears. Understand why.
3. Press **Run slow query** → find it under *Traces* and expand the waterfall.
4. Press **Open crashing page** → this one only works because of
   `onRequestError`. Comment that export out, restart, and try again to see the
   difference.
5. Add a todo with an empty title → an inline message, nothing in Sentry.
6. In `src/graphql/todo/queries.ts`, add a `throw new Error("boom")` inside the
   `todos` resolver and reload the home page. Watch it arrive tagged with the
   operation name `GetTodos`.

---

## 11. Removing the demo

When you are done, delete:

- `src/app/sentry-demo/`
- `src/graphql/debug/`
- the `import "@/graphql/debug/resolvers";` line in `src/graphql/schema.ts`
- the footer links in `src/app/layout.tsx`

The rest of the setup is what you would keep in a real project.
