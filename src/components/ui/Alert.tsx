import { cx } from "@/lib/cx";

import styles from "./Alert.module.css";

import type { ReactNode } from "react";

export interface AlertProps {
  tone?: "danger" | "warning" | "info";
  title: ReactNode;
  /** Secondary line, rendered in monospace. Useful for raw error messages. */
  detail?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function Alert({
  tone = "danger",
  title,
  detail,
  action,
  className,
}: AlertProps) {
  return (
    <div
      className={cx(styles.alert, styles[tone], className)}
      role={tone === "danger" ? "alert" : "status"}
    >
      <div className={styles.body}>
        <div className={styles.title}>{title}</div>
        {detail ? <div className={styles.detail}>{detail}</div> : null}
      </div>
      {action}
    </div>
  );
}
