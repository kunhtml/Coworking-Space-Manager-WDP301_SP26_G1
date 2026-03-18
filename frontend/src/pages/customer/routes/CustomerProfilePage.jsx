import { Badge, Button, Card, Col, Container, Form, Navbar, Row } from "react-bootstrap";
import { Link } from "react-router";
import { useAuth } from "../../../hooks/useAuth";
import AuthNavActions from "../../../components/common/AuthNavActions";

export default function CustomerProfilePage() {
  const { user } = useAuth();
  const fullName = user?.fullName || "Nguyễn Khách Hàng";
  const email = user?.email || "khach@email.com";
  const phone = user?.phone || "0901 234 567";

  const initials = fullName
    .split(" ")
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Navbar bg="white" expand="lg" className="py-3 shadow-sm border-0">
        <Container>
          <Navbar.Brand as={Link} to="/" className="fw-bold d-flex align-items-center">
            <div
              className="studyspace-logo me-2 d-flex align-items-center justify-content-center rounded-3"
              style={{ background: "#6366f1", width: "40px", height: "40px" }}
            >
              <i className="bi bi-house-door-fill text-white"></i>
            </div>
            <span style={{ color: "#1f2937" }}>StudySpace</span>
          </Navbar.Brand>

          <div className="d-flex align-items-center gap-4 ms-auto">
            <Link to="/" className="text-decoration-none fw-semibold text-primary">Trang chủ</Link>
            <Link to="/order-table" className="text-decoration-none fw-semibold text-secondary">Đặt chỗ</Link>
            <Link to="/menu" className="text-decoration-none fw-semibold text-secondary">Thực đơn</Link>
            <Link to="/customer-dashboard/orders" className="text-decoration-none fw-semibold text-secondary">Đơn của tôi</Link>
            <AuthNavActions displayName={fullName} />
          </div>
        </Container>
      </Navbar>

      <main className="py-4 flex-grow-1">
        <Container style={{ maxWidth: "980px" }}>
          <Card className="border-0 shadow-sm overflow-hidden mb-4">
            <div
              style={{
                height: "100px",
                background: "linear-gradient(90deg, #6366f1 0%, #7c3aed 100%)",
              }}
            ></div>
            <Card.Body style={{ marginTop: "-42px" }}>
              <div
                className="rounded-circle bg-white border d-flex align-items-center justify-content-center fw-bold text-primary"
                style={{ width: "84px", height: "84px", fontSize: "40px" }}
              >
                {initials}
              </div>
              <h3 className="fw-bold mt-3 mb-1">{fullName}</h3>
              <p className="text-secondary fw-semibold mb-3">{email} • Thành viên từ 01/2025</p>
              <hr className="my-3" />
              <Row className="g-3">
                <Col xs={6} md={2}><div className="text-primary fw-bold fs-4">12</div><div className="text-secondary fw-semibold small">Lần đặt chỗ</div></Col>
                <Col xs={6} md={2}><div className="text-primary fw-bold fs-4">2.5M</div><div className="text-secondary fw-semibold small">Tổng chi tiêu</div></Col>
                <Col xs={6} md={2}><div className="text-primary fw-bold fs-4">45h</div><div className="text-secondary fw-semibold small">Giờ sử dụng</div></Col>
                <Col xs={6} md={3}><div className="text-primary fw-bold fs-4">⭐ Gold</div><div className="text-secondary fw-semibold small">Hạng thành viên</div></Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom py-3">
              <h5 className="fw-bold mb-0">
                <i className="bi bi-pencil-fill text-primary me-2"></i>
                Chỉnh sửa thông tin
              </h5>
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Label className="fw-semibold">Họ và tên</Form.Label>
                  <Form.Control value={fullName} readOnly className="bg-light" />
                </Col>
                <Col md={6}>
                  <Form.Label className="fw-semibold">Email</Form.Label>
                  <Form.Control value={email} readOnly className="bg-light" />
                </Col>
                <Col md={6}>
                  <Form.Label className="fw-semibold">Số điện thoại</Form.Label>
                  <Form.Control value={phone} readOnly className="bg-light" />
                </Col>
                <Col md={6}>
                  <Form.Label className="fw-semibold">Ngày sinh</Form.Label>
                  <Form.Control type="date" value="2000-05-15" readOnly className="bg-light" />
                </Col>
                <Col md={12}>
                  <Form.Label className="fw-semibold">Địa chỉ</Form.Label>
                  <Form.Control value="123 Đường ABC, Quận 1, TP.HCM" readOnly className="bg-light" />
                </Col>
              </Row>

              <div className="d-flex justify-content-end gap-2 mt-4">
                <Button variant="outline-secondary">Hủy</Button>
                <Button className="staff-secondary-btn">
                  <i className="bi bi-floppy me-2"></i>Lưu thay đổi
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Container>
      </main>
    </div>
  );
}
