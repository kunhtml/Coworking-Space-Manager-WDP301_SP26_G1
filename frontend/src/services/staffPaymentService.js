import { apiClient as api } from "./api";

export const processCounterPayment = async (orderId, method) => {
  return api.post("/staff/payment/counter", {
    orderId,
    method,
  });
};
