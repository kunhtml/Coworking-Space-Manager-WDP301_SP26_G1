import { Badge, Card, Col, Row } from "react-bootstrap";

export default function SeatZoneSection({
  zone,
  tables,
  getCfg,
  hoveredId,
  setHoveredId,
  onOpen,
  formatTime,
  bookingStatusLabel,
  colProps = { xl: 2, lg: 3, md: 4, sm: 6 } // Default for full page
}) {
  return (
    <div className="mb-5">
      <div className="d-flex align-items-center gap-3 mb-3">
        <h5 className="fw-bold text-secondary mb-0">{zone}</h5>
        <span className="rounded-pill px-3 py-1 small fw-bold" style={{ background: "#f1f5f9", color: "#475569" }}>
          {tables.length} ban
        </span>
        <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
      </div>

      <Row className="g-3">
        {tables.map((table) => {
          const cfg = getCfg(table.status);
          const id = table.id || table._id;
          const isHover = hoveredId === id;
          return (
            <Col {...colProps} key={String(id)}>
              <Card
                className="border-2 staff-seat-card"
                style={{
                  cursor: "pointer",
                  transform: isHover ? "translateY(-6px)" : "translateY(0)",
                  boxShadow: isHover ? `0 12px 28px ${cfg.glowColor}, 0 2px 8px rgba(0,0,0,0.06)` : "0 2px 8px rgba(0,0,0,0.04)",
                  transition: "all 0.22s cubic-bezier(.4,0,.2,1)",
                  borderColor: cfg.borderColor,
                  background: isHover ? cfg.iconBg : "#fff",
                  borderWidth: "2px",
                  borderStyle: "solid",
                }}
                onClick={() => onOpen(table)}
                onMouseEnter={() => setHoveredId(id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <Card.Body className="text-center px-2 py-3">
                  <h5 className="fw-bold mb-1 text-truncate" style={{ fontSize: "0.95rem", lineHeight: 1.3 }} title={table.name}>{table.name}</h5>
                  <div className="text-secondary fw-semibold mb-1" style={{ fontSize: "0.76rem" }}>{table.tableType || "Cho ngoi"}</div>
                  <div className="fw-semibold mb-2" style={{ fontSize: "0.76rem", color: "#64748b" }}>
                    {table.capacity ? `${table.capacity} cho` : ""}
                    {table.capacity && table.pricePerHour ? " · " : ""}
                    {table.pricePerHour ? `${Number(table.pricePerHour).toLocaleString("vi-VN")}d/h` : ""}
                  </div>
                  <span className="rounded-pill px-3 py-1 fw-bold d-inline-block mb-2" style={{ background: cfg.badgeBg, color: cfg.badgeColor, fontSize: "0.73rem", letterSpacing: "0.02em" }}>
                    {cfg.label}
                  </span>
                  {table.activeBooking && (
                    <div className="mt-1 rounded-3 px-2 py-1" style={{ background: "#fef9c3", fontSize: "0.7rem" }}>
                      <span className="fw-bold" style={{ color: "#92400e" }}>#{table.activeBooking.bookingCode}</span>
                      <div style={{ color: "#78350f" }}>{formatTime(table.activeBooking.startTime)} - {formatTime(table.activeBooking.endTime)}</div>
                      {table.activeBooking.status && (
                        <Badge bg="" className="rounded-pill mt-1" style={{ background: "#fde68a", color: "#92400e", fontSize: "0.63rem" }}>
                          {bookingStatusLabel[table.activeBooking.status] || table.activeBooking.status}
                        </Badge>
                      )}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
}
