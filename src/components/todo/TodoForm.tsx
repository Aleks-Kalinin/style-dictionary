"use client";

import { useMutation } from "@apollo/client/react";
import * as Sentry from "@sentry/nextjs";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import {
  CREATE_TODO,
  GET_TODOS,
  type CreateTodoData,
  type CreateTodoVars,
  type Priority,
} from "@/graphql/operations";
import { readableError, reportMutationError } from "@/lib/graphql-error";

import styles from "./TodoForm.module.css";

const PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH"];

export function TodoForm() {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createTodo, { loading }] = useMutation<
    CreateTodoData,
    CreateTodoVars
  >(CREATE_TODO, {
    // The list and the counts both change, so refetch the query that owns
    // them. Simpler and harder to get wrong than hand-editing the cache.
    refetchQueries: [GET_TODOS],
    onError: (mutationError) => {
      setError(readableError(mutationError));
      reportMutationError("createTodo", mutationError);
    },
    onCompleted: () => {
      setTitle("");
      setNotes("");
      setPriority("MEDIUM");
      setExpanded(false);
      setError(null);
    },
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Give the todo a title first.");
      return;
    }

    // A breadcrumb records the action without sending an event. If something
    // fails later, this shows up in the trail on the Sentry issue page.
    Sentry.addBreadcrumb({
      category: "ui.action",
      message: "Submitted new todo",
      level: "info",
      data: { priority, hasNotes: notes.trim().length > 0 },
    });

    void createTodo({
      variables: {
        input: { title, notes: notes.trim() || null, priority },
      },
    });
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.row}>
        <TextField
          label="New todo"
          hideLabel
          placeholder="What needs doing?"
          value={title}
          maxLength={200}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setExpanded(true)}
          disabled={loading}
          className={styles.title}
        />
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? "Adding..." : "Add"}
        </Button>
      </div>

      {expanded ? (
        <div className={styles.details}>
          <TextAreaField
            label="Notes"
            placeholder="Optional detail"
            value={notes}
            rows={2}
            onChange={(e) => setNotes(e.target.value)}
            disabled={loading}
          />
          <SelectField
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            disabled={loading}
            className={styles.priority}
          >
            {PRIORITIES.map((value) => (
              <option key={value} value={value}>
                {value.charAt(0) + value.slice(1).toLowerCase()}
              </option>
            ))}
          </SelectField>
        </div>
      ) : null}

      {error ? <Alert title="Could not add todo" detail={error} /> : null}
    </form>
  );
}
