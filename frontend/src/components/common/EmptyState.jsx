export default function EmptyState({ icon = "📦", title = "No data", description = "", className = "" }) {
  return (
    <div className={`text-center py-5 text-muted ${className}`.trim()}>
      <div style={{ fontSize: 48 }}>{icon}</div>
      <p className="fw-semibold mt-2 mb-1">{title}</p>
      {description ? <p className="small mb-0">{description}</p> : null}
    </div>
  );
}
