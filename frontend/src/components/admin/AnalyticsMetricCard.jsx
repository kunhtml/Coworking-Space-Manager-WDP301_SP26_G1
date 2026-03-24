import { Card } from "react-bootstrap";

export default function AnalyticsMetricCard({ label, value, valueColor, trendText, trendColor, icon }) {
  return (
    <Card
      className="border-0"
      style={{
        backgroundColor: "white",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
        borderRadius: "12px",
      }}
    >
      <Card.Body className="p-4">
        <div className="d-flex align-items-start justify-content-between">
          <div>
            <div
              style={{
                fontSize: "12px",
                color: "#94a3b8",
                fontWeight: "600",
                marginBottom: "8px",
              }}
            >
              {label}
            </div>
            <div
              style={{
                fontSize: "32px",
                fontWeight: "700",
                color: valueColor,
                marginBottom: "6px",
              }}
            >
              {value}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: trendColor,
                fontWeight: "600",
              }}
            >
              {trendText}
            </div>
          </div>
          <div style={{ fontSize: "28px" }}>{icon}</div>
        </div>
      </Card.Body>
    </Card>
  );
}
