export default function ActionButtons({
  order,
  onEdit,
  onPay,
  onComplete,
  onViewInvoice,
  completing,
}) {
  const rawStatus = String(order?.status || "").trim().toUpperCase();
  const normalizedStatus = rawStatus === "CANCELED" ? "CANCELLED" : rawStatus;
  const canPayAtCounter = !["CANCELLED", "COMPLETED"].includes(normalizedStatus);

  return (
    <div className="d-flex gap-2">
      {canPayAtCounter ? (
        <button
          className="staff-icon-btn"
          type="button"
          title="Thanh toán tại quầy"
          onClick={() => onPay(order)}
          style={{
            background: "#ecfeff",
            color: "#0f766e",
            border: "1.5px solid #a5f3fc",
          }}
        >
          <i className="bi bi-cash-coin" />
        </button>
      ) : (
        <span
          className="rounded-pill px-2 py-1 fw-bold d-inline-flex align-items-center gap-1"
          style={{
            background: "#dcfce7",
            color: "#166534",
            fontSize: "0.72rem",
            whiteSpace: "nowrap",
          }}
          title="Đơn đã thanh toán"
        >
          <i className="bi bi-check-circle-fill" />
          Đã thanh toán
        </span>
      )}

      <button
        className="staff-icon-btn"
        type="button"
        title="Cập nhật đơn"
        onClick={() => onEdit(order)}
      >
        <i className="bi bi-pencil-square" />
      </button>

      {!["COMPLETED", "CANCELLED"].includes(normalizedStatus) && (
        <button
          className="staff-icon-btn"
          type="button"
          title="Xác nhận hoàn thành"
          disabled={completing === order.id}
          onClick={() => onComplete(order)}
          style={{
            background: "#dcfce7",
            color: "#15803d",
            border: "1.5px solid #bbf7d0",
          }}
        >
          {completing === order.id ? (
            <i className="bi bi-arrow-clockwise" style={{ animation: "spin 0.8s linear infinite" }} />
          ) : (
            <i className="bi bi-check-circle-fill" />
          )}
        </button>
      )}

      <button
        className="staff-icon-btn staff-icon-btn-success"
        type="button"
        title="Xem hóa đơn"
        onClick={() => onViewInvoice(order.id)}
      >
        <i className="bi bi-receipt" />
      </button>
    </div>
  );
}
