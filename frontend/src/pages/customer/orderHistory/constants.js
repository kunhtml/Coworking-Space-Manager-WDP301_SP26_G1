export const PAGE_SIZE = 5;

export const BOOKING_STATUS_MAP = {
  Pending: { label: "Chờ thanh toán", bg: "warning", textClass: "text-dark" },
  Awaiting_Payment: { label: "Chờ thanh toán", bg: "warning", textClass: "text-dark" },
  Confirmed: { label: "Đã xác nhận", bg: "success", textClass: "text-white" },
  Completed: { label: "Đã hoàn thành", bg: "secondary", textClass: "text-white" },
  Cancelled: { label: "Đã hủy", bg: "danger", textClass: "text-white" },
};

export const ORDER_STATUS_MAP = {
  Pending: { label: "Chờ xác nhận", bg: "warning", textClass: "text-dark" },
  Confirmed: { label: "Đã xác nhận", bg: "success", textClass: "text-white" },
  Cancelled: { label: "Đã hủy", bg: "danger", textClass: "text-white" },
};
