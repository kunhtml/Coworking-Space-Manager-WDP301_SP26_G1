import { Button, Modal } from "react-bootstrap";

export default function BookingDetailModal({
  show,
  booking,
  onClose,
  onCheckinNow,
  statusStyle,
  statusLabel,
  fmtDate,
  fmtTime,
  fmtCur,
}) {
  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton className="border-0">
        <Modal.Title className="fw-bold fs-6">Chi tiet Booking</Modal.Title>
      </Modal.Header>
      <Modal.Body className="px-4 pb-2">
        {booking && (
          <>
            <div className="mb-4 text-center">
              {(() => {
                const st = statusStyle[booking.status] || { bg: "#f1f5f9", color: "#475569" };
                return (
                  <span className="rounded-pill px-4 py-2 fw-bold d-inline-flex align-items-center gap-2" style={{ background: st.bg, color: st.color, fontSize: "0.9rem" }}>
                    {statusLabel[booking.status] || booking.status}
                  </span>
                );
              })()}
            </div>

            <div className="rounded-3 p-3" style={{ background: "#f8fafc", fontSize: "0.87rem" }}>
              {[
                ["Ma booking", booking.bookingCode],
                ["Khach hang", booking.customerName || "Khong xac dinh"],
                ["Dien thoai", booking.customerPhone || "--"],
                ["Ban", booking.spaceName || "--"],
                ["Ngay", fmtDate(booking.startTime)],
                ["Gio bat dau", fmtTime(booking.startTime)],
                ["Gio ket thuc", fmtTime(booking.endTime)],
                ["Dat coc", fmtCur(booking.depositAmount)],
                ["Staff check-in", booking.checkedInByName || "--"],
                [
                  "Luc check-in",
                  booking.checkedInAt
                    ? `${fmtTime(booking.checkedInAt)} ${fmtDate(booking.checkedInAt)}`
                    : "--",
                ],
              ].map(([label, value]) => (
                <div key={label} className="d-flex justify-content-between py-2 border-bottom">
                  <span style={{ color: "#64748b" }}>{label}</span>
                  <strong style={{ color: "#0f172a" }}>{value}</strong>
                </div>
              ))}
            </div>
          </>
        )}
      </Modal.Body>
      <Modal.Footer className="border-0 px-4 pb-4">
        {booking && ["Confirmed", "Awaiting_Payment"].includes(booking.status) && (
          <Button className="fw-bold rounded-3 flex-grow-1" style={{ background: "#6366f1", border: "none" }} onClick={onCheckinNow}>
            Check-in ngay
          </Button>
        )}
        <Button variant="outline-secondary" className="fw-semibold rounded-3 flex-grow-1" onClick={onClose}>
          Dong
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
