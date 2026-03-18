import { Badge, Button, Card, Col, Form, Row, Table } from "react-bootstrap";
import AdminLayout from "../../components/admin/AdminLayout";

const orders = [
  {
    code: "#SV-067",
    customer: "Nguyễn Văn B",
    seat: "A3",
    service: "☕ Cà phê sữa đá, 🥤 Trà đào",
    total: "65,000đ",
    status: "Đang pha chế",
    statusClass: "bg-primary-subtle text-primary",
    time: "14:30",
  },
  {
    code: "#SV-066",
    customer: "Trần Thị C",
    seat: "B1",
    service: "🖨 In tài liệu (30 trang)",
    total: "30,000đ",
    status: "Chờ xử lý",
    statusClass: "bg-warning-subtle text-warning",
    time: "14:25",
  },
  {
    code: "#SV-065",
    customer: "Lê Minh D",
    seat: "A2",
    service: "☕ Latte, 🔌 Thuê sạc laptop",
    total: "55,000đ",
    status: "Hoàn thành",
    statusClass: "bg-info-subtle text-info",
    time: "14:10",
  },
  {
    code: "#SV-064",
    customer: "Phạm Hoa E",
    seat: "C1",
    service: "🥤 Trà đào x3, 🎥 Thuê máy chiếu",
    total: "155,000đ",
    status: "Hoàn thành",
    statusClass: "bg-info-subtle text-info",
    time: "13:55",
  },
  {
    code: "#SV-063",
    customer: "Vũ Bình F",
    seat: "VIP-1",
    service: "☕ Americano x2, 🥐 Bánh mì",
    total: "110,000đ",
    status: "Đã hủy",
    statusClass: "bg-danger-subtle text-danger",
    time: "13:40",
  },
];

export default function StaffOrderManagementPage() {
  return (
    <AdminLayout>
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Quản lý đơn dịch vụ</h2>
        <p className="text-secondary fw-semibold small mb-0">
          Xem và quản lý tất cả đơn dịch vụ phát sinh
        </p>
      </div>

      <Row className="g-3 mb-3 align-items-center">
        <Col md={3}>
          <Form.Select className="staff-filter-control">
            <option>Tất cả trạng thái</option>
          </Form.Select>
        </Col>
        <Col md={3}>
          <div className="staff-search-wrap">
            <i className="bi bi-search"></i>
            <input placeholder="Tìm đơn hàng..." />
          </div>
        </Col>
        <Col md={2}>
          <Form.Select className="staff-filter-control">
            <option>Tất cả chỗ ngồi</option>
          </Form.Select>
        </Col>
        <Col className="text-md-end">
          <Button className="staff-secondary-btn">
            <i className="bi bi-plus-lg me-2"></i>
            Tạo đơn mới
          </Button>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm staff-panel-card">
        <Card.Body className="p-0">
          <Table responsive className="mb-0 align-middle staff-table">
            <thead>
              <tr>
                <th>MÃ ĐƠN</th>
                <th>KHÁCH HÀNG</th>
                <th>CHỖ</th>
                <th>DỊCH VỤ</th>
                <th>TỔNG</th>
                <th>TRẠNG THÁI</th>
                <th>GIỜ</th>
                <th>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.code}>
                  <td className="fw-bold">{order.code}</td>
                  <td className="fw-semibold">{order.customer}</td>
                  <td className="fw-semibold">{order.seat}</td>
                  <td className="fw-semibold">{order.service}</td>
                  <td className="fw-bold">{order.total}</td>
                  <td>
                    <Badge
                      className={`rounded-pill border-0 px-3 py-2 ${order.statusClass}`}
                    >
                      {order.status}
                    </Badge>
                  </td>
                  <td className="fw-semibold">{order.time}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <button className="staff-icon-btn" type="button">
                        <i className="bi bi-pencil-square"></i>
                      </button>
                      <button
                        className="staff-icon-btn staff-icon-btn-success"
                        type="button"
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </AdminLayout>
  );
}
