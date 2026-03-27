import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Col, Row, Table } from "react-bootstrap";
import AdminLayout from "../../components/admin/AdminLayout";
import RevenueChart from "../../components/admin/RevenueChart";
import SummaryCard from "../../components/admin/SummaryCard";
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
    () =>
      revenueByPeriod.reduce((sum, item) => sum + (Number(item.total) || 0), 0),
    [revenueByPeriod],
  );

  const filteredTransactions = useMemo(
    () =>
      revenueByPeriod.reduce((sum, item) => sum + (Number(item.count) || 0), 0),
    [revenueByPeriod],
  );

  const filteredBookings = useMemo(
    () =>
      occupancyByPeriod.reduce(
        (sum, item) => sum + (Number(item.bookingCount) || 0),
        0,
      ),
    [occupancyByPeriod],
  );

  const topTableTypeUsage = useMemo(() => {
    const rows = Array.isArray(report?.tableTypeUsage)
      ? report.tableTypeUsage
      : [];
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
            Cập nhật:{" "}
            {report?.generatedAt
              ? new Date(report.generatedAt).toLocaleString("vi-VN")
              : "-"}
          </small>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="g-3 mb-4">
        <Col xl={4} md={6}>
          <SummaryCard
            label="Tổng doanh thu"
            value={loading ? "..." : formatVND(filteredRevenue)}
          />
        </Col>
        <Col xl={4} md={6}>
          <SummaryCard
            label="Doanh thu đơn dịch vụ"
            value={loading ? "..." : formatVND(summary.totalOrderRevenue)}
          />
        </Col>
        <Col xl={4} md={6}>
          <SummaryCard
            label={`Tổng booking theo ${FILTER_LABEL[timeFilter]}`}
            value={
              loading
                ? "..."
                : Number(filteredBookings || 0).toLocaleString("vi-VN")
            }
            subtitle={
              loading
                ? ""
                : `${Number(filteredTransactions || 0).toLocaleString("vi-VN")} giao dịch thành công`
            }
          />
        </Col>
      </Row>

      <Row className="g-3 mb-3">
        <Col lg={7}>
          <RevenueChart
            title="Doanh thu theo kỳ"
            columns={[
              { key: "period", header: "Kỳ" },
              { key: "total", header: "Doanh thu" },
              { key: "count", header: "Số giao dịch" },
            ]}
            data={revenueByPeriod}
            loading={loading}
            emptyText="Không có dữ liệu"
            renderCell={(col, row) => {
              if (col.key === "period")
                return <span className="fw-semibold">{row._id}</span>;
              if (col.key === "total") return formatVND(row.total);
              if (col.key === "count")
                return Number(row.count || 0).toLocaleString("vi-VN");
              return null;
            }}
          />
        </Col>

        <Col lg={5}>
          <RevenueChart
            title="Thanh toán gần đây"
            columns={[
              { key: "paidAt", header: "Thời gian" },
              { key: "method", header: "Hình thức" },
              { key: "amount", header: "Số tiền" },
            ]}
            data={recentPayments}
            loading={loading}
            emptyText="Không có dữ liệu"
            renderCell={(col, row) => {
              if (col.key === "paidAt") return formatShortDate(row.paidAt);
              if (col.key === "method") return row.method || "-";
              if (col.key === "amount") return formatVND(row.amount);
              return null;
            }}
          />
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
                  <td colSpan={3} className="text-center text-muted py-4">
                    Đang tải...
                  </td>
                </tr>
              ) : topTableTypeUsage.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center text-muted py-4">
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                topTableTypeUsage.map((row) => (
                  <tr key={row.tableType}>
                    <td className="fw-semibold">
                      {row.tableType || "Không xác định"}
                    </td>
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
