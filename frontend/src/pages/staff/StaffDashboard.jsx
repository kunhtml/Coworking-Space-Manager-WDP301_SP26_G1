import { Badge, Button, Card, Col, Row, Table } from "react-bootstrap";
import AdminLayout from "../../components/admin/AdminLayout";

export function meta() {
  return [
    { title: "Dashboard | Staff" },
    { name: "description", content: "Bảng điều khiển nhân viên" },
  ];
}

const statCards = [
  {
    icon: "bi-people-fill",
    iconWrap: "staff-stat-icon bg-primary-subtle text-primary",
    value: "32",
    label: "Khách đang sử dụng",
    trend: "+5 hôm nay",
    trendClass: "text-success",
  },
  {
    icon: "bi-shop",
    iconWrap: "staff-stat-icon bg-success-subtle text-success",
    value: "18/45",
    label: "Chỗ ngồi trống",
    trend: "60% lấp đầy",
    trendClass: "text-danger",
  },
  {
    icon: "bi-receipt-cutoff",
    iconWrap: "staff-stat-icon bg-info-subtle text-info",
    value: "67",
    label: "Đơn dịch vụ hôm nay",
    trend: "+12%",
    trendClass: "text-success",
  },
  {
    icon: "bi-calendar-check",
    iconWrap: "staff-stat-icon bg-warning-subtle text-warning",
    value: "8",
    label: "Booking chờ check-in",
    trend: "+3 mới",
    trendClass: "text-success",
  },
];

const recentActivities = [
  {
    time: "14:30",
    customer: "Nguyễn Văn B",
    seat: "A3",
    type: "Check-in",
    status: "Đang sử dụng",
    statusClass: "bg-success-subtle text-success",
  },
  {
    time: "14:22",
    customer: "Trần Thị C",
    seat: "B2",
    type: "Gọi đồ uống",
    status: "Đang pha chế",
    statusClass: "bg-primary-subtle text-primary",
  },
  {
    time: "14:10",
    customer: "Lê Minh D",
    seat: "A1",
    type: "In tài liệu",
    status: "Hoàn thành",
    statusClass: "bg-info-subtle text-info",
  },
  {
    time: "13:55",
    customer: "Phạm Hoa E",
    seat: "C1",
    type: "Check-out",
    status: "Đã thanh toán",
    statusClass: "bg-primary-subtle text-primary",
  },
  {
    time: "13:40",
    customer: "Vũ Bình F",
    seat: "VIP-1",
    type: "Thuê phòng",
    status: "Đang sử dụng",
    statusClass: "bg-success-subtle text-success",
  },
];

const notifications = [
  {
    icon: "bi-bag-check",
    iconClass: "bg-warning-subtle text-warning",
    title: "Booking #BK-003 sắp đến giờ check-in (15:00)",
    time: "Trong 28 phút",
  },
  {
    icon: "bi-exclamation-circle",
    iconClass: "bg-danger-subtle text-danger",
    title: "Bàn B2 - Khách sắp hết giờ booking",
    time: "Còn 15 phút",
  },
  {
    icon: "bi-cash-coin",
    iconClass: "bg-success-subtle text-success",
    title: "Thanh toán 180,000đ từ phòng VIP-1",
    time: "10 phút trước",
  },
  {
    icon: "bi-printer",
    iconClass: "bg-primary-subtle text-primary",
    title: "A1 yêu cầu in 15 trang tài liệu",
    time: "12 phút trước",
  },
  {
    icon: "bi-person-circle",
    iconClass: "bg-info-subtle text-info",
    title: "Khách vãng lai check-in tại A5",
    time: "20 phút trước",
  },
];

export default function StaffDashboard() {
  return (
    <AdminLayout>
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Dashboard</h2>
        <p className="text-secondary fw-semibold small mb-0">
          Tổng quan hoạt động hôm nay
        </p>
      </div>

      <Row className="g-3 mb-4">
        {statCards.map((card) => (
          <Col xl={3} md={6} key={card.label}>
            <Card className="border-0 shadow-sm staff-panel-card h-100">
              <Card.Body>
                <div className={card.iconWrap}>
                  <i className={`bi ${card.icon}`}></i>
                </div>
                <h3 className="fw-bold mb-1 mt-3">{card.value}</h3>
                <div className="text-secondary fw-semibold mb-2">
                  {card.label}
                </div>
                <small className={`${card.trendClass} fw-semibold`}>
                  {card.trend}
                </small>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row className="g-3">
        <Col lg={8}>
          <Card className="border-0 shadow-sm staff-panel-card">
            <Card.Header className="bg-white border-bottom d-flex align-items-center justify-content-between">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-list-ul me-2 text-primary"></i>
                Hoạt động gần đây
              </h5>
              <Button
                variant="outline-secondary"
                size="sm"
                className="rounded-3 fw-semibold"
              >
                Xem tất cả
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive className="mb-0 align-middle staff-table">
                <thead>
                  <tr>
                    <th>THỜI GIAN</th>
                    <th>KHÁCH HÀNG</th>
                    <th>CHỖ NGỒI</th>
                    <th>LOẠI</th>
                    <th>TRẠNG THÁI</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivities.map((item) => (
                    <tr key={`${item.time}-${item.customer}`}>
                      <td className="fw-semibold">{item.time}</td>
                      <td className="fw-semibold">{item.customer}</td>
                      <td className="fw-semibold">{item.seat}</td>
                      <td className="fw-semibold">{item.type}</td>
                      <td>
                        <Badge
                          className={`rounded-pill border-0 px-3 py-2 ${item.statusClass}`}
                        >
                          {item.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="border-0 shadow-sm staff-panel-card h-100">
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-bell-fill me-2 text-primary"></i>
                Thông báo
              </h5>
            </Card.Header>
            <Card.Body className="p-0">
              {notifications.map((item, index) => (
                <div
                  key={`${item.title}-${index}`}
                  className="d-flex gap-3 px-3 py-3 border-bottom staff-notify-item"
                >
                  <div className={`staff-notify-icon ${item.iconClass}`}>
                    <i className={`bi ${item.icon}`}></i>
                  </div>
                  <div>
                    <div className="fw-semibold mb-1">{item.title}</div>
                    <small className="text-secondary fw-semibold">
                      {item.time}
                    </small>
                  </div>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </AdminLayout>
  );
}
