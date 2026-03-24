import { Card } from "react-bootstrap";

export default function HourlyCapacityCard({ hourlyLoading, hourlyError, hourlyCapacity, peakWindowLabel }) {
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
        <h5
          className="mb-4 fw-bold"
          style={{ fontSize: "16px", color: "#1e293b" }}
        >
          <i
            className="bi bi-bar-chart"
            style={{ color: "#8b5cf6", marginRight: "8px" }}
          ></i>
          Công suất theo khung giờ
        </h5>

        <div
          style={{
            height: "300px",
            display: "flex",
            alignItems: "flex-end",
            gap: "8px",
          }}
        >
          {hourlyLoading ? (
            <div className="w-100 h-100 d-flex align-items-center justify-content-center">
              <small style={{ color: "#64748b" }}>Dang tai du lieu...</small>
            </div>
          ) : hourlyError ? (
            <div className="w-100 h-100 d-flex align-items-center justify-content-center">
              <small style={{ color: "#ef4444" }}>{hourlyError}</small>
            </div>
          ) : hourlyCapacity.length === 0 ? (
            <div className="w-100 h-100 d-flex align-items-center justify-content-center">
              <small style={{ color: "#64748b" }}>Khong co du lieu theo gio.</small>
            </div>
          ) : (
            hourlyCapacity.map((item, idx) => (
              <div
                key={idx}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div
                  title={`${item.time}: ${item.usage}%`}
                  style={{
                    width: "100%",
                    height: `${Math.max(30, (Number(item.usage) || 0) * 3)}px`,
                    backgroundColor: "#c7d2fe",
                    borderRadius: "4px 4px 0 0",
                    transition: "all 0.2s",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#8b5cf6";
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(139, 92, 246, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#c7d2fe";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <small
                  style={{
                    color: "#94a3b8",
                    fontWeight: "600",
                    marginTop: "8px",
                    fontSize: "11px",
                  }}
                >
                  {item.time}
                </small>
              </div>
            ))
          )}
        </div>

        <div
          style={{
            marginTop: "20px",
            paddingTop: "20px",
            borderTop: "1px solid #f1f5f9",
          }}
        >
          <small style={{ color: "#f59e0b", fontWeight: "600" }}>
            <i className="bi bi-exclamation-circle me-1"></i>
            Cao điểm: {peakWindowLabel}
          </small>
        </div>
      </Card.Body>
    </Card>
  );
}
