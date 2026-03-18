import { Badge, Card, Col, Form, Row } from "react-bootstrap";
import AdminLayout from "../../components/admin/AdminLayout";

const services = [
  {
    category: "Đồ uống",
    name: "Cà phê sữa đá",
    desc: "Cà phê phin truyền thống pha sữa đặc, đá viên",
    price: "30,000đ",
    status: "Còn hàng",
    statusClass: "text-success",
    emoji: "☕",
  },
  {
    category: "Đồ uống",
    name: "Trà đào cam sả",
    desc: "Trà thơm hòa quyện đào tươi, cam tươi và sả",
    price: "35,000đ",
    status: "Còn hàng",
    statusClass: "text-success",
    emoji: "🍑",
  },
  {
    category: "Đồ uống",
    name: "Latte",
    desc: "Espresso đậm đà kết hợp sữa tươi béo ngậy",
    price: "40,000đ",
    status: "Còn hàng",
    statusClass: "text-success",
    emoji: "🥛",
  },
  {
    category: "Đồ ăn nhẹ",
    name: "Bánh mì croissant",
    desc: "Croissant bơ Pháp nướng giòn thơm ngon",
    price: "25,000đ",
    status: "Còn hàng",
    statusClass: "text-success",
    emoji: "🥐",
  },
  {
    category: "In ấn",
    name: "In tài liệu",
    desc: "Đen trắng: 1,000đ/trang • Màu: 3,000đ/trang",
    price: "1,000đ/tr",
    status: "Sẵn sàng",
    statusClass: "text-success",
    emoji: "🖨",
  },
  {
    category: "Thiết bị",
    name: "Thuê máy chiếu",
    desc: "Máy chiếu Full HD, kết nối HDMI/Wireless",
    price: "50,000đ/h",
    status: "2 máy trống",
    statusClass: "text-success",
    emoji: "🎥",
  },
  {
    category: "Thiết bị",
    name: "Thuê sạc laptop",
    desc: "Type-C 65W, Magsafe, USB-C PD",
    price: "20,000đ",
    status: "5 cái trống",
    statusClass: "text-success",
    emoji: "🔌",
  },
  {
    category: "Thiết bị",
    name: "Thuê tai nghe chống ồn",
    desc: "Sony WH-1000XM5, chống ồn chủ động",
    price: "15,000đ/h",
    status: "Hết hàng",
    statusClass: "text-danger",
    emoji: "🎧",
  },
];

export default function StaffServiceListPage() {
  return (
    <AdminLayout>
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Danh sách dịch vụ & Thực đơn</h2>
        <p className="text-secondary fw-semibold small mb-0">
          Đồ uống, đồ ăn, in ấn, thiết bị cho thuê
        </p>
      </div>

      <Row className="g-3 mb-3">
        <Col md={3}>
          <Form.Select className="staff-filter-control">
            <option>Tất cả danh mục</option>
          </Form.Select>
        </Col>
        <Col md={3}>
          <div className="staff-search-wrap">
            <i className="bi bi-search"></i>
            <input placeholder="Tìm dịch vụ..." />
          </div>
        </Col>
      </Row>

      <Row className="g-3">
        {services.map((service) => (
          <Col xl={3} lg={4} md={6} key={service.name}>
            <Card className="border-0 shadow-sm staff-menu-card h-100">
              <div className="p-3 d-flex justify-content-between align-items-center">
                <Badge className="bg-primary-subtle text-primary border-0">
                  {service.category}
                </Badge>
              </div>
              <div className="staff-service-thumb">{service.emoji}</div>
              <Card.Body>
                <h5 className="fw-bold mb-2">{service.name}</h5>
                <div className="text-secondary fw-semibold mb-3">
                  {service.desc}
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <div
                    className="text-primary fw-bold"
                    style={{ fontSize: "1.8rem" }}
                  >
                    {service.price}
                  </div>
                  <div className={`${service.statusClass} fw-semibold`}>
                    ● {service.status}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </AdminLayout>
  );
}
