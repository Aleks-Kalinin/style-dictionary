import { cx } from "@/lib/cx";

import styles from "./Card.module.css";

import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds the standard inset. Turn off when the card holds a flush list. */
  padded?: boolean;
  children?: ReactNode;
}

export function Card({ padded = true, className, ...props }: CardProps) {
  return (
    <div
      className={cx(styles.card, padded && styles.padded, className)}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx(styles.header, className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cx(styles.title, className)} {...props} />;
}
