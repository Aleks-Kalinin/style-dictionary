/**
 * Joins class names, dropping anything that is not a usable string. Keeps
 * conditional classes readable: cx(styles.base, isActive && styles.active).
 *
 * Accepts `unknown` because `someReactNode && styles.x` can produce 0 or "",
 * not just false.
 */
export function cx(...values: unknown[]): string {
  return values
    .filter((value): value is string => typeof value === "string" && value !== "")
    .join(" ");
}
