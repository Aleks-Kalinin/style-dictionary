"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { TextField } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/Spinner";
import {
  CLEAR_COMPLETED,
  GET_TODOS,
  type ClearCompletedData,
  type GetTodosData,
  type GetTodosVars,
  type TodoStatus,
} from "@/graphql/operations";
import { cx } from "@/lib/cx";
import { readableError, reportMutationError } from "@/lib/graphql-error";

import { TodoForm } from "./TodoForm";
import { TodoItem } from "./TodoItem";

import styles from "./TodoApp.module.css";

const FILTERS: { value: TodoStatus; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "COMPLETED", label: "Done" },
];

export function TodoApp() {
  const [status, setStatus] = useState<TodoStatus>("ALL");
  const [search, setSearch] = useState("");

  const { data, loading, error, refetch } = useQuery<
    GetTodosData,
    GetTodosVars
  >(GET_TODOS, {
    variables: { status, search: search.trim() || null },
    // Keeps the previous list on screen while a new filter loads, instead of
    // flashing a spinner on every keystroke.
    notifyOnNetworkStatusChange: false,
  });

  const [clearCompleted, { loading: clearing }] =
    useMutation<ClearCompletedData>(CLEAR_COMPLETED, {
      refetchQueries: [GET_TODOS],
      onError: (mutationError) =>
        reportMutationError("clearCompleted", mutationError),
    });

  const todos = data?.todos ?? [];
  const stats = data?.todoStats;

  return (
    <div className={styles.app}>
      <Card className={styles.composer}>
        <TodoForm />
      </Card>

      <Card padded={false}>
        <CardHeader>
          <div className={styles.headerLeft}>
            <CardTitle>Todos</CardTitle>
            {stats ? (
              <Badge tone={stats.active > 0 ? "accent" : "success"}>
                {stats.active} active
              </Badge>
            ) : null}
          </div>

          {stats && stats.completed > 0 ? (
            <Button
              size="sm"
              variant="ghost"
              disabled={clearing}
              onClick={() => {
                void clearCompleted();
              }}
            >
              Clear {stats.completed} done
            </Button>
          ) : null}
        </CardHeader>

        <div className={styles.toolbar}>
          <div className={styles.filters} role="tablist" aria-label="Filter">
            {FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                role="tab"
                aria-selected={status === filter.value}
                className={cx(
                  styles.filter,
                  status === filter.value && styles.filterActive,
                )}
                onClick={() => setStatus(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <TextField
            label="Search todos"
            hideLabel
            type="search"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.search}
          />
        </div>

        {error ? (
          <div className={styles.state}>
            <Alert
              title="Could not load todos"
              detail={readableError(error)}
              action={
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    void refetch();
                  }}
                >
                  Retry
                </Button>
              }
            />
          </div>
        ) : loading && todos.length === 0 ? (
          <div className={styles.state}>
            <Spinner label="Loading todos" />
          </div>
        ) : todos.length === 0 ? (
          <p className={styles.empty}>
            {search.trim()
              ? `Nothing matches "${search.trim()}".`
              : status === "COMPLETED"
                ? "Nothing finished yet."
                : "All clear. Add something above."}
          </p>
        ) : (
          <ul className={styles.list} role="list">
            {todos.map((todo) => (
              <TodoItem key={todo.id} todo={todo} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
