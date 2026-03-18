import { Badge, Card, Col, Form, Row } from "react-bootstrap";
import AdminLayout from "../../components/admin/AdminLayout";

const categories = [
  "Tất cả",
  "☕ Đồ uống",
  "🥐 Đồ ăn nhẹ",
  "🖨 In ấn",
  "🔌 Thiết bị",
  "📦 Gói giờ",
];

const services = [
  {
    name: "Cà phê sữa đá",
    desc: "Phin truyền thống",
    price: "30,000đ",
    emoji: "☕",
  },
  {
    name: "Trà đào cam sả",
    desc: "Thanh mát, giải khát",
    price: "35,000đ",
    emoji: "🍑",
  },
  { name: "Latte", desc: "Espresso + sữa tươi", price: "40,000đ", emoji: "🥛" },
  {
    name: "Americano",
    desc: "Espresso pha nước",
    price: "35,000đ",
    emoji: "☕",
  },
  {
    name: "Bánh mì croissant",
    desc: "Croissant bơ Pháp",
    price: "25,000đ",
    emoji: "🥐",
  },
  {
    name: "In tài liệu (10 trang)",
    desc: "Đen trắng / Màu",
    price: "10,000đ",
    emoji: "🖨",
  },
  {
    name: "Thuê sạc laptop",
    desc: "Type-C / Magsafe",
    price: "20,000đ",
    emoji: "🔌",
  },
  {
    name: "Thuê máy chiếu",
    desc: "Full HD, HDMI",
    price: "50,000đ/h",
    emoji: "🎥",
  },
  {
    name: "Thuê tai nghe chống ồn",
    desc: "Chống ồn cao cấp",
    price: "15,000đ",
    emoji: "🎧",
    outOfStock: true,
  },
];

export default function StaffCreateServicePage() {
  return (
    <AdminLayout>
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Tạo đơn dịch vụ</h2>
        <p className="text-secondary fw-semibold small mb-0">
          Thêm đồ uống, in ấn, thiết bị cho khách
        </p>
      </div>

      <div className="mb-3" style={{ maxWidth: "230px" }}>
        <Form.Select className="staff-filter-control">
          <option>-- Chọn chỗ ngồi --</option>
        </Form.Select>
      </div>

      <div className="d-flex flex-wrap gap-2 mb-3">
        {categories.map((item, index) => (
          <button
            type="button"
            key={item}
            className={`staff-chip ${index === 0 ? "active" : ""}`}
          >
            {item}
          </button>
        ))}
      </div>

      <Row className="g-3">
        <Col xl={9}>
          <Row className="g-3">
            {services.map((service) => (
              <Col lg={4} md={6} key={service.name}>
                <Card className="border-0 shadow-sm staff-service-card h-100">
                  <div className="staff-service-thumb">{service.emoji}</div>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <h6 className="fw-bold mb-0">{service.name}</h6>
                      <Badge className="staff-price-badge">
                        {service.price}
                      </Badge>
                    </div>
                    <small className="text-secondary fw-semibold">
                      {service.desc}
                    </small>
                    {service.outOfStock && (
                      <div className="mt-2">
                        <Badge className="bg-danger-subtle text-danger border-0">
                          Hết hàng
                        </Badge>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Col>

        <Col xl={3}>
          <Card className="border-0 shadow-sm staff-panel-card h-100">
            <Card.Header className="bg-white border-bottom d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-cart3 me-2 text-primary"></i>
                Đơn dịch vụ
              </h5>
              <small className="text-secondary fw-semibold">0 món</small>
            </Card.Header>
            <Card.Body className="d-flex align-items-center justify-content-center text-center">
              <div className="text-secondary fw-semibold">
                <i className="bi bi-cup-hot" style={{ fontSize: "48px" }}></i>
                <div className="mt-2">Chưa có dịch vụ</div>
                <div>Chọn dịch vụ từ danh sách bên trái</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </AdminLayout>
  );
}
