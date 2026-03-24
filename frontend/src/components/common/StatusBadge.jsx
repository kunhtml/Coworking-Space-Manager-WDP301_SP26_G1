const STATUS_UI = {
  PENDING: { label: "Chờ xử lý", bg: "#fef9c3", color: "#92400e", icon: "bi-hourglass-split" },
  CONFIRMED: { label: "Đã xác nhận", bg: "#dbeafe", color: "#1d4ed8", icon: "bi-check-circle" },
  PREPARING: { label: "Đang chuẩn bị", bg: "#e0f2fe", color: "#0369a1", icon: "bi-fire" },
  SERVED: { label: "Đã phục vụ", bg: "#dcfce7", color: "#166534", icon: "bi-cup-hot" },
  COMPLETED: { label: "Hoàn tất", bg: "#bbf7d0", color: "#166534", icon: "bi-trophy" },
  CANCELLED: { label: "Đã hủy", bg: "#fee2e2", color: "#b91c1c", icon: "bi-x-circle" },
};

export default function StatusBadge({ status, className = "" }) {
  const stUi = STATUS_UI[status] || {
    label: status || "Unknown",
    bg: "#f1f5f9",
    color: "#475569",
    icon: "bi-question",
  };

  return (
    <span
      className={`rounded-pill px-3 py-1 fw-bold d-inline-flex align-items-center gap-1 ${className}`.trim()}
      style={{ background: stUi.bg, color: stUi.color, fontSize: "0.76rem", whiteSpace: "nowrap" }}
    >
      <i className={`bi ${stUi.icon}`} />
      {stUi.label}
    </span>
  );
}
