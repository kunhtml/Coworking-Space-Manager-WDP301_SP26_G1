import type { Route } from "./+types/dashboard";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Navbar,
  Table,
} from "react-bootstrap";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Quản lý đặt chỗ | Nexus Coworking" },
    {
      name: "description",
      content: "Quản lý các đặt chỗ của bạn tại Nexus Coworking.",
    },
  ];
}

const bookings = [
  {
    id: "BK-1029",
    space: "Hot Desk - Tầng 5",
    date: "2026-02-25",
    time: "08:00",
    duration: "1 ngày",
    status: "Đã xác nhận",
    price: "150.000đ",
  },
  {
    id: "BK-1030",
    space: "Phòng họp sáng tạo",
    date: "2026-02-28",
    time: "14:00",
    duration: "2 giờ",
    status: "Chờ thanh toán",
    price: "400.000đ",
  },
  {
    id: "BK-0985",
    space: "Dedicated Desk - Tầng 6",
    date: "2026-01-01",
    time: "08:00",
    duration: "1 tháng",
    status: "Đã hoàn thành",
    price: "3.000.000đ",
  },
];

export default function Dashboard() {
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
                to="/spaces"
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
              <div className="d-flex gap-2 ms-lg-3 mt-2 mt-lg-0">
                <Button
                  variant="outline-danger"
                  className="px-4 rounded-pill fw-medium"
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
                <span className="fw-medium text-dark">Nguyễn Văn A</span>
              </p>
            </Col>
            <Col xs="auto" className="mt-3 mt-md-0">
              <Button
                as={Link}
                to="/"
                variant="primary"
                className="rounded-pill px-4 fw-medium shadow-sm"
              >
                <i className="bi bi-plus-lg me-1"></i> Đặt chỗ mới
              </Button>
            </Col>
          </Row>

          <Row className="g-4 mb-4">
            <Col md={4}>
              <Card className="border-0 shadow-sm rounded-4 h-100">
                <Card.Body className="p-4 d-flex align-items-center">
                  <div
                    className="bg-primary bg-opacity-10 text-primary rounded-circle p-3 me-3 d-flex align-items-center justify-content-center"
                    style={{ width: "60px", height: "60px" }}
                  >
                    <i className="bi bi-calendar-check fs-3"></i>
                  </div>
                  <div>
                    <h6 className="text-muted mb-1">Tổng số đặt chỗ</h6>
                    <h3 className="fw-bold mb-0">12</h3>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-0 shadow-sm rounded-4 h-100">
                <Card.Body className="p-4 d-flex align-items-center">
                  <div
                    className="bg-warning bg-opacity-10 text-warning rounded-circle p-3 me-3 d-flex align-items-center justify-content-center"
                    style={{ width: "60px", height: "60px" }}
                  >
                    <i className="bi bi-clock-history fs-3"></i>
                  </div>
                  <div>
                    <h6 className="text-muted mb-1">Chờ thanh toán</h6>
                    <h3 className="fw-bold mb-0">1</h3>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-0 shadow-sm rounded-4 h-100">
                <Card.Body className="p-4 d-flex align-items-center">
                  <div
                    className="bg-success bg-opacity-10 text-success rounded-circle p-3 me-3 d-flex align-items-center justify-content-center"
                    style={{ width: "60px", height: "60px" }}
                  >
                    <i className="bi bi-check-circle fs-3"></i>
                  </div>
                  <div>
                    <h6 className="text-muted mb-1">Đã hoàn thành</h6>
                    <h3 className="fw-bold mb-0">8</h3>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Card className="shadow-sm border-0 rounded-4 overflow-hidden">
            <Card.Header className="bg-white border-bottom py-3 px-4">
              <h5 className="fw-bold mb-0 text-dark">Lịch sử đặt chỗ</h5>
            </Card.Header>
            <Card.Body className="p-0">
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
                        {booking.id}
                      </td>
                      <td className="py-3 px-4 fw-medium">{booking.space}</td>
                      <td className="py-3 px-4">
                        <div className="fw-medium">{booking.date}</div>
                        <small className="text-muted">
                          <i className="bi bi-clock me-1"></i>
                          {booking.time} ({booking.duration})
                        </small>
                      </td>
                      <td className="py-3 px-4 fw-bold text-dark">
                        {booking.price}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          bg={
                            booking.status === "Đã xác nhận"
                              ? "success"
                              : booking.status === "Chờ thanh toán"
                                ? "warning"
                                : "secondary"
                          }
                          className={`px-3 py-2 rounded-pill fw-medium ${booking.status === "Chờ thanh toán" ? "text-dark" : "bg-opacity-10 text-" + (booking.status === "Đã xác nhận" ? "success" : "secondary")}`}
                        >
                          {booking.status === "Đã xác nhận" && (
                            <i className="bi bi-check-circle me-1"></i>
                          )}
                          {booking.status === "Chờ thanh toán" && (
                            <i className="bi bi-clock-history me-1"></i>
                          )}
                          {booking.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-end">
                        <Button
                          variant="light"
                          size="sm"
                          className="rounded-circle me-2"
                          title="Chi tiết"
                        >
                          <i className="bi bi-eye"></i>
                        </Button>
                        {booking.status === "Chờ thanh toán" && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="rounded-pill px-3 fw-medium shadow-sm"
                          >
                            Thanh toán
                          </Button>
                        )}
                        {booking.status === "Đã xác nhận" && (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="rounded-pill px-3 fw-medium"
                          >
                            Hủy
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
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
                doanh nghiệp. Nơi kết nối cộng đồng và phát triển ý tưởng.
              </p>
              <div className="d-flex gap-3">
                <a
                  href="#"
                  className="text-secondary hover-white transition-all"
                >
                  <i className="bi bi-facebook fs-5"></i>
                </a>
                <a
                  href="#"
                  className="text-secondary hover-white transition-all"
                >
                  <i className="bi bi-instagram fs-5"></i>
                </a>
                <a
                  href="#"
                  className="text-secondary hover-white transition-all"
                >
                  <i className="bi bi-linkedin fs-5"></i>
                </a>
              </div>
            </Col>
            <Col lg={2} md={6}>
              <h5 className="fw-bold mb-3 text-white">Liên kết</h5>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <Link
                    to="/"
                    className="text-secondary text-decoration-none hover-white transition-all"
                  >
                    Trang chủ
                  </Link>
                </li>
                <li className="mb-2">
                  <Link
                    to="/spaces"
                    className="text-secondary text-decoration-none hover-white transition-all"
                  >
                    Không gian
                  </Link>
                </li>
                <li className="mb-2">
                  <Link
                    to="/dashboard"
                    className="text-secondary text-decoration-none hover-white transition-all"
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
                  <a
                    href="#"
                    className="text-secondary text-decoration-none hover-white transition-all"
                  >
                    Hot Desk
                  </a>
                </li>
                <li className="mb-2">
                  <a
                    href="#"
                    className="text-secondary text-decoration-none hover-white transition-all"
                  >
                    Dedicated Desk
                  </a>
                </li>
                <li className="mb-2">
                  <a
                    href="#"
                    className="text-secondary text-decoration-none hover-white transition-all"
                  >
                    Phòng họp
                  </a>
                </li>
                <li className="mb-2">
                  <a
                    href="#"
                    className="text-secondary text-decoration-none hover-white transition-all"
                  >
                    Văn phòng riêng
                  </a>
                </li>
              </ul>
            </Col>
            <Col lg={3} md={6}>
              <h5 className="fw-bold mb-3 text-white">Liên hệ</h5>
              <ul className="list-unstyled text-secondary">
                <li className="mb-2 d-flex">
                  <i className="bi bi-geo-alt me-2 text-primary"></i> Tầng 5,
                  Tòa nhà Innovation, TP.HCM
                </li>
                <li className="mb-2 d-flex">
                  <i className="bi bi-telephone me-2 text-primary"></i> 1900
                  1234
                </li>
                <li className="mb-2 d-flex">
                  <i className="bi bi-envelope me-2 text-primary"></i>{" "}
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
              <a
                href="#"
                className="text-secondary text-decoration-none me-3 hover-white transition-all"
              >
                Điều khoản
              </a>
              <a
                href="#"
                className="text-secondary text-decoration-none hover-white transition-all"
              >
                Bảo mật
              </a>
            </Col>
          </Row>
        </Container>
      </footer>
    </div>
  );
}
