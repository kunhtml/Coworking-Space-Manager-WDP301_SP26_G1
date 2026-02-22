import { useState, useRef, useEffect } from "react";
import { animate, stagger } from "animejs";
import type { Route } from "./+types/home";
import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  Navbar,
  Row,
  Modal,
  Form,
} from "react-bootstrap";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Nexus Coffee | Đặt bàn & Không gian làm việc" },
    {
      name: "description",
      content:
        "Hệ thống đặt bàn và quản lý không gian tại Nexus Coffee. Trải nghiệm cà phê đích thực và không gian làm việc lý tưởng.",
    },
  ];
}

export default function Home() {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const menuScrollRef = useRef<HTMLDivElement>(null);

  const handleClose = () => setShowBookingModal(false);
  const handleShow = () => setShowBookingModal(true);

  useEffect(() => {
    animate(".hero-letter", {
      rotateX: [-90, 0],
      translateY: [50, 0],
      opacity: [0, 1],
      ease: "outElastic(1, .6)",
      duration: 1500,
      delay: stagger(40),
    });
  }, []);

  const scrollMenu = (direction: "left" | "right") => {
    if (menuScrollRef.current) {
      const scrollAmount = 350; // Adjust based on card width
      menuScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

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
              <a
                href="#spaces"
                className="text-decoration-none text-light fw-medium px-2 py-1 hover-primary transition-all text-uppercase"
              >
                Không gian
              </a>
              <a
                href="#menu"
                className="text-decoration-none text-light fw-medium px-2 py-1 hover-primary transition-all text-uppercase"
              >
                Thực đơn
              </a>
              <a
                href="#booking"
                className="text-decoration-none text-light fw-medium px-2 py-1 hover-primary transition-all text-uppercase"
              >
                Hướng dẫn đặt bàn
              </a>
              <div className="d-flex gap-2 ms-lg-3 mt-2 mt-lg-0">
                <Button
                  variant="outline-light"
                  className="px-4 rounded-0 fw-medium text-uppercase"
                  onClick={handleShow}
                >
                  Đặt bàn ngay
                </Button>
              </div>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <header
        className="py-5 position-relative overflow-hidden"
        style={{
          minHeight: "80vh",
          display: "flex",
          alignItems: "center",
          background: "linear-gradient(135deg, #121212 0%, #000000 100%)",
        }}
      >
        <Container
          className="position-relative text-center"
          style={{ zIndex: 1 }}
        >
          <p
            className="text-uppercase tracking-widest mb-4 text-secondary"
            style={{ letterSpacing: "0.5em" }}
          >
            H ư ơ n g v ị đ ậ m đ à . K h ô n g g i a n c ự c c h i l l .
          </p>
          <h1
            className="display-2 fw-bold text-white mb-4 lh-sm text-uppercase"
            style={{ perspective: "600px" }}
          >
            {"Trải nghiệm cà phê".split("").map((char, i) => (
              <span
                key={`line1-${i}`}
                className="hero-letter"
                style={{
                  display: "inline-block",
                  opacity: 0,
                  whiteSpace: "pre",
                }}
              >
                {char}
              </span>
            ))}
            <br />
            {"đích thực".split("").map((char, i) => (
              <span
                key={`line2-${i}`}
                className="hero-letter"
                style={{
                  display: "inline-block",
                  opacity: 0,
                  whiteSpace: "pre",
                }}
              >
                {char}
              </span>
            ))}
          </h1>
          <p
            className="lead text-secondary mb-5 mx-auto"
            style={{ maxWidth: "800px" }}
          >
            Khám phá không gian thưởng thức cà phê độc đáo với thiết kế hiện
            đại, yên tĩnh. Hệ thống đặt bàn trực tuyến giúp bạn giữ chỗ nhanh
            chóng cho buổi hẹn hò hay làm việc hiệu quả.
          </p>
          <div className="d-flex flex-wrap gap-3 justify-content-center">
            <Button
              variant="light"
              size="lg"
              className="rounded-0 px-5 py-3 fw-bold text-uppercase"
              onClick={handleShow}
            >
              Đặt bàn ngay
            </Button>
            <Button
              href="#spaces"
              variant="outline-light"
              size="lg"
              className="rounded-0 px-5 py-3 fw-bold text-uppercase"
            >
              Khám phá không gian
            </Button>
          </div>
          <div className="mt-5 pt-5 text-secondary opacity-50">
            <i className="bi bi-cup-hot" style={{ fontSize: "120px" }}></i>
          </div>
        </Container>
      </header>

      <section
        id="booking"
        className="py-5 border-top border-secondary bg-black"
      >
        <Container>
          <Row className="align-items-center g-5">
            <Col lg={6}>
              <h2 className="display-5 fw-bold text-white mb-4 text-uppercase">
                Đặt bàn dễ dàng.
                <br />
                Thưởng thức trọn vẹn.
              </h2>
              <p className="lead text-secondary mb-5">
                Không còn lo hết chỗ vào những giờ cao điểm. Hệ thống đặt bàn
                thông minh của chúng tôi giúp bạn chọn chính xác vị trí ngồi yêu
                thích chỉ với vài thao tác đơn giản.
              </p>
              <div className="d-flex flex-column gap-4">
                <div className="d-flex align-items-start">
                  <span className="text-secondary fs-4 me-3 fw-bold">01</span>
                  <div>
                    <h5 className="text-white mb-1">
                      Chọn vị trí ngồi theo sơ đồ quán.
                    </h5>
                  </div>
                </div>
                <div className="d-flex align-items-start">
                  <span className="text-secondary fs-4 me-3 fw-bold">02</span>
                  <div>
                    <h5 className="text-white mb-1">
                      Đặt trước đồ uống, không cần chờ đợi.
                    </h5>
                  </div>
                </div>
                <div className="d-flex align-items-start">
                  <span className="text-secondary fs-4 me-3 fw-bold">03</span>
                  <div>
                    <h5 className="text-white mb-1">
                      Tích điểm thành viên tự động.
                    </h5>
                  </div>
                </div>
              </div>
            </Col>
            <Col lg={6}>
              <Card className="bg-dark border-secondary rounded-0">
                <Card.Header className="border-secondary bg-black text-secondary d-flex justify-content-between align-items-center">
                  <span>booking_receipt.txt</span>
                  <div className="d-flex gap-2">
                    <div
                      className="rounded-circle bg-danger"
                      style={{ width: "12px", height: "12px" }}
                    ></div>
                    <div
                      className="rounded-circle bg-warning"
                      style={{ width: "12px", height: "12px" }}
                    ></div>
                    <div
                      className="rounded-circle bg-success"
                      style={{ width: "12px", height: "12px" }}
                    ></div>
                  </div>
                </Card.Header>
                <Card.Body className="p-4">
                  <pre
                    className="mb-0 text-light"
                    style={{ fontSize: "0.9rem" }}
                  >
                    <code>
                      <span className="text-secondary">
                        ================================
                      </span>
                      <br />
                      <span className="text-info fw-bold">
                        {" "}
                        NEXUS COFFEE BOOKING{" "}
                      </span>
                      <br />
                      <span className="text-secondary">
                        ================================
                      </span>
                      <br />
                      <br />
                      <span className="text-warning">Khách hàng:</span>{" "}
                      <span className="text-white">Nguyễn Văn A</span>
                      <br />
                      <span className="text-warning">Thời gian:</span>{" "}
                      <span className="text-white">19:00 - 21/02/2026</span>
                      <br />
                      <span className="text-warning">Vị trí:</span>{" "}
                      <span className="text-success">
                        Bàn Tầng 2 - Cạnh cửa sổ (W-05)
                      </span>
                      <br />
                      <span className="text-warning">Số lượng:</span>{" "}
                      <span className="text-white">2 người</span>
                      <br />
                      <br />
                      <span className="text-secondary">
                        --------------------------------
                      </span>
                      <br />
                      <span className="text-info">Đồ uống đặt trước:</span>
                      <br />
                      <span className="text-white">1x Cold Brew (Size L)</span>
                      <br />
                      <span className="text-white">
                        1x Matcha Latte (Size M)
                      </span>
                      <br />
                      <br />
                      <span className="text-success fw-bold">
                        &gt; TRẠNG THÁI: ĐÃ XÁC NHẬN
                      </span>
                      <br />
                      <span className="text-secondary">
                        ================================
                      </span>
                    </code>
                  </pre>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      <section className="py-5 border-top border-secondary">
        <Container>
          <Row className="g-4 text-center">
            <Col md={4}>
              <h3 className="display-4 fw-bold text-white mb-2">50+</h3>
              <p className="text-secondary text-uppercase tracking-widest">
                Loại đồ uống
              </p>
            </Col>
            <Col md={4}>
              <h3 className="display-4 fw-bold text-white mb-2">24/7</h3>
              <p className="text-secondary text-uppercase tracking-widest">
                Mở cửa phục vụ
              </p>
            </Col>
            <Col md={4}>
              <h3 className="display-4 fw-bold text-white mb-2">100%</h3>
              <p className="text-secondary text-uppercase tracking-widest">
                Cà phê nguyên chất
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      <section
        id="menu"
        className="py-5 border-top border-secondary bg-dark position-relative"
      >
        <Container>
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold text-white text-uppercase">
              Thực đơn nổi bật
            </h2>
            <p className="text-secondary">
              Hương vị đặc trưng chỉ có tại Nexus Coffee
            </p>
          </div>

          <div className="d-flex align-items-center gap-3">
            <Button
              variant="dark"
              className="flex-shrink-0 rounded-circle border-secondary d-none d-md-flex align-items-center justify-content-center"
              style={{ width: "44px", height: "44px" }}
              onClick={() => scrollMenu("left")}
            >
              <i className="bi bi-chevron-left"></i>
            </Button>

            <div
              ref={menuScrollRef}
              className="d-flex gap-4 overflow-x-auto hide-scrollbar pb-3"
              style={{ scrollSnapType: "x mandatory", flex: 1 }}
            >
              {[
                {
                  name: "Nexus Signature",
                  desc: "Cà phê ủ lạnh kết hợp kem macchiato độc quyền",
                  price: "65.000đ",
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
                  name: "Matcha Latte",
                  desc: "Trà xanh Nhật Bản kết hợp sữa tươi thơm béo",
                  price: "55.000đ",
                },
                {
                  name: "Peach Tea Mania",
                  desc: "Trà đào cam sả thanh mát, giải nhiệt",
                  price: "50.000đ",
                },
                {
                  name: "Cold Brew Original",
                  desc: "Cà phê ủ lạnh 24h, hương vị mượt mà",
                  price: "55.000đ",
                },
                {
                  name: "Mocha Frappuccino",
                  desc: "Cà phê đá xay với sốt chocolate và kem tươi",
                  price: "60.000đ",
                },
                {
                  name: "Trà Vải Cam Sả",
                  desc: "Trà đen kết hợp vải thiều và cam sả tươi",
                  price: "50.000đ",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex-shrink-0"
                  style={{ width: "280px", scrollSnapAlign: "start" }}
                >
                  <div className="p-4 border border-secondary h-100 bg-black hover-bg-dark transition-all d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <h5 className="text-white text-uppercase mb-0">
                        {item.name}
                      </h5>
                      <span className="text-warning fw-bold ms-2">
                        {item.price}
                      </span>
                    </div>
                    <p className="text-secondary mb-0 flex-grow-1">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="dark"
              className="flex-shrink-0 rounded-circle border-secondary d-none d-md-flex align-items-center justify-content-center"
              style={{ width: "44px", height: "44px" }}
              onClick={() => scrollMenu("right")}
            >
              <i className="bi bi-chevron-right"></i>
            </Button>
          </div>

          <div className="text-center mt-5">
            <Button
              variant="outline-light"
              className="rounded-0 px-4 py-2 text-uppercase fw-bold"
              as={Link}
              to="/menu"
            >
              Xem toàn bộ thực đơn
            </Button>
          </div>
        </Container>
      </section>

      <section
        id="spaces"
        className="py-5 border-top border-secondary bg-black"
      >
        <Container>
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold text-white text-uppercase">
              Không gian tại Nexus Coffee
            </h2>
          </div>
          <Row className="g-5">
            <Col md={4}>
              <div className="p-4 border border-secondary h-100 hover-bg-dark transition-all">
                <h1 className="text-secondary opacity-50 display-1 fw-bold mb-4">
                  01
                </h1>
                <h4 className="text-white text-uppercase mb-3">
                  Khu vực
                  <br />
                  làm việc
                </h4>
                <p className="text-secondary">
                  Không gian yên tĩnh, được trang bị đầy đủ ổ cắm điện tại mỗi
                  bàn và wifi tốc độ cao (Wifi 6). Lý tưởng để chạy deadline,
                  học tập hoặc làm việc từ xa.
                </p>
              </div>
            </Col>
            <Col md={4}>
              <div className="p-4 border border-secondary h-100 hover-bg-dark transition-all">
                <h1 className="text-secondary opacity-50 display-1 fw-bold mb-4">
                  02
                </h1>
                <h4 className="text-white text-uppercase mb-3">
                  Góc
                  <br />
                  trò chuyện
                </h4>
                <p className="text-secondary">
                  Không gian mở thoáng đãng, âm nhạc nhẹ nhàng, ghế sofa êm ái.
                  Phù hợp cho những buổi gặp gỡ bạn bè, hẹn hò hay thư giãn cuối
                  tuần.
                </p>
              </div>
            </Col>
            <Col md={4}>
              <div className="p-4 border border-secondary h-100 hover-bg-dark transition-all">
                <h1 className="text-secondary opacity-50 display-1 fw-bold mb-4">
                  03
                </h1>
                <h4 className="text-white text-uppercase mb-3">
                  Phòng họp
                  <br />
                  riêng tư
                </h4>
                <p className="text-secondary">
                  Phòng cách âm hoàn toàn, trang bị máy chiếu và bảng trắng.
                  Dành riêng cho các buổi họp nhóm, workshop nhỏ hoặc gặp gỡ đối
                  tác quan trọng.
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <div
        className="d-flex"
        style={{
          whiteSpace: "nowrap",
          backgroundColor: "white",
          color: "black",
          padding: "1.2rem 0",
          transform: "rotate(-2deg) scale(1.05)",
          boxShadow: "0 0 60px rgba(0,0,0,0.6)",
          fontWeight: 900,
          fontSize: "2rem",
          textTransform: "uppercase",
          overflow: "hidden",
          margin: "4rem -5%",
        }}
      >
        <div className="marquee-content">
          <span style={{ padding: "0 2rem", flexShrink: 0 }}>
            CÀ PHÊ NGUYÊN CHẤT &nbsp;-&nbsp; KHÔNG GIAN YÊN TĨNH &nbsp;-&nbsp;
            WIFI TỐC ĐỘ CAO &nbsp;-&nbsp; PHỤC VỤ 24/7 &nbsp;-&nbsp;
          </span>
        </div>
        <div className="marquee-content">
          <span style={{ padding: "0 2rem", flexShrink: 0 }}>
            CÀ PHÊ NGUYÊN CHẤT &nbsp;-&nbsp; KHÔNG GIAN YÊN TĨNH &nbsp;-&nbsp;
            WIFI TỐC ĐỘ CAO &nbsp;-&nbsp; PHỤC VỤ 24/7 &nbsp;-&nbsp;
          </span>
        </div>
      </div>

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
      <Modal
        show={showBookingModal}
        onHide={handleClose}
        centered
        className="font-monospace"
        data-bs-theme="dark"
      >
        <Modal.Header
          closeButton
          className="bg-dark text-light border-secondary rounded-0 border-bottom"
        >
          <Modal.Title className="text-uppercase fw-bold">
            <i className="bi bi-calendar-check me-2"></i>
            Đặt bàn
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-light p-4">
          <Form>
            <Form.Group className="mb-3" controlId="bookingName">
              <Form.Label className="text-secondary small text-uppercase fw-bold">
                Họ và tên
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="Nhập họ và tên"
                className="bg-black text-light border-secondary rounded-0 shadow-none"
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="bookingPhone">
              <Form.Label className="text-secondary small text-uppercase fw-bold">
                Số điện thoại
              </Form.Label>
              <Form.Control
                type="tel"
                placeholder="Nhập số điện thoại"
                className="bg-black text-light border-secondary rounded-0 shadow-none"
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="bookingDate">
                  <Form.Label className="text-secondary small text-uppercase fw-bold">
                    Ngày
                  </Form.Label>
                  <Form.Control
                    type="date"
                    className="bg-black text-light border-secondary rounded-0 shadow-none"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="bookingTime">
                  <Form.Label className="text-secondary small text-uppercase fw-bold">
                    Giờ
                  </Form.Label>
                  <Form.Control
                    type="time"
                    className="bg-black text-light border-secondary rounded-0 shadow-none"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3" controlId="bookingGuests">
              <Form.Label className="text-secondary small text-uppercase fw-bold">
                Số người
              </Form.Label>
              <Form.Select className="bg-black text-light border-secondary rounded-0 shadow-none">
                <option value="1">1 người</option>
                <option value="2">2 người</option>
                <option value="3">3 người</option>
                <option value="4">4 người</option>
                <option value="5+">5+ người</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-4" controlId="bookingNote">
              <Form.Label className="text-secondary small text-uppercase fw-bold">
                Ghi chú (Tùy chọn)
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Yêu cầu đặc biệt..."
                className="bg-black text-light border-secondary rounded-0 shadow-none"
              />
            </Form.Group>
            <Button
              variant="light"
              type="submit"
              className="w-100 rounded-0 fw-bold text-uppercase py-3 mt-2"
              onClick={(e) => {
                e.preventDefault();
                handleClose();
              }}
            >
              Xác nhận đặt bàn
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .tracking-widest { letter-spacing: 0.1em; }
        .hover-bg-dark:hover { background-color: #212529 !important; }
        .hover-white:hover { color: white !important; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .marquee-content {
          display: inline-flex;
          flex-shrink: 0;
          animation: marquee 20s linear infinite;
        }
        @keyframes marquee {
          0%   { transform: translateX(0%); }
          100% { transform: translateX(-100%); }
        }
      `,
        }}
      />
    </div>
  );
}
