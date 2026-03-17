import { useState } from "react";
import {
  Button,
  Card,
  Col,
  Container,
  Navbar,
  Row,
  Nav,
  Badge,
} from "react-bootstrap";
import { Link } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import AuthNavActions from "../../components/common/AuthNavActions";

export function meta() {
  return [
    { title: "StudySpace | Không gian học tập lý tưởng" },
    {
      name: "description",
      content:
        "Đặt chỗ ngồi online, thưởng thức đồ uống, sử dụng dịch vụ in ấn & thiết bị — tất cả trong một hệ thống thông minh.",
    },
  ];
}

const workspaceOptions = [
  {
    id: "individual",
    title: "Ghế cá nhân",
    description: "Không gian yên tĩnh cho việc học tập và làm việc cá nhân",
    price: 25000,
    capacity: "1 chỗ",
    features: ["0 cầm", "Wi-Fi 5G"],
    icon: "💺",
    color: "rgba(99, 102, 241, 0.1)",
    badge: "Ghế cá nhân",
    status: "Trống",
    statusColor: "success",
  },
  {
    id: "group4",
    title: "Bàn nhóm (4 chỗ)",
    description: "Thảo luận nhóm, làm project, học nhóm hiệu quả",
    price: 40000,
    capacity: "4 chỗ",
    features: ["4 ổ cắm", "Bảng trắng"],
    icon: "👥",
    color: "rgba(251, 191, 36, 0.1)",
    badge: "Bàn nhóm",
    status: "Trống",
    statusColor: "success",
  },
  {
    id: "group6",
    title: "Bàn nhóm (6 chỗ)",
    description: "Bàn lớn dành cho nhóm đông, họp team, workshop nhỏ",
    price: 55000,
    capacity: "6 chỗ",
    features: ["6 ổ cắm", "Màn hình"],
    icon: "👥",
    color: "rgba(34, 197, 94, 0.1)",
    badge: "Bàn nhóm",
    status: "Còn lại 1",
    statusColor: "warning",
  },
  {
    id: "meeting8",
    title: "Phòng họp (8 chỗ)",
    description: "Phòng riêng cách âm, máy chiếu, bảng trắng, AC",
    price: 120000,
    capacity: "8 chỗ",
    features: ["Máy chiếu", "AC"],
    icon: "📊",
    color: "rgba(59, 130, 246, 0.1)",
    badge: "Phòng họp",
    status: "Hết chỗ",
    statusColor: "danger",
  },
  {
    id: "vip10",
    title: "Phòng VIP (10 chỗ)",
    description: "Full option: máy chiếu, loa, bảng, minibar, phục vụ riêng",
    price: null,
    capacity: "10 chỗ",
    features: ["VIP", "Minibar"],
    icon: "👑",
    color: "rgba(139, 92, 246, 0.1)",
    badge: "VIP",
    status: "Trống",
    statusColor: "success",
  },
];

const menuItems = [
  {
    id: 1,
    name: "Cà phê sữa đá",
    description: "Cà phê phin truyền thống pha sữa đặc, đá viên",
    price: 30000,
    icon: "☕",
    category: "drink",
    color: "rgba(99, 102, 241, 0.1)",
  },
  {
    id: 2,
    name: "Trà đào cam sả",
    description: "Trà thơm hoa quyến đào tươi, cam vả sả",
    price: 35000,
    icon: "🧡",
    category: "drink",
    color: "rgba(251, 191, 36, 0.1)",
  },
  {
    id: 3,
    name: "Latte",
    description: "Espresso đậm đà kết hợp sữa tươi béo ngậy",
    price: 40000,
    icon: "🥛",
    category: "drink",
    color: "rgba(156, 163, 175, 0.1)",
  },
  {
    id: 4,
    name: "Americano",
    description: "Espresso pha nước, vị đắm thanh",
    price: 35000,
    icon: "☕",
    category: "drink",
    color: "rgba(99, 102, 241, 0.1)",
  },
  {
    id: 5,
    name: "Croissant bơ Pháp",
    description: "Bánh sừng bò bơ Pháp nướng giòn thơm",
    price: 25000,
    icon: "🥐",
    category: "food",
    color: "rgba(251, 191, 36, 0.1)",
  },
  {
    id: 6,
    name: "In tài liệu (10 trang)",
    description: "In đen trắng hoặc màu, A4",
    price: 10000,
    icon: "🖨️",
    category: "print",
    color: "rgba(59, 130, 246, 0.1)",
  },
  {
    id: 7,
    name: "Thuê sạc laptop",
    description: "Type-C 65W, Magsafe, USB-C PD",
    price: 20000,
    icon: "🔌",
    category: "equipment",
    color: "rgba(34, 197, 94, 0.1)",
  },
  {
    id: 8,
    name: "Thuê máy chiếu",
    description: "Full HD, kết nối HDMI/Wireless",
    price: 50000,
    unit: "/h",
    icon: "📽️",
    category: "equipment",
    color: "rgba(139, 92, 246, 0.1)",
  },
];

const categories = [
  { id: "all", label: "Tất cả", icon: "" },
  { id: "drink", label: "Đồ uống", icon: "☕" },
  { id: "food", label: "Đồ ăn", icon: "🍰" },
  { id: "print", label: "In ấn", icon: "📄" },
  { id: "equipment", label: "Thiết bị", icon: "🔧" },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredMenuItems =
    selectedCategory === "all"
      ? menuItems
      : menuItems.filter((item) => item.category === selectedCategory);

  const formatPrice = (price, unit = "đ") => {
    return new Intl.NumberFormat("vi-VN").format(price) + unit;
  };

  return (
    <div className="min-vh-100 bg-light">
      {/* Header Navigation */}
      <Navbar bg="white" expand="lg" className="py-3 shadow-sm border-0">
        <Container>
          <Navbar.Brand
            as={Link}
            to="/"
            className="fw-bold d-flex align-items-center"
          >
            <div
              className="studyspace-logo me-2 d-flex align-items-center justify-content-center rounded-3"
              style={{ background: "#6366f1", width: "40px", height: "40px" }}
            >
              <i className="bi bi-cup-hot-fill text-white"></i>
            </div>
            <span style={{ color: "#1f2937" }}>StudySpace</span>
          </Navbar.Brand>

          <Navbar.Toggle />
          <Navbar.Collapse>
            <Nav className="me-auto ms-5">
              <Nav.Link href="#spaces" className="fw-medium text-muted px-3">
                Trang chủ
              </Nav.Link>
              <Nav.Link href="#menu" className="fw-medium text-muted px-3">
                Đặt chỗ
              </Nav.Link>
              <Nav.Link href="#menu" className="fw-medium text-muted px-3">
                Thực đơn
              </Nav.Link>
            </Nav>

            <div className="d-flex gap-3 align-items-center">
              <AuthNavActions />
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Hero Section */}
      <section
        className="hero-section py-5"
        style={{
          background:
            "linear-gradient(135deg, #1e1b4b 0%, #3730a3 50%, #6366f1 100%)",
          minHeight: "80vh",
          color: "white",
        }}
      >
        <Container className="py-5">
          <Row className="align-items-center min-vh-50">
            <Col lg={7}>
              <div className="hero-content">
                <h1 className="display-4 fw-bold mb-4">
                  Không gian học tập lý{" "}
                  <span style={{ color: "#f59e0b" }}>tưởng</span> cho bạn
                </h1>
                <p className="lead mb-5 text-white-50">
                  Đặt chỗ ngồi online, thưởng thức đồ uống, sử dụng dịch
                  <br />
                  vụ in ấn & thiết bị — tất cả trong một hệ thống thông minh.
                </p>

                <div className="d-flex gap-3 mb-5">
                  <Button
                    as={Link}
                    to="/order-table"
                    size="lg"
                    className="px-5 py-3 fw-semibold rounded-pill border-0"
                    style={{ backgroundColor: "#6366f1" }}
                  >
                    <i className="bi bi-calendar-plus me-2"></i>
                    Đặt chỗ ngay
                  </Button>
                  <Button
                    as={Link}
                    to="/menu"
                    variant="outline-light"
                    size="lg"
                    className="px-5 py-3 fw-semibold rounded-pill"
                  >
                    <i className="bi bi-cup-hot me-2"></i>
                    Xem thực đơn
                  </Button>
                </div>

                <Row className="text-center text-lg-start">
                  <Col xs={4} lg={4}>
                    <h3 className="fw-bold mb-1">30+</h3>
                    <p className="small text-white-50 mb-0">Chỗ ngồi</p>
                  </Col>
                  <Col xs={4} lg={4}>
                    <h3 className="fw-bold mb-1">15+</h3>
                    <p className="small text-white-50 mb-0">Dịch vụ</p>
                  </Col>
                  <Col xs={4} lg={4}>
                    <h3 className="fw-bold mb-1">
                      4.9<i className="bi bi-star-fill text-warning ms-1"></i>
                    </h3>
                    <p className="small text-white-50 mb-0">Đánh giá</p>
                  </Col>
                </Row>
              </div>
            </Col>

            <Col lg={5}>
              <div className="hero-card-preview">
                <Card
                  className="shadow-lg border-0 rounded-4"
                  style={{ maxWidth: "300px", margin: "0 auto" }}
                >
                  <Card.Header className="border-0 bg-transparent p-3">
                    <div className="d-flex align-items-center justify-content-between">
                      <Badge bg="success" className="px-3 py-2 fw-normal">
                        Ghế cá nhân
                      </Badge>
                      <Badge bg="primary" className="px-2">
                        Còn trống
                      </Badge>
                    </div>
                  </Card.Header>
                  <Card.Body className="text-center p-4">
                    <div
                      className="workspace-icon mb-3"
                      style={{ fontSize: "3rem" }}
                    >
                      💺
                    </div>
                    <p className="text-muted small mb-3">
                      Không gian yên tĩnh, 0 cầm riêng, đèn bàn,
                      <br />
                      Wi-Fi 5G tốc độ cao.
                    </p>
                    <h4 className="fw-bold text-primary">
                      25,000<small>đ/giờ</small>
                    </h4>
                  </Card.Body>
                </Card>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Workspace Selection Section */}
      <section id="spaces" className="py-5 bg-light">
        <Container>
          <div className="text-center mb-5">
            <Badge bg="primary" className="px-3 py-2 rounded-pill mb-3">
              <i className="bi bi-geo-alt me-2"></i>
              KHÔNG GIAN
            </Badge>
            <h2 className="fw-bold mb-3">Chọn chỗ ngồi phù hợp</h2>
            <p className="text-muted lead">
              Đa dạng loại hình từ ghế cá nhân đến phòng VIP, đặt trước online
              dễ dàng
            </p>
          </div>

          <Row className="g-4">
            {workspaceOptions.map((workspace) => (
              <Col
                key={workspace.id}
                lg={workspace.id === "vip10" ? 6 : 3}
                md={6}
              >
                <Card className="h-100 border-0 shadow-sm rounded-4 overflow-hidden hover-lift">
                  <div
                    className="card-header border-0 p-4 position-relative"
                    style={{ backgroundColor: workspace.color }}
                  >
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <Badge
                        bg="light"
                        text="primary"
                        className="px-3 py-2 fw-normal"
                      >
                        {workspace.badge}
                      </Badge>
                      <Badge bg={workspace.statusColor} className="px-2 py-1">
                        {workspace.status}
                      </Badge>
                    </div>

                    <div
                      className="workspace-icon mb-3"
                      style={{ fontSize: "3rem" }}
                    >
                      {workspace.icon}
                    </div>
                  </div>

                  <Card.Body className="p-4">
                    <h5 className="fw-bold mb-2">{workspace.title}</h5>
                    <p className="text-muted small mb-3">
                      {workspace.description}
                    </p>

                    <div className="d-flex align-items-center gap-3 mb-4 small text-muted">
                      <span>
                        <i className="bi bi-people me-1 text-primary"></i>
                        {workspace.capacity}
                      </span>
                      {workspace.features.map((feature, idx) => (
                        <span key={idx}>
                          <i className="bi bi-check-circle me-1 text-success"></i>
                          {feature}
                        </span>
                      ))}
                    </div>

                    <div className="d-flex align-items-center justify-content-between">
                      {workspace.price ? (
                        <div>
                          <h4 className="fw-bold text-primary mb-0">
                            {formatPrice(workspace.price)}
                            <small className="text-muted">/giờ</small>
                          </h4>
                        </div>
                      ) : (
                        <div>
                          <span className="text-muted small">Hết chỗ</span>
                        </div>
                      )}

                      <Button
                        variant="primary"
                        size="sm"
                        className="px-4 rounded-pill fw-semibold"
                        disabled={workspace.status === "Hết chỗ"}
                        as={Link}
                        to="/order-table"
                      >
                        Đặt
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Menu & Services Section */}
      <section id="menu" className="py-5 bg-white">
        <Container>
          <div className="text-center mb-5">
            <Badge bg="primary" className="px-3 py-2 rounded-pill mb-3">
              <i className="bi bi-cup-hot me-2"></i>
              THỰC ĐƠN & DỊCH VỤ
            </Badge>
            <h2 className="fw-bold mb-3">Đồ uống & Dịch vụ</h2>
            <p className="text-muted lead">
              Thưởng thức đồ uống ngon, sử dụng dịch vụ in ấn và thuê thiết bị
            </p>
          </div>

          {/* Category Filters */}
          <div className="d-flex justify-content-center mb-5">
            <div className="d-flex gap-2 flex-wrap">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={
                    selectedCategory === category.id
                      ? "primary"
                      : "outline-secondary"
                  }
                  size="sm"
                  className="px-4 py-2 rounded-pill fw-medium"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.icon && (
                    <span className="me-2">{category.icon}</span>
                  )}
                  {category.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Menu Items Grid */}
          <Row className="g-4">
            {filteredMenuItems.map((item) => (
              <Col key={item.id} lg={3} md={6}>
                <Card className="h-100 border-0 shadow-sm rounded-4 overflow-hidden hover-lift">
                  <div
                    className="card-header border-0 p-4 position-relative text-center"
                    style={{ backgroundColor: item.color }}
                  >
                    <Badge
                      bg="light"
                      text="primary"
                      className="position-absolute top-0 start-0 m-3 px-2 py-1 small"
                    >
                      Đồ uống
                    </Badge>

                    <div
                      className="menu-icon mb-3 mt-3"
                      style={{ fontSize: "4rem" }}
                    >
                      {item.icon}
                    </div>

                    <div className="price-badge position-absolute top-0 end-0 m-3">
                      <Badge bg="primary" className="px-3 py-2 fw-bold">
                        {formatPrice(item.price)}
                        {item.unit || ""}
                      </Badge>
                    </div>
                  </div>

                  <Card.Body className="p-4">
                    <h6 className="fw-bold mb-2">{item.name}</h6>
                    <p className="text-muted small mb-4">{item.description}</p>

                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <h5 className="fw-bold text-primary mb-0">
                          {formatPrice(item.price)}
                          {item.unit || ""}
                        </h5>
                      </div>

                      <Button
                        variant="primary"
                        size="sm"
                        className="rounded-circle p-2"
                        style={{ width: "40px", height: "40px" }}
                      >
                        <i className="bi bi-plus-lg"></i>
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-light py-5">
        <Container>
          <Row className="g-4">
            <Col lg={4}>
              <div className="d-flex align-items-center mb-3">
                <div
                  className="studyspace-logo me-2 d-flex align-items-center justify-content-center rounded-3"
                  style={{
                    background: "#6366f1",
                    width: "40px",
                    height: "40px",
                  }}
                >
                  <i className="bi bi-cup-hot-fill text-white"></i>
                </div>
                <span className="fw-bold text-white fs-5">StudySpace</span>
              </div>
              <p className="text-white-50 small mb-0">
                Không gian học tập & làm việc chuyên nghiệp, tiện nghi. Đặt chỗ
                online,
                <br />
                thanh toán QR, quản lý dễ dàng.
              </p>
            </Col>

            <Col lg={2}>
              <h6 className="fw-bold text-white mb-3">Liên kết</h6>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <a
                    href="#"
                    className="text-white-50 text-decoration-none small"
                  >
                    Trang chủ
                  </a>
                </li>
                <li className="mb-2">
                  <a
                    href="#"
                    className="text-white-50 text-decoration-none small"
                  >
                    Đặt chỗ
                  </a>
                </li>
                <li className="mb-2">
                  <a
                    href="#"
                    className="text-white-50 text-decoration-none small"
                  >
                    Thực đơn
                  </a>
                </li>
                <li className="mb-2">
                  <a
                    href="#"
                    className="text-white-50 text-decoration-none small"
                  >
                    Liên hệ
                  </a>
                </li>
              </ul>
            </Col>

            <Col lg={3}>
              <h6 className="fw-bold text-white mb-3">Dịch vụ</h6>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <span className="text-white-50 small">Ghế cá nhân</span>
                </li>
                <li className="mb-2">
                  <span className="text-white-50 small">Bàn nhóm</span>
                </li>
                <li className="mb-2">
                  <span className="text-white-50 small">Phòng họp</span>
                </li>
                <li className="mb-2">
                  <span className="text-white-50 small">Phòng VIP</span>
                </li>
              </ul>
            </Col>

            <Col lg={3}>
              <h6 className="fw-bold text-white mb-3">Liên hệ</h6>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <i className="bi bi-geo-alt me-2 text-primary"></i>
                  <span className="text-white-50 small">
                    123 Nguyễn Huệ, Q.1
                  </span>
                </li>
                <li className="mb-2">
                  <i className="bi bi-telephone me-2 text-primary"></i>
                  <span className="text-white-50 small">0909 888 999</span>
                </li>
                <li className="mb-2">
                  <i className="bi bi-envelope me-2 text-primary"></i>
                  <span className="text-white-50 small">
                    hello@studyspace.vn
                  </span>
                </li>
              </ul>
            </Col>
          </Row>

          <hr className="my-4 border-secondary" />
          <div className="text-center">
            <small className="text-white-50">
              © 2025 StudySpace. CSMS — Coworking Space Management System.
            </small>
          </div>
        </Container>
      </footer>
    </div>
  );
}
