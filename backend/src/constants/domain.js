<<<<<<< HEAD
=======
// Các trạng thái chuẩn của một đơn hàng trong hệ thống
>>>>>>> main
export const ORDER_STATUS = Object.freeze({
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  PREPARING: "PREPARING",
  SERVED: "SERVED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
});

<<<<<<< HEAD
=======
// Luồng chuyển trạng thái hợp lệ của đơn hàng
// Ví dụ: PENDING -> CONFIRMED hoặc CANCELLED
>>>>>>> main
export const ORDER_FLOW = Object.freeze({
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PREPARING],
  [ORDER_STATUS.PREPARING]: [ORDER_STATUS.SERVED],
  [ORDER_STATUS.SERVED]: [ORDER_STATUS.COMPLETED],
  [ORDER_STATUS.COMPLETED]: [],
  [ORDER_STATUS.CANCELLED]: [],
});

<<<<<<< HEAD
=======
// Các phương thức thanh toán được chấp nhận
>>>>>>> main
export const PAYMENT_METHOD = Object.freeze({
  CASH: "CASH",
  QR_PAYOS: "QR_PAYOS",
});

<<<<<<< HEAD
export const PAYMENT_METHOD_VALUES = Object.values(PAYMENT_METHOD);

=======
// Mảng giá trị phương thức thanh toán để validate/input check
export const PAYMENT_METHOD_VALUES = Object.values(PAYMENT_METHOD);

// Trạng thái còn hàng của món
>>>>>>> main
export const MENU_AVAILABILITY = Object.freeze({
  AVAILABLE: "AVAILABLE",
  OUT_OF_STOCK: "OUT_OF_STOCK",
});

<<<<<<< HEAD
export const MENU_AVAILABILITY_VALUES = Object.values(MENU_AVAILABILITY);

export function normalizeOrderStatus(rawStatus) {
  const status = String(rawStatus || "").trim().toUpperCase();
=======
// Mảng giá trị trạng thái món để validate/input check
export const MENU_AVAILABILITY_VALUES = Object.values(MENU_AVAILABILITY);

// Chuẩn hóa trạng thái đơn hàng đầu vào về chuẩn nội bộ
// Hỗ trợ map các giá trị cũ/đồng nghĩa như NEW, PAID, CANCELED
export function normalizeOrderStatus(rawStatus) {
  const status = String(rawStatus || "")
    .trim()
    .toUpperCase();
>>>>>>> main
  if (!status) return ORDER_STATUS.PENDING;

  if (status === "NEW") return ORDER_STATUS.PENDING;
  if (status === "PAID") return ORDER_STATUS.COMPLETED;
  if (status === "CANCELED") return ORDER_STATUS.CANCELLED;
  if (status === "CANCELLED") return ORDER_STATUS.CANCELLED;

  if (ORDER_FLOW[status]) return status;
  return ORDER_STATUS.PENDING;
}

<<<<<<< HEAD
=======
// Kiểm tra có được phép chuyển từ trạng thái hiện tại sang trạng thái mới hay không
>>>>>>> main
export function canTransitionOrderStatus(fromStatus, toStatus) {
  const from = normalizeOrderStatus(fromStatus);
  const to = normalizeOrderStatus(toStatus);
  if (from === to) return true;
  return ORDER_FLOW[from]?.includes(to) || false;
}

<<<<<<< HEAD
export function normalizePaymentMethod(rawMethod) {
  const method = String(rawMethod || "").trim().toUpperCase();
=======
// Chuẩn hóa phương thức thanh toán đầu vào
// QR/PAYOS sẽ được quy về QR_PAYOS
export function normalizePaymentMethod(rawMethod) {
  const method = String(rawMethod || "")
    .trim()
    .toUpperCase();
>>>>>>> main
  if (!method) return PAYMENT_METHOD.CASH;
  if (method === "QR") return PAYMENT_METHOD.QR_PAYOS;
  if (method === "PAYOS") return PAYMENT_METHOD.QR_PAYOS;
  return method;
}

<<<<<<< HEAD
export function normalizeMenuAvailability(rawStatus, stockQuantity = 0) {
  const status = String(rawStatus || "").trim().toUpperCase();
=======
// Chuẩn hóa trạng thái còn hàng dựa trên rawStatus và số lượng tồn kho
// Nếu qty <= 0 thì luôn OUT_OF_STOCK, ngược lại AVAILABLE
export function normalizeMenuAvailability(rawStatus, stockQuantity = 0) {
  const status = String(rawStatus || "")
    .trim()
    .toUpperCase();
>>>>>>> main
  const qty = Number(stockQuantity || 0);

  if (status === MENU_AVAILABILITY.OUT_OF_STOCK) {
    return MENU_AVAILABILITY.OUT_OF_STOCK;
  }

  if (status === "IN_STOCK" || status === "AVAILABLE") {
    return qty > 0
      ? MENU_AVAILABILITY.AVAILABLE
      : MENU_AVAILABILITY.OUT_OF_STOCK;
  }

<<<<<<< HEAD
  return qty > 0
    ? MENU_AVAILABILITY.AVAILABLE
    : MENU_AVAILABILITY.OUT_OF_STOCK;
}
=======
  return qty > 0 ? MENU_AVAILABILITY.AVAILABLE : MENU_AVAILABILITY.OUT_OF_STOCK;
}
>>>>>>> main
