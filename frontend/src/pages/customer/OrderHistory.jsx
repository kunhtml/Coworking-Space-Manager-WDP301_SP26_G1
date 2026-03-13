import { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Navbar,
  Table,
  Spinner,
  Alert,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { getBookings } from "../../services/bookingService";

export function meta() {
  return [
    { title: "Quản lý đặt chỗ | Nexus Coworking" },
    {
      name: "description",
      content: "Quản lý các đặt chỗ của bạn tại Nexus Coworking.",
    },
  ];
}

const fmt = (n) => new Intl.NumberFormat("vi-VN").format(n);

function formatDate(iso) {
  if (!iso) return "--";
  return new Date(iso).toLocaleDateString("vi-VN");
}

function formatTime(iso) {
  if (!iso) return "--";
  return new Date(iso).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function calcDuration(start, end) {
  if (!start || !end) return "";
  const diff = (new Date(end) - new Date(start)) / (1000 * 60 * 60);
  if (diff < 1) return `${Math.round(diff * 60)} phút`;
  return `${diff % 1 === 0 ? diff : diff.toFixed(1)} giờ`;
}

const STATUS_MAP = {
  Pending: {
    label: "Chờ thanh toán",
    bg: "warning",
    textClass: "text-dark",
    icon: "bi-clock-history",
  },
  Awaiting_Payment: {
    label: "Chờ thanh toán",
    bg: "warning",
    textClass: "text-dark",
    icon: "bi-qr-code",
  },
  Confirmed: {
    label: "Đã xác nhận",
    bg: "success",
    textClass: "text-white",
    icon: "bi-check-circle",
  },
  Completed: {
    label: "Đã hoàn thành",
    bg: "secondary",
    textClass: "text-white",
    icon: "bi-check2-all",
  },
  Cancelled: {
    label: "Đã hủy",
    bg: "danger",
    textClass: "text-white",
    icon: "bi-x-circle",
  },
};

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || {
    label: status,
    bg: "secondary",
    textClass: "text-white",
    icon: "bi-dash",
  };
  return (
    <Badge
      bg={s.bg}
      className={`px-3 py-2 rounded-pill fw-medium ${s.textClass}`}
    >
      <i className={`bi ${s.icon} me-1`}></i>
      {s.label}
    </Badge>
  );
}

export default function Dashboard() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    getBookings()
      .then(setBookings)
      .catch((err) =>
        setError(err.message || "Không thể tải danh sách đặt chỗ."),
      )
      .finally(() => setLoading(false));
  }, [isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const total = bookings.length;
  const pendingCount = bookings.filter((b) =>
    ["Pending", "Awaiting_Payment"].includes(b.status),
  ).length;
  const completedCount = bookings.filter(
    (b) => b.status === "Completed",
  ).length;

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar expand="lg" className="bg-white shadow-sm sticky-top py-3">
        <Container>
          <Navbar.Brand as={Link} to="/" className="fw-bold text-primary fs-4">
            <i className="bi bi-building me-2"></i>Nexus Coworking
          </Navbar.Brand>
          <Navbar.Toggle
            aria-controls="basic-navbar-nav"
            className="border-0 shadow-none"
          />
          <Navbar.Collapse id="basic-navbar-nav">
            <div className="ms-auto d-flex flex-column flex-lg-row gap-3 align-items-lg-center mt-3 mt-lg-0">
              <Link
                to="/order-table"
                className="text-decoration-none text-dark fw-medium px-2 py-1 hover-primary transition-all"
              >
                Không gian
              </Link>
              <Link
                to="/dashboard"
                className="text-decoration-none text-primary fw-bold px-2 py-1 rounded bg-primary bg-opacity-10"
              >
                Quản lý đặt chỗ
              </Link>
              <div className="d-flex gap-2 ms-lg-3 mt-2 mt-lg-0 align-items-center">
                <Link
                  to="/profile"
                  className="d-flex align-items-center gap-2 px-3 py-2 rounded-pill border border-secondary-subtle text-decoration-none"
                  style={{ background: "#f8f9fa" }}
                >
                  <div
                    className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
                    style={{
                      width: 30,
                      height: 30,
                      fontSize: 13,
                      flexShrink: 0,
                    }}
                  >
                    {(user?.fullName || user?.email || "?")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <span
                    className="fw-medium text-dark"
                    style={{ fontSize: 14 }}
                  >
                    {user?.fullName || user?.email || "Khách"}
                  </span>
                </Link>
                <Button
                  variant="outline-danger"
                  className="px-4 rounded-pill fw-medium"
                  onClick={handleLogout}
                >
                  Đăng xuất
                </Button>
              </div>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <main className="flex-grow-1 bg-light py-5">
        <Container>
          <Row className="mb-4 align-items-center">
            <Col>
              <h2 className="fw-bold mb-1 text-dark">Quản lý đặt chỗ</h2>
              <p className="text-muted mb-0">
                Xin chào,{" "}
                <span className="fw-medium text-dark">
                  {user?.fullName || user?.email || "Khách"}
                </span>
              </p>
            </Col>
            <Col xs="auto" className="mt-3 mt-md-0">
              <Button
                as={Link}
                to="/order-table"
                variant="primary"
                className="rounded-pill px-4 fw-medium shadow-sm"
              >
                <i className="bi bi-plus-lg me-1"></i> Đặt chỗ mới
              </Button>
            </Col>
          </Row>

          {/* Summary cards */}
          <Row className="g-4 mb-4">
            <Col md={4}>
              <Card className="border-0 shadow-sm rounded-4 h-100">
                <Card.Body className="p-4 d-flex align-items-center">
                  <div
                    className="bg-primary bg-opacity-10 text-primary rounded-circle p-3 me-3 d-flex align-items-center justify-content-center"
                    style={{ width: 60, height: 60 }}
                  >
                    <i className="bi bi-calendar-check fs-3"></i>
                  </div>
                  <div>
                    <h6 className="text-muted mb-1">Tổng số đặt chỗ</h6>
                    <h3 className="fw-bold mb-0">{loading ? "—" : total}</h3>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-0 shadow-sm rounded-4 h-100">
                <Card.Body className="p-4 d-flex align-items-center">
                  <div
                    className="bg-warning bg-opacity-10 text-warning rounded-circle p-3 me-3 d-flex align-items-center justify-content-center"
                    style={{ width: 60, height: 60 }}
                  >
                    <i className="bi bi-clock-history fs-3"></i>
                  </div>
                  <div>
                    <h6 className="text-muted mb-1">Chờ thanh toán</h6>
                    <h3 className="fw-bold mb-0">
                      {loading ? "—" : pendingCount}
                    </h3>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-0 shadow-sm rounded-4 h-100">
                <Card.Body className="p-4 d-flex align-items-center">
                  <div
                    className="bg-success bg-opacity-10 text-success rounded-circle p-3 me-3 d-flex align-items-center justify-content-center"
                    style={{ width: 60, height: 60 }}
                  >
                    <i className="bi bi-check-circle fs-3"></i>
                  </div>
                  <div>
                    <h6 className="text-muted mb-1">Đã hoàn thành</h6>
                    <h3 className="fw-bold mb-0">
                      {loading ? "—" : completedCount}
                    </h3>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Table */}
          <Card className="shadow-sm border-0 rounded-4 overflow-hidden">
            <Card.Header className="bg-white border-bottom py-3 px-4">
              <h5 className="fw-bold mb-0 text-dark">Lịch sử đặt chỗ</h5>
            </Card.Header>
            <Card.Body className="p-0">
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="text-muted mt-3 mb-0">Đang tải dữ liệu...</p>
                </div>
              ) : error ? (
                <div className="p-4">
                  <Alert variant="danger" className="mb-0">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                  </Alert>
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-5">
                  <i
                    className="bi bi-calendar-x text-muted"
                    style={{ fontSize: "3rem" }}
                  ></i>
                  <p className="text-muted mt-3 mb-0">
                    Bạn chưa có đặt chỗ nào.
                  </p>
                  <Button
                    as={Link}
                    to="/order-table"
                    variant="primary"
                    className="rounded-pill px-4 mt-3"
                  >
                    Đặt chỗ ngay
                  </Button>
                </div>
              ) : (
                <Table responsive hover className="mb-0 align-middle">
                  <thead className="bg-light">
                    <tr>
                      <th className="py-3 px-4 border-bottom-0 text-muted fw-semibold">
                        Mã đặt chỗ
                      </th>
                      <th className="py-3 px-4 border-bottom-0 text-muted fw-semibold">
                        Không gian
                      </th>
                      <th className="py-3 px-4 border-bottom-0 text-muted fw-semibold">
                        Thời gian
                      </th>
                      <th className="py-3 px-4 border-bottom-0 text-muted fw-semibold">
                        Tổng tiền
                      </th>
                      <th className="py-3 px-4 border-bottom-0 text-muted fw-semibold">
                        Trạng thái
                      </th>
                      <th className="py-3 px-4 border-bottom-0 text-muted fw-semibold text-end">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking.id}>
                        <td className="py-3 px-4 fw-medium text-primary">
                          {booking.bookingCode}
                        </td>
                        <td className="py-3 px-4 fw-medium">
                          {booking.spaceName}
                        </td>
                        <td className="py-3 px-4">
                          <div className="fw-medium">
                            {formatDate(booking.startTime)}
                          </div>
                          <small className="text-muted">
                            <i className="bi bi-clock me-1"></i>
                            {formatTime(booking.startTime)}
                            {booking.endTime &&
                              ` (${calcDuration(booking.startTime, booking.endTime)})`}
                          </small>
                        </td>
                        <td className="py-3 px-4 fw-bold text-dark">
                          {booking.depositAmount > 0
                            ? `${fmt(booking.depositAmount)}đ`
                            : "Miễn phí"}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={booking.status} />
                        </td>
                        <td className="py-3 px-4 text-end">
                          {["Pending", "Awaiting_Payment"].includes(
                            booking.status,
                          ) && (
                            <Button
                              variant="primary"
                              size="sm"
                              className="rounded-pill px-3 fw-medium shadow-sm"
                              onClick={() => navigate(`/payment/${booking.id}`)}
                            >
                              Thanh toán
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Container>
      </main>

      <footer className="bg-dark text-light py-5 mt-auto">
        <Container>
          <Row className="gy-4">
            <Col lg={4} md={6}>
              <h4 className="fw-bold mb-3 text-white">
                <i className="bi bi-building me-2 text-primary"></i>Nexus
                Coworking
              </h4>
              <p className="text-secondary mb-4">
                Không gian làm việc sáng tạo dành cho startup, freelancer và
                doanh nghiệp.
              </p>
              <div className="d-flex gap-3">
                <a href="#" className="text-secondary">
                  <i className="bi bi-facebook fs-5"></i>
                </a>
                <a href="#" className="text-secondary">
                  <i className="bi bi-instagram fs-5"></i>
                </a>
                <a href="#" className="text-secondary">
                  <i className="bi bi-linkedin fs-5"></i>
                </a>
              </div>
            </Col>
            <Col lg={2} md={6}>
              <h5 className="fw-bold mb-3 text-white">Liên kết</h5>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <Link to="/" className="text-secondary text-decoration-none">
                    Trang chủ
                  </Link>
                </li>
                <li className="mb-2">
                  <Link
                    to="/order-table"
                    className="text-secondary text-decoration-none"
                  >
                    Không gian
                  </Link>
                </li>
                <li className="mb-2">
                  <Link
                    to="/dashboard"
                    className="text-secondary text-decoration-none"
                  >
                    Quản lý đặt chỗ
                  </Link>
                </li>
              </ul>
            </Col>
            <Col lg={3} md={6}>
              <h5 className="fw-bold mb-3 text-white">Dịch vụ</h5>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <a href="#" className="text-secondary text-decoration-none">
                    Hot Desk
                  </a>
                </li>
                <li className="mb-2">
                  <a href="#" className="text-secondary text-decoration-none">
                    Dedicated Desk
                  </a>
                </li>
                <li className="mb-2">
                  <a href="#" className="text-secondary text-decoration-none">
                    Phòng họp
                  </a>
                </li>
                <li className="mb-2">
                  <a href="#" className="text-secondary text-decoration-none">
                    Văn phòng riêng
                  </a>
                </li>
              </ul>
            </Col>
            <Col lg={3} md={6}>
              <h5 className="fw-bold mb-3 text-white">Liên hệ</h5>
              <ul className="list-unstyled text-secondary">
                <li className="mb-2 d-flex">
                  <i className="bi bi-geo-alt me-2 text-primary"></i>Tầng 5, Tòa
                  nhà Innovation, TP.HCM
                </li>
                <li className="mb-2 d-flex">
                  <i className="bi bi-telephone me-2 text-primary"></i>1900 1234
                </li>
                <li className="mb-2 d-flex">
                  <i className="bi bi-envelope me-2 text-primary"></i>
                  hello@nexuscoworking.vn
                </li>
              </ul>
            </Col>
          </Row>
          <hr className="border-secondary my-4" />
          <Row>
            <Col md={6} className="text-center text-md-start">
              <p className="text-secondary mb-0">
                &copy; 2026 Nexus Coworking. All rights reserved.
              </p>
            </Col>
            <Col md={6} className="text-center text-md-end mt-2 mt-md-0">
              <a href="#" className="text-secondary text-decoration-none me-3">
                Điều khoản
              </a>
              <a href="#" className="text-secondary text-decoration-none">
                Bảo mật
              </a>
            </Col>
          </Row>
        </Container>
      </footer>
    </div>
  );
}
