import { Alert, Button, Modal, Spinner } from "react-bootstrap";

export default function SeatStatusModal({
  show,
  onClose,
  selected,
  activeBooking,
  error,
  statuses,
  getCfg,
  newStatus,
  setNewStatus,
  onSave,
  updating,
  formatTime,
  bookingStatusLabel,
}) {
  return (
    <Modal show={show} onHide={onClose} centered size="sm">
      <Modal.Header closeButton className="border-0 pb-1">
        <Modal.Title className="fw-bold fs-6">Cap nhat - <span style={{ color: "#6366f1" }}>{selected?.name}</span></Modal.Title>
      </Modal.Header>
      <Modal.Body className="pt-1 pb-3 px-3">
        {activeBooking && (
          <div className="rounded-3 p-2 mb-3 small" style={{ background: "#fefce8", border: "1px solid #fde68a" }}>
            <div className="fw-bold mb-1" style={{ color: "#92400e" }}>Booking dang hoat dong</div>
            <div style={{ color: "#78350f" }}>
              <strong>{activeBooking.bookingCode}</strong> · {formatTime(activeBooking.startTime)} - {formatTime(activeBooking.endTime)}
            </div>
            <div style={{ color: "#78350f" }}>
              Trang thai: {bookingStatusLabel[activeBooking.status] || activeBooking.status}
            </div>
          </div>
        )}

        <p className="text-muted small mb-3">Chon trang thai moi:</p>
        {error && <Alert variant="danger" className="py-1 px-2 small mb-2">{error}</Alert>}

        <div className="d-flex flex-column gap-2">
          {statuses.map((s) => {
            const cfg = getCfg(s);
            const isActive = newStatus === s;
            return (
              <div
                key={s}
                onClick={() => setNewStatus(s)}
                className="rounded-3 px-3 py-2 d-flex align-items-center gap-3"
                style={{
                  background: isActive ? cfg.badgeBg : "#f8fafc",
                  border: `2px solid ${isActive ? cfg.borderColor : "#e2e8f0"}`,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  transform: isActive ? "scale(1.01)" : "scale(1)",
                }}
              >
                <span style={{ fontSize: 18 }}>{cfg.emoji}</span>
                <span className="fw-semibold" style={{ color: isActive ? cfg.badgeColor : "#475569", fontSize: "0.9rem" }}>
                  {cfg.label}
                </span>
                {isActive && <i className="bi bi-check-circle-fill ms-auto" style={{ color: cfg.badgeColor }} />}
              </div>
            );
          })}
        </div>
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0 px-3 pb-3">
        <Button variant="outline-secondary" className="fw-semibold rounded-3 flex-grow-1" onClick={onClose} disabled={updating}>
          Huy
        </Button>
        <Button
          className="fw-bold rounded-3 flex-grow-1"
          style={{ background: newStatus && newStatus !== selected?.status ? "#6366f1" : "#94a3b8", border: "none", color: "#fff" }}
          onClick={onSave}
          disabled={updating || newStatus === selected?.status}
        >
          {updating ? <><Spinner size="sm" className="me-1" /> Dang luu...</> : "Luu thay doi"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
