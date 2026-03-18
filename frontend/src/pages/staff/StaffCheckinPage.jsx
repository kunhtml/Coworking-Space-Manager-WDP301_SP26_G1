import { Badge, Button, Card, Col, Form, Row } from "react-bootstrap";
import AdminLayout from "../../components/admin/AdminLayout";

const bookings = [
  {
    code: "#BK-20250110-001",
    guest: "Nguyễn Văn B",
    time: "14:00",
    status: "Chờ check-in",
    statusClass: "bg-warning-subtle text-warning",
    accent: "staff-accent-danger",
    seat: "Ghế cá nhân",
    range: "14:00 - 18:00 (4h)",
    deposit: "30,000đ",
    email: "nguyenb@email.com",
    actions: ["Check-in & Gán chỗ", "Chi tiết"],
  },
  {
    code: "#BK-20250110-002",
    guest: "Trần Thị C",
    time: "13:30",
    status: "Đã check-in",
    statusClass: "bg-success-subtle text-success",
    accent: "staff-accent-warning",
    seat: "B2 - Bàn nhóm",
    range: "13:30 - 17:30 (4h)",
    deposit: "2 đồ uống, 1 in ấn",
    email: "165,000đ",
    actions: ["Thêm dịch vụ", "Check-out"],
  },
  {
    code: "Khách vãng lai",
    guest: "Lê Minh D",
    time: "14:10",
    status: "Đã check-in",
    statusClass: "bg-success-subtle text-success",
    accent: "staff-accent-primary",
    seat: "A1 - Ghế cá nhân",
    range: "14:10 (walk-in)",
    deposit: "25,000đ/giờ",
    email: "22 phút",
    actions: ["Thêm dịch vụ", "Check-out"],
  },
];

export default function StaffCheckinPage() {
  return (
    <AdminLayout>
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Check-in / Check-out</h2>
        <p className="text-secondary fw-semibold small mb-0">
          Tiếp nhận, xác nhận booking và check-out khách
        </p>
      </div>

      <Row className="g-3 mb-3 align-items-center">
        <Col md={4} lg={2}>
          <Form.Select className="staff-filter-control">
            <option>Tất cả</option>
            <option>Chờ check-in</option>
            <option>Đang sử dụng</option>
          </Form.Select>
        </Col>
        <Col md={5} lg={3}>
          <div className="staff-search-wrap">
            <i className="bi bi-search"></i>
            <input placeholder="Tìm mã booking, tên khách" />
          </div>
        </Col>
        <Col className="text-md-end">
          <Button className="staff-primary-btn">
            <i className="bi bi-person-plus-fill me-2"></i>
            Check-in mới
          </Button>
        </Col>
      </Row>

      <Row className="g-3">
        {bookings.map((booking) => (
          <Col lg={4} key={`${booking.code}-${booking.guest}`}>
            <Card
              className={`border-0 shadow-sm staff-booking-card ${booking.accent}`}
            >
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h5 className="fw-bold mb-0">
                    {booking.code} · {booking.guest}
                  </h5>
                  <small className="text-secondary fw-semibold">
                    {booking.time}
                  </small>
                </div>

                <Badge
                  className={`rounded-pill border-0 px-3 py-2 mb-3 ${booking.statusClass}`}
                >
                  {booking.status}
                </Badge>

                <div className="staff-booking-info mb-3">
                  <div>
                    <span>Loại chỗ</span>
                    <strong>{booking.seat}</strong>
                  </div>
                  <div>
                    <span>Thời gian</span>
                    <strong>{booking.range}</strong>
                  </div>
                  <div>
                    <span>Giá / Đặt cọc</span>
                    <strong>{booking.deposit}</strong>
                  </div>
                  <div>
                    <span>Ghi chú</span>
                    <strong>{booking.email}</strong>
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <Button className="staff-primary-btn flex-grow-1">
                    {booking.actions[0]}
                  </Button>
                  <Button
                    variant="outline-secondary"
                    className="flex-grow-1 fw-semibold rounded-3"
                  >
                    {booking.actions[1]}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </AdminLayout>
  );
}
