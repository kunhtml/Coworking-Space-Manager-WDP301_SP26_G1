import { useCallback, useState } from "react";
import {
  createBookingApi,
  getBookings,
  updateBookingApi,
} from "../services/bookingService";

export default function useBooking() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = useCallback(async (fn) => {
    setLoading(true);
    setError("");
    try {
      return await fn();
    } catch (err) {
      setError(err.message || "Booking request failed");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getMyBookings = useCallback(() => run(() => getBookings()), [run]);
  const createBooking = useCallback((payload) => run(() => createBookingApi(payload)), [run]);
  const updateBooking = useCallback((id, payload) => run(() => updateBookingApi(id, payload)), [run]);

  return {
    loading,
    error,
    getMyBookings,
    createBooking,
    updateBooking,
  };
}
