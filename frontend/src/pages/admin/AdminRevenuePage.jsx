import { Badge, Button, Card, Col, Row, Table } from "react-bootstrap";
import AdminLayout from "../../components/admin/AdminLayout";

export function meta() {
  return [
    { title: "Báo cáo doanh thu | Admin" },
    {
      name: "description",
      content: "Phân tích doanh thu theo thời gian và danh mục",
    },
  ];
}

const summaryCards = [
  {
    icon: "bi-cash-stack",
    iconClass: "bg-primary-subtle text-primary",
    value: "12.5M",
    label: "Doanh thu hôm nay",
    delta: "+18% vs hôm qua",
  },
  {
    icon: "bi-calendar-week",
    iconClass: "bg-success-subtle text-success",
    value: "78.8M",
    label: "Doanh thu tuần này",
    delta: "+12% vs tuần trước",
  },
  {
    icon: "bi-calendar3",
    iconClass: "bg-info-subtle text-info",
    value: "298M",
    label: "Doanh thu tháng này",
    delta: "+8%",
  },
  {
    icon: "bi-receipt-cutoff",
    iconClass: "bg-warning-subtle text-warning",
    value: "89",
    label: "Số đơn hôm nay",
    delta: "+15 đơn",
  },
];

const categoryRevenue = [
  {
    name: "☕ Phí chỗ ngồi",
    sold: "67 phiên",
    revenue: "5,000,000đ",
    ratio: "40%",
    trend: "+15%",
    trendClass: "text-success",
  },
  {
    name: "🥤 Đồ uống",
    sold: "124 ly",
    revenue: "3,125,000đ",
    ratio: "25%",
    trend: "+22%",
    trendClass: "text-success",
  },
  {
    name: "🔌 Thiết bị thuê",
    sold: "18 lượt",
    revenue: "1,875,000đ",
    ratio: "15%",
    trend: "+8%",
    trendClass: "text-success",
  },
  {
    name: "🖨 In ấn",
    sold: "890 trang",
    revenue: "1,250,000đ",
    ratio: "10%",
    trend: "-4%",
    trendClass: "text-danger",
  },
  {
    name: "🥐 Đồ ăn",
    sold: "55 phần",
    revenue: "1,250,000đ",
    ratio: "10%",
    trend: "+6%",
    trendClass: "text-success",
  },
];

const chartDays = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"];
const chartValues = [
  "9.5M",
  "7.2M",
  "11.0M",
  "8.8M",
  "14.2M",
  "15.0M",
  "12.0M",
  "8.2M",
  "10.8M",
  "12.5M",
];

export default function AdminRevenuePage() {
  return (
    <AdminLayout>
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Báo cáo doanh thu</h2>
        <p className="text-muted mb-0">
          Phân tích doanh thu theo ngày, tuần, tháng, danh mục
        </p>
      </div>

      <Row className="g-3 mb-3 align-items-center">
        <Col lg={6} className="d-flex gap-2 flex-wrap">
          <Button size="sm" variant="light" className="fw-semibold">
            Hôm nay
          </Button>
          <Button
            size="sm"
            variant="link"
            className="fw-semibold text-secondary text-decoration-none"
          >
            Tuần này
          </Button>
          <Button
            size="sm"
            variant="link"
            className="fw-semibold text-secondary text-decoration-none"
          >
            Tháng này
          </Button>
          <Button
            size="sm"
            variant="link"
            className="fw-semibold text-secondary text-decoration-none"
          >
            Quý này
          </Button>
        </Col>
        <Col lg={6} className="d-flex justify-content-lg-end gap-2 flex-wrap">
          <input
            type="date"
            className="form-control"
            style={{ width: 130 }}
            defaultValue="2025-01-10"
          />
          <span className="d-flex align-items-center text-secondary fw-semibold">
            đến
          </span>
          <input
            type="date"
            className="form-control"
            style={{ width: 130 }}
            defaultValue="2025-01-10"
          />
          <Button className="staff-secondary-btn">
            <i className="bi bi-download me-2"></i>Xuất Excel
          </Button>
        </Col>
      </Row>

      <Row className="g-3 mb-4">
        {summaryCards.map((card) => (
          <Col xl={3} md={6} key={card.label}>
            <Card className="border-0 shadow-sm staff-panel-card h-100">
              <Card.Body>
                <div className={`staff-stat-icon ${card.iconClass}`}>
                  <i className={`bi ${card.icon}`}></i>
                </div>
                <h3 className="fw-bold mt-3 mb-1">{card.value}</h3>
                <div className="text-secondary fw-semibold mb-2">
                  {card.label}
                </div>
                <Badge className="bg-success-subtle text-success border-0">
                  {card.delta}
                </Badge>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row className="g-3 mb-3">
        <Col lg={8}>
          <Card className="border-0 shadow-sm staff-panel-card h-100">
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-graph-up-arrow me-2 text-primary"></i>
                Doanh thu theo ngày (Tháng 1/2025)
              </h5>
            </Card.Header>
            <Card.Body
              className="d-flex align-items-end justify-content-between"
              style={{ minHeight: 200 }}
            >
              {chartDays.map((day, index) => (
                <div key={day} className="text-center">
                  <div className="fw-bold small text-secondary mb-2">
                    {chartValues[index]}
                  </div>
                  <div className="small text-secondary">{day}</div>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="border-0 shadow-sm staff-panel-card h-100">
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-pie-chart-fill me-2 text-primary"></i>
                Phân bổ nguồn thu
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="text-center mb-3">
                <h3 className="fw-bold mb-0">12.5M</h3>
                <small className="text-secondary">Hôm nay</small>
              </div>
              <div className="d-flex flex-column gap-2">
                <div>
                  <span className="text-success">●</span> Phí chỗ ngồi — 40%
                </div>
                <div>
                  <span className="text-primary">●</span> Đồ uống — 25%
                </div>
                <div>
                  <span className="text-warning">●</span> Thiết bị thuê — 15%
                </div>
                <div>
                  <span className="text-danger">●</span> In ấn — 10%
                </div>
                <div>
                  <span className="text-secondary">●</span> Đồ ăn — 10%
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm staff-panel-card">
        <Card.Header className="bg-white border-bottom">
          <h5 className="mb-0 fw-bold">
            <i className="bi bi-table me-2 text-primary"></i>
            Chi tiết doanh thu theo danh mục
          </h5>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive className="mb-0 align-middle staff-table">
            <thead>
              <tr>
                <th>DANH MỤC</th>
                <th>SỐ LƯỢNG BÁN</th>
                <th>DOANH THU</th>
                <th>% TỔNG</th>
                <th>SO VỚI HÔM QUA</th>
              </tr>
            </thead>
            <tbody>
              {categoryRevenue.map((row) => (
                <tr key={row.name}>
                  <td className="fw-semibold">{row.name}</td>
                  <td className="fw-semibold">{row.sold}</td>
                  <td className="fw-bold">{row.revenue}</td>
                  <td className="fw-semibold">{row.ratio}</td>
                  <td className={`fw-semibold ${row.trendClass}`}>
                    {row.trend}
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
