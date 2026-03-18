import { useState, useEffect } from "react";
import { Card, Row, Col, Button } from "react-bootstrap";
import AdminLayout from "../../components/admin/AdminLayout";

export function meta() {
  return [
    { title: "Công suất & Sử dụng | Admin" },
    {
      name: "description",
      content: "Phân tích hiệu suất và sử dụng không gian",
    },
  ];
}

export default function AdminAnalytics() {
  const [filterTab, setFilterTab] = useState("today");
  
  const metrics = {
    occupancy: 72,
    avgTime: "2h 45p",
    peakHours: "14:00-17:00",
    noShowRate: 3.2,
  };

  const hourlyCapacity = [
    { time: "7h", usage: 15 },
    { time: "8h", usage: 30 },
    { time: "9h", usage: 55 },
    { time: "10h", usage: 65 },
    { time: "11h", usage: 50 },
    { time: "12h", usage: 40 },
    { time: "13h", usage: 60 },
    { time: "14h", usage: 85 },
    { time: "15h", usage: 88 },
    { time: "16h", usage: 70 },
    { time: "17h", usage: 48 },
    { time: "18h", usage: 45 },
  ];

  // Heatmap data - space usage by day and type
  const heatmapData = [
    { type: "Sáng", days: [65, 72, 78, 85, 82, 75, 45] },
    { type: "Trưa", days: [48, 55, 62, 68, 70, 58, 32] },
    { type: "Chiều", days: [72, 80, 85, 88, 92, 80, 50] },
    { type: "Tối", days: [55, 60, 65, 70, 72, 65, 40] },
  ];

  const topSpaces = [
    {
      rank: 1,
      space: "A3",
      type: "Ghế cá nhân",
      sessions: 45,
      totalHours: "112h",
      revenue: "2,800,000đ",
      usageRate: 92,
    },
    {
      rank: 2,
      space: "B1",
      type: "Bàn nhóm",
      sessions: 38,
      totalHours: "95h",
      revenue: "3,800,000đ",
      usageRate: 85,
    },
    {
      rank: 3,
      space: "A1",
      type: "Ghế cá nhân",
      sessions: 42,
      totalHours: "98h",
      revenue: "2,450,000đ",
      usageRate: 82,
    },
    {
      rank: 4,
      space: "C1",
      type: "Phòng họp",
      sessions: 22,
      totalHours: "66h",
      revenue: "7,920,000đ",
      usageRate: 75,
    },
    {
      rank: 5,
      space: "VIP-1",
      type: "Phòng VIP",
      sessions: 12,
      totalHours: "48h",
      revenue: "9,600,000đ",
      usageRate: 60,
    },
    {
      rank: 6,
      space: "VIP-2",
      type: "Phòng VIP",
      sessions: 8,
      totalHours: "32h",
      revenue: "6,400,000đ",
      usageRate: 40,
    },
  ];

  const getColorForUsage = (rate) => {
    if (rate >= 80) return "#8b5cf6"; // purple
    if (rate >= 60) return "#3b82f6"; // blue
    if (rate >= 40) return "#f59e0b"; // orange
    return "#ef4444"; // red
  };

  const getHeatmapColor = (value) => {
    if (value >= 80) return "#4f46e5";
    if (value >= 65) return "#6366f1";
    if (value >= 50) return "#818cf8";
    if (value >= 35) return "#c7d2fe";
    return "#f3f4f6";
  };

  return (
    <AdminLayout>
      <div>
        {/* Header */}
        <div className="mb-5 pb-3">
          <h1 
            className="fw-bold mb-2"
            style={{ fontSize: "28px", color: "#1e293b" }}
          >
            Công suất & Sử dụng
          </h1>
          <p 
            className="mb-0"
            style={{ fontSize: "15px", color: "#64748b" }}
          >
            Tỷ lệ lấp đầy, khung giờ cao điểm, xếp hạng không gian
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-5 d-flex gap-3" style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "0" }}>
          {[
            { value: "today", label: "Hôm nay", text: "Today" },
            { value: "week", label: "Tuần này", text: "This Week" },
            { value: "month", label: "Tháng này", text: "This Month" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilterTab(tab.value)}
              style={{
                padding: "12px 20px",
                border: "none",
                backgroundColor: "transparent",
                borderBottom: filterTab === tab.value ? "3px solid #8b5cf6" : "none",
                color: filterTab === tab.value ? "#8b5cf6" : "#94a3b8",
                fontWeight: filterTab === tab.value ? "600" : "500",
                fontSize: "14px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (filterTab !== tab.value) {
                  e.target.style.color = "#64748b";
                }
              }}
              onMouseLeave={(e) => {
                if (filterTab !== tab.value) {
                  e.target.style.color = "#94a3b8";
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Metric Cards */}
        <Row className="g-3 mb-5">
          <Col lg={3} md={6}>
            <Card 
              className="border-0"
              style={{
                backgroundColor: "white",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
                borderRadius: "12px",
              }}
            >
              <Card.Body className="p-4">
                <div className="d-flex align-items-start justify-content-between">
                  <div>
                    <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "600", marginBottom: "8px" }}>
                      Tỷ lệ lấp đầy trung bình
                    </div>
                    <div style={{ fontSize: "32px", fontWeight: "700", color: "#8b5cf6", marginBottom: "6px" }}>
                      {metrics.occupancy}%
                    </div>
                    <div style={{ fontSize: "12px", color: "#22c55e", fontWeight: "600" }}>
                      <i className="bi bi-arrow-up me-1"></i>
                      +15% vs tuần trước
                    </div>
                  </div>
                  <div style={{ fontSize: "28px" }}>📊</div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6}>
            <Card 
              className="border-0"
              style={{
                backgroundColor: "white",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
                borderRadius: "12px",
              }}
            >
              <Card.Body className="p-4">
                <div className="d-flex align-items-start justify-content-between">
                  <div>
                    <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "600", marginBottom: "8px" }}>
                      Thời gian nghỉ trung bình
                    </div>
                    <div style={{ fontSize: "32px", fontWeight: "700", color: "#10b981", marginBottom: "6px" }}>
                      {metrics.avgTime}
                    </div>
                    <div style={{ fontSize: "12px", color: "#22c55e", fontWeight: "600" }}>
                      <i className="bi bi-arrow-up me-1"></i>
                      +16 phút
                    </div>
                  </div>
                  <div style={{ fontSize: "28px" }}>⏱️</div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6}>
            <Card 
              className="border-0"
              style={{
                backgroundColor: "white",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
                borderRadius: "12px",
              }}
            >
              <Card.Body className="p-4">
                <div className="d-flex align-items-start justify-content-between">
                  <div>
                    <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "600", marginBottom: "8px" }}>
                      Khung giờ cao điểm
                    </div>
                    <div style={{ fontSize: "32px", fontWeight: "700", color: "#f59e0b", marginBottom: "6px" }}>
                      {metrics.peakHours}
                    </div>
                    <div style={{ fontSize: "12px", color: "#22c55e", fontWeight: "600" }}>
                      <i className="bi bi-arrow-up me-1"></i>
                      92% lấp đầy
                    </div>
                  </div>
                  <div style={{ fontSize: "28px" }}>🔥</div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6}>
            <Card 
              className="border-0"
              style={{
                backgroundColor: "white",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
                borderRadius: "12px",
              }}
            >
              <Card.Body className="p-4">
                <div className="d-flex align-items-start justify-content-between">
                  <div>
                    <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "600", marginBottom: "8px" }}>
                      Tỷ lệ No-show
                    </div>
                    <div style={{ fontSize: "32px", fontWeight: "700", color: "#ef4444", marginBottom: "6px" }}>
                      {metrics.noShowRate}%
                    </div>
                    <div style={{ fontSize: "12px", color: "#ef4444", fontWeight: "600" }}>
                      <i className="bi bi-arrow-down me-1"></i>
                      -1.5%
                    </div>
                  </div>
                  <div style={{ fontSize: "28px" }}>👥</div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Main Content */}
        <Row className="g-4 mb-5">
          {/* Hourly Capacity Chart */}
          <Col lg={7}>
            <Card 
              className="border-0"
              style={{
                backgroundColor: "white",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
                borderRadius: "12px",
              }}
            >
              <Card.Body className="p-4">
                <h5 
                  className="mb-4 fw-bold"
                  style={{ fontSize: "16px", color: "#1e293b" }}
                >
                  <i className="bi bi-bar-chart" style={{ color: "#8b5cf6", marginRight: "8px" }}></i>
                  Công suất theo khung giờ
                </h5>

                <div style={{ height: "300px", display: "flex", alignItems: "flex-end", gap: "8px" }}>
                  {hourlyCapacity.map((item, idx) => (
                    <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div
                        style={{
                          width: "100%",
                          height: `${Math.max(30, item.usage * 3)}px`,
                          backgroundColor: "#c7d2fe",
                          borderRadius: "4px 4px 0 0",
                          transition: "all 0.2s",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#8b5cf6";
                          e.currentTarget.style.boxShadow = "0 4px 12px rgba(139, 92, 246, 0.3)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#c7d2fe";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      />
                      <small style={{ color: "#94a3b8", fontWeight: "600", marginTop: "8px", fontSize: "11px" }}>
                        {item.time}
                      </small>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid #f1f5f9" }}>
                  <small style={{ color: "#f59e0b", fontWeight: "600" }}>
                    <i className="bi bi-exclamation-circle me-1"></i>
                    Cao điểm: 14:00 - 16:00 (88–95% lấp đầy)
                  </small>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Heatmap */}
          <Col lg={5}>
            <Card 
              className="border-0"
              style={{
                backgroundColor: "white",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
                borderRadius: "12px",
              }}
            >
              <Card.Body className="p-4">
                <h5 
                  className="mb-3 fw-bold"
                  style={{ fontSize: "16px", color: "#1e293b" }}
                >
                  <i className="bi bi-calendar-heat" style={{ color: "#8b5cf6", marginRight: "8px" }}></i>
                  Heatmap tuần này
                </h5>

                <small style={{ color: "#64748b", fontSize: "12px", display: "block", marginBottom: "16px" }}>
                  Mức độ sử dụng theo ngày & khung giờ:
                </small>

                {heatmapData.map((row, rowIdx) => (
                  <div key={rowIdx} style={{ marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      <small style={{ width: "40px", color: "#64748b", fontWeight: "600", fontSize: "11px" }}>
                        {row.type}
                      </small>
                      <div style={{ display: "flex", gap: "4px", flex: 1 }}>
                        {row.days.map((day, dayIdx) => (
                          <div
                            key={dayIdx}
                            style={{
                              flex: 1,
                              height: "28px",
                              backgroundColor: getHeatmapColor(day),
                              borderRadius: "4px",
                              cursor: "pointer",
                              transition: "all 0.2s",
                              title: `${day}%`,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = "scale(1.1)";
                              e.currentTarget.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.15)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "none";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "11px" }}>
                    <div>
                      <div style={{ width: "16px", height: "16px", backgroundColor: "#f3f4f6", borderRadius: "2px" }} />
                    </div>
                    <span style={{ color: "#94a3b8" }}>15%</span>
                    <div style={{ display: "flex", gap: "4px" }}>
                      {[4, 3, 2, 1].map((idx) => (
                        <div 
                          key={idx}
                          style={{
                            width: "16px",
                            height: "16px",
                            backgroundColor: getHeatmapColor(10 + idx * 20),
                            borderRadius: "2px",
                          }}
                        />
                      ))}
                    </div>
                    <span style={{ color: "#94a3b8" }}>Nối điều</span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Top Spaces Table */}
        <Card 
          className="border-0"
          style={{
            backgroundColor: "white",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
            borderRadius: "12px",
          }}
        >
          <Card.Body className="p-4">
            <h5 
              className="mb-4 fw-bold"
              style={{ fontSize: "16px", color: "#1e293b" }}
            >
              <i className="bi bi-trophy" style={{ color: "#f59e0b", marginRight: "8px" }}></i>
              Xếp hạng không gian được sử dụng nhiều nhất
            </h5>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <th style={{ padding: "12px", textAlign: "left", color: "#64748b", fontWeight: "600", fontSize: "12px" }}>#</th>
                    <th style={{ padding: "12px", textAlign: "left", color: "#64748b", fontWeight: "600", fontSize: "12px" }}>KHÔNG GIAN</th>
                    <th style={{ padding: "12px", textAlign: "left", color: "#64748b", fontWeight: "600", fontSize: "12px" }}>LOẠI</th>
                    <th style={{ padding: "12px", textAlign: "left", color: "#64748b", fontWeight: "600", fontSize: "12px" }}>SỐ PHIÊN</th>
                    <th style={{ padding: "12px", textAlign: "left", color: "#64748b", fontWeight: "600", fontSize: "12px" }}>TỔNG GIỜ</th>
                    <th style={{ padding: "12px", textAlign: "left", color: "#64748b", fontWeight: "600", fontSize: "12px" }}>DOANH THU</th>
                    <th style={{ padding: "12px", textAlign: "left", color: "#64748b", fontWeight: "600", fontSize: "12px" }}>TỶ LỆ SỬ DỤNG</th>
                  </tr>
                </thead>
                <tbody>
                  {topSpaces.map((space, idx) => (
                    <tr 
                      key={idx}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        backgroundColor: idx % 2 === 0 ? "transparent" : "#f9fafb",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#f3f4f6";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = idx % 2 === 0 ? "transparent" : "#f9fafb";
                      }}
                    >
                      <td style={{ padding: "12px", color: "#64748b", fontSize: "13px", fontWeight: "600" }}>
                        {space.rank}
                      </td>
                      <td style={{ padding: "12px", color: "#1e293b", fontSize: "13px", fontWeight: "600" }}>
                        {space.space}
                      </td>
                      <td style={{ padding: "12px", color: "#64748b", fontSize: "13px" }}>
                        {space.type}
                      </td>
                      <td style={{ padding: "12px", color: "#64748b", fontSize: "13px" }}>
                        {space.sessions} phiên
                      </td>
                      <td style={{ padding: "12px", color: "#64748b", fontSize: "13px" }}>
                        {space.totalHours}
                      </td>
                      <td style={{ padding: "12px", color: "#1e293b", fontSize: "13px", fontWeight: "600" }}>
                        {space.revenue}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ flex: 1, height: "4px", backgroundColor: "#e2e8f0", borderRadius: "2px" }}>
                            <div
                              style={{
                                height: "100%",
                                width: `${space.usageRate}%`,
                                backgroundColor: getColorForUsage(space.usageRate),
                                borderRadius: "2px",
                              }}
                            />
                          </div>
                          <span style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b", minWidth: "32px" }}>
                            {space.usageRate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card.Body>
        </Card>
      </div>
    </AdminLayout>
  );
}
