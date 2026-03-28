import { Button, Card, Col } from "react-bootstrap";
import StatusBadge from "./StatusBadge";

export default function BookingCard({
  booking,
  statusLabel,
  statusStyle,
  fmtDate,
  fmtTime,
  fmtCur,
  canCheckIn,
  isExpired,
  isChecking,
  onCheckin,
  onViewDetail,
}) {
  return (
    <Col lg={4} md={6} key={String(booking.id)}>
      <Card
        className="border-0 shadow-sm h-100"
        style={{
          borderRadius: 16,
          borderLeft: `4px solid ${isExpired ? "#ef4444" : statusStyle.color}`,
          transition: "box-shadow 0.2s",
          opacity: isExpired ? 0.75 : 1,
        }}
      >
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <div className="fw-bold fs-6" style={{ color: "#0f172a" }}>
                {booking.bookingCode}
              </div>
              <div
                className="fw-semibold"
                style={{ color: "#475569", fontSize: "0.88rem" }}
              >
                {booking.customerName || "Khong xac dinh"}
              </div>
            </div>
            <div className="d-flex flex-column align-items-end gap-1">
              <StatusBadge status={statusLabel} className="px-3 py-1" />
              {isExpired && (
                <span
                  className="rounded-pill px-2 py-1 fw-bold d-inline-flex align-items-center gap-1"
                  style={{
                    background: "#fee2e2",
                    color: "#b91c1c",
                    fontSize: "0.72rem",
                  }}
                >
                  <i className="bi bi-clock-history" /> Hết giờ
                </span>
              )}
            </div>
          </div>

          <div
            className="rounded-3 px-3 py-2 mb-3"
            style={{ background: "#f8fafc", fontSize: "0.84rem" }}
          >
            <div className="d-flex justify-content-between py-1 border-bottom">
              <span style={{ color: "#64748b" }}>Ban</span>
              <strong style={{ color: "#0f172a" }}>
                {booking.spaceName || "--"}
              </strong>
            </div>
            <div className="d-flex justify-content-between py-1 border-bottom">
              <span style={{ color: "#64748b" }}>Ngay</span>
              <strong style={{ color: "#0f172a" }}>
                {fmtDate(booking.startTime)}
              </strong>
            </div>
            <div className="d-flex justify-content-between py-1 border-bottom">
              <span style={{ color: "#64748b" }}>Gio</span>
              <strong style={{ color: "#0f172a" }}>
                {fmtTime(booking.startTime)} - {fmtTime(booking.endTime)}
              </strong>
            </div>
            <div className="d-flex justify-content-between py-1 border-bottom">
              <span style={{ color: "#64748b" }}>SDT</span>
              <strong style={{ color: "#0f172a" }}>
                {booking.customerPhone || "--"}
              </strong>
            </div>
            {booking.checkedInByName && (
              <div className="d-flex justify-content-between py-1 border-bottom">
                <span style={{ color: "#64748b" }}>Staff check-in</span>
                <strong style={{ color: "#0f172a" }}>
                  {booking.checkedInByName}
                </strong>
              </div>
            )}
            {booking.checkedInAt && (
              <div className="d-flex justify-content-between py-1 border-bottom">
                <span style={{ color: "#64748b" }}>Luc check-in</span>
                <strong style={{ color: "#0f172a" }}>
                  {fmtTime(booking.checkedInAt)} {fmtDate(booking.checkedInAt)}
                </strong>
              </div>
            )}
            <div className="d-flex justify-content-between py-1">
              <span style={{ color: "#64748b" }}>Dat coc</span>
              <strong style={{ color: "#15803d" }}>
                {fmtCur(booking.depositAmount)}
              </strong>
            </div>
          </div>

          <div className="d-flex gap-2">
            <Button
              className="fw-bold rounded-3 flex-grow-1"
              style={{
                background: canCheckIn ? "#6366f1" : "#e2e8f0",
                border: "none",
                color: canCheckIn ? "#fff" : "#94a3b8",
                fontSize: "0.88rem",
              }}
              disabled={!canCheckIn || isChecking}
              onClick={() => onCheckin(booking)}
            >
              {isChecking
                ? "Dang xu ly..."
                : isExpired
                  ? "Hết giờ"
                  : "Check-in"}
            </Button>
            <Button
              variant="outline-secondary"
              className="fw-semibold rounded-3 flex-grow-1"
              style={{ fontSize: "0.88rem" }}
              onClick={() => onViewDetail(booking)}
            >
              Chi tiet
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Col>
  );
}
