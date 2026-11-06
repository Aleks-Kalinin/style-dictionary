import { CombinedGraphQLErrors } from "@apollo/client";
import * as Sentry from "@sentry/nextjs";

/**
 * Apollo Client 4 wraps the `errors` array a GraphQL response can carry in a
 * `CombinedGraphQLErrors` object, and reports transport failures as ordinary
 * Errors. This flattens both into one string a person can read.
 */
export function readableError(error: unknown): string {
  if (error instanceof CombinedGraphQLErrors) {
    return error.errors.map((e) => e.message).join(" ");
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
}

/**
 * True when the server rejected the input, rather than something breaking.
 * These are shown inline and deliberately not reported to Sentry.
 */
export function isUserInputError(error: unknown): boolean {
  if (!(error instanceof CombinedGraphQLErrors)) return false;

  return error.errors.every((e) =>
    ["BAD_USER_INPUT", "NOT_FOUND"].includes(String(e.extensions?.code)),
  );
}

/**
 * Reports a failed mutation to Sentry, but only when it is a genuine fault.
 * `action` becomes a searchable tag in the Sentry UI.
 */
export function reportMutationError(action: string, error: unknown) {
  if (isUserInputError(error)) return;

  Sentry.captureException(error, {
    tags: { area: "todo-mutation", action },
  });
}
