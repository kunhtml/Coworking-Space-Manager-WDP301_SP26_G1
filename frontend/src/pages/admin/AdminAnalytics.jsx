import { useState, useEffect, useCallback } from "react";
import { Card, Row, Col, Spinner, Alert, Badge } from "react-bootstrap";
import AdminLayout from "../../components/admin/AdminLayout";
import { apiClient as api } from "../../services/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from "recharts";

export function meta() {
  return [
    { title: "Công suất & Sử dụng | Admin" },
    {
      name: "description",
      content: "Phân tích hiệu suất và sử dụng không gian",
    },
  ];
}

// Color palette
const COLORS = {
  primary: "#8b5cf6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
  secondary: "#64748b",
};

const PIE_COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#6366f1"];

export default function AdminAnalytics() {
  const [filterTab, setFilterTab] = useState("week");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await api.get(`/admin/analytics?period=${filterTab}`);
      setData(result);
    } catch (err) {
      console.error("Error loading analytics:", err);
      setError(err.message || "Lỗi khi tải dữ liệu phân tích");
    } finally {
      setLoading(false);
    }
  }, [filterTab]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("vi-VN").format(value) + "đ";
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: "#1e293b",
            padding: "12px 16px",
            borderRadius: "8px",
            border: "none",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          <p style={{ color: "#e2e8f0", margin: 0, fontWeight: 600, marginBottom: "4px" }}>
            {label}
          </p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color, margin: 0, fontSize: "13px" }}>
              {entry.name}: {entry.value}
              {entry.dataKey === "usage" ? "%" : ""}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Render loading state
  if (loading) {
    return (
      <AdminLayout>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
          <Spinner animation="border" variant="primary" />
          <span className="ms-3">Đang tải dữ liệu...</span>
        </div>
      </AdminLayout>
    );
  }

  // Render error state
  if (error) {
    return (
      <AdminLayout>
        <Alert variant="danger" className="m-4">
          <Alert.Heading>Lỗi</Alert.Heading>
          <p>{error}</p>
          <button className="btn btn-outline-danger" onClick={loadAnalytics}>
            Thử lại
          </button>
        </Alert>
      </AdminLayout>
    );
  }

  // Default values if no data
  const metrics = data?.metrics || {
    occupancy: 0,
    occupancyChange: 0,
    avgTime: "0h 0p",
    avgTimeChange: 0,
    peakHours: "N/A",
    peakOccupancy: 0,
    noShowRate: 0,
    noShowChange: 0,
  };

  const hourlyCapacity = data?.hourlyCapacity || [];
  const topSpaces = data?.topSpaces || [];
  const tableTypeUsage = data?.tableTypeUsage || [];
  const trendData = data?.trendData || [];
  const summary = data?.summary || {};

  // Prepare pie chart data
  const pieData = tableTypeUsage
    .filter((t) => t.totalBookings > 0)
    .map((t) => ({
      name: t.name.replace("_", " "),
      value: t.totalBookings,
      hours: Math.round(t.totalHours),
      revenue: t.revenue,
    }));

  // Get status badge color
  const getChangeColor = (value, isNegativeBetter = false) => {
    if (value === 0) return "secondary";
    const isGood = isNegativeBetter ? value < 0 : value > 0;
    return isGood ? "success" : "danger";
  };

  const getChangeIcon = (value) => {
    if (value === 0) return "bi-dash";
    return value > 0 ? "bi-arrow-up" : "bi-arrow-down";
  };

  return (
    <AdminLayout>
      <div style={{ padding: "0" }}>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-start mb-4">
          <div>
            <h1 className="fw-bold mb-1" style={{ fontSize: "26px", color: "#1e293b" }}>
              Công suất & Sử dụng
            </h1>
            <p className="mb-0" style={{ fontSize: "14px", color: "#64748b" }}>
              Phân tích hiệu suất sử dụng không gian coworking
            </p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Badge bg="light" text="dark" className="px-3 py-2" style={{ fontSize: "12px" }}>
              <i className="bi bi-clock me-1"></i>
              Cập nhật: {new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
            </Badge>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-4">
          <div
            className="d-inline-flex p-1"
            style={{
              backgroundColor: "#f1f5f9",
              borderRadius: "10px",
            }}
          >
            {[
              { value: "today", label: "Hôm nay" },
              { value: "week", label: "Tuần này" },
              { value: "month", label: "Tháng này" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilterTab(tab.value)}
                style={{
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: "8px",
                  backgroundColor: filterTab === tab.value ? "white" : "transparent",
                  color: filterTab === tab.value ? "#8b5cf6" : "#64748b",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: filterTab === tab.value ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Metric Cards - 4 columns */}
        <Row className="g-3 mb-4">
          {/* Tỷ lệ lấp đầy */}
          <Col lg={3} md={6}>
            <Card className="border-0 h-100" style={{ borderRadius: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      backgroundColor: "#f3e8ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <i className="bi bi-pie-chart-fill" style={{ fontSize: "22px", color: COLORS.primary }}></i>
                  </div>
                </div>
                <div style={{ fontSize: "32px", fontWeight: "700", color: COLORS.primary, marginBottom: "4px" }}>
                  {metrics.occupancy}%
                </div>
                <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "500" }}>
                  Tỷ lệ lấp đầy trung bình
                </div>
                {/* Mini progress */}
                <div className="mt-3">
                  <div style={{ height: "6px", backgroundColor: "#f1f5f9", borderRadius: "3px" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${metrics.occupancy}%`,
                        backgroundColor: COLORS.primary,
                        borderRadius: "3px",
                        transition: "width 0.5s ease",
                      }}
                    />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Thời gian sử dụng */}
          <Col lg={3} md={6}>
            <Card className="border-0 h-100" style={{ borderRadius: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      backgroundColor: "#d1fae5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <i className="bi bi-clock-fill" style={{ fontSize: "22px", color: COLORS.success }}></i>
                  </div>
                </div>
                <div style={{ fontSize: "32px", fontWeight: "700", color: COLORS.success, marginBottom: "4px" }}>
                  {metrics.avgTime}
                </div>
                <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "500" }}>
                  Thời gian sử dụng TB/phiên
                </div>
                <div className="mt-3" style={{ fontSize: "12px", color: "#94a3b8" }}>
                  <i className="bi bi-info-circle me-1"></i>
                  Tổng: {summary.totalBookedHours || 0} giờ
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Khung giờ cao điểm */}
          <Col lg={3} md={6}>
            <Card className="border-0 h-100" style={{ borderRadius: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      backgroundColor: "#fef3c7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <i className="bi bi-fire" style={{ fontSize: "22px", color: COLORS.warning }}></i>
                  </div>
                </div>
                <div style={{ fontSize: "32px", fontWeight: "700", color: COLORS.warning, marginBottom: "4px" }}>
                  {metrics.peakHours}
                </div>
                <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "500" }}>
                  Khung giờ cao điểm
                </div>
                <div className="mt-3" style={{ fontSize: "12px", color: "#94a3b8" }}>
                  <i className="bi bi-exclamation-triangle me-1"></i>
                  Nên tăng giá giờ cao điểm
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Tỷ lệ hủy */}
          <Col lg={3} md={6}>
            <Card className="border-0 h-100" style={{ borderRadius: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      backgroundColor: "#fee2e2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <i className="bi bi-x-circle-fill" style={{ fontSize: "22px", color: COLORS.danger }}></i>
                  </div>
                </div>
                <div style={{ fontSize: "32px", fontWeight: "700", color: COLORS.danger, marginBottom: "4px" }}>
                  {metrics.noShowRate}%
                </div>
                <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "500" }}>
                  Tỷ lệ Hủy
                </div>
                <div className="mt-3" style={{ fontSize: "12px", color: "#94a3b8" }}>
                  <i className="bi bi-info-circle me-1"></i>
                  {summary.totalBookings || 0} đặt chỗ
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Charts Row */}
        <Row className="g-4 mb-4">
          {/* Bar Chart - Công suất theo khung giờ */}
          <Col lg={8}>
            <Card className="border-0 h-100" style={{ borderRadius: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <h5 className="fw-bold mb-1" style={{ fontSize: "16px", color: "#1e293b" }}>
                      Công suất theo khung giờ
                    </h5>
                    <p className="mb-0" style={{ fontSize: "12px", color: "#94a3b8" }}>
                      Tỷ lệ sử dụng các bàn theo từng giờ trong ngày
                    </p>
                  </div>
                  <Badge bg="light" text="dark" style={{ fontSize: "11px" }}>
                    {filterTab === "today" ? "Hôm nay" : filterTab === "week" ? "7 ngày qua" : "30 ngày qua"}
                  </Badge>
                </div>

                {hourlyCapacity.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={hourlyCapacity} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="time"
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        tickLine={false}
                        axisLine={{ stroke: "#e2e8f0" }}
                      />
                      <YAxis
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `${v}%`}
                        domain={[0, 100]}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="usage"
                        name="Tỷ lệ sử dụng"
                        fill={COLORS.primary}
                        radius={[6, 6, 0, 0]}
                        maxBarSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: "300px" }}>
                    <i className="bi bi-inbox" style={{ fontSize: "48px", color: "#cbd5e1" }}></i>
                    <p className="mt-3 mb-0" style={{ color: "#94a3b8" }}>
                      Chưa có dữ liệu trong khoảng thời gian này
                    </p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Pie Chart - Phân bố theo loại */}
          <Col lg={4}>
            <Card className="border-0 h-100" style={{ borderRadius: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <Card.Body className="p-4">
                <div className="mb-3">
                  <h5 className="fw-bold mb-1" style={{ fontSize: "16px", color: "#1e293b" }}>
                    Phân bố theo loại không gian
                  </h5>
                  <p className="mb-0" style={{ fontSize: "12px", color: "#94a3b8" }}>
                    Số lượng đặt chỗ theo từng loại
                  </p>
                </div>

                {pieData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name, props) => [
                            `${value} đặt chỗ (${props.payload.hours}h)`,
                            props.payload.name,
                          ]}
                          contentStyle={{
                            backgroundColor: "#1e293b",
                            border: "none",
                            borderRadius: "8px",
                            color: "#e2e8f0",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Legend */}
                    <div className="mt-2">
                      {pieData.map((item, index) => (
                        <div
                          key={index}
                          className="d-flex justify-content-between align-items-center py-1"
                          style={{ borderBottom: index < pieData.length - 1 ? "1px solid #f1f5f9" : "none" }}
                        >
                          <div className="d-flex align-items-center gap-2">
                            <div
                              style={{
                                width: "10px",
                                height: "10px",
                                borderRadius: "50%",
                                backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
                              }}
                            />
                            <span style={{ fontSize: "12px", color: "#64748b" }}>{item.name}</span>
                          </div>
                          <span style={{ fontSize: "12px", fontWeight: "600", color: "#1e293b" }}>
                            {item.value} ({Math.round((item.value / pieData.reduce((a, b) => a + b.value, 0)) * 100)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: "250px" }}>
                    <i className="bi bi-pie-chart" style={{ fontSize: "48px", color: "#cbd5e1" }}></i>
                    <p className="mt-3 mb-0" style={{ color: "#94a3b8" }}>
                      Chưa có dữ liệu
                    </p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Top Spaces Table */}
        <Card className="border-0" style={{ borderRadius: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <Card.Body className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h5 className="fw-bold mb-1" style={{ fontSize: "16px", color: "#1e293b" }}>
                  <i className="bi bi-trophy me-2" style={{ color: "#f59e0b" }}></i>
                  Top không gian được sử dụng nhiều nhất
                </h5>
                <p className="mb-0" style={{ fontSize: "12px", color: "#94a3b8" }}>
                  Xếp hạng dựa trên số lượng đặt chỗ và doanh thu
                </p>
              </div>
              <Badge bg="primary" className="px-3 py-2">
                {topSpaces.length} không gian
              </Badge>
            </div>

            {topSpaces.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover mb-0" style={{ fontSize: "13px" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                      <th style={{ fontWeight: "600", color: "#64748b", padding: "12px 16px" }}>#</th>
                      <th style={{ fontWeight: "600", color: "#64748b", padding: "12px 16px" }}>KHÔNG GIAN</th>
                      <th style={{ fontWeight: "600", color: "#64748b", padding: "12px 16px" }}>LOẠI</th>
                      <th style={{ fontWeight: "600", color: "#64748b", padding: "12px 16px", textAlign: "center" }}>
                        SỐ PHIÊN
                      </th>
                      <th style={{ fontWeight: "600", color: "#64748b", padding: "12px 16px", textAlign: "center" }}>
                        TỔNG GIỜ
                      </th>
                      <th style={{ fontWeight: "600", color: "#64748b", padding: "12px 16px", textAlign: "right" }}>
                        DOANH THU
                      </th>
                      <th style={{ fontWeight: "600", color: "#64748b", padding: "12px 16px", width: "180px" }}>
                        TỶ LỆ SỬ DỤNG
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {topSpaces.map((space, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "14px 16px", verticalAlign: "middle" }}>
                          {space.rank <= 3 ? (
                            <span style={{ fontSize: "20px" }}>
                              {space.rank === 1 ? "🥇" : space.rank === 2 ? "🥈" : "🥉"}
                            </span>
                          ) : (
                            <span style={{ color: "#94a3b8", fontWeight: "600" }}>{space.rank}</span>
                          )}
                        </td>
                        <td style={{ padding: "14px 16px", fontWeight: "600", color: "#1e293b" }}>{space.space}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <Badge
                            bg="light"
                            text="dark"
                            style={{ fontWeight: "500", fontSize: "11px" }}
                          >
                            {space.type?.replace("_", " ")}
                          </Badge>
                        </td>
                        <td style={{ padding: "14px 16px", textAlign: "center", color: "#64748b" }}>
                          {space.sessions}
                        </td>
                        <td style={{ padding: "14px 16px", textAlign: "center", color: "#64748b" }}>
                          {space.totalHours}
                        </td>
                        <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: "600", color: "#10b981" }}>
                          {space.revenue}
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <div className="d-flex align-items-center gap-2">
                            <div
                              style={{
                                flex: 1,
                                height: "8px",
                                backgroundColor: "#e2e8f0",
                                borderRadius: "4px",
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  height: "100%",
                                  width: `${space.usageRate}%`,
                                  backgroundColor:
                                    space.usageRate >= 70
                                      ? COLORS.primary
                                      : space.usageRate >= 40
                                        ? COLORS.info
                                        : COLORS.warning,
                                  borderRadius: "4px",
                                  transition: "width 0.5s ease",
                                }}
                              />
                            </div>
                            <span style={{ fontSize: "12px", fontWeight: "600", color: "#1e293b", minWidth: "36px" }}>
                              {space.usageRate}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-5">
                <i className="bi bi-inbox" style={{ fontSize: "48px", color: "#cbd5e1" }}></i>
                <p className="mt-3 mb-0" style={{ color: "#94a3b8" }}>
                  Chưa có dữ liệu đặt chỗ trong khoảng thời gian này
                </p>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Summary Footer */}
        <div
          className="mt-4 p-3 d-flex justify-content-between align-items-center"
          style={{
            backgroundColor: "#f8fafc",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
          }}
        >
          <div className="d-flex gap-4">
            <div style={{ fontSize: "13px" }}>
              <span style={{ color: "#64748b" }}>Tổng bàn:</span>
              <span style={{ color: "#1e293b", fontWeight: "600", marginLeft: "6px" }}>{summary.totalTables || 0}</span>
            </div>
            <div style={{ fontSize: "13px" }}>
              <span style={{ color: "#64748b" }}>Đặt chỗ:</span>
              <span style={{ color: "#1e293b", fontWeight: "600", marginLeft: "6px" }}>{summary.totalBookings || 0}</span>
            </div>
            <div style={{ fontSize: "13px" }}>
              <span style={{ color: "#64748b" }}>Giờ sử dụng:</span>
              <span style={{ color: "#1e293b", fontWeight: "600", marginLeft: "6px" }}>
                {summary.totalBookedHours || 0}h
              </span>
            </div>
          </div>
          <div style={{ fontSize: "13px" }}>
            <span style={{ color: "#64748b" }}>Tổng doanh thu:</span>
            <span style={{ color: COLORS.success, fontWeight: "700", marginLeft: "6px", fontSize: "15px" }}>
              {formatCurrency(summary.totalRevenue || 0)}
            </span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
