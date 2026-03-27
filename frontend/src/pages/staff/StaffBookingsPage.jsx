import { useEffect, useState } from "react";
import {
  Alert,
  Card,
  Col,
  Form,
  Row,
  Spinner,
  Table,
  Pagination,
  Badge,
} from "react-bootstrap";
import AdminLayout from "../../components/admin/AdminLayout";
import { getAllBookingsApi } from "../../services/bookingService";

const STATUS_MAP = {
  Pending: { label: "Chờ thanh toán", bg: "warning", textClass: "text-dark" },
  Awaiting_Payment: {
    label: "Chờ thanh toán",
    bg: "warning",
    textClass: "text-dark",
  },
  Confirmed: { label: "Đã xác nhận", bg: "success", textClass: "text-white" },
  CheckedIn: { label: "Đang sử dụng", bg: "primary", textClass: "text-white" },
  Completed: {
    label: "Đã hoàn thành",
    bg: "secondary",
    textClass: "text-white",
  },
  Cancelled: { label: "Đã hủy", bg: "danger", textClass: "text-white" },
};

function formatDateTime(d) {
  if (!d) return "--";
  return new Date(d).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function fmtMoney(v) {
  return new Intl.NumberFormat("vi-VN").format(Number(v || 0)) + "đ";
}

export default function StaffBookingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookings, setBookings] = useState([]);

  // Filters
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const qs = { date: dateFilter, search };
      const data = await getAllBookingsApi(qs);
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Lỗi tải danh sách booking.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(loadData, 300);
    return () => clearTimeout(t);
  }, [search, dateFilter]);

  // Client-side status filter + default sort by schedule time (newest first)
  const filteredBookings = bookings
    .filter((b) => {
      if (statusFilter === "all") return true;
      const s = String(b.status || "Pending");
      if (statusFilter === "Pending" && s === "Awaiting_Payment") return true;
      return s === statusFilter;
    })
    .sort((a, b) => {
      const aStart = new Date(a.startTime || 0).getTime();
      const bStart = new Date(b.startTime || 0).getTime();
      if (bStart !== aStart) return bStart - aStart;

      const aEnd = new Date(a.endTime || 0).getTime();
      const bEnd = new Date(b.endTime || 0).getTime();
      return bEnd - aEnd;
    });

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const displayBookings = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, dateFilter, statusFilter]);

  return (
    <AdminLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1 text-dark">Danh sách Booking</h3>
          <p className="text-secondary mb-0">
            Quản lý và tra cứu thông tin đặt bàn của khách
          </p>
        </div>
      </div>

      <Card className="border-0 shadow-sm mb-4 rounded-4 staff-panel-card">
        <Card.Body className="p-4">
          <Row className="g-3 align-items-center mb-4">
            <Col md={4}>
              <div className="staff-search-wrap border rounded-3 px-3 py-2 d-flex align-items-center bg-light">
                <i className="bi bi-search text-muted me-2" />
                <input
                  className="border-0 bg-transparent flex-grow-1 outline-none"
                  style={{ outline: "none" }}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm theo mã booking, tên khách, SĐT, tên bàn..."
                />
              </div>
            </Col>
            <Col md={3}>
              <Form.Control
                type="date"
                className="rounded-3"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </Col>
            <Col md={3}>
              <Form.Select
                className="rounded-3"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="Pending">Chờ thanh toán</option>
                <option value="Confirmed">Đã xác nhận</option>
                <option value="CheckedIn">Đang sử dụng</option>
                <option value="Completed">Đã hoàn thành</option>
                <option value="Cancelled">Đã hủy</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <button
                className="btn btn-outline-secondary w-100 rounded-3"
                onClick={loadData}
                disabled={loading}
              >
                <i className="bi bi-arrow-clockwise me-1"></i> Làm mới
              </button>
            </Col>
          </Row>

          {error && <Alert variant="danger">{error}</Alert>}

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 fw-semibold text-muted">Đang tải dữ liệu...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-inbox fs-1 mb-2"></i>
              <p className="fw-medium">Không tìm thấy booking nào phù hợp</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle border text-nowrap">
                <thead className="table-light text-secondary">
                  <tr>
                    <th>MÃ BOOKING</th>
                    <th>KHÁCH HÀNG</th>
                    <th>BÀN</th>
                    <th>THỜI GIAN THEO LỊCH</th>
                    <th>TRỊ GIÁ</th>
                    <th>TRẠNG THÁI</th>
                  </tr>
                </thead>
                <tbody>
                  {displayBookings.map((b) => {
                    const statusObj = STATUS_MAP[b.status] || {
                      label: b.status,
                      bg: "secondary",
                      textClass: "text-white",
                    };
                    return (
                      <tr key={b.id}>
                        <td className="fw-semibold text-primary">
                          {b.bookingCode}
                        </td>
                        <td>
                          <div className="fw-semibold text-dark">
                            {b.customerName}
                          </div>
                          {b.customerPhone && (
                            <small className="text-muted">
                              {b.customerPhone}
                            </small>
                          )}
                        </td>
                        <td className="fw-semibold">{b.spaceName}</td>
                        <td>
                          <div className="small">
                            {formatDateTime(b.startTime)} <br />
                            <i className="bi bi-arrow-return-right text-muted mx-1"></i>
                            {formatDateTime(b.endTime)}
                          </div>
                        </td>
                        <td className="fw-semibold text-dark">
                          {fmtMoney(b.depositAmount)}
                        </td>
                        <td>
                          <Badge
                            bg={statusObj.bg}
                            className={`px-2 py-1 rounded-pill ${statusObj.textClass}`}
                          >
                            {statusObj.label}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}

          {!loading && totalPages > 1 && (
            <div className="d-flex justify-content-center mt-3">
              <Pagination>
                <Pagination.Prev
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((c) => c - 1)}
                />
                {[...Array(totalPages)].map((_, i) => (
                  <Pagination.Item
                    key={i + 1}
                    active={i + 1 === currentPage}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </Pagination.Item>
                ))}
                <Pagination.Next
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((c) => c + 1)}
                />
              </Pagination>
            </div>
          )}
        </Card.Body>
      </Card>
    </AdminLayout>
  );
}
