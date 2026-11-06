import { cx } from "@/lib/cx";

import styles from "./Spinner.module.css";

export function Spinner({
  className,
  label = "Loading",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span role="status">
      <span className={cx(styles.spinner, className)} aria-hidden="true" />
      <span className="visually-hidden">{label}</span>
    </span>
  );
}
