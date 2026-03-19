import { Badge } from "react-bootstrap";

export default function StatusPill({ status, map, className = "" }) {
  const config = map[status] || {
    label: status || "Unknown",
    bg: "secondary",
    textClass: "text-white",
  };

  return (
    <Badge
      bg={config.bg}
      className={`px-3 py-2 rounded-pill fw-medium ${config.textClass} ${className}`.trim()}
    >
      {config.label}
    </Badge>
  );
}
