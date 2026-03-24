import ConfirmModal from "./ConfirmModal";

export default function CheckinConfirmModal({
  show,
  booking,
  onClose,
  onConfirm,
  loading,
  fmtTime,
}) {
  return (
    <ConfirmModal
      show={show}
      onClose={onClose}
      onConfirm={onConfirm}
      loading={loading}
      title="Xac nhan Check-in"
      message="Xac nhan khach hang da den va check-in vao ban?"
      confirmText="Xac nhan"
      cancelText="Huy"
    >
      {booking && (
        <div className="rounded-3 p-3 mb-2" style={{ background: "#f8fafc", fontSize: "0.85rem" }}>
          <div className="d-flex justify-content-between mb-1"><span style={{ color: "#64748b" }}>Ma booking</span><strong>{booking.bookingCode}</strong></div>
          <div className="d-flex justify-content-between mb-1"><span style={{ color: "#64748b" }}>Khach hang</span><strong>{booking.customerName || "--"}</strong></div>
          <div className="d-flex justify-content-between mb-1"><span style={{ color: "#64748b" }}>Ban</span><strong>{booking.spaceName || "--"}</strong></div>
          <div className="d-flex justify-content-between"><span style={{ color: "#64748b" }}>Gio</span><strong>{fmtTime(booking.startTime)} - {fmtTime(booking.endTime)}</strong></div>
        </div>
      )}
    </ConfirmModal>
  );
}
