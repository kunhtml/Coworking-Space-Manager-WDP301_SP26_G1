import { useEffect, useState } from "react";
import { Card, Button } from "react-bootstrap";
import AdminLayout from "../../components/admin/AdminLayout";
import OccupancyChart from "../../components/admin/OccupancyChart";
import { getDailyTableUsageApi } from "../../services/api";

export function meta() {
  return [
    { title: "Lich Lap Day Ban | Admin" },
    {
      name: "description",
      content: "Theo doi cong suat phuc vu nha hang",
    },
  ];
}

const monthNames = [
  "Thang 01",
  "Thang 02",
  "Thang 03",
  "Thang 04",
  "Thang 05",
  "Thang 06",
  "Thang 07",
  "Thang 08",
  "Thang 09",
  "Thang 10",
  "Thang 11",
  "Thang 12",
];

const weekDays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function getColorForOccupancy(rate) {
  if (rate >= 80) {
    return { bg: "#fee2e2", text: "#dc2626", border: "#fca5a5" };
  }
  if (rate >= 40) {
    return { bg: "#fef3c7", text: "#d97706", border: "#fcd34d" };
  }
  return { bg: "#dcfce7", text: "#16a34a", border: "#86efac" };
}

function getBarWidthForOccupancy(rate) {
  return `${rate}%`;
}

export default function AdminOccupancyPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthlyData, setMonthlyData] = useState({});
  const [totalTables, setTotalTables] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMonthlyOccupancy = async () => {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      try {
        const data = await getDailyTableUsageApi({ year, month });
        setMonthlyData(data.dailyUsage || {});
        setTotalTables(data.totalTables || 0);
      } catch (err) {
        console.error("Error loading monthly occupancy:", err);
        setMonthlyData({});
        setTotalTables(0);
      } finally {
        setLoading(false);
      }
    };

    loadMonthlyOccupancy();
  }, [currentDate]);

  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };

  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i += 1) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      days.push(day);
    }
    return days;
  };

  const calendarDays = getCalendarDays();
  const today = new Date();
  const isCurrentMonth =
    currentDate.getMonth() === today.getMonth() &&
    currentDate.getFullYear() === today.getFullYear();

  return (
    <AdminLayout>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <Card
          className="border-0 mb-4"
          style={{
            backgroundColor: "white",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
            borderRadius: "12px",
          }}
        >
          <Card.Body className="p-4">
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-3">
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    backgroundColor: "#dbeafe",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <i
                    className="bi bi-calendar-week"
                    style={{ fontSize: "24px", color: "#3b82f6" }}
                  ></i>
                </div>
                <div>
                  <h1
                    className="mb-1"
                    style={{
                      fontSize: "20px",
                      fontWeight: "700",
                      color: "#1e293b",
                    }}
                  >
                    Lich Lap Day Ban
                  </h1>
                  <p
                    className="mb-0"
                    style={{ fontSize: "14px", color: "#64748b" }}
                  >
                    Theo doi cong suat phuc vu nha hang
                  </p>
                  <p
                    className="mb-0"
                    style={{
                      fontSize: "13px",
                      color: "#475569",
                      fontWeight: 600,
                    }}
                  >
                    Tong so ban tren he thong:{" "}
                    {Number(totalTables || 0).toLocaleString("vi-VN")}
                  </p>
                </div>
              </div>

              <div className="d-flex align-items-center gap-3">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={goToToday}
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    padding: "8px 16px",
                    borderRadius: "8px",
                  }}
                >
                  Hom nay
                </Button>

                <div className="d-flex align-items-center gap-2">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={goToPreviousMonth}
                    style={{ padding: "8px 12px", borderRadius: "8px" }}
                  >
                    <i className="bi bi-chevron-left"></i>
                  </Button>

                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: "600",
                      color: "#1e293b",
                      minWidth: "140px",
                      textAlign: "center",
                    }}
                  >
                    {monthNames[currentDate.getMonth()]},{" "}
                    {currentDate.getFullYear()}
                  </div>

                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={goToNextMonth}
                    style={{ padding: "8px 12px", borderRadius: "8px" }}
                  >
                    <i className="bi bi-chevron-right"></i>
                  </Button>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card
          className="border-0 mb-4"
          style={{
            backgroundColor: "white",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
            borderRadius: "12px",
          }}
        >
          <Card.Body className="p-3">
            <div className="d-flex align-items-center gap-4">
              <div className="d-flex align-items-center gap-2">
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    backgroundColor: "#16a34a",
                    borderRadius: "50%",
                  }}
                ></div>
                <span style={{ fontSize: "13px", color: "#64748b" }}>
                  Thap (&lt; 40%)
                </span>
              </div>

              <div className="d-flex align-items-center gap-2">
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    backgroundColor: "#d97706",
                    borderRadius: "50%",
                  }}
                ></div>
                <span style={{ fontSize: "13px", color: "#64748b" }}>
                  Trung binh (40% - 79%)
                </span>
              </div>

              <div className="d-flex align-items-center gap-2">
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    backgroundColor: "#dc2626",
                    borderRadius: "50%",
                  }}
                ></div>
                <span style={{ fontSize: "13px", color: "#64748b" }}>
                  {"Cao (>= 80%)"}
                </span>
              </div>
            </div>
          </Card.Body>
        </Card>

        <OccupancyChart>
          {loading ? (
            <div
              className="d-flex align-items-center justify-content-center"
              style={{ minHeight: "400px" }}
            >
              <div className="text-center">
                <div className="spinner-border text-primary mb-3" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p style={{ color: "#64748b", fontSize: "14px" }}>
                  Dang tai du lieu thang {monthNames[currentDate.getMonth()]}...
                </p>
              </div>
            </div>
          ) : (
            <div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: "12px",
                  marginBottom: "12px",
                  paddingBottom: "12px",
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                {weekDays.map((day, idx) => (
                  <div
                    key={idx}
                    style={{
                      textAlign: "center",
                      fontSize: "13px",
                      fontWeight: "700",
                      color: idx === 6 ? "#dc2626" : "#64748b",
                    }}
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: "12px",
                }}
              >
                {calendarDays.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`}></div>;
                  }

                  const dayData = monthlyData[day] || {};
                  const tablesUsed = dayData.tablesUsed || 0;
                  const occupancyRate = dayData.occupancyRate || 0;
                  const isFutureDay = dayData.isFutureDay || false;
                  const colors = getColorForOccupancy(occupancyRate);
                  const isToday = isCurrentMonth && day === today.getDate();
                  const dayOfWeek = idx % 7;
                  const isSunday = dayOfWeek === 6;

                  return (
                    <div
                      key={day}
                      style={{
                        backgroundColor: isToday
                          ? "#eff6ff"
                          : isFutureDay
                            ? "#fefce8"
                            : "#fafafa",
                        border: isToday
                          ? "2px solid #3b82f6"
                          : isFutureDay
                            ? "1px dashed #fbbf24"
                            : "1px solid #e5e7eb",
                        borderRadius: "8px",
                        padding: "12px",
                        minHeight: "100px",
                        transition: "all 0.2s",
                        cursor: "default",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: isToday ? "700" : "600",
                          color: isSunday ? "#dc2626" : "#1e293b",
                          marginBottom: "8px",
                        }}
                      >
                        {day}
                      </div>

                      {isToday && (
                        <div
                          style={{
                            position: "absolute",
                            top: "8px",
                            right: "8px",
                            backgroundColor: "#3b82f6",
                            color: "white",
                            fontSize: "10px",
                            fontWeight: "600",
                            padding: "2px 8px",
                            borderRadius: "4px",
                          }}
                        >
                          Hom nay
                        </div>
                      )}

                      {tablesUsed > 0 && (
                        <div
                          style={{
                            backgroundColor: colors.bg,
                            border: `1px solid ${colors.border}`,
                            borderRadius: "6px",
                            padding: "4px 8px",
                            marginBottom: "6px",
                            display: "inline-block",
                          }}
                        >
                          <i
                            className="bi bi-people-fill"
                            style={{
                              fontSize: "10px",
                              color: colors.text,
                              marginRight: "4px",
                            }}
                          ></i>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: "600",
                              color: colors.text,
                            }}
                          >
                            {tablesUsed} ban
                          </span>
                        </div>
                      )}

                      {tablesUsed > 0 && (
                        <div
                          style={{
                            fontSize: "11px",
                            color: isFutureDay ? "#d97706" : "#64748b",
                            marginBottom: "6px",
                            fontStyle: isFutureDay ? "italic" : "normal",
                          }}
                        >
                          {isFutureDay ? "Dat truoc" : "Lap day"}
                        </div>
                      )}

                      {tablesUsed > 0 && (
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#94a3b8",
                            marginBottom: "4px",
                          }}
                        >
                          {occupancyRate}%
                        </div>
                      )}

                      {tablesUsed > 0 && (
                        <div
                          style={{
                            width: "100%",
                            height: "4px",
                            backgroundColor: "#e5e7eb",
                            borderRadius: "2px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: getBarWidthForOccupancy(occupancyRate),
                              height: "100%",
                              backgroundColor: colors.text,
                              borderRadius: "2px",
                              transition: "width 0.3s ease",
                            }}
                          ></div>
                        </div>
                      )}

                      {tablesUsed === 0 && (
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#cbd5e1",
                            fontStyle: "italic",
                          }}
                        >
                          Chua co du lieu
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </OccupancyChart>
      </div>
    </AdminLayout>
  );
}
