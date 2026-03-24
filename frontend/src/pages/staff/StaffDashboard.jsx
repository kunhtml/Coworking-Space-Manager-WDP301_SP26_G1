import { useEffect, useState, useCallback } from "react";
import { Badge, Button, Card, Col, Row } from "react-bootstrap";
import { useNavigate } from "react-router";
import AdminLayout from "../../components/admin/AdminLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import RecentActivityTable from "../../components/staff/RecentActivityTable";
import { getStaffDashboardStats } from "../../services/staffDashboardService";

export function meta() {
  return [
    { title: "Dashboard | Staff" },
    { name: "description", content: "Bảng điều khiển nhân viên" },
  ];
}

const ORDER_STATUS_UI = {
  PENDING:   { label: "Chờ xử lý", cls: "bg-warning-subtle text-warning", icon: "bi-hourglass-split" },
  CONFIRMED: { label: "Đã xác nhận", cls: "bg-primary-subtle text-primary", icon: "bi-check-circle" },
  PREPARING: { label: "Đang chuẩn bị", cls: "bg-info-subtle text-info", icon: "bi-fire" },
  SERVED:    { label: "Đã phục vụ", cls: "bg-success-subtle text-success", icon: "bi-cup-hot" },
  COMPLETED: { label: "Hoàn tất", cls: "bg-secondary-subtle text-secondary", icon: "bi-trophy" },
  CANCELLED: { label: "Đã hủy", cls: "bg-danger-subtle text-danger", icon: "bi-x-circle" },
};

function fmtCur(v) {
  return `${new Intl.NumberFormat("vi-VN").format(Number(v || 0))}đ`;
}
function toTime(v) {
  if (!v) return "--";
  return new Date(v).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export default function StaffDashboard() {
  const navigate = useNavigate();
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const data = await getStaffDashboardStats();
      setStats(data);
      setLastRefresh(new Date());
    } catch {
      /* ignore – keep stale data */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30_000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const statCards = stats
    ? [
        {
          icon: "bi-receipt-cutoff",
          iconWrap: "staff-stat-icon bg-info-subtle text-info",
          value: String(stats.orders.total),
          label: "Đơn hàng hôm nay",
          trend: `${stats.orders.COMPLETED} hoàn tất`,
          trendClass: stats.orders.COMPLETED > 0 ? "text-success" : "text-secondary",
        },
        {
          icon: "bi-hourglass-split",
          iconWrap: "staff-stat-icon bg-warning-subtle text-warning",
          value: String(stats.orders.PENDING),
          label: "Đơn chờ xử lý",
          trend: stats.orders.PENDING > 0 ? "Cần xử lý ngay" : "Không có đơn chờ",
          trendClass: stats.orders.PENDING > 0 ? "text-danger" : "text-success",
        },
        {
          icon: "bi-shop",
          iconWrap: "staff-stat-icon bg-success-subtle text-success",
          value: `${stats.tables.occupied}/${stats.tables.total}`,
          label: "Bàn đang sử dụng",
          trend: `${stats.tables.available} bàn trống`,
          trendClass: stats.tables.available > 0 ? "text-success" : "text-danger",
        },
        {
          icon: "bi-trophy",
          iconWrap: "staff-stat-icon bg-primary-subtle text-primary",
          value: String(stats.orders.COMPLETED),
          label: "Đơn hoàn thành",
          trend: `${stats.orders.CANCELLED} đã hủy`,
          trendClass: "text-secondary",
        },
      ]
    : [];

  return (
    <AdminLayout>
      <div className="mb-4 d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div>
          <h2 className="fw-bold mb-1">Dashboard</h2>
          <p className="text-secondary fw-semibold small mb-0">
            Tổng quan hoạt động hôm nay
            {lastRefresh && (
              <span className="ms-2 text-muted" style={{ fontWeight: 400 }}>
                · Cập nhật lúc {toTime(lastRefresh)}
              </span>
            )}
          </p>
        </div>
        <Button
          variant="outline-secondary"
          size="sm"
          className="rounded-3 fw-semibold d-flex align-items-center gap-1"
          onClick={fetchStats}
          disabled={loading}
        >
          <i className={`bi ${loading ? "bi-arrow-clockwise" : "bi-arrow-clockwise"}`} />
          {loading ? "Đang tải..." : "Làm mới"}
        </Button>
      </div>

      {/* Stat Cards */}
      {loading && !stats ? (
        <LoadingSpinner text="Đang tải dữ liệu..." color="#6366f1" />
      ) : (
        <>
          <Row className="g-3 mb-4">
            {statCards.map((card) => (
              <Col xl={3} md={6} key={card.label}>
                <Card className="border-0 shadow-sm staff-panel-card h-100">
                  <Card.Body>
                    <div className={card.iconWrap}>
                      <i className={`bi ${card.icon}`}></i>
                    </div>
                    <h3 className="fw-bold mb-1 mt-3">{card.value}</h3>
                    <div className="text-secondary fw-semibold mb-2">{card.label}</div>
                    <small className={`${card.trendClass} fw-semibold`}>{card.trend}</small>
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
                    Hoạt động gần đây (10 đơn mới nhất)
                  </h5>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="rounded-3 fw-semibold"
                    onClick={() => navigate("/staff-dashboard/orders")}
                  >
                    Xem tất cả
                  </Button>
                </Card.Header>
                <Card.Body className="p-0">
                  <RecentActivityTable
                    activity={stats?.activity || []}
                    statusUi={ORDER_STATUS_UI}
                    fmtCur={fmtCur}
                    toTime={toTime}
                  />
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4}>
              <Card className="border-0 shadow-sm staff-panel-card h-100">
                <Card.Header className="bg-white border-bottom">
                  <h5 className="mb-0 fw-bold">
                    <i className="bi bi-bar-chart-fill me-2 text-primary"></i>
                    Thống kê đơn hàng hôm nay
                  </h5>
                </Card.Header>
                <Card.Body>
                  {stats ? (
                    <div className="d-flex flex-column gap-3 mt-1">
                      {[
                        { key: "PENDING", label: "Chờ xử lý", cls: "bg-warning-subtle text-warning", icon: "bi-hourglass-split" },
                        { key: "CONFIRMED", label: "Đã xác nhận", cls: "bg-primary-subtle text-primary", icon: "bi-check-circle" },
                        { key: "PREPARING", label: "Đang chuẩn bị", cls: "bg-info-subtle text-info", icon: "bi-fire" },
                        { key: "SERVED", label: "Đã phục vụ", cls: "bg-success-subtle text-success", icon: "bi-cup-hot" },
                        { key: "COMPLETED", label: "Hoàn tất", cls: "bg-secondary-subtle text-secondary", icon: "bi-trophy" },
                        { key: "CANCELLED", label: "Đã hủy", cls: "bg-danger-subtle text-danger", icon: "bi-x-circle" },
                      ].map(({ key, label, cls, icon }) => {
                        const count = stats.orders[key] || 0;
                        const pct   = stats.orders.total > 0 ? Math.round((count / stats.orders.total) * 100) : 0;
                        return (
                          <div key={key}>
                            <div className="d-flex justify-content-between mb-1">
                              <span className="fw-semibold small d-flex align-items-center gap-1">
                                <i className={`bi ${icon}`} /> {label}
                              </span>
                              <span className={`fw-bold small rounded-pill px-2 ${cls}`}>{count}</span>
                            </div>
                            <div className="progress" style={{ height: 6, borderRadius: 8 }}>
                              <div
                                className="progress-bar"
                                style={{
                                  width: `${pct}%`,
                                  background: key === "PENDING" ? "#f59e0b"
                                    : key === "CONFIRMED" ? "#6366f1"
                                    : key === "PREPARING" ? "#0284c7"
                                    : key === "SERVED" ? "#22c55e"
                                    : key === "COMPLETED" ? "#64748b"
                                    : "#ef4444",
                                  borderRadius: 8,
                                  transition: "width 0.5s ease",
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}

                      <hr className="my-1" />
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-semibold small">
                          <i className="bi bi-shop me-1 text-success" />Bàn trống
                        </span>
                        <span className="fw-bold" style={{ color: "#22c55e" }}>
                          {stats.tables.available}/{stats.tables.total}
                        </span>
                      </div>

                      <Button
                        className="fw-bold rounded-3 mt-2"
                        style={{ background: "#6366f1", border: "none" }}
                        onClick={() => navigate("/staff-dashboard/orders")}
                      >
                        <i className="bi bi-receipt-cutoff me-2" />
                        Quản lý đơn hàng
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted small">Không có dữ liệu</div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </AdminLayout>
  );
}
