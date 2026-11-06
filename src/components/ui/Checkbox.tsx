"use client";

import { useId } from "react";

import { cx } from "@/lib/cx";

import styles from "./Checkbox.module.css";

import type { InputHTMLAttributes } from "react";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "id"> {
  /** Required: a checkbox with no accessible name is unusable with a reader. */
  label: string;
}

export function Checkbox({ label, className, ...props }: CheckboxProps) {
  const id = useId();

  return (
    <span className={cx(styles.wrapper, className)}>
      <input id={id} type="checkbox" className={styles.input} {...props} />
      <label htmlFor={id} className={styles.box}>
        <svg
          className={styles.check}
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 8.5L6.5 12L13 4.5"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="visually-hidden">{label}</span>
      </label>
    </span>
  );
}
