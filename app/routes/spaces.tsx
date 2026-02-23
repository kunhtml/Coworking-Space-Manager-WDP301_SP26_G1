import type { Route } from "./+types/spaces";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Navbar,
} from "react-bootstrap";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Không gian làm việc | Nexus Coworking" },
    {
      name: "description",
      content: "Khám phá các không gian làm việc tại Nexus Coworking.",
    },
  ];
}

const spaces = [
  {
    id: 1,
    name: "Hot Desk - Tầng 5",
    type: "Chỗ ngồi tự do",
    capacity: "1 người",
    price: "150.000đ/ngày",
    image:
      "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=800&q=80",
    features: ["Wifi tốc độ cao", "Trà & Cafe miễn phí", "Ghế Ergonomic"],
  },
  {
    id: 2,
    name: "Dedicated Desk - Tầng 6",
    type: "Chỗ ngồi cố định",
    capacity: "1 người",
    price: "3.000.000đ/tháng",
    image:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
    features: ["Tủ đồ cá nhân", "Sử dụng phòng họp 5h/tháng", "In ấn miễn phí"],
  },
  {
    id: 3,
    name: "Phòng họp sáng tạo",
    type: "Phòng họp",
    capacity: "8-10 người",
    price: "200.000đ/giờ",
    image:
      "https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800&q=80",
    features: ["Máy chiếu 4K", "Bảng trắng", "Cách âm tốt"],
  },
  {
    id: 4,
    name: "Văn phòng riêng Standard",
    type: "Văn phòng riêng",
    capacity: "4-6 người",
    price: "15.000.000đ/tháng",
    image:
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80",
    features: ["Bảo mật 24/7", "Logo công ty", "Miễn phí phòng họp"],
  },
];

export default function Spaces() {
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
                className="text-decoration-none text-primary fw-bold px-2 py-1 rounded bg-primary bg-opacity-10"
              >
                Không gian
              </Link>
              <Link
                to="/dashboard"
                className="text-decoration-none text-dark fw-medium px-2 py-1 hover-primary transition-all"
              >
                Quản lý đặt chỗ
              </Link>
              <div className="d-flex gap-2 ms-lg-3 mt-2 mt-lg-0">
                <Button
                  as={Link}
                  to="/login"
                  variant="outline-primary"
                  className="px-4 rounded-pill fw-medium"
                >
                  Đăng nhập
                </Button>
                <Button
                  variant="primary"
                  className="px-4 rounded-pill fw-medium shadow-sm"
                >
                  Đăng ký
                </Button>
              </div>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <main className="flex-grow-1 bg-light py-5">
        <Container>
          <div className="text-center mb-5">
            <Badge
              bg="primary"
              className="bg-opacity-10 text-primary mb-3 px-3 py-2 rounded-pill fw-medium"
            >
              Không gian làm việc
            </Badge>
            <h1 className="fw-bold display-5 mb-3 text-dark">
              Khám phá không gian làm việc
            </h1>
            <p
              className="text-muted lead mx-auto"
              style={{ maxWidth: "700px" }}
            >
              Lựa chọn không gian phù hợp nhất với nhu cầu của bạn và đội ngũ.
              Từ chỗ ngồi linh hoạt đến văn phòng riêng tư, chúng tôi đều có
              giải pháp hoàn hảo.
            </p>
          </div>

          <Row className="g-4">
            {spaces.map((space) => (
              <Col md={6} lg={4} key={space.id}>
                <Card className="h-100 shadow-sm border-0 rounded-4 overflow-hidden hover-lift transition-all">
                  <div
                    className="position-relative"
                    style={{ height: "240px", overflow: "hidden" }}
                  >
                    <img
                      src={space.image}
                      alt={space.name}
                      className="w-100 h-100 object-fit-cover transition-transform hover-zoom"
                    />
                    <div className="position-absolute top-0 end-0 m-3">
                      <Badge
                        bg="light"
                        text="dark"
                        className="shadow-sm px-3 py-2 rounded-pill fw-bold fs-6"
                      >
                        {space.price}
                      </Badge>
                    </div>
                  </div>
                  <Card.Body className="d-flex flex-column p-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <Badge
                        bg="primary"
                        className="bg-opacity-10 text-primary px-3 py-2 rounded-pill fw-medium"
                      >
                        {space.type}
                      </Badge>
                      <span className="text-muted small d-flex align-items-center">
                        <i className="bi bi-people-fill me-1"></i>{" "}
                        {space.capacity}
                      </span>
                    </div>
                    <Card.Title className="fw-bold fs-4 mb-3 text-dark">
                      {space.name}
                    </Card.Title>

                    <div className="mb-4 flex-grow-1">
                      <p className="fw-semibold mb-3 text-dark fs-6">
                        Tiện ích bao gồm:
                      </p>
                      <ul className="list-unstyled mb-0">
                        {space.features.map((feature, idx) => (
                          <li
                            key={idx}
                            className="mb-2 text-muted d-flex align-items-center"
                          >
                            <div
                              className="bg-success bg-opacity-10 text-success rounded-circle p-1 me-2 d-flex align-items-center justify-content-center"
                              style={{ width: "24px", height: "24px" }}
                            >
                              <i
                                className="bi bi-check"
                                style={{ fontSize: "14px" }}
                              ></i>
                            </div>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button
                      as={Link}
                      to="/"
                      variant="primary"
                      className="w-100 mt-auto py-2 rounded-pill fw-bold shadow-sm"
                    >
                      Đặt chỗ ngay
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
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
