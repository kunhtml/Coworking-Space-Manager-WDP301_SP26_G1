import type { Route } from "./+types/home";
import { useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Navbar,
  Row,
} from "react-bootstrap";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Moon Bean Cafe | Đặt bàn online" },
    {
      name: "description",
      content: "Website quán cafe Moon Bean cho phép xem menu và đặt bàn nhanh.",
    },
  ];
}

type Booking = {
  name: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  area: string;
  note: string;
};

const areas = ["Trong nhà", "Sân vườn", "Gần cửa sổ", "Phòng yên tĩnh"];

const menuItems = [
  { name: "Cold Brew Cam", price: "65.000đ", tag: "Best Seller" },
  { name: "Bạc xỉu đá", price: "45.000đ", tag: "Classic" },
  { name: "Matcha Latte", price: "58.000đ", tag: "Healthy" },
  { name: "Croissant bơ", price: "35.000đ", tag: "Bakery" },
];

export default function Home() {
  const [booking, setBooking] = useState<Booking>({
    name: "",
    phone: "",
    date: "",
    time: "",
    guests: 2,
    area: areas[0],
    note: "",
  });
  const [submitted, setSubmitted] = useState<Booking | null>(null);

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(booking);
  };

  return (
    <div>
      <Navbar expand="lg" className="cafe-navbar shadow-sm">
        <Container>
          <Navbar.Brand className="fw-bold">☕ Moon Bean Cafe</Navbar.Brand>
        </Container>
      </Navbar>

      <header className="hero-section py-5">
        <Container>
          <Row className="align-items-center g-4">
            <Col md={7}>
              <h1 className="display-5 fw-bold">Đặt bàn cafe nhanh trong 30 giây</h1>
              <p className="lead text-muted mb-4">
                Chọn khu vực yêu thích, số lượng khách và thời gian đến. Moon Bean
                sẽ giữ bàn cho bạn ngay khi xác nhận.
              </p>
              <Badge bg="dark" className="px-3 py-2">
                Mở cửa 07:00 - 22:30 mỗi ngày
              </Badge>
            </Col>
            <Col md={5}>
              <Card className="shadow border-0">
                <Card.Body>
                  <h5 className="fw-semibold">Món nổi bật hôm nay</h5>
                  <div className="d-grid gap-2 mt-3">
                    {menuItems.map((item) => (
                      <div
                        key={item.name}
                        className="d-flex justify-content-between align-items-center menu-item"
                      >
                        <div>
                          <div className="fw-medium">{item.name}</div>
                          <small className="text-muted">{item.tag}</small>
                        </div>
                        <strong>{item.price}</strong>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </header>

      <section className="pb-5">
        <Container>
          <Row className="g-4">
            <Col lg={7}>
              <Card className="shadow-sm border-0 h-100">
                <Card.Body>
                  <h4 className="fw-semibold mb-3">Đặt bàn</h4>
                  <Form onSubmit={onSubmit}>
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Họ và tên</Form.Label>
                          <Form.Control
                            required
                            value={booking.name}
                            onChange={(e) =>
                              setBooking({ ...booking, name: e.target.value })
                            }
                            placeholder="Nguyễn Văn A"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Số điện thoại</Form.Label>
                          <Form.Control
                            required
                            value={booking.phone}
                            onChange={(e) =>
                              setBooking({ ...booking, phone: e.target.value })
                            }
                            placeholder="09xxxxxxxx"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Ngày đến</Form.Label>
                          <Form.Control
                            type="date"
                            required
                            min={today}
                            value={booking.date}
                            onChange={(e) =>
                              setBooking({ ...booking, date: e.target.value })
                            }
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Giờ đến</Form.Label>
                          <Form.Control
                            type="time"
                            required
                            value={booking.time}
                            onChange={(e) =>
                              setBooking({ ...booking, time: e.target.value })
                            }
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Số khách</Form.Label>
                          <Form.Select
                            value={booking.guests}
                            onChange={(e) =>
                              setBooking({
                                ...booking,
                                guests: Number(e.target.value),
                              })
                            }
                          >
                            {[1, 2, 3, 4, 5, 6, 8, 10].map((guest) => (
                              <option key={guest} value={guest}>
                                {guest} người
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Khu vực</Form.Label>
                          <Form.Select
                            value={booking.area}
                            onChange={(e) =>
                              setBooking({ ...booking, area: e.target.value })
                            }
                          >
                            {areas.map((area) => (
                              <option key={area} value={area}>
                                {area}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col xs={12}>
                        <Form.Group>
                          <Form.Label>Ghi chú</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            value={booking.note}
                            onChange={(e) =>
                              setBooking({ ...booking, note: e.target.value })
                            }
                            placeholder="Ví dụ: cần ổ điện gần bàn"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Button type="submit" className="mt-4 px-4" variant="dark">
                      Xác nhận đặt bàn
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={5}>
              <Card className="shadow-sm border-0">
                <Card.Body>
                  <h4 className="fw-semibold mb-3">Thông tin quán</h4>
                  <p className="mb-2">📍 123 Nguyễn Huệ, Quận 1, TP.HCM</p>
                  <p className="mb-2">📞 0909 123 456</p>
                  <p className="mb-0">📧 booking@moonbean.vn</p>
                </Card.Body>
              </Card>

              {submitted && (
                <Alert variant="success" className="mt-3 shadow-sm">
                  <Alert.Heading className="h6">Đặt bàn thành công!</Alert.Heading>
                  <div>
                    {submitted.name} - {submitted.guests} khách - {submitted.date}{" "}
                    {submitted.time}
                  </div>
                  <small className="text-muted">
                    Khu vực: {submitted.area}. Chúng tôi sẽ liên hệ qua số {submitted.phone}.
                  </small>
                </Alert>
              )}
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
}
