export const ORDER_STATUS = Object.freeze({
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  PREPARING: "PREPARING",
  SERVED: "SERVED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
});

export const ORDER_FLOW = Object.freeze({
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PREPARING],
  [ORDER_STATUS.PREPARING]: [ORDER_STATUS.SERVED],
  [ORDER_STATUS.SERVED]: [ORDER_STATUS.COMPLETED],
  [ORDER_STATUS.COMPLETED]: [],
  [ORDER_STATUS.CANCELLED]: [],
});

export const PAYMENT_METHOD = Object.freeze({
  CASH: "CASH",
  QR_PAYOS: "QR_PAYOS",
});

export const PAYMENT_METHOD_VALUES = Object.values(PAYMENT_METHOD);

export const MENU_AVAILABILITY = Object.freeze({
  AVAILABLE: "AVAILABLE",
  OUT_OF_STOCK: "OUT_OF_STOCK",
});

export const MENU_AVAILABILITY_VALUES = Object.values(MENU_AVAILABILITY);

export function normalizeOrderStatus(rawStatus) {
  const status = String(rawStatus || "").trim().toUpperCase();
  if (!status) return ORDER_STATUS.PENDING;

  if (status === "NEW") return ORDER_STATUS.PENDING;
  if (status === "PAID") return ORDER_STATUS.COMPLETED;
  if (status === "CANCELED") return ORDER_STATUS.CANCELLED;
  if (status === "CANCELLED") return ORDER_STATUS.CANCELLED;

  if (ORDER_FLOW[status]) return status;
  return ORDER_STATUS.PENDING;
}

export function canTransitionOrderStatus(fromStatus, toStatus) {
  const from = normalizeOrderStatus(fromStatus);
  const to = normalizeOrderStatus(toStatus);
  if (from === to) return true;
  return ORDER_FLOW[from]?.includes(to) || false;
}

export function normalizePaymentMethod(rawMethod) {
  const method = String(rawMethod || "").trim().toUpperCase();
  if (!method) return PAYMENT_METHOD.CASH;
  if (method === "QR") return PAYMENT_METHOD.QR_PAYOS;
  if (method === "PAYOS") return PAYMENT_METHOD.QR_PAYOS;
  return method;
}

export function normalizeMenuAvailability(rawStatus, stockQuantity = 0) {
  const status = String(rawStatus || "").trim().toUpperCase();
  const qty = Number(stockQuantity || 0);

  if (status === MENU_AVAILABILITY.OUT_OF_STOCK) {
    return MENU_AVAILABILITY.OUT_OF_STOCK;
  }

  if (status === "IN_STOCK" || status === "AVAILABLE") {
    return qty > 0
      ? MENU_AVAILABILITY.AVAILABLE
      : MENU_AVAILABILITY.OUT_OF_STOCK;
  }

  return qty > 0
    ? MENU_AVAILABILITY.AVAILABLE
    : MENU_AVAILABILITY.OUT_OF_STOCK;
}