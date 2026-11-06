"use client";

import { useId } from "react";

import { cx } from "@/lib/cx";

import styles from "./Field.module.css";

import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

interface FieldShellProps {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** Hides the label visually but keeps it for screen readers. */
  hideLabel?: boolean;
  htmlFor: string;
  children: ReactNode;
}

function FieldShell({
  label,
  hint,
  error,
  hideLabel,
  htmlFor,
  children,
}: FieldShellProps) {
  return (
    <div className={styles.field}>
      <label
        htmlFor={htmlFor}
        className={cx(styles.label, hideLabel && "visually-hidden")}
      >
        {label}
      </label>
      {children}
      {hint && !error ? <span className={styles.hint}>{hint}</span> : null}
      {error ? (
        <span className={styles.error} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

type SharedProps = Pick<
  FieldShellProps,
  "label" | "hint" | "error" | "hideLabel"
>;

export type TextFieldProps = SharedProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "id">;

/**
 * Each control generates its own id with `useId`, so the label is always
 * wired to the right input without callers inventing unique strings.
 */
export function TextField({
  label,
  hint,
  error,
  hideLabel,
  className,
  ...props
}: TextFieldProps) {
  const id = useId();

  return (
    <FieldShell
      label={label}
      hint={hint}
      error={error}
      hideLabel={hideLabel}
      htmlFor={id}
    >
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        className={cx(styles.control, error && styles.invalid, className)}
        {...props}
      />
    </FieldShell>
  );
}

export type TextAreaFieldProps = SharedProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id">;

export function TextAreaField({
  label,
  hint,
  error,
  hideLabel,
  className,
  ...props
}: TextAreaFieldProps) {
  const id = useId();

  return (
    <FieldShell
      label={label}
      hint={hint}
      error={error}
      hideLabel={hideLabel}
      htmlFor={id}
    >
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        className={cx(
          styles.control,
          styles.textarea,
          error && styles.invalid,
          className,
        )}
        {...props}
      />
    </FieldShell>
  );
}

export type SelectFieldProps = SharedProps &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, "id">;

export function SelectField({
  label,
  hint,
  error,
  hideLabel,
  className,
  children,
  ...props
}: SelectFieldProps) {
  const id = useId();

  return (
    <FieldShell
      label={label}
      hint={hint}
      error={error}
      hideLabel={hideLabel}
      htmlFor={id}
    >
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        className={cx(
          styles.control,
          styles.select,
          error && styles.invalid,
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
}
