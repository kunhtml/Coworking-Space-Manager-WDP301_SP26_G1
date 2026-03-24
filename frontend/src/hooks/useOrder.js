import { useCallback, useState } from "react";
import {
  createOrderApi,
  getMyOrders,
  updateOrderApi,
} from "../services/orderService";

export default function useOrder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = useCallback(async (fn) => {
    setLoading(true);
    setError("");
    try {
      return await fn();
    } catch (err) {
      setError(err.message || "Order request failed");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getOrders = useCallback(() => run(() => getMyOrders()), [run]);
  const createOrder = useCallback((payload) => run(() => createOrderApi(payload)), [run]);
  const updateOrder = useCallback((id, payload) => run(() => updateOrderApi(id, payload)), [run]);

  return {
    loading,
    error,
    getOrders,
    createOrder,
    updateOrder,
  };
}
