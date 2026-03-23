import { useState, useEffect } from "react";

import {
  Button,
  Card,
  Col,
  Container,
  Row,
  Badge,
  Alert,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectCards } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-cards";
import GuestCustomerNavbar from "../../components/common/GuestCustomerNavbar";

export function meta() {
  return [
    { title: "Coworking Space | Không gian học tập lý tưởng" },
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
    icon: "bi-person-workspace",
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
    icon: "bi-people-fill",
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
    icon: "bi-people-fill",
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
    icon: "bi-easel",
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
    icon: "bi-gem",
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
    icon: "bi-cup-straw",
    category: "drink",
    color: "rgba(251, 191, 36, 0.1)",
  },
  {
    id: 3,
    name: "Latte",
    description: "Espresso đậm đà kết hợp sữa tươi béo ngậy",
    price: 40000,
    icon: "bi-cup",
    category: "drink",
    color: "rgba(156, 163, 175, 0.1)",
  },
  {
    id: 4,
    name: "Americano",
    description: "Espresso pha nước, vị đắm thanh",
    price: 35000,
    icon: "bi-cup-hot",
    category: "drink",
    color: "rgba(99, 102, 241, 0.1)",
  },
  {
    id: 5,
    name: "Croissant bơ Pháp",
    description: "Bánh sừng bò bơ Pháp nướng giòn thơm",
    price: 25000,
    icon: "bi-bread-slice",
    category: "food",
    color: "rgba(251, 191, 36, 0.1)",
  },
  {
    id: 6,
    name: "Bánh mì chả lụa",
    description: "Bánh mì nóng giòn ăn kèm chả lụa và pate gia truyền",
    price: 30000,
    icon: "bi-bag",
    category: "food",
    color: "rgba(59, 130, 246, 0.1)",
  },
  {
    id: 7,
    name: "Tiramisu Cổ Điển",
    description: "Bánh phô mai Mascarpone hương cà phê và rượu Rhum nhẹ",
    price: 45000,
    icon: "bi-bag",
    category: "food",
    color: "rgba(34, 197, 94, 0.1)",
  },
  {
    id: 8,
    name: "Muffin Sô-cô-la Chip",
    description: "Bánh muffin nướng mềm xốp, thơm mùi cacao với những hạt sô-cô-la chip giòn",
    price: 30000,
    icon: "bi-bag",
    category: "food",
    color: "rgba(139, 92, 246, 0.1)",
  },
];

const categories = [
  { id: "all", label: "Tất cả", icon: "" },
  { id: "drink", label: "Đồ uống", icon: "bi-cup-hot" },
  { id: "food", label: "Đồ ăn", icon: "bi-bread-slice" },
  { id: "print", label: "In ấn", icon: "bi-printer" },
  { id: "equipment", label: "Thiết bị", icon: "bi-tools" },
];

export default function Home() {
  const navigate = useNavigate();

  // Auto-redirect Admin/Staff về dashboard của họ
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const user = JSON.parse(stored);
        const role = (user?.role || "").toLowerCase();
        if (role === "admin") navigate("/admin-dashboard/users", { replace: true });
        else if (role === "staff") navigate("/staff-dashboard", { replace: true });

      }
    } catch {
      // ignore parse errors
    }
  }, [navigate]);

  // const [selectedCategory, setSelectedCategory] = useState("all");


  // const filteredMenuItems =
  //   selectedCategory === "all"
  //     ? menuItems
  //     : menuItems.filter((item) => item.category === selectedCategory);

  const formatPrice = (price, unit = "đ") => {
    return new Intl.NumberFormat("vi-VN").format(price) + unit;
  };

  return (
    <div className="min-vh-100 bg-light">
      {/* Header Navigation */}
      <GuestCustomerNavbar activeItem="home" />

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
                <Swiper
                  modules={[EffectCards, Autoplay]}
                  effect="cards"
                  grabCursor={true}
                  autoplay={{
                    delay: 3000,
                    disableOnInteraction: false,
                  }}
                  loop={true}
                  cardsEffect={{
                    rotate: true,
                    slideShadows: true,
                  }}
                  slidesPerView="auto"
                  centeredSlides={true}
                  className="workspace-swiper"
                  style={{
                    maxWidth: "400px",
                    margin: "0 auto",
                    height: "400px",
                  }}
                >
                  {workspaceOptions.map((workspace) => (
                    <SwiperSlide key={workspace.id} className="workspace-slide">
                      <Card
                        className="border-0 rounded-4 overflow-hidden h-100 workspace-card"
                        style={{
                          maxWidth: "320px",
                          backdropFilter: "blur(10px)",
                          background: "rgba(255, 255, 255, 0.95)",
                          border: "1px solid rgba(255, 255, 255, 0.3)",
                          boxShadow: "0 10px 20px rgba(0, 0, 0, 0.3)",
                        }}
                      >
                        <Card.Header className="border-0 p-3 bg-transparent">
                          <div className="d-flex justify-content-between align-items-start">
                            <Badge bg="success" className="px-3 py-2 fw-normal">
                              {workspace.badge}
                            </Badge>
                            <Badge
                              bg={workspace.statusColor}
                              className="px-2 py-1"
                            >
                              {workspace.status}
                            </Badge>
                          </div>
                        </Card.Header>

                        <Card.Body className="text-center p-4">
                          <div
                            className="workspace-icon mb-3"
                            style={{ fontSize: "3rem", color: "#6366f1" }}
                          >
                            <i className={workspace.icon}></i>
                          </div>
                          <h5 className="fw-bold mb-2 text-dark">
                            {workspace.title}
                          </h5>
                          <p className="text-muted small mb-3">
                            {workspace.description}
                          </p>

                          {workspace.price ? (
                            <h4 className="fw-bold text-primary mb-0">
                              {formatPrice(workspace.price)}
                              <small>/giờ</small>
                            </h4>
                          ) : (
                            <div className="mb-0">
                              <span className="text-muted small">Hết chỗ</span>
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Menu & Services Section */}
      <section id="menu" className="py-5 bg-white">
        <Container>
          <div className="text-center mb-5">
            <Badge bg="primary" className="px-3 py-2 rounded-pill mb-3">
              <i className="bi bi-cup-hot me-2"></i>
              THỰC ĐƠN
            </Badge>
            <h2 className="fw-bold mb-3">Đồ ăn & Đồ uống</h2>
            <p className="text-muted lead">
              Thưởng thức đồ uống ngon, đồ ăn đa dạng
            </p>
          </div>

          {/* Menu Items Grid - Chỉ lấy 8 món đầu tiên */}
          <Row className="g-4">
            {menuItems.slice(0, 8).map((item) => (
              <Col key={item.id} lg={3} md={6}>
                <Card 
                  className="h-100 border-0 shadow-sm rounded-4 overflow-hidden hover-lift"
                  onClick={() => navigate('/menu')} // 👉 Đổi '/order' thành route thực tế của bạn
                  style={{ cursor: "pointer" }}      // 👉 Thêm con trỏ chuột khi hover để báo hiệu có thể click
                >
                  <div
                    className="card-header border-0 p-4 position-relative text-center"
                    style={{ backgroundColor: item.color }}
                  >
                    <Badge
                      bg="light"
                      text="primary"
                      className="position-absolute top-0 start-0 m-3 px-2 py-1 small"
                    >
                      {item.category === "drink" ? "Đồ uống" : item.category === "food" ? "Đồ ăn" : item.category === "print" ? "In ấn" : "Thiết bị"}
                    </Badge>

                    <div
                      className="menu-icon mb-3 mt-3"
                      style={{ fontSize: "4rem" }}
                    >
                      <i className={item.icon}></i>
                    </div>

                    <div className="price-badge position-absolute top-0 end-0 m-3">
                      <Badge bg="primary" className="px-3 py-2 fw-bold">
                        {formatPrice(item.price)}
                        {item.unit || ""}
                      </Badge>
                    </div>
                  </div>

                  <Card.Body className="p-4 d-flex flex-column text-center">
                    <h6 className="fw-bold mb-2">{item.name}</h6>
                    <p className="text-muted small mb-4 flex-grow-1">{item.description}</p>

                    {/* Đã bỏ nút (+), căn giữa giá tiền cho đẹp mắt */}
                    <h5 className="fw-bold text-primary mb-0">
                      {formatPrice(item.price)}
                      {item.unit || ""}
                    </h5>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Nút Xem thêm */}
          <div className="text-center mt-5">
            <Button
              variant="outline-primary"
              size="lg"
              className="px-5 py-3 rounded-pill fw-bold"
              onClick={() => navigate('/menu')} // 👉 Đổi '/order' thành route thực tế của bạn
            >
              Xem thêm <i className="bi bi-arrow-right ms-2"></i>
            </Button>
          </div>
        </Container>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-light py-5">
        <Container>
          <Row className="g-4">
            <Col lg={4}>
              <div className="d-flex align-items-center mb-3">
                <div
                  className="Coworking Space-logo me-2 d-flex align-items-center justify-content-center rounded-3"
                  style={{
                    background: "#6366f1",
                    width: "40px",
                    height: "40px",
                  }}
                >
                  <i className="bi bi-cup-hot-fill text-white"></i>
                </div>
                <span className="fw-bold text-white fs-5">Coworking Space</span>
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
                    hello@Coworking Space.vn
                  </span>
                </li>
              </ul>
            </Col>
          </Row>

          <hr className="my-4 border-secondary" />
          <div className="text-center">
            <small className="text-white-50">
              © 2025 Coworking Space. CSMS — Coworking Space Management System.
            </small>
          </div>
        </Container>
      </footer>
    </div>
  );
}

