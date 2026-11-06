"use client";

import { useMutation } from "@apollo/client/react";
import * as Sentry from "@sentry/nextjs";
import { useState } from "react";

import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { SelectField, TextField } from "@/components/ui/Field";
import {
  DELETE_TODO,
  GET_TODOS,
  TOGGLE_TODO,
  UPDATE_TODO,
  type DeleteTodoData,
  type Priority,
  type Todo,
  type ToggleTodoData,
  type UpdateTodoData,
  type UpdateTodoVars,
} from "@/graphql/operations";
import { cx } from "@/lib/cx";
import { readableError, reportMutationError } from "@/lib/graphql-error";

import styles from "./TodoItem.module.css";

const PRIORITY_TONE: Record<Priority, BadgeTone> = {
  LOW: "neutral",
  MEDIUM: "accent",
  HIGH: "danger",
};

const PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH"];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function TodoItem({ todo }: { todo: Todo }) {
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(todo.title);
  const [draftPriority, setDraftPriority] = useState<Priority>(todo.priority);
  const [error, setError] = useState<string | null>(null);

  const onError = (action: string) => (mutationError: unknown) => {
    setError(readableError(mutationError));
    reportMutationError(action, mutationError);
  };

  /**
   * No `refetchQueries` here. The mutation returns the updated Todo including
   * its id, so Apollo's normalised cache replaces the stored entity and this
   * component re-renders on its own. The counts come from `todoStats`, which
   * is why only the mutations that change *how many* todos exist refetch.
   */
  const [toggleTodo, { loading: toggling }] = useMutation<ToggleTodoData>(
    TOGGLE_TODO,
    { refetchQueries: [GET_TODOS], onError: onError("toggleTodo") },
  );

  const [updateTodo, { loading: updating }] = useMutation<
    UpdateTodoData,
    UpdateTodoVars
  >(UPDATE_TODO, {
    onError: onError("updateTodo"),
    onCompleted: () => {
      setEditing(false);
      setError(null);
    },
  });

  const [deleteTodo, { loading: deleting }] = useMutation<DeleteTodoData>(
    DELETE_TODO,
    { refetchQueries: [GET_TODOS], onError: onError("deleteTodo") },
  );

  const busy = toggling || updating || deleting;

  function handleToggle() {
    Sentry.addBreadcrumb({
      category: "ui.action",
      message: todo.completed ? "Reopened todo" : "Completed todo",
      level: "info",
    });

    void toggleTodo({ variables: { id: todo.id } });
  }

  function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    void updateTodo({
      variables: {
        id: todo.id,
        input: { title: draftTitle, priority: draftPriority },
      },
    });
  }

  function startEditing() {
    setDraftTitle(todo.title);
    setDraftPriority(todo.priority);
    setEditing(true);
    setError(null);
  }

  if (editing) {
    return (
      <li className={styles.item}>
        <form className={styles.editor} onSubmit={handleSave}>
          <TextField
            label="Title"
            hideLabel
            value={draftTitle}
            maxLength={200}
            autoFocus
            onChange={(e) => setDraftTitle(e.target.value)}
            error={error ?? undefined}
          />
          <SelectField
            label="Priority"
            hideLabel
            value={draftPriority}
            onChange={(e) => setDraftPriority(e.target.value as Priority)}
          >
            {PRIORITIES.map((value) => (
              <option key={value} value={value}>
                {value.charAt(0) + value.slice(1).toLowerCase()}
              </option>
            ))}
          </SelectField>
          <div className={styles.editorActions}>
            <Button type="submit" variant="primary" size="sm" disabled={busy}>
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className={cx(styles.item, busy && styles.pending)}>
      <Checkbox
        className={styles.checkbox}
        label={`Mark "${todo.title}" as ${todo.completed ? "not done" : "done"}`}
        checked={todo.completed}
        onChange={handleToggle}
        disabled={busy}
      />

      <div className={styles.body}>
        <div className={styles.titleRow}>
          <span className={cx(styles.title, todo.completed && styles.completed)}>
            {todo.title}
          </span>
          <Badge tone={PRIORITY_TONE[todo.priority]} withDot>
            {todo.priority}
          </Badge>
        </div>

        {todo.notes ? <p className={styles.notes}>{todo.notes}</p> : null}

        <span className={styles.meta}>Added {formatDate(todo.createdAt)}</span>

        {error ? (
          <span className={styles.meta} role="alert">
            {error}
          </span>
        ) : null}
      </div>

      <div className={styles.actions}>
        <Button size="sm" variant="ghost" onClick={startEditing} disabled={busy}>
          Edit
        </Button>
        <Button
          size="sm"
          variant="dangerGhost"
          disabled={busy}
          onClick={() => {
            void deleteTodo({ variables: { id: todo.id } });
          }}
        >
          Delete
        </Button>
      </div>
    </li>
  );
}
