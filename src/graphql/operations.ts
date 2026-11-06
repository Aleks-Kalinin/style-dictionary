import { gql } from "@apollo/client";

/**
 * The GraphQL documents this app sends, kept in one place so the queries are
 * reviewable together. A fragment defines "the fields a Todo card needs" once;
 * every operation then reuses it, so adding a field is a single-line change.
 */
export const TODO_FIELDS = gql`
  fragment TodoFields on Todo {
    id
    title
    notes
    completed
    priority
    createdAt
    updatedAt
  }
`;

export const GET_TODOS = gql`
  ${TODO_FIELDS}
  query GetTodos($status: TodoStatus, $search: String) {
    todos(status: $status, search: $search) {
      ...TodoFields
    }
    todoStats {
      total
      active
      completed
    }
  }
`;

export const CREATE_TODO = gql`
  ${TODO_FIELDS}
  mutation CreateTodo($input: CreateTodoInput!) {
    createTodo(input: $input) {
      ...TodoFields
    }
  }
`;

export const UPDATE_TODO = gql`
  ${TODO_FIELDS}
  mutation UpdateTodo($id: ID!, $input: UpdateTodoInput!) {
    updateTodo(id: $id, input: $input) {
      ...TodoFields
    }
  }
`;

export const TOGGLE_TODO = gql`
  ${TODO_FIELDS}
  mutation ToggleTodo($id: ID!) {
    toggleTodo(id: $id) {
      ...TodoFields
    }
  }
`;

export const DELETE_TODO = gql`
  mutation DeleteTodo($id: ID!) {
    deleteTodo(id: $id)
  }
`;

export const CLEAR_COMPLETED = gql`
  mutation ClearCompleted {
    clearCompleted
  }
`;

/* -------------------------------------------------------------------------
   Result types.

   These are written by hand. On a larger project you would generate them
   from schema.graphql with graphql-codegen so they cannot drift; for five
   operations, hand-written types are easier to read and one less build step.
   ------------------------------------------------------------------------- */

export type Priority = "LOW" | "MEDIUM" | "HIGH";
export type TodoStatus = "ALL" | "ACTIVE" | "COMPLETED";

export interface Todo {
  __typename?: "Todo";
  id: string;
  title: string;
  notes: string | null;
  completed: boolean;
  priority: Priority;
  createdAt: string;
  updatedAt: string;
}

export interface TodoStats {
  total: number;
  active: number;
  completed: number;
}

export interface GetTodosData {
  todos: Todo[];
  todoStats: TodoStats;
}

export interface GetTodosVars {
  status?: TodoStatus;
  search?: string | null;
}

export interface CreateTodoData {
  createTodo: Todo;
}

export interface CreateTodoVars {
  input: { title: string; notes?: string | null; priority?: Priority };
}

export interface UpdateTodoData {
  updateTodo: Todo;
}

export interface UpdateTodoVars {
  id: string;
  input: {
    title?: string;
    notes?: string | null;
    completed?: boolean;
    priority?: Priority;
  };
}

export interface ToggleTodoData {
  toggleTodo: Todo;
}

export interface DeleteTodoData {
  deleteTodo: string;
}

export interface ClearCompletedData {
  clearCompleted: number;
}
