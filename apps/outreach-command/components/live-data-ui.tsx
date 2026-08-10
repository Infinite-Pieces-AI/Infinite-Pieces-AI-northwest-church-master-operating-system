import Link from "next/link";

export function LiveDataNotice({
  title,
  children,
  warning = false,
}: {
  title: string;
  children: React.ReactNode;
  warning?: boolean;
}) {
  return (
    <section className={`live-data-notice${warning ? " live-data-notice--warning" : ""}`}>
      <span aria-hidden="true">{warning ? "!" : "✓"}</span>
      <div>
        <strong>{title}</strong>
        <div>{children}</div>
      </div>
    </section>
  );
}

export function EmptyLiveData({
  title,
  description,
  href,
  action,
}: {
  title: string;
  description: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="live-empty-state">
      <span aria-hidden="true">◇</span>
      <h2>{title}</h2>
      <p>{description}</p>
      {href && action ? (
        <Link className="secondary-button" href={href}>
          {action}
        </Link>
      ) : null}
    </div>
  );
}

export function LiveMetric({
  label,
  value,
  detail,
  tone = "blue",
}: {
  label: string;
  value: number | string;
  detail: string;
  tone?: "blue" | "gold" | "green" | "rose";
}) {
  return (
    <article className={`metric-card metric-card--${tone}`}>
      <span>{label}</span>
      <strong>{typeof value === "number" ? value.toLocaleString() : value}</strong>
      <p>{detail}</p>
    </article>
  );
}

export function statusClass(value: unknown) {
  const status = String(value ?? "").toLowerCase();
  if (
    ["approved", "active", "published", "success", "complete", "completed", "connected"].includes(
      status,
    )
  ) {
    return "status-pill status-pill--ready";
  }
  if (["failed", "suspended", "removed", "rejected", "blocked", "opted_out"].includes(status)) {
    return "status-pill status-pill--blocked";
  }
  return "status-pill status-pill--review";
}

export function text(value: unknown, fallback = "—"): string {
  if (value === null || value === undefined || value === "") return fallback;
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function dateTime(value: unknown): string {
  if (typeof value !== "string" || !value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : date.toLocaleString();
}
