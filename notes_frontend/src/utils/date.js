// PUBLIC_INTERFACE
export function formatDateTime(value) {
  /** Format an ISO datetime (or Date) into a compact, readable string. */
  if (!value) return "";
  const dt = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(dt.getTime())) return "";

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dt);
}
