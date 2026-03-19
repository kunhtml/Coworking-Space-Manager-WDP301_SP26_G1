import { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Card, Col, Form, Row, Spinner } from "react-bootstrap";
import AdminLayout from "../../components/admin/AdminLayout";
import { getAllBookingsApi } from "../../services/bookingService";
import { staffCheckInBooking } from "../../services/staffDashboardService";

const statusLabelMap = {
  Pending: "Chờ thanh toán",
  Awaiting_Payment: "Chờ thanh toán",
  Confirmed: "Đã xác nhận",
  CheckedIn: "Đã check-in",
  Completed: "Đã hoàn thành",
  Cancelled: "Đã hủy",
};

const statusClassMap = {
  Pending: "bg-warning-subtle text-warning",
  Awaiting_Payment: "bg-warning-subtle text-warning",
  Confirmed: "bg-primary-subtle text-primary",
  CheckedIn: "bg-success-subtle text-success",
  Completed: "bg-info-subtle text-info",
  Cancelled: "bg-danger-subtle text-danger",
};

function formatTime(date) {
  if (!date) return "--";
  return new Date(date).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateTimeRange(start, end) {
  if (!start || !end) return "--";
  const s = new Date(start);
  const e = new Date(end);
  return `${s.toLocaleDateString("vi-VN")} ${formatTime(start)} - ${formatTime(end)}`;
}

export default function StaffCheckinPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [checkingId, setCheckingId] = useState("");

  const loadBookings = async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await getAllBookingsApi({ search });
      setBookings(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setError(err.message || "Không thể tải danh sách booking.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      loadBookings();
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  const filteredBookings = useMemo(() => {
    if (statusFilter === "all") return bookings;
    return bookings.filter((b) => b.status === statusFilter);
  }, [bookings, statusFilter]);

  const handleCheckIn = async (bookingId) => {
    setCheckingId(String(bookingId));
    setError("");
    try {
      await staffCheckInBooking(bookingId);
      await loadBookings();
    } catch (err) {
      setError(err.message || "Check-in thất bại.");
    } finally {
      setCheckingId("");
    }
  };

  return (
    <AdminLayout>
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Check-in / Check-out</h2>
        <p className="text-secondary fw-semibold small mb-0">
          Đồng bộ dữ liệu booking từ MongoDB
        </p>
      </div>

      <Row className="g-3 mb-3 align-items-center">
        <Col md={3} lg={3}>
          <Form.Select
            className="staff-filter-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="Pending">Chờ thanh toán</option>
            <option value="Awaiting_Payment">Chờ thanh toán (PayOS)</option>
            <option value="Confirmed">Đã xác nhận</option>
            <option value="CheckedIn">Đã check-in</option>
            <option value="Completed">Đã hoàn thành</option>
            <option value="Cancelled">Đã hủy</option>
          </Form.Select>
        </Col>
        <Col md={5} lg={4}>
          <div className="staff-search-wrap">
            <i className="bi bi-search"></i>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm mã booking, tên khách"
            />
          </div>
        </Col>
        <Col className="text-md-end">
          <Button className="staff-primary-btn" onClick={loadBookings}>
            <i className="bi bi-arrow-clockwise me-2"></i>
            Tải lại
          </Button>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : filteredBookings.length === 0 ? (
        <Alert variant="secondary">Không có booking phù hợp.</Alert>
      ) : (
        <Row className="g-3">
          {filteredBookings.map((booking) => {
            const statusClass = statusClassMap[booking.status] || "bg-secondary-subtle text-secondary";
            const statusLabel = statusLabelMap[booking.status] || booking.status || "Unknown";
            const canCheckIn = ["Confirmed", "Awaiting_Payment"].includes(booking.status);

            return (
              <Col lg={4} key={String(booking.id)}>
                <Card className="border-0 shadow-sm staff-booking-card staff-accent-primary">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="fw-bold mb-0">
                        {booking.bookingCode} · {booking.customerName || "Không xác định"}
                      </h5>
                      <small className="text-secondary fw-semibold">
                        {formatTime(booking.startTime)}
                      </small>
                    </div>

                    <Badge className={`rounded-pill border-0 px-3 py-2 mb-3 ${statusClass}`}>
                      {statusLabel}
                    </Badge>

                    <div className="staff-booking-info mb-3">
                      <div>
                        <span>Bàn</span>
                        <strong>{booking.spaceName || "Không xác định"}</strong>
                      </div>
                      <div>
                        <span>Thời gian</span>
                        <strong>{formatDateTimeRange(booking.startTime, booking.endTime)}</strong>
                      </div>
                      <div>
                        <span>Đặt cọc</span>
                        <strong>{new Intl.NumberFormat("vi-VN").format(Number(booking.depositAmount || 0))}đ</strong>
                      </div>
                      <div>
                        <span>Điện thoại</span>
                        <strong>{booking.customerPhone || "--"}</strong>
                      </div>
                    </div>

                    <div className="d-flex gap-2">
                      <Button
                        className="staff-primary-btn flex-grow-1"
                        disabled={!canCheckIn || checkingId === String(booking.id)}
                        onClick={() => handleCheckIn(booking.id)}
                      >
                        {checkingId === String(booking.id) ? "Đang check-in..." : "Check-in"}
                      </Button>
                      <Button
                        variant="outline-secondary"
                        className="flex-grow-1 fw-semibold rounded-3"
                        disabled
                      >
                        Chi tiết
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </AdminLayout>
  );
}
