export function MetricCard({
  label,
  value,
  detail,
  trend,
  tone = "blue"
}: {
  label: string;
  value: string;
  detail: string;
  trend?: string;
  tone?: "blue" | "gold" | "green" | "rose";
}) {
  return (
    <article className={`metric-card metric-card--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
      {trend ? <small>{trend}</small> : null}
    </article>
  );
}
