import { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Card, Col, Row, Table } from "react-bootstrap";
import AdminLayout from "../../components/admin/AdminLayout";
import { getReportAnalyticsApi } from "../../services/api";

export function meta() {
  return [
    { title: "Báo cáo doanh thu | Admin" },
    {
      name: "description",
      content: "Phân tích doanh thu theo dữ liệu thực từ hệ thống",
    },
  ];
}

const FILTER_MAP = {
  day: "Ngày",
  week: "Tuần",
  month: "Tháng",
  year: "Năm",
};

const FILTER_LABEL = {
  day: "ngày",
  week: "tuần",
  month: "tháng",
  year: "năm",
};

const STATUS_LABEL = {
  Success: "Thành công",
  Failed: "Thất bại",
  Pending: "Đang chờ",
};

function formatVND(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
}

function formatShortDate(dateValue) {
  if (!dateValue) return "-";
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });
}

export default function AdminRevenuePage() {
  const [timeFilter, setTimeFilter] = useState("day");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [report, setReport] = useState(null);

  useEffect(() => {
    const loadReport = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getReportAnalyticsApi({
          timeFilter: FILTER_MAP[timeFilter],
        });
        setReport(data || null);
      } catch (err) {
        setReport(null);
        setError(err.message || "Không tải được dữ liệu báo cáo doanh thu.");
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [timeFilter]);

  const summary = report?.summary || {};
  const revenueByPeriod = Array.isArray(report?.revenueByMonth)
    ? report.revenueByMonth
    : [];
  const occupancyByPeriod = Array.isArray(report?.occupancyByPeriod)
    ? report.occupancyByPeriod
    : [];
  const recentPayments = Array.isArray(report?.recentPayments)
    ? report.recentPayments
    : [];

  const filteredRevenue = useMemo(
    () => revenueByPeriod.reduce((sum, item) => sum + (Number(item.total) || 0), 0),
    [revenueByPeriod],
  );

  const filteredTransactions = useMemo(
    () => revenueByPeriod.reduce((sum, item) => sum + (Number(item.count) || 0), 0),
    [revenueByPeriod],
  );

  const filteredBookings = useMemo(
    () => occupancyByPeriod.reduce((sum, item) => sum + (Number(item.bookingCount) || 0), 0),
    [occupancyByPeriod],
  );

  const topTableTypeUsage = useMemo(() => {
    const rows = Array.isArray(report?.tableTypeUsage) ? report.tableTypeUsage : [];
    return rows.slice(0, 8);
  }, [report]);

  return (
    <AdminLayout>
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Báo cáo doanh thu</h2>
        <p className="text-muted mb-0">Dữ liệu lấy trực tiếp từ server</p>
      </div>

      <Row className="g-3 mb-4 align-items-center">
        <Col lg={8} className="d-flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant={timeFilter === "day" ? "dark" : "light"}
            onClick={() => setTimeFilter("day")}
          >
            Ngày
          </Button>
          <Button
            size="sm"
            variant={timeFilter === "week" ? "dark" : "light"}
            onClick={() => setTimeFilter("week")}
          >
            Tuần
          </Button>
          <Button
            size="sm"
            variant={timeFilter === "month" ? "dark" : "light"}
            onClick={() => setTimeFilter("month")}
          >
            Tháng
          </Button>
          <Button
            size="sm"
            variant={timeFilter === "year" ? "dark" : "light"}
            onClick={() => setTimeFilter("year")}
          >
            Năm
          </Button>
        </Col>
        <Col lg={4} className="text-lg-end">
          <small className="text-muted">
            Cập nhật: {report?.generatedAt ? new Date(report.generatedAt).toLocaleString("vi-VN") : "-"}
          </small>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="g-3 mb-4">
        <Col xl={3} md={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="text-secondary small">Tổng doanh thu</div>
              <h4 className="fw-bold mt-2 mb-0">{loading ? "..." : formatVND(filteredRevenue)}</h4>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={3} md={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="text-secondary small">Doanh thu cọc</div>
              <h4 className="fw-bold mt-2 mb-0">{loading ? "..." : formatVND(summary.depositRevenue)}</h4>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={3} md={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="text-secondary small">Doanh thu đơn dịch vụ</div>
              <h4 className="fw-bold mt-2 mb-0">{loading ? "..." : formatVND(summary.totalOrderRevenue)}</h4>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={3} md={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="text-secondary small">Tổng booking theo {FILTER_LABEL[timeFilter]}</div>
              <h4 className="fw-bold mt-2 mb-0">{loading ? "..." : Number(filteredBookings || 0).toLocaleString("vi-VN")}</h4>
              <div className="text-muted small mt-1">{loading ? "" : `${Number(filteredTransactions || 0).toLocaleString("vi-VN")} giao dịch thành công`}</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-3 mb-3">
        <Col lg={7}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0 fw-bold">Doanh thu theo kỳ</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive className="mb-0 align-middle">
                <thead>
                  <tr>
                    <th>Kỳ</th>
                    <th>Doanh thu</th>
                    <th>Số giao dịch</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="text-center text-muted py-4">Đang tải...</td>
                    </tr>
                  ) : revenueByPeriod.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center text-muted py-4">Không có dữ liệu</td>
                    </tr>
                  ) : (
                    revenueByPeriod.map((item) => (
                      <tr key={item._id}>
                        <td className="fw-semibold">{item._id}</td>
                        <td>{formatVND(item.total)}</td>
                        <td>{Number(item.count || 0).toLocaleString("vi-VN")}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={5}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0 fw-bold">Thanh toán gần đây</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive className="mb-0 align-middle">
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>Hình thức</th>
                    <th>Số tiền</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="text-center text-muted py-4">Đang tải...</td>
                    </tr>
                  ) : recentPayments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center text-muted py-4">Không có dữ liệu</td>
                    </tr>
                  ) : (
                    recentPayments.map((row) => (
                      <tr key={String(row.id)}>
                        <td>{formatShortDate(row.paidAt)}</td>
                        <td>{row.method || "-"}</td>
                        <td>{formatVND(row.amount)}</td>
                        <td>
                          <Badge bg={row.status === "Success" ? "success" : row.status === "Failed" ? "danger" : "secondary"}>
                            {STATUS_LABEL[row.status] || row.status || "-"}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-bottom">
          <h5 className="mb-0 fw-bold">Chi tiết sử dụng theo loại bàn</h5>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive className="mb-0 align-middle">
            <thead>
              <tr>
                <th>Loại bàn</th>
                <th>Số booking</th>
                <th>Tổng khách quy đổi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="text-center text-muted py-4">Đang tải...</td>
                </tr>
              ) : topTableTypeUsage.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center text-muted py-4">Không có dữ liệu</td>
                </tr>
              ) : (
                topTableTypeUsage.map((row) => (
                  <tr key={row.tableType}>
                    <td className="fw-semibold">{row.tableType || "Không xác định"}</td>
                    <td>{Number(row.bookings || 0).toLocaleString("vi-VN")}</td>
                    <td>{Number(row.guests || 0).toLocaleString("vi-VN")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </AdminLayout>
  );
}
