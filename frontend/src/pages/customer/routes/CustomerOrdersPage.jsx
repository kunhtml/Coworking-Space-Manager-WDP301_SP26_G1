import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Modal,
  Navbar,
  Row,
} from "react-bootstrap";
import { Link } from "react-router";
import { useAuth } from "../../../hooks/useAuth";
import AuthNavActions from "../../../components/common/AuthNavActions";

const orders = [
  {
    code: "#CUS-20250111-001",
    status: "Hoàn thành",
    statusClass: "bg-success-subtle text-success",
    datetime: "11/01/2025 • 14:00 - 16:00",
    lines: [
      "🪑 Ghế cá nhân A1 (2h) — 50,000đ",
      "☕ Cà phê sữa đá ×1 — 30,000đ",
      "🍑 Trà đào cam sả ×1 — 35,000đ",
    ],
    totalLabel: "Tổng",
    total: "115,000đ",
    actions: ["Hóa đơn"],
  },
  {
    code: "#CUS-20250110-003",
    status: "Chờ thanh toán",
    statusClass: "bg-warning-subtle text-warning",
    datetime: "10/01/2025 • 09:00 - 12:00",
    lines: [
      "👥 Bàn nhóm B2 (3h) — 120,000đ",
      "☕ Latte ×2 — 80,000đ",
      "🖨 In tài liệu (20 trang) — 20,000đ",
    ],
    totalLabel: "Còn thanh toán",
    total: "220,000đ",
    actions: ["Thanh toán ngay"],
  },
  {
    code: "#CUS-20250109-002",
    status: "Hoàn thành",
    statusClass: "bg-success-subtle text-success",
    datetime: "09/01/2025 • 14:00 - 18:00",
    lines: [
      "👑 Phòng VIP-1 (4h) — 800,000đ",
      "☕ Americano ×3 — 105,000đ",
      "🎥 Thuê máy chiếu (4h) — 200,000đ",
    ],
    totalLabel: "Tổng",
    total: "1,105,000đ",
    actions: ["Hóa đơn"],
  },
];

export default function CustomerOrdersPage() {
  const { user } = useAuth();
  const [showInvoice, setShowInvoice] = useState(false);

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Navbar bg="white" expand="lg" className="py-3 shadow-sm border-0">
        <Container fluid="lg">
          <Navbar.Brand
            as={Link}
            to="/"
            className="fw-bold d-flex align-items-center"
          >
            <div
              className="studyspace-logo me-2 d-flex align-items-center justify-content-center rounded-3"
              style={{ background: "#6366f1", width: "40px", height: "40px" }}
            >
              <i className="bi bi-house-door-fill text-white"></i>
            </div>
            <span style={{ color: "#1f2937" }}>StudySpace</span>
          </Navbar.Brand>

          <div className="d-flex align-items-center gap-4 ms-auto">
            <Link
              to="/"
              className="text-decoration-none fw-semibold text-primary"
            >
              Trang chủ
            </Link>
            <Link
              to="/order-table"
              className="text-decoration-none fw-semibold text-secondary"
            >
              Đặt chỗ
            </Link>
            <Link
              to="/menu"
              className="text-decoration-none fw-semibold text-secondary"
            >
              Thực đơn
            </Link>
            <Link
              to="/customer-dashboard/orders"
              className="text-decoration-none fw-semibold text-secondary"
            >
              Đơn của tôi
            </Link>
            <AuthNavActions displayName={user?.fullName || "Khách"} />
          </div>
        </Container>
      </Navbar>

      <main className="py-4 flex-grow-1">
        <Container fluid="lg">
          <Row className="align-items-center mb-3">
            <Col>
              <h1 className="fw-bold mb-0">Đơn hàng của tôi</h1>
              <div className="text-secondary fw-semibold">
                Lịch sử đặt chỗ & dịch vụ
              </div>
            </Col>
            <Col xs="auto" className="d-flex gap-2">
              <Form.Select style={{ width: 120 }}>
                <option>Tất cả</option>
              </Form.Select>
              <div className="staff-search-wrap" style={{ width: 210 }}>
                <i className="bi bi-search"></i>
                <input placeholder="Tìm mã đơn..." />
              </div>
            </Col>
          </Row>

          <Row className="g-3">
            {orders.map((order) => (
              <Col lg={4} key={order.code}>
                <Card className="border-0 shadow-sm staff-panel-card h-100">
                  <Card.Header className="bg-white border-bottom d-flex justify-content-between align-items-center">
                    <h4 className="fw-bold mb-0">{order.code}</h4>
                    <Badge
                      className={`rounded-pill border-0 px-3 py-2 ${order.statusClass}`}
                    >
                      {order.status}
                    </Badge>
                  </Card.Header>
                  <Card.Body>
                    <div className="fw-semibold text-secondary mb-2">
                      📅 {order.datetime}
                    </div>
                    {order.lines.map((line) => (
                      <div
                        key={line}
                        className="border-bottom py-2 fw-semibold text-dark"
                      >
                        {line}
                      </div>
                    ))}
                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <h3 className="text-primary fw-bold mb-0">
                        {order.totalLabel}
                      </h3>
                      <h2 className="text-primary fw-bold mb-0">
                        {order.total}
                      </h2>
                    </div>
                  </Card.Body>
                  <Card.Footer className="bg-white border-top d-flex gap-2">
                    {order.actions.includes("Hóa đơn") && (
                      <Button
                        className="staff-secondary-btn w-100"
                        onClick={() => setShowInvoice(true)}
                      >
                        <i className="bi bi-receipt me-2"></i>Hóa đơn
                      </Button>
                    )}
                    {order.actions.includes("Thanh toán ngay") && (
                      <Button className="staff-primary-btn w-100">
                        <i className="bi bi-credit-card me-2"></i>Thanh toán
                        ngay
                      </Button>
                    )}
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </main>

      <Modal
        show={showInvoice}
        onHide={() => setShowInvoice(false)}
        centered
        size="lg"
      >
        <Modal.Body className="p-4">
          <div className="border rounded-4 p-4">
            <h3 className="fw-bold mb-0">StudySpace</h3>
            <div className="text-secondary fw-semibold">
              Coworking Space Management System
            </div>
            <div className="text-center fw-bold mt-2">HÓA ĐƠN ĐIỆN TỬ</div>
            <hr />
            <div className="fw-bold mb-2">THÔNG TIN ĐƠN HÀNG</div>
            <div className="d-flex justify-content-between">
              <span>Mã đơn</span>
              <strong>#CUS-20250111-001</strong>
            </div>
            <div className="d-flex justify-content-between">
              <span>Ngày</span>
              <strong>11/01/2025</strong>
            </div>
            <div className="d-flex justify-content-between">
              <span>Khách hàng</span>
              <strong>Nguyễn Khách Hàng</strong>
            </div>
            <div className="d-flex justify-content-between">
              <span>Email</span>
              <strong>khach@email.com</strong>
            </div>
            <div className="fw-bold mt-3 mb-2">CHI TIẾT DỊCH VỤ</div>
            <div className="d-flex justify-content-between">
              <span>🪑 Ghế cá nhân A1 (2h)</span>
              <strong>50,000đ</strong>
            </div>
            <div className="d-flex justify-content-between">
              <span>☕ Cà phê sữa đá ×1</span>
              <strong>30,000đ</strong>
            </div>
            <div className="d-flex justify-content-between">
              <span>🍑 Trà đào cam sả ×1</span>
              <strong>35,000đ</strong>
            </div>
            <hr />
            <div className="d-flex justify-content-between align-items-center">
              <h2 className="text-primary fw-bold mb-0">TỔNG CỘNG</h2>
              <h1 className="text-primary fw-bold mb-0">115,000đ</h1>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 d-flex gap-2">
          <Button
            variant="outline-secondary"
            className="w-100"
            onClick={() => setShowInvoice(false)}
          >
            Đóng
          </Button>
          <Button className="w-100" variant="primary">
            <i className="bi bi-download me-2"></i>Tải PDF
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
