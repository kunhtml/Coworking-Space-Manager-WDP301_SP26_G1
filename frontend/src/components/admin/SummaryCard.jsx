import { Card } from "react-bootstrap";

export default function SummaryCard({ label, value, icon, color = "primary", className = "", subtitle = "" }) {
  return (
    <Card className={`border-0 shadow-sm h-100 ${className}`.trim()}>
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <p className="text-muted small mb-1">{label}</p>
            <h3 className="fw-bold mb-0">{value}</h3>
            {subtitle ? <small className="text-muted">{subtitle}</small> : null}
          </div>
          {icon ? (
            <div className={`bg-${color} bg-opacity-10 rounded-circle p-3`}>
              <i className={`bi ${icon} fs-4 text-${color}`}></i>
            </div>
          ) : null}
        </div>
      </Card.Body>
    </Card>
  );
}
