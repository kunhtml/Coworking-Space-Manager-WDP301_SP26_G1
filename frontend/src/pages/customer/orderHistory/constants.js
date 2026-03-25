export const PAGE_SIZE = 5;

export const BOOKING_STATUS_MAP = {
  Pending: { label: "Chờ thanh toán", bg: "warning", textClass: "text-dark" },
  Confirmed: { label: "Đã xác nhận", bg: "success", textClass: "text-white" },
  Completed: {
    label: "Đã hoàn thành",
    bg: "secondary",
    textClass: "text-white",
  },
  Cancelled: { label: "Đã hủy", bg: "danger", textClass: "text-white" },
};

export const ORDER_STATUS_MAP = {
  PENDING: { label: "Chờ xử lý", bg: "warning", textClass: "text-dark" },
  CONFIRMED: { label: "Đã xác nhận", bg: "primary", textClass: "text-white" },
  PREPARING: { label: "Đang chuẩn bị", bg: "info", textClass: "text-dark" },
  SERVED: { label: "Đã phục vụ", bg: "success", textClass: "text-white" },
  COMPLETED: { label: "Hoàn tất", bg: "secondary", textClass: "text-white" },
  CANCELLED: { label: "Đã hủy", bg: "danger", textClass: "text-white" },
};

export const PAYMENT_STATUS_MAP = {
  PAID: { label: "Đã thanh toán", bg: "success", textClass: "text-white" },
  UNPAID: { label: "Chưa thanh toán", bg: "warning", textClass: "text-dark" },
  CANCELLED: { label: "Đã hủy", bg: "danger", textClass: "text-white" },
};
