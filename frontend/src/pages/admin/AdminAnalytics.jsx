import { useState, useEffect } from "react";
import { Row, Col } from "react-bootstrap";
import AdminLayout from "../../components/admin/AdminLayout";
import AnalyticsFilterTabs from "../../components/admin/AnalyticsFilterTabs";
import AnalyticsMetricCard from "../../components/admin/AnalyticsMetricCard";
import HourlyCapacityCard from "../../components/admin/HourlyCapacityCard";
import TopSpacesTableCard from "../../components/admin/TopSpacesTableCard";
import { getHourlyOccupancyApi } from "../../services/api";

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
  const [hourlyCapacity, setHourlyCapacity] = useState([]);
  const [peakWindowLabel, setPeakWindowLabel] = useState("--");
  const [hourlyLoading, setHourlyLoading] = useState(true);
  const [hourlyError, setHourlyError] = useState("");

  useEffect(() => {
    const formatLocalISODate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const loadHourlyCapacity = async () => {
      setHourlyLoading(true);
      setHourlyError("");

      try {
        const periodMap = {
          today: "day",
          week: "week",
          month: "month",
        };
        const data = await getHourlyOccupancyApi({
          date: formatLocalISODate(new Date()),
          period: periodMap[filterTab] || "day",
        });
        setHourlyCapacity(Array.isArray(data?.hourlyCapacity) ? data.hourlyCapacity : []);
        setPeakWindowLabel(data?.peakWindow?.label || "--");
      } catch (err) {
        setHourlyCapacity([]);
        setPeakWindowLabel("--");
        setHourlyError(err?.message || "Khong tai duoc du lieu cong suat theo gio.");
      } finally {
        setHourlyLoading(false);
      }
    };

    loadHourlyCapacity();
  }, [filterTab]);

  const averageHourlyOccupancy = hourlyCapacity.length
    ? Math.round(
        hourlyCapacity.reduce((sum, item) => sum + (Number(item.usage) || 0), 0) /
          hourlyCapacity.length,
      )
    : 0;

  const metrics = {
    occupancy: averageHourlyOccupancy,
    avgTime: "2h 45p",
    peakHours: peakWindowLabel !== "--" ? peakWindowLabel.split(" (")[0] : "--",
    noShowRate: 3.2,
  };

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

  return (
    <AdminLayout>
      <div>
        <div className="mb-5 pb-3">
          <h1
            className="fw-bold mb-2"
            style={{ fontSize: "28px", color: "#1e293b" }}
          >
            Công suất & Sử dụng
          </h1>
          <p className="mb-0" style={{ fontSize: "15px", color: "#64748b" }}>
            Tỷ lệ lấp đầy, khung giờ cao điểm, xếp hạng không gian
          </p>
        </div>

        <AnalyticsFilterTabs filterTab={filterTab} onChange={setFilterTab} />

        <Row className="g-3 mb-5">
          <Col lg={3} md={6}>
            <AnalyticsMetricCard
              label="Tỷ lệ lấp đầy trung bình"
              value={`${metrics.occupancy}%`}
              valueColor="#8b5cf6"
              trendColor="#22c55e"
              trendText={
                <>
                  <i className="bi bi-arrow-up me-1"></i>
                  +15% vs tuần trước
                </>
              }
              icon="📊"
            />
          </Col>

          <Col lg={3} md={6}>
            <AnalyticsMetricCard
              label="Thời gian nghỉ trung bình"
              value={metrics.avgTime}
              valueColor="#10b981"
              trendColor="#22c55e"
              trendText={
                <>
                  <i className="bi bi-arrow-up me-1"></i>
                  +16 phút
                </>
              }
              icon="⏱️"
            />
          </Col>

          <Col lg={3} md={6}>
            <AnalyticsMetricCard
              label="Khung giờ cao điểm"
              value={metrics.peakHours}
              valueColor="#f59e0b"
              trendColor="#22c55e"
              trendText={
                <>
                  <i className="bi bi-arrow-up me-1"></i>
                  92% lấp đầy
                </>
              }
              icon="🔥"
            />
          </Col>

          <Col lg={3} md={6}>
            <AnalyticsMetricCard
              label="Tỷ lệ No-show"
              value={`${metrics.noShowRate}%`}
              valueColor="#ef4444"
              trendColor="#ef4444"
              trendText={
                <>
                  <i className="bi bi-arrow-down me-1"></i>
                  -1.5%
                </>
              }
              icon="👥"
            />
          </Col>
        </Row>

        <Row className="g-4 mb-5">
          <Col lg={12}>
            <HourlyCapacityCard
              hourlyLoading={hourlyLoading}
              hourlyError={hourlyError}
              hourlyCapacity={hourlyCapacity}
              peakWindowLabel={peakWindowLabel}
            />
          </Col>
        </Row>

        <TopSpacesTableCard
          topSpaces={topSpaces}
          getColorForUsage={getColorForUsage}
        />
      </div>
    </AdminLayout>
  );
}
