import { Container, Navbar, Row, Col, Badge } from "react-bootstrap";
import { Link } from "react-router";

export function meta() {
  return [
    { title: "Thực đơn | Nexus Coffee" },
    {
      name: "description",
      content:
        "Khám phá thực đơn đa dạng với các loại cà phê nguyên chất, trà thanh mát và bánh ngọt hấp dẫn tại Nexus Coffee.",
    },
  ];
}

export default function Menu() {
  const menuCategories = [
    {
      title: "Cà Phê Đặc Sản",
      items: [
        {
          name: "Nexus Signature",
          desc: "Cà phê ủ lạnh kết hợp kem macchiato độc quyền",
          price: "65.000đ",
          isNew: true,
        },
        {
          name: "Classic Espresso",
          desc: "Cà phê nguyên chất pha máy chuẩn Ý",
          price: "45.000đ",
        },
        {
          name: "Caramel Macchiato",
          desc: "Espresso, sữa tươi và sốt caramel ngọt ngào",
          price: "55.000đ",
        },
        {
          name: "Cold Brew Original",
          desc: "Cà phê ủ lạnh 24h, hương vị mượt mà",
          price: "55.000đ",
        },
        {
          name: "Bạc Xỉu",
          desc: "Cà phê sữa đá truyền thống với lớp bọt sữa béo ngậy",
          price: "45.000đ",
        },
      ],
    },
    {
      title: "Trà & Trái Cây",
      items: [
        {
          name: "Matcha Latte",
          desc: "Trà xanh Nhật Bản kết hợp sữa tươi thơm béo",
          price: "55.000đ",
        },
        {
          name: "Peach Tea Mania",
          desc: "Trà đào cam sả thanh mát, giải nhiệt",
          price: "50.000đ",
          isBestSeller: true,
        },
        {
          name: "Trà Vải Cam Sả",
          desc: "Trà đen kết hợp vải thiều và cam sả tươi",
          price: "50.000đ",
        },
        {
          name: "Trà Oolong Hạt Sen",
          desc: "Trà oolong đậm vị cùng hạt sen bùi bùi",
          price: "55.000đ",
        },
      ],
    },
    {
      title: "Đá Xay & Khác",
      items: [
        {
          name: "Mocha Frappuccino",
          desc: "Cà phê đá xay với sốt chocolate và kem tươi",
          price: "60.000đ",
        },
        {
          name: "Matcha Đá Xay",
          desc: "Trà xanh đá xay mát lạnh",
          price: "60.000đ",
        },
        {
          name: "Chocolate Đá Xay",
          desc: "Chocolate đậm đặc xay cùng đá và kem tươi",
          price: "55.000đ",
        },
      ],
    },
    {
      title: "Bánh Ngọt",
      items: [
        {
          name: "Tiramisu",
          desc: "Bánh phô mai cà phê kiểu Ý",
          price: "45.000đ",
        },
        {
          name: "Cheesecake Trà Xanh",
          desc: "Bánh phô mai nướng vị trà xanh",
          price: "45.000đ",
        },
        {
          name: "Croissant",
          desc: "Bánh sừng bò bơ Pháp nướng giòn",
          price: "35.000đ",
        },
      ],
    },
  ];

  return (
    <div className="d-flex flex-column min-vh-100 bg-dark text-light font-monospace">
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
                to="/#spaces"
                className="text-decoration-none text-light fw-medium px-2 py-1 hover-primary transition-all text-uppercase"
              >
                Không gian
              </Link>
              <Link
                to="/menu"
                className="text-decoration-none text-warning fw-bold px-2 py-1 hover-primary transition-all text-uppercase"
              >
                Thực đơn
              </Link>
              <Link
                to="/#booking"
                className="text-decoration-none text-light fw-medium px-2 py-1 hover-primary transition-all text-uppercase"
              >
                Hướng dẫn đặt bàn
              </Link>
              <div className="d-flex gap-2 ms-lg-3 mt-2 mt-lg-0">
                <Link
                  to="/"
                  className="btn btn-outline-light px-4 rounded-0 fw-medium text-uppercase"
                >
                  Về trang chủ
                </Link>
              </div>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <header className="py-5 bg-black border-bottom border-secondary text-center">
        <Container>
          <h1 className="display-4 fw-bold text-white text-uppercase mb-3">
            Thực Đơn
          </h1>
          <p
            className="lead text-secondary mx-auto"
            style={{ maxWidth: "600px" }}
          >
            Khám phá hương vị đặc trưng được pha chế từ những hạt cà phê tuyển
            chọn và nguyên liệu tươi ngon nhất.
          </p>
        </Container>
      </header>

      <main className="py-5 flex-grow-1">
        <Container>
          {menuCategories.map((category, idx) => (
            <div key={idx} className="mb-5 pb-4 border-bottom border-secondary">
              <h2 className="text-warning text-uppercase fw-bold mb-4 d-flex align-items-center">
                <span className="me-3">{category.title}</span>
                <div
                  className="flex-grow-1 bg-secondary"
                  style={{ height: "1px", opacity: 0.3 }}
                ></div>
              </h2>
              <Row className="g-4">
                {category.items.map((item, itemIdx) => (
                  <Col md={6} lg={4} key={itemIdx}>
                    <div className="p-4 border border-secondary h-100 bg-black hover-bg-dark transition-all d-flex flex-column position-relative overflow-hidden">
                      {item.isNew && (
                        <Badge
                          bg="danger"
                          className="position-absolute top-0 end-0 m-2 rounded-0 text-uppercase"
                        >
                          Mới
                        </Badge>
                      )}
                      {item.isBestSeller && (
                        <Badge
                          bg="warning"
                          text="dark"
                          className="position-absolute top-0 end-0 m-2 rounded-0 text-uppercase"
                        >
                          Bán chạy
                        </Badge>
                      )}
                      <div className="d-flex justify-content-between align-items-start mb-3 mt-2">
                        <h5 className="text-white text-uppercase mb-0 pe-3">
                          {item.name}
                        </h5>
                        <span className="text-warning fw-bold" style={{ whiteSpace: "nowrap" }}>
                          {item.price}
                        </span>
                      </div>
                      <p className="text-secondary mb-0 flex-grow-1 small">
                        {item.desc}
                      </p>
                    </div>
                  </Col>
                ))}
              </Row>
            </div>
          ))}
        </Container>
      </main>

      <footer className="bg-black text-secondary py-5 mt-auto border-top border-secondary">
        <Container>
          <Row className="gy-4 align-items-center">
            <Col md={4} className="text-center text-md-start">
              <div className="d-flex align-items-center justify-content-center justify-content-md-start mb-3">
                <i className="bi bi-cup-hot-fill me-2 fs-4 text-white"></i>
                <span className="fw-bold text-white fs-5">NEXUS COFFEE</span>
              </div>
              <p className="small mb-0">
                © 2026 NEXUS COFFEE. ALL RIGHTS RESERVED.
              </p>
            </Col>
            <Col md={8} className="text-center text-md-end">
              <div className="d-flex gap-4 justify-content-center justify-content-md-end">
                <a
                  href="#"
                  className="text-secondary text-decoration-none hover-white transition-all text-uppercase small fw-bold"
                >
                  Facebook
                </a>
                <a
                  href="#"
                  className="text-secondary text-decoration-none hover-white transition-all text-uppercase small fw-bold"
                >
                  Instagram
                </a>
                <a
                  href="#"
                  className="text-secondary text-decoration-none hover-white transition-all text-uppercase small fw-bold"
                >
                  Tiktok
                </a>
              </div>
            </Col>
          </Row>
        </Container>
      </footer>
    </div>
  );
}
