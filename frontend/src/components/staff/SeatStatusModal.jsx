import { Alert, Button, Modal, Spinner } from "react-bootstrap";

export default function SeatStatusModal({
  show,
  onClose,
  selected,
  activeBooking,
  upcomingBookings = [],
  error,
  statuses,
  getCfg,
  newStatus,
  setNewStatus,
  onSave,
  updating,
  formatTime,
  bookingStatusLabel,
  onGoToPOS,
}) {
  return (
    <Modal show={show} onHide={onClose} centered size="md">
      <Modal.Header closeButton className="border-0 pb-1">
        <Modal.Title className="fw-bold fs-5">
          Thông tin bàn - <span style={{ color: "#6366f1" }}>{selected?.name}</span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="pt-1 pb-3 px-3">
        {/* Table Details */}
        <div className="mb-3 d-flex flex-wrap gap-2 text-muted fw-semibold small">
          <span>{selected?.tableType || "Bàn"}</span>
          {selected?.capacity && <span>• {selected.capacity} chỗ</span>}
          {selected?.pricePerHour > 0 && <span>• {Number(selected.pricePerHour).toLocaleString("vi-VN")}đ/h</span>}
        </div>

        {/* Active Booking */}
        {activeBooking && (
          <div className="rounded-3 p-3 mb-3" style={{ background: "#fefce8", border: "1px solid #fde68a" }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="fw-bold fs-6" style={{ color: "#92400e" }}>
                Khách đang sử dụng
              </div>
              <span className="badge rounded-pill" style={{ background: "#f59e0b", color: "#fff" }}>
                {bookingStatusLabel[activeBooking.status] || activeBooking.status}
              </span>
            </div>
            <div className="text-dark fw-semibold mb-1">
              <i className="bi bi-person-circle me-2" style={{ color: "#d97706" }} />
              {activeBooking.customerName || "Khách lẻ"}
              {activeBooking.customerPhone && <span className="ms-2 fw-normal text-muted">({activeBooking.customerPhone})</span>}
            </div>
            <div style={{ color: "#78350f", fontSize: "0.85rem" }}>
              <i className="bi bi-clock-history me-2" />
              {formatTime(activeBooking.startTime)} - {formatTime(activeBooking.endTime)}
            </div>
          </div>
        )}

        {/* Upcoming Bookings */}
        {upcomingBookings && upcomingBookings.length > 0 ? (
          <div className="rounded-3 p-3 mb-4" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <div className="fw-bold fs-6 mb-2" style={{ color: "#166534" }}>Lịch đặt sắp tới</div>
            <div className="d-flex flex-column gap-2">
              {upcomingBookings.slice(0, 3).map((b, idx) => (
                <div key={idx} className="d-flex justify-content-between align-items-center bg-white px-2 py-1 rounded shadow-sm" style={{ borderLeft: "3px solid #22c55e" }}>
                  <div style={{ color: "#166534", fontSize: "0.85rem", fontWeight: 600 }}>
                    {formatTime(b.startTime)} - {formatTime(b.endTime)}
                  </div>
                  <div className="text-muted" style={{ fontSize: "0.75rem" }}>{b.customerName || "Khách"}</div>
                </div>
              ))}
              {upcomingBookings.length > 3 && (
                <div className="text-center text-muted small mt-1">+ {upcomingBookings.length - 3} lịch khác</div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-3 p-3 mb-4 text-center" style={{ background: "#f8fafc", border: "1px dashed #cbd5e1" }}>
            <i className="bi bi-calendar-check fs-4 text-success mb-1" />
            <div className="fw-bold text-success" style={{ fontSize: "0.9rem" }}>Hiện giờ có lịch trống</div>
            <div className="text-muted" style={{ fontSize: "0.75rem" }}>Chưa có booking nào sắp tới.</div>
          </div>
        )}

        {/* Update Status Selection */}
        <p className="fw-bold text-secondary small mb-2 text-uppercase">Cập nhật trạng thái</p>
        {error && <Alert variant="danger" className="py-1 px-2 small mb-2">{error}</Alert>}

        <div className="d-flex flex-wrap gap-2">
          {statuses.map((s) => {
            const cfg = getCfg(s);
            const isActive = newStatus === s;
            return (
              <div
                key={s}
                onClick={() => setNewStatus(s)}
                className="rounded-3 px-3 py-2 d-flex align-items-center gap-2"
                style={{
                  background: isActive ? cfg.badgeBg : "#f8fafc",
                  border: `2px solid ${isActive ? cfg.borderColor : "#e2e8f0"}`,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  flex: "1 1 calc(50% - 0.5rem)",
                }}
              >
                <span style={{ fontSize: "1.1rem" }}>{cfg.emoji}</span>
                <span className="fw-bold" style={{ color: isActive ? cfg.badgeColor : "#64748b", fontSize: "0.85rem" }}>
                  {cfg.label}
                </span>
              </div>
            );
          })}
        </div>
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0 px-3 pb-3 d-flex flex-wrap">
        <Button variant="outline-secondary" className="fw-semibold rounded-3 flex-grow-1" onClick={onClose} disabled={updating}>
          Đóng
        </Button>
        <Button
          className="fw-bold rounded-3 flex-grow-1"
          style={{ background: "#10b981", border: "none" }}
          onClick={onSave}
          disabled={updating || newStatus === selected?.status}
        >
          {updating ? <><Spinner size="sm" className="me-1" /> Đang lưu...</> : "Lưu trạng thái"}
        </Button>
        {onGoToPOS && (
          <Button
            className="fw-bold rounded-3 w-100 mt-2 d-flex justify-content-center align-items-center gap-2"
            style={{ background: "#6366f1", border: "none" }}
            onClick={onGoToPOS}
          >
            <i className="bi bi-calculator" /> Chuyển đến màn hình POS
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}
