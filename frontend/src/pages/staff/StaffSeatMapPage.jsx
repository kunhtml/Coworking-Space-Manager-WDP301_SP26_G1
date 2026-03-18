import { Badge, Card, Col, Form, Row } from "react-bootstrap";
import AdminLayout from "../../components/admin/AdminLayout";

const statusLegend = [
  { label: "Trống", className: "staff-dot-green" },
  { label: "Đang sử dụng", className: "staff-dot-red" },
  { label: "Đã đặt trước", className: "staff-dot-yellow" },
  { label: "Đang dọn", className: "staff-dot-blue" },
];

const zones = [
  {
    title: "Khu A — Ghế cá nhân",
    seats: [
      {
        name: "A1",
        subtitle: "Ghế cá nhân",
        detail: "1 chỗ • 25,000đ/h",
        status: "Trống",
        className: "staff-seat-green",
      },
      {
        name: "A2",
        subtitle: "Ghế cá nhân",
        detail: "1 chỗ • 25,000đ/h",
        status: "Đang sử dụng",
        className: "staff-seat-red",
        footer: "Lê Minh D • 1h 20p",
      },
      {
        name: "A3",
        subtitle: "Ghế cá nhân",
        detail: "1 chỗ • 25,000đ/h",
        status: "Đang sử dụng",
        className: "staff-seat-red",
        footer: "Nguyễn Văn B • 2h 15p",
      },
      {
        name: "A4",
        subtitle: "Ghế cá nhân",
        detail: "1 chỗ • 25,000đ/h",
        status: "Trống",
        className: "staff-seat-green",
      },
      {
        name: "A5",
        subtitle: "Ghế cá nhân",
        detail: "1 chỗ • 25,000đ/h",
        status: "Đã đặt trước",
        className: "staff-seat-yellow",
        footer: "15:00 - Phạm Hoa E",
      },
      {
        name: "A6",
        subtitle: "Ghế cá nhân",
        detail: "1 chỗ • 25,000đ/h",
        status: "Đang dọn",
        className: "staff-seat-blue",
      },
    ],
  },
  {
    title: "Khu B — Bàn nhóm",
    seats: [
      {
        name: "B1",
        subtitle: "Bàn nhóm",
        detail: "4 chỗ • 40,000đ/h",
        status: "Đang sử dụng",
        className: "staff-seat-red",
        footer: "Trần Thị C + 2 • 50p",
      },
      {
        name: "B2",
        subtitle: "Bàn nhóm",
        detail: "4 chỗ • 40,000đ/h",
        status: "Trống",
        className: "staff-seat-green",
      },
      {
        name: "B3",
        subtitle: "Bàn nhóm",
        detail: "6 chỗ • 55,000đ/h",
        status: "Trống",
        className: "staff-seat-green",
      },
    ],
  },
  {
    title: "Khu C — Phòng riêng & VIP",
    seats: [
      {
        name: "C1",
        subtitle: "Phòng họp",
        detail: "6 chỗ • 120,000đ/h",
        status: "Đang sử dụng",
        className: "staff-seat-red",
      },
      {
        name: "VIP-1",
        subtitle: "Phòng VIP",
        detail: "4 chỗ • 150,000đ/h",
        status: "Đã đặt trước",
        className: "staff-seat-yellow",
      },
      {
        name: "VIP-2",
        subtitle: "Phòng VIP",
        detail: "4 chỗ • 150,000đ/h",
        status: "Trống",
        className: "staff-seat-green",
      },
    ],
  },
];

export default function StaffSeatMapPage() {
  return (
    <AdminLayout>
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Sơ đồ chỗ ngồi</h2>
        <p className="text-secondary fw-semibold small mb-0">
          Trạng thái không gian làm việc theo thời gian thực
        </p>
      </div>

      <div className="d-flex flex-wrap gap-4 mb-4 align-items-center justify-content-between">
        <div className="d-flex flex-wrap gap-4">
          {statusLegend.map((item) => (
            <div
              className="d-flex align-items-center gap-2 fw-semibold text-secondary"
              key={item.label}
            >
              <span className={`staff-status-dot ${item.className}`}></span>
              {item.label}
            </div>
          ))}
        </div>
        <Form.Select
          className="staff-filter-control"
          style={{ width: "180px" }}
        >
          <option>Tất cả khu vực</option>
        </Form.Select>
      </div>

      {zones.map((zone) => (
        <div key={zone.title} className="mb-4">
          <h5 className="fw-bold text-secondary mb-3">{zone.title}</h5>
          <Row className="g-3">
            {zone.seats.map((seat) => (
              <Col xl={2} lg={3} md={4} sm={6} key={seat.name}>
                <Card className={`border-2 staff-seat-card ${seat.className}`}>
                  <Card.Body className="text-center">
                    <div className="staff-seat-icon mb-3">
                      <i className="bi bi-shop"></i>
                    </div>
                    <h4 className="fw-bold mb-1">{seat.name}</h4>
                    <div className="text-secondary fw-semibold small">
                      {seat.subtitle}
                    </div>
                    <div className="text-secondary fw-semibold mb-2">
                      {seat.detail}
                    </div>
                    <Badge className="rounded-pill border-0 px-3 py-2 mb-2 staff-seat-badge">
                      {seat.status}
                    </Badge>
                    {seat.footer && (
                      <div className="small text-secondary fw-semibold">
                        {seat.footer}
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      ))}
    </AdminLayout>
  );
}
