import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cx } from "@/lib/cx";

import styles from "./Button.module.css";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "dangerGhost";

export type ButtonSize = "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  /** Square padding for a button whose only child is an icon. */
  iconOnly?: boolean;
  children?: ReactNode;
}

/**
 * The variants are a closed set on purpose. A design system works because the
 * choices are finite: a caller picks "danger", not a specific red.
 */
export function Button({
  variant = "secondary",
  size = "md",
  fullWidth = false,
  iconOnly = false,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        styles.button,
        styles[size],
        styles[variant],
        fullWidth && styles.fullWidth,
        iconOnly && styles.iconOnly,
        className,
      )}
      {...props}
    />
  );
}
