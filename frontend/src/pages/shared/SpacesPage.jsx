import { useState } from "react";
import {
  Badge,
  Button,
  Col,
  Container,
  Modal,
  Navbar,
  Row,
} from "react-bootstrap";
import { Link } from "react-router";
import AuthNavActions from "../../components/common/AuthNavActions";

export function meta() {
  return [
    { title: "Nexus Coffee | Không gian & Thực đơn" },
    {
      name: "description",
      content:
        "Khám phá không gian cà phê độc đáo và thực đơn phong phú tại Nexus Coffee.",
    },
  ];
}

const spaceImages = [
  {
    id: 1,
    src: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80",
    title: "Khu vực Lounge",
    desc: "Không gian mở thoáng đãng với ghế sofa êm ái, lý tưởng để thư giãn và trò chuyện.",
    tag: "Lounge",
  },
  {
    id: 2,
    src: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80",
    title: "Góc làm việc yên tĩnh",
    desc: "Khu vực riêng tư, ánh sáng tự nhiên chan hòa, phù hợp cho công việc tập trung.",
    tag: "Workspace",
  },
  {
    id: 3,
    src: "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=800&q=80",
    title: "Bàn tròn nhóm",
    desc: "Bàn lớn phù hợp cho các buổi họp nhóm nhỏ hoặc làm việc cùng bạn bè.",
    tag: "Nhóm",
  },
  {
    id: 4,
    src: "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=800&q=80",
    title: "Không gian ngoài trời",
    desc: "Ban công xanh mát, hít thở không khí trong lành giữa lòng thành phố.",
    tag: "Ngoài trời",
  },
  {
    id: 5,
    src: "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800&q=80",
    title: "Khu vực cà phê chính",
    desc: "Thiết kế hiện đại, ấm cúng — nơi mọi khoảnh khắc đều trở nên đặc biệt.",
    tag: "Chính",
  },
  {
    id: 6,
    src: "https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&q=80",
    title: "Phòng riêng tư",
    desc: "Phòng kính cách âm cao cấp, lý tưởng cho cuộc họp quan trọng.",
    tag: "VIP",
  },
];

const foodImages = [
  {
    id: 1,
    src: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80",
    title: "Cà phê Espresso",
    desc: "Đậm đà, nguyên chất từ hạt cà phê Arabica cao nguyên.",
    tag: "Cà phê",
    price: "45.000đ",
  },
  {
    id: 2,
    src: "https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=800&q=80",
    title: "Matcha Latte",
    desc: "Trà xanh Nhật Bản hòa quyện cùng sữa tươi béo ngậy.",
    tag: "Trà",
    price: "65.000đ",
  },
  {
    id: 3,
    src: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&q=80",
    title: "Bánh croissant bơ",
    desc: "Nhập khẩu từ lò bánh Pháp, vỏ giòn tan, nhân bơ thơm lừng.",
    tag: "Bánh ngọt",
    price: "55.000đ",
  },
  {
    id: 4,
    src: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800&q=80",
    title: "Toast bơ mật ong",
    desc: "Bánh mì nướng vàng ruộm, phủ bơ và mật ong thượng hạng.",
    tag: "Ăn sáng",
    price: "50.000đ",
  },
  {
    id: 5,
    src: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&q=80",
    title: "Smoothie trái cây",
    desc: "Hỗn hợp trái cây tươi xay mịn, thơm ngon và bổ dưỡng.",
    tag: "Nước uống",
    price: "70.000đ",
  },
  {
    id: 6,
    src: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&q=80",
    title: "Bánh cheesecake",
    desc: "Cheesecake New York style mịn màng, phủ berry tươi.",
    tag: "Bánh ngọt",
    price: "80.000đ",
  },
  {
    id: 7,
    src: "https://images.unsplash.com/photo-1518057111178-44a106bad636?w=800&q=80",
    title: "Cappuccino",
    desc: "Lớp foam sữa mềm mịn ôm lấy espresso đậm đà.",
    tag: "Cà phê",
    price: "55.000đ",
  },
  {
    id: 8,
    src: "https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=800&q=80",
    title: "Salad Cesar",
    desc: "Rau xanh tươi mát, phô mai parmesan, sốt Cesar đặc biệt.",
    tag: "Ăn nhẹ",
    price: "95.000đ",
  },
];

const TAG_COLORS = {
  Lounge: "primary",
  Workspace: "success",
  Nhóm: "info",
  "Ngoài trời": "success",
  Chính: "secondary",
  VIP: "warning",
  "Cà phê": "warning",
  Trà: "success",
  "Bánh ngọt": "danger",
  "Ăn sáng": "info",
  "Nước uống": "primary",
  "Ăn nhẹ": "secondary",
};

export default function SpacesPage() {
  const [lightbox, setLightbox] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  const spaceTags = ["all", ...new Set(spaceImages.map((i) => i.tag))];
  const foodTags = ["all", ...new Set(foodImages.map((i) => i.tag))];

  const [spaceFilter, setSpaceFilter] = useState("all");
  const [foodFilter, setFoodFilter] = useState("all");

  const filteredSpaces =
    spaceFilter === "all"
      ? spaceImages
      : spaceImages.filter((i) => i.tag === spaceFilter);

  const filteredFood =
    foodFilter === "all"
      ? foodImages
      : foodImages.filter((i) => i.tag === foodFilter);

  return (
    <div className="d-flex flex-column min-vh-100 bg-dark text-light font-monospace">
      {/* Navbar */}
      <Navbar
        expand="lg"
        className="bg-dark border-bottom border-secondary sticky-top py-3"
        variant="dark"
      >
        <Container>
          <Navbar.Brand
            as={Link}
            to="/"
            className="fw-bold text-white fs-4 d-flex align-items-center"
          >
            <i className="bi bi-cup-hot-fill me-2 fs-3"></i>
            NEXUS COFFEE
          </Navbar.Brand>
          <Navbar.Toggle
            aria-controls="basic-navbar-nav"
            className="border-0 shadow-none"
          />
          <Navbar.Collapse id="basic-navbar-nav">
            <div className="ms-auto d-flex flex-column flex-lg-row gap-4 align-items-lg-center mt-3 mt-lg-0">
              <Link
                to="/spaces"
                className="text-decoration-none text-warning fw-bold px-2 py-1 text-uppercase"
              >
                Không gian
              </Link>
              <Link
                to="/order-table"
                className="text-decoration-none text-light fw-medium px-2 py-1 hover-primary transition-all text-uppercase"
              >
                Đặt bàn
              </Link>
              <Link
                to="/menu"
                className="text-decoration-none text-light fw-medium px-2 py-1 hover-primary transition-all text-uppercase"
              >
                Thực đơn
              </Link>
              <AuthNavActions />
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Hero */}
      <section
        className="position-relative d-flex align-items-center justify-content-center text-center"
        style={{
          minHeight: 420,
          background:
            "linear-gradient(135deg, #0f0c29 0%, #1a1a2e 50%, #16213e 100%)",
          overflow: "hidden",
        }}
      >
        {/* decorative blobs */}
        <div
          className="position-absolute rounded-circle"
          style={{
            width: 500,
            height: 500,
            background:
              "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
            top: -100,
            left: -100,
          }}
        />
        <div
          className="position-absolute rounded-circle"
          style={{
            width: 400,
            height: 400,
            background:
              "radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)",
            bottom: -80,
            right: -80,
          }}
        />
        <Container className="position-relative py-5">
          <div className="mb-3">
            <Badge
              bg="warning"
              text="dark"
              className="px-3 py-2 rounded-pill fw-semibold"
              style={{ letterSpacing: 2, fontSize: 11 }}
            >
              NEXUS COFFEE
            </Badge>
          </div>
          <h1
            className="display-4 fw-bold mb-3"
            style={{ letterSpacing: -1, lineHeight: 1.1 }}
          >
            Không gian &amp; <span style={{ color: "#f59e0b" }}>Thực đơn</span>
          </h1>
          <p
            className="text-secondary fs-5 mb-4"
            style={{ maxWidth: 540, margin: "0 auto" }}
          >
            Trải nghiệm không gian cà phê tinh tế và thực đơn đa dạng, được chắt
            lọc từ những nguyên liệu tươi ngon nhất.
          </p>
          <div className="d-flex gap-3 justify-content-center flex-wrap">
            <Button
              as={Link}
              to="/order-table"
              variant="warning"
              size="lg"
              className="rounded-0 px-5 py-3 fw-bold text-uppercase text-dark"
            >
              Đặt bàn ngay
            </Button>
            <Button
              as="a"
              href="#gallery-spaces"
              variant="outline-light"
              size="lg"
              className="rounded-0 px-5 py-3 fw-bold text-uppercase"
            >
              Xem thêm
            </Button>
          </div>
        </Container>
      </section>

      {/* Space Gallery */}
      <section
        id="gallery-spaces"
        className="py-5"
        style={{ background: "#111827" }}
      >
        <Container>
          <div className="text-center mb-5">
            <Badge
              bg="primary"
              className="px-3 py-2 rounded-pill mb-3"
              style={{ letterSpacing: 2, fontSize: 11 }}
            >
              KHÔNG GIAN
            </Badge>
            <h2 className="fw-bold display-6 mb-2">Không gian của chúng tôi</h2>
            <p className="text-secondary">
              Mỗi góc nhỏ đều được thiết kế để mang lại trải nghiệm tốt nhất cho
              bạn
            </p>
          </div>

          {/* Filter pills */}
          <div className="d-flex flex-wrap gap-2 justify-content-center mb-4">
            {spaceTags.map((tag) => (
              <Button
                key={tag}
                size="sm"
                variant={spaceFilter === tag ? "primary" : "outline-secondary"}
                className="rounded-pill px-3 fw-medium"
                onClick={() => setSpaceFilter(tag)}
              >
                {tag === "all" ? "Tất cả" : tag}
              </Button>
            ))}
          </div>

          <Row className="g-4">
            {filteredSpaces.map((img, idx) => (
              <Col key={img.id} xs={12} sm={6} lg={4}>
                <div
                  className="position-relative rounded-3 overflow-hidden"
                  style={{
                    cursor: "pointer",
                    height: idx % 3 === 0 ? 320 : 260,
                    background: "#1f2937",
                  }}
                  onClick={() => setLightbox({ type: "space", item: img })}
                >
                  <img
                    src={img.src}
                    alt={img.title}
                    className="w-100 h-100"
                    style={{
                      objectFit: "cover",
                      transition: "transform 0.4s ease",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.transform = "scale(1.07)")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.transform = "scale(1)")
                    }
                  />
                  {/* overlay */}
                  <div
                    className="position-absolute bottom-0 start-0 end-0 p-3"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)",
                    }}
                  >
                    <Badge
                      bg={TAG_COLORS[img.tag] || "secondary"}
                      className="mb-1 px-2 py-1 rounded-pill"
                      style={{ fontSize: 10 }}
                    >
                      {img.tag}
                    </Badge>
                    <div
                      className="fw-bold text-white"
                      style={{ fontSize: 15 }}
                    >
                      {img.title}
                    </div>
                  </div>
                  {/* zoom icon */}
                  <div
                    className="position-absolute top-0 end-0 m-2 bg-dark bg-opacity-50 rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: 34, height: 34 }}
                  >
                    <i
                      className="bi bi-zoom-in text-white"
                      style={{ fontSize: 14 }}
                    ></i>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Divider */}
      <div
        className="py-4 text-center"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(245,158,11,0.15), transparent)",
        }}
      >
        <i
          className="bi bi-cup-hot text-warning opacity-50"
          style={{ fontSize: 32 }}
        ></i>
      </div>

      {/* Food Gallery */}
      <section className="py-5" style={{ background: "#0f172a" }}>
        <Container>
          <div className="text-center mb-5">
            <Badge
              bg="warning"
              text="dark"
              className="px-3 py-2 rounded-pill mb-3"
              style={{ letterSpacing: 2, fontSize: 11 }}
            >
              THỰC ĐƠN
            </Badge>
            <h2 className="fw-bold display-6 mb-2">Đồ ăn &amp; Thức uống</h2>
            <p className="text-secondary">
              Thưởng thức hương vị đặc sắc được chế biến từ nguyên liệu tươi
              ngon hàng ngày
            </p>
          </div>

          {/* Filter pills */}
          <div className="d-flex flex-wrap gap-2 justify-content-center mb-4">
            {foodTags.map((tag) => (
              <Button
                key={tag}
                size="sm"
                variant={foodFilter === tag ? "warning" : "outline-secondary"}
                className={`rounded-pill px-3 fw-medium ${foodFilter === tag ? "text-dark" : ""}`}
                onClick={() => setFoodFilter(tag)}
              >
                {tag === "all" ? "Tất cả" : tag}
              </Button>
            ))}
          </div>

          <Row className="g-4">
            {filteredFood.map((item) => (
              <Col key={item.id} xs={12} sm={6} md={4} lg={3}>
                <div
                  className="rounded-3 overflow-hidden h-100"
                  style={{
                    background: "#1e293b",
                    cursor: "pointer",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                  onClick={() => setLightbox({ type: "food", item })}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow =
                      "0 12px 32px rgba(0,0,0,0.4)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div style={{ height: 200, overflow: "hidden" }}>
                    <img
                      src={item.src}
                      alt={item.title}
                      className="w-100 h-100"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <div className="p-3">
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <Badge
                        bg={TAG_COLORS[item.tag] || "secondary"}
                        className="px-2 py-1 rounded-pill"
                        style={{ fontSize: 10 }}
                      >
                        {item.tag}
                      </Badge>
                      <span
                        className="fw-bold"
                        style={{ color: "#f59e0b", fontSize: 14 }}
                      >
                        {item.price}
                      </span>
                    </div>
                    <h6 className="fw-bold text-white mb-1 mt-2">
                      {item.title}
                    </h6>
                    <p
                      className="text-secondary mb-0"
                      style={{ fontSize: 13, lineHeight: 1.5 }}
                    >
                      {item.desc}
                    </p>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* CTA */}
      <section
        className="py-5 text-center"
        style={{
          background:
            "linear-gradient(135deg, #1e3a5f 0%, #1a1a2e 50%, #3b1a2e 100%)",
        }}
      >
        <Container>
          <h2 className="fw-bold display-6 mb-3">Sẵn sàng trải nghiệm?</h2>
          <p className="text-secondary mb-4 fs-5">
            Đặt bàn ngay hôm nay và tận hưởng không gian cà phê tuyệt vời
          </p>
          <Button
            as={Link}
            to="/order-table"
            variant="warning"
            size="lg"
            className="rounded-0 px-5 py-3 fw-bold text-uppercase text-dark me-3"
          >
            Đặt bàn ngay
          </Button>
          <Button
            as={Link}
            to="/menu"
            variant="outline-light"
            size="lg"
            className="rounded-0 px-5 py-3 fw-bold text-uppercase"
          >
            Xem thực đơn
          </Button>
        </Container>
      </section>

      {/* Footer */}
      <footer className="bg-dark border-top border-secondary py-4 mt-auto">
        <Container>
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div className="fw-bold text-white d-flex align-items-center gap-2">
              <i className="bi bi-cup-hot-fill text-warning"></i>
              NEXUS COFFEE
            </div>
            <div className="d-flex gap-4 flex-wrap">
              <Link
                to="/"
                className="text-secondary text-decoration-none small"
              >
                Trang chủ
              </Link>
              <Link
                to="/spaces"
                className="text-primary text-decoration-none small fw-medium"
              >
                Không gian
              </Link>
              <Link
                to="/menu"
                className="text-secondary text-decoration-none small"
              >
                Thực đơn
              </Link>
              <Link
                to="/order-table"
                className="text-secondary text-decoration-none small"
              >
                Đặt bàn
              </Link>
            </div>
            <div className="text-secondary small">
              © 2026 Nexus Coffee. All rights reserved.
            </div>
          </div>
        </Container>
      </footer>

      {/* Lightbox Modal */}
      <Modal
        show={!!lightbox}
        onHide={() => setLightbox(null)}
        centered
        size="lg"
        contentClassName="bg-dark border border-secondary"
      >
        {lightbox && (
          <>
            <Modal.Header
              closeButton
              closeVariant="white"
              className="border-secondary"
            >
              <Modal.Title className="text-white fw-bold">
                {lightbox.item.title}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-0">
              <img
                src={lightbox.item.src.replace("w=800", "w=1200")}
                alt={lightbox.item.title}
                className="w-100"
                style={{ maxHeight: 520, objectFit: "cover" }}
              />
              <div className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <Badge
                    bg={TAG_COLORS[lightbox.item.tag] || "secondary"}
                    className="px-3 py-2 rounded-pill"
                  >
                    {lightbox.item.tag}
                  </Badge>
                  {lightbox.type === "food" && (
                    <span className="fw-bold fs-5" style={{ color: "#f59e0b" }}>
                      {lightbox.item.price}
                    </span>
                  )}
                </div>
                <p className="text-secondary mt-2 mb-0">{lightbox.item.desc}</p>
              </div>
            </Modal.Body>
            <Modal.Footer className="border-secondary">
              {lightbox.type === "space" && (
                <Button
                  as={Link}
                  to="/order-table"
                  variant="warning"
                  className="text-dark fw-bold rounded-pill px-4"
                  onClick={() => setLightbox(null)}
                >
                  Đặt bàn tại đây
                </Button>
              )}
              <Button
                variant="outline-secondary"
                className="rounded-pill px-4"
                onClick={() => setLightbox(null)}
              >
                Đóng
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>
    </div>
  );
}
