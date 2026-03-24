import { Button, Form, Modal, Spinner } from "react-bootstrap";

export default function PaymentModal({
  show,
  onClose,
  onConfirm,
  order,
  method,
  setMethod,
  loading,
  fmtCur,
}) {
  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton className="border-0">
        <Modal.Title className="fw-bold">Thanh toán tại quầy</Modal.Title>
      </Modal.Header>
      <Modal.Body className="px-4 pb-2">
        {order && (
          <div className="rounded-3 p-3 mb-3" style={{ background: "#f8fafc", fontSize: "0.85rem" }}>
            <div><span style={{ color: "#64748b" }}>Mã đơn: </span><strong>{order.orderCode}</strong></div>
            <div><span style={{ color: "#64748b" }}>Khách: </span><strong>{order.customerName || "Khách lẻ"}</strong></div>
            <div><span style={{ color: "#64748b" }}>Tổng tiền: </span><strong style={{ color: "#15803d" }}>{fmtCur(order.totalAmount)}</strong></div>
          </div>
        )}

        <Form.Label className="fw-bold mb-2">Phương thức thanh toán</Form.Label>
        <div className="d-flex gap-2 mb-2">
          {[
            { key: "CASH", label: "CASH", icon: "bi-cash-coin" },
            { key: "QR_PAYOS", label: "QR_PAYOS", icon: "bi-qr-code" },
          ].map((opt) => {
            const active = method === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setMethod(opt.key)}
                className="rounded-3 px-3 py-2 d-flex align-items-center gap-2"
                style={{
                  background: active ? "#ecfeff" : "#f8fafc",
                  border: `2px solid ${active ? "#0891b2" : "#e2e8f0"}`,
                  color: active ? "#0e7490" : "#475569",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                }}
                disabled={loading}
              >
                <i className={`bi ${opt.icon}`} />
                {opt.label}
              </button>
            );
          })}
        </div>
      </Modal.Body>
      <Modal.Footer className="border-0 px-4 pb-4">
        <Button
          variant="outline-secondary"
          className="fw-semibold rounded-3"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          className="fw-bold rounded-3"
          style={{ background: "#0ea5e9", border: "none" }}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? <><Spinner size="sm" className="me-1" />Đang xử lý...</> : "Confirm"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
