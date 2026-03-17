import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  ButtonGroup,
  Card,
  Col,
  Container,
  Nav,
  Navbar,
  Row,
  Spinner,
  Dropdown,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { apiClient as api } from "../../services/api";

export function meta() {
  return [
    { title: "Report & Analytics | Nexus Coffee" },
    { name: "description", content: "Báo cáo và phân tích cho Nexus Coffee" },
  ];
}

/* ───────── helpers ───────── */
const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN").format(Number(value) || 0) + "đ";

const formatAxis = (v) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(Math.round(v));
};

const getNiceMax = (max) => {
  if (max <= 0) return 100;
  const mag = Math.pow(10, Math.floor(Math.log10(max)));
  const norm = max / mag;
  const nice = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return nice * mag;
};

/* ───────── sub‑components ───────── */
function RevenueLineChart({ data, timeFilter }) {
  const W = 800,
    H = 340;
  const m = { t: 30, r: 30, b: 55, l: 75 };
  const pw = W - m.l - m.r;
  const ph = H - m.t - m.b;

  if (data.length === 0) {
    return (
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        className="border rounded bg-white"
      >
        <text
          x={W / 2}
          y={H / 2}
          textAnchor="middle"
          fill="#6c757d"
          fontSize="14"
        >
          Chưa có dữ liệu doanh thu
        </text>
      </svg>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.value));
  const niceMax = getNiceMax(maxVal * 1.15);
  const yTickCount = 5;

  const points = data.map((d, i) => ({
    x: m.l + (data.length > 1 ? (i / (data.length - 1)) * pw : pw / 2),
    y: m.t + ph - (d.value / niceMax) * ph,
    ...d,
  }));

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPath = [
    `M ${points[0].x},${m.t + ph}`,
    ...points.map((p) => `L ${p.x},${p.y}`),
    `L ${points[points.length - 1].x},${m.t + ph} Z`,
  ].join(" ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      width="100%"
      className="border rounded bg-white"
    >
      <defs>
        <linearGradient id="revGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#0d6efd" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#0d6efd" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* horizontal grid + Y‑axis labels */}
      {Array.from({ length: yTickCount + 1 }, (_, i) => {
        const y = m.t + (i / yTickCount) * ph;
        const val = niceMax * (1 - i / yTickCount);
        return (
          <g key={`y${i}`}>
            <line
              x1={m.l}
              y1={y}
              x2={W - m.r}
              y2={y}
              stroke="#e9ecef"
              strokeWidth="1"
            />
            <text
              x={m.l - 12}
              y={y + 4}
              textAnchor="end"
              fill="#6c757d"
              fontSize="11"
            >
              {formatAxis(val)}
            </text>
          </g>
        );
      })}

      {/* area fill */}
      <path d={areaPath} fill="url(#revGrad)" />

      {/* line */}
      <polyline
        fill="none"
        stroke="#0d6efd"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={polyline}
      />

      {/* data points + X labels */}
      {points.map((p, i) => (
        <g key={i}>
          <circle
            cx={p.x}
            cy={p.y}
            r="5"
            fill="#fff"
            stroke="#0d6efd"
            strokeWidth="2.5"
          />
          <text
            x={p.x}
            y={m.t + ph + 22}
            textAnchor="middle"
            fill="#6c757d"
            fontSize="11"
          >
            {p.label}
          </text>
          {/* hover value */}
          <text
            x={p.x}
            y={p.y - 12}
            textAnchor="middle"
            fill="#0d6efd"
            fontSize="10"
            fontWeight="600"
            opacity="0"
          >
            {formatCurrency(p.value)}
          </text>
          <title>{`${p.label}: ${formatCurrency(p.value)}`}</title>
          {/* invisible hit area */}
          <circle cx={p.x} cy={p.y} r="18" fill="transparent">
            <title>{`${p.label}: ${formatCurrency(p.value)}`}</title>
          </circle>
        </g>
      ))}

      {/* axis label */}
      <text
        x={W / 2}
        y={H - 5}
        textAnchor="middle"
        fill="#6c757d"
        fontSize="12"
      >
        Doanh thu theo {timeFilter.toLowerCase()}
      </text>
    </svg>
  );
}

function OccupancyBarChart({ data }) {
  const W = 800,
    H = 340;
  const m = { t: 30, r: 30, b: 55, l: 55 };
  const pw = W - m.l - m.r;
  const ph = H - m.t - m.b;

  const n = data.length;
  if (n === 0) {
    return (
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        className="border rounded bg-white"
      >
        <text
          x={W / 2}
          y={H / 2}
          textAnchor="middle"
          fill="#6c757d"
          fontSize="14"
        >
          Chưa có dữ liệu
        </text>
      </svg>
    );
  }

  const gap = pw * 0.04;
  const barW = (pw - gap * (n + 1)) / n;
  const pctTicks = [0, 25, 50, 75, 100];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      width="100%"
      className="border rounded bg-white"
    >
      <defs>
        <linearGradient id="barGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#0dcaf0" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#0d6efd" stopOpacity="0.7" />
        </linearGradient>
      </defs>

      {/* horizontal grid + Y labels */}
      {pctTicks.map((pct) => {
        const y = m.t + ph - (pct / 100) * ph;
        return (
          <g key={`pct${pct}`}>
            <line
              x1={m.l}
              y1={y}
              x2={W - m.r}
              y2={y}
              stroke="#e9ecef"
              strokeWidth="1"
            />
            <text
              x={m.l - 10}
              y={y + 4}
              textAnchor="end"
              fill="#6c757d"
              fontSize="11"
            >
              {pct}%
            </text>
          </g>
        );
      })}

      {/* bars */}
      {data.map((item, i) => {
        const x = m.l + gap + i * (barW + gap);
        const barH = (item.occupancy / 100) * ph;
        const y = m.t + ph - barH;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              fill="url(#barGrad)"
              rx="4"
              ry="4"
            />
            {/* value on top */}
            <text
              x={x + barW / 2}
              y={y - 6}
              textAnchor="middle"
              fill="#0d6efd"
              fontSize="11"
              fontWeight="600"
            >
              {item.occupancy}%
            </text>
            {/* X label */}
            <text
              x={x + barW / 2}
              y={m.t + ph + 22}
              textAnchor="middle"
              fill="#6c757d"
              fontSize="11"
            >
              {item.day}
            </text>
            <title>{`${item.day}: ${item.occupancy}%`}</title>
          </g>
        );
      })}
    </svg>
  );
}

/* ═══════════════════════════════════════
   Main Page
   ═══════════════════════════════════════ */
export default function ReportAnalyticsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeFilter, setTimeFilter] = useState("Ngày");

  useEffect(() => {
    const loadReport = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await api.get(
          `/reports/analytics?timeFilter=${encodeURIComponent(timeFilter)}`,
        );
        setReport(data);
      } catch (err) {
        setError(err.message || "Không thể tải báo cáo.");
      } finally {
        setLoading(false);
      }
    };
    loadReport();
  }, [timeFilter]); // 🎯 Reload data when timeFilter changes

  const summary = report?.summary || {};

  /* ── revenue chart data ── */
  const revenueChartData = useMemo(() => {
    const raw = report?.revenueByMonth || [];
    if (raw.length > 0) {
      return raw.map((item) => ({
        label: item._id || item.month || "",
        value: item.total || item.revenue || 0,
      }));
    }
    return [];
  }, [report]);

  /* ── occupancy data from MongoDB ── */
  const occupancyByDay = useMemo(() => {
    if (report?.occupancyByPeriod && Array.isArray(report.occupancyByPeriod)) {
      return report.occupancyByPeriod.map((item) => ({
        day: item._id,
        occupancy: item.occupancyRate || 0,
      }));
    }

    // 🚫 No fallback fake data - if no MongoDB data, show empty
    return [];
  }, [report, timeFilter]);

  /* ── top 5 revenue periods ── */
  const topRevenuePeriods = useMemo(() => {
    if (!report?.recentPayments) return [];
    return [...report.recentPayments]
      .sort((a, b) => (b.amount || 0) - (a.amount || 0))
      .slice(0, 5)
      .map((payment) => {
        const date = new Date(payment.paidAt || Date.now());
        return {
          period: `${String(date.getDate()).padStart(2, "0")}/${String(
            date.getMonth() + 1,
          ).padStart(2, "0")}/${date.getFullYear()}`,
          revenue: payment.amount || 0,
        };
      });
  }, [report]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  /* ── loading ── */
  if (loading) {
    return (
      <div className="d-flex flex-column min-vh-100 bg-light">
        <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm">
          <Container>
            <Navbar.Brand as={Link} to="/" className="fw-bold text-white">
              <i className="bi bi-cup-hot-fill me-2 text-warning"></i>
              NEXUS ADMIN
            </Navbar.Brand>
          </Container>
        </Navbar>
        <Container className="py-5 flex-grow-1 d-flex align-items-center justify-content-center">
          <Card className="shadow-sm border-0">
            <Card.Body className="py-5 text-center">
              <Spinner animation="border" variant="primary" />
              <div className="mt-3 text-muted">
                Đang tải báo cáo từ MongoDB...
              </div>
            </Card.Body>
          </Card>
        </Container>
      </div>
    );
  }

  /* ═══════ RENDER ═══════ */
  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      {/* Navbar */}
      <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm">
        <Container>
          <Navbar.Brand as={Link} to="/" className="fw-bold text-white">
            <i className="bi bi-cup-hot-fill me-2 text-warning"></i>
            NEXUS ADMIN
          </Navbar.Brand>
          <Navbar.Toggle />
          <Navbar.Collapse>
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/admin" className="text-light">
                <i className="bi bi-list-ul me-1"></i>Quản lý Menu
              </Nav.Link>
              <Nav.Link as={Link} to="/admin/tables" className="text-light">
                <i className="bi bi-table me-1"></i>Quản lý Bàn
              </Nav.Link>
              <Nav.Link as={Link} to="/admin/users" className="text-light">
                <i className="bi bi-people me-1"></i>Quản lý User
              </Nav.Link>
              <Nav.Link as={Link} to="/admin/reports" className="text-light">
                <i className="bi bi-bar-chart-line me-1"></i>Report & Analytics
              </Nav.Link>
            </Nav>
            <div className="ms-auto d-flex align-items-center gap-3 mt-3 mt-lg-0">
              <Dropdown align="end">
                <Dropdown.Toggle
                  variant="outline-light"
                  size="sm"
                  className="d-flex align-items-center gap-2"
                >
                  <i className="bi bi-person-circle"></i>
                  <span>{user?.fullName || user?.email || "Admin"}</span>
                </Dropdown.Toggle>
                <Dropdown.Menu className="shadow">
                  <Dropdown.Item as={Link} to="/admin/profile">
                    <i className="bi bi-person me-2"></i>
                    Hồ sơ
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={handleLogout} className="text-danger">
                    <i className="bi bi-box-arrow-right me-2"></i>
                    Đăng xuất
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container fluid className="py-4">
        {error && (
          <Alert variant="danger" className="shadow-sm border-0 mb-4">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        )}

        {/* ── Header KPI ── */}
        <Card className="shadow-sm border-0 mb-4">
          <Card.Body className="p-4">
            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start gap-3 mb-3">
              <div>
                <h4 className="fw-bold mb-2">Doanh thu & Tỉ lệ lấp đầy</h4>
                <p className="text-muted mb-0 small">
                  Phân tích chi tiết doanh thu từ thanh toán thành công và mức
                  độ sử dụng bàn/phòng theo từng kỳ thời gian
                </p>
              </div>
              <ButtonGroup size="sm">
                {["Ngày", "Tuần", "Tháng", "Năm"].map((f) => (
                  <Button
                    key={f}
                    variant={timeFilter === f ? "primary" : "outline-primary"}
                    onClick={() => setTimeFilter(f)}
                    style={{ minWidth: 70 }}
                  >
                    {f}
                  </Button>
                ))}
              </ButtonGroup>
            </div>

            <Row className="g-3">
              <Col md={6} xl={3}>
                <div className="p-3 border rounded bg-white h-100">
                  <div className="small text-muted mb-1">
                    Tổng doanh thu ({timeFilter})
                  </div>
                  <div className="h5 fw-bold mb-0">
                    {formatCurrency(summary.totalRevenue)}
                  </div>
                </div>
              </Col>
              <Col md={6} xl={3}>
                <div className="p-3 border rounded bg-white h-100">
                  <div className="small text-muted mb-1">Tổng booking</div>
                  <div className="h5 fw-bold mb-0">
                    {summary.totalBookings || 0}
                  </div>
                  <div className="small text-primary">Đặt bàn / phòng</div>
                </div>
              </Col>
              <Col md={6} xl={3}>
                <div className="p-3 border rounded bg-white h-100">
                  <div className="small text-muted mb-1">Tổng bàn / phòng</div>
                  <div className="h5 fw-bold mb-0">
                    {summary.totalTables || 0}
                  </div>
                  <div className="small text-success">Đang hoạt động</div>
                </div>
              </Col>
              <Col md={6} xl={3}>
                <div className="p-3 border rounded bg-white h-100">
                  <div className="small text-muted mb-1">
                    Lấp đầy TB ({timeFilter})
                  </div>
                  <div className="h5 fw-bold mb-0">
                    {summary.occupancyRate || 0}%
                  </div>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* ── Revenue chart + Top 5 ── */}
        <Row className="g-4 mb-4">
          <Col lg={8}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Body className="p-4">
                <h5 className="fw-bold mb-1">Biểu đồ doanh thu</h5>
                <div className="text-muted small mb-3">
                  Doanh thu theo {timeFilter.toLowerCase()}
                </div>
                <RevenueLineChart
                  data={revenueChartData}
                  timeFilter={timeFilter}
                />
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Body className="p-4">
                <h5 className="fw-bold mb-1">Phân bổ</h5>
                <div className="text-muted small mb-3">
                  Top 5 kỳ doanh thu cao nhất
                </div>
                <div className="d-flex flex-column gap-2">
                  {topRevenuePeriods.length === 0 ? (
                    <div className="text-center text-muted py-4">
                      <i className="bi bi-inbox fs-3"></i>
                      <div className="small mt-2">Chưa có dữ liệu</div>
                    </div>
                  ) : (
                    topRevenuePeriods.map((item, i) => (
                      <div
                        key={i}
                        className="d-flex justify-content-between align-items-center py-2 border-bottom"
                      >
                        <span className="small">
                          <span className="badge bg-primary me-2">{i + 1}</span>
                          {item.period}
                        </span>
                        <span className="fw-semibold text-success">
                          {formatCurrency(item.revenue)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* ── Occupancy bar chart ── */}
        <Card className="shadow-sm border-0 mb-4">
          <Card.Body className="p-4">
            <h5 className="fw-bold mb-1">Biểu đồ lấp đầy</h5>
            <div className="text-muted small mb-3">
              Tỷ lệ lấp đầy bàn theo ngày
            </div>
            <OccupancyBarChart data={occupancyByDay} />
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
