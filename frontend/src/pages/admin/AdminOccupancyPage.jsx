import { useState, useEffect } from "react";
import { Card, Button, Modal, Badge } from "react-bootstrap";
import AdminLayout from "../../components/admin/AdminLayout";
import { getDailyTableUsageApi } from "../../services/api";
import { getAllBookingsApi } from "../../services/bookingService";

export function meta() {
  return [
    { title: "Lịch Lấp Đầy Bàn | Admin" },
    {
      name: "description",
      content: "Theo dõi công suất phục vụ nhà hàng",
    },
  ];
}

export default function AdminOccupancyPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthlyData, setMonthlyData] = useState({});
  const [totalTables, setTotalTables] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayDetailsLoading, setDayDetailsLoading] = useState(false);
  const [dayTableDetails, setDayTableDetails] = useState([]);
  const [dayDetailsError, setDayDetailsError] = useState("");
  const [expandedTableId, setExpandedTableId] = useState(null);

  useEffect(() => {
    loadMonthlyOccupancy();
  }, [currentDate]);

  const loadMonthlyOccupancy = async () => {
    setLoading(true);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; // API expects 1-12
    
    try {
      const data = await getDailyTableUsageApi({ year, month });
      setMonthlyData(data.dailyUsage || {});
      setTotalTables(data.totalTables || 0);
    } catch (err) {
      console.error("Error loading monthly occupancy:", err);
      setMonthlyData({});
      setTotalTables(0);
    }
    
    setLoading(false);
  };

  const toDateParam = (year, monthIndex, day) => {
    const y = String(year);
    const m = String(monthIndex + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const loadDayTableDetails = async (day) => {
    setDayDetailsLoading(true);
    setDayDetailsError("");
    try {
      const date = toDateParam(currentDate.getFullYear(), currentDate.getMonth(), day);
      const rows = await getAllBookingsApi({ date });
      const grouped = new Map();

      rows.forEach((row) => {
        const tableName = row.spaceName || "Không xác định";
        if (!grouped.has(tableName)) {
          grouped.set(tableName, {
            _id: tableName,
            name: tableName,
            capacity: null,
            location: "",
            bookings: [],
          });
        }
        grouped.get(tableName).bookings.push({
          _id: row.id || row.bookingCode,
          startTime: row.startTime,
          endTime: row.endTime,
          status: row.status,
          totalPrice: row.depositAmount || 0,
          user: {
            name: row.customerName,
            phone: row.customerPhone,
          },
        });
      });

      setDayTableDetails(Array.from(grouped.values()));
    } catch (err) {
      setDayDetailsError(err.message || "Không tải được chi tiết bàn theo ngày");
      setDayTableDetails([]);
    } finally {
      setDayDetailsLoading(false);
    }
  };

  const openDayModal = (day) => {
    setSelectedDay(day);
    setShowDayModal(true);
    setExpandedTableId(null);
    loadDayTableDetails(day);
  };

  const closeDayModal = () => {
    setShowDayModal(false);
    setSelectedDay(null);
    setDayTableDetails([]);
    setDayDetailsError("");
    setExpandedTableId(null);
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
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
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday
    
    const days = [];
    
    // Add empty cells for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getColorForOccupancy = (rate) => {
    if (rate >= 80) return { bg: "#fee2e2", text: "#dc2626", border: "#fca5a5" }; // Red - Cao
    if (rate >= 40) return { bg: "#fef3c7", text: "#d97706", border: "#fcd34d" }; // Yellow - Trung bình
    return { bg: "#dcfce7", text: "#16a34a", border: "#86efac" }; // Green - Thấp
  };

  const getOccupancyLabel = (rate) => {
    if (rate >= 80) return "Cao";
    if (rate >= 40) return "Trung bình";
    return "Thấp";
  };

  const getBarWidthForOccupancy = (rate) => {
    return `${rate}%`;
  };

  const getStatusInfo = (status) => {
    const map = {
      Confirmed: { label: "Đã xác nhận", bg: "success" },
      Pending: { label: "Chờ xác nhận", bg: "warning" },
      Completed: { label: "Đã sử dụng", bg: "info" },
      Cancelled: { label: "Đã hủy", bg: "secondary" },
      Canceled: { label: "Đã hủy", bg: "secondary" },
      In_Use: { label: "Đang sử dụng", bg: "secondary" },
      CheckedIn: { label: "Đã check-in", bg: "primary" },
      Awaiting_Payment: { label: "Chờ thanh toán", bg: "warning" },
    };
    return map[status] || { label: status || "Không xác định", bg: "secondary" };
  };

  const monthNames = [
    "Tháng 01", "Tháng 02", "Tháng 03", "Tháng 04",
    "Tháng 05", "Tháng 06", "Tháng 07", "Tháng 08",
    "Tháng 09", "Tháng 10", "Tháng 11", "Tháng 12"
  ];

  const weekDays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  const calendarDays = getCalendarDays();
  const today = new Date();
  const isCurrentMonth = currentDate.getMonth() === today.getMonth() && 
                         currentDate.getFullYear() === today.getFullYear();

  return (
    <AdminLayout>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header Card */}
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
                    Lịch Lấp Đầy Bàn
                  </h1>
                  <p
                    className="mb-0"
                    style={{ fontSize: "14px", color: "#64748b" }}
                  >
                    Theo dõi công suất phục vụ nhà hàng
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
                  Hôm nay
                </Button>
                
                <div className="d-flex align-items-center gap-2">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={goToPreviousMonth}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                    }}
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
                    {monthNames[currentDate.getMonth()]}, {currentDate.getFullYear()}
                  </div>
                  
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={goToNextMonth}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                    }}
                  >
                    <i className="bi bi-chevron-right"></i>
                  </Button>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Legend */}
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
                  Thấp (&lt; 40%)
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
                  Trung bình (40% - 79%)
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
                  Cao (≥ 80%)
                </span>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Calendar Grid */}
        <Card
          className="border-0"
          style={{
            backgroundColor: "white",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
            borderRadius: "12px",
          }}
        >
          <Card.Body className="p-4">
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
                    Đang tải dữ liệu tháng {monthNames[currentDate.getMonth()]}...
                  </p>
                </div>
              </div>
            ) : (
              <div>
                {/* Week day headers */}
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

                {/* Calendar days */}
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
                        onClick={() => openDayModal(day)}
                        style={{
                          backgroundColor: isToday ? "#eff6ff" : isFutureDay ? "#fefce8" : "#fafafa",
                          border: isToday ? "2px solid #3b82f6" : isFutureDay ? "1px dashed #fbbf24" : "1px solid #e5e7eb",
                          borderRadius: "8px",
                          padding: "12px",
                          minHeight: "100px",
                          transition: "all 0.2s",
                          cursor: "pointer",
                          position: "relative",
                        }}
                        onMouseEnter={(e) => {
                          if (!isToday) {
                            e.currentTarget.style.backgroundColor = isFutureDay ? "#fef9c3" : "#f9fafb";
                            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isToday) {
                            e.currentTarget.style.backgroundColor = isFutureDay ? "#fefce8" : "#fafafa";
                            e.currentTarget.style.boxShadow = "none";
                          }
                        }}
                      >
                        {/* Day number */}
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

                        {/* Today badge */}
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
                            Hôm nay
                          </div>
                        )}

                        {/* Table count badge */}
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
                              {tablesUsed} bàn
                            </span>
                          </div>
                        )}

                        {/* Occupancy label */}
                        {tablesUsed > 0 && (
                          <div
                            style={{
                              fontSize: "11px",
                              color: isFutureDay ? "#d97706" : "#64748b",
                              marginBottom: "6px",
                              fontStyle: isFutureDay ? "italic" : "normal",
                            }}
                          >
                            {isFutureDay ? "Đặt trước" : "Lấp đầy"}
                          </div>
                        )}

                        {/* Progress bar with percentage */}
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
                            Chưa có dữ liệu
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Day Detail Modal */}
        <Modal show={showDayModal} onHide={closeDayModal} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>
              <i className="bi bi-calendar-event me-2 text-primary"></i>
              Chi tiết ngày {selectedDay}/{currentDate.getMonth() + 1}/{currentDate.getFullYear()}
              {selectedDay && monthlyData[selectedDay]?.isFutureDay && (
                <Badge bg="warning" className="ms-2" style={{ fontSize: "12px" }}>
                  Ngày tương lai
                </Badge>
              )}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedDay && monthlyData[selectedDay] ? (
              <div>
                {/* Future day notice */}
                {monthlyData[selectedDay].isFutureDay && (
                  <div
                    className="mb-3 p-3"
                    style={{
                      backgroundColor: "#fef3c7",
                      borderRadius: "8px",
                      border: "1px solid #fbbf24",
                    }}
                  >
                    <i className="bi bi-info-circle me-2 text-warning"></i>
                    <span style={{ color: "#92400e" }}>
                      Đây là ngày trong tương lai. Dữ liệu hiển thị là các <strong>đặt chỗ trước</strong>, chưa phải thực tế sử dụng.
                    </span>
                  </div>
                )}

                {/* Summary */}
                <div className="d-flex gap-3 mb-4">
                  <div
                    style={{
                      flex: 1,
                      backgroundColor: "#f0f9ff",
                      borderRadius: "8px",
                      padding: "16px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "24px", fontWeight: "700", color: "#0369a1" }}>
                      {monthlyData[selectedDay].tablesUsed}
                    </div>
                    <div style={{ fontSize: "13px", color: "#64748b" }}>
                      {monthlyData[selectedDay].isFutureDay ? "Bàn đặt trước" : "Bàn được sử dụng"}
                    </div>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      backgroundColor: "#f0fdf4",
                      borderRadius: "8px",
                      padding: "16px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "24px", fontWeight: "700", color: "#16a34a" }}>
                      {monthlyData[selectedDay].totalTables}
                    </div>
                    <div style={{ fontSize: "13px", color: "#64748b" }}>Tổng số bàn</div>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      backgroundColor: "#fefce8",
                      borderRadius: "8px",
                      padding: "16px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "24px", fontWeight: "700", color: "#ca8a04" }}>
                      {monthlyData[selectedDay].occupancyRate}%
                    </div>
                    <div style={{ fontSize: "13px", color: "#64748b" }}>
                      {monthlyData[selectedDay].isFutureDay ? "Tỉ lệ đặt trước" : "Tỉ lệ lấp đầy"}
                    </div>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      backgroundColor: "#fdf4ff",
                      borderRadius: "8px",
                      padding: "16px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "24px", fontWeight: "700", color: "#a855f7" }}>
                      {monthlyData[selectedDay].bookingCount}
                    </div>
                    <div style={{ fontSize: "13px", color: "#64748b" }}>Lượt đặt bàn</div>
                  </div>
                </div>

                {/* Tables List */}
                {dayDetailsLoading ? (
                  <div className="text-center py-4" style={{ color: "#64748b" }}>
                    Đang tải chi tiết bàn...
                  </div>
                ) : dayDetailsError ? (
                  <div className="text-center py-4" style={{ color: "#dc2626" }}>
                    {dayDetailsError}
                  </div>
                ) : dayTableDetails.length > 0 ? (
                  <div>
                    <h6 className="mb-3" style={{ fontWeight: "600", color: "#1e293b" }}>
                      <i className="bi bi-list-ul me-2"></i>
                      {monthlyData[selectedDay].isFutureDay ? "Danh sách bàn đặt trước" : "Danh sách bàn được sử dụng"}
                    </h6>
                    <div>
                      {dayTableDetails.map((table) => {
                        const isExpanded = expandedTableId === table._id;
                        return (
                          <div
                            key={table._id}
                            className="mb-2"
                            style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}
                          >
                            <button
                              type="button"
                              onClick={() => setExpandedTableId(isExpanded ? null : table._id)}
                              style={{
                                width: "100%",
                                border: "none",
                                background: "#f8fafc",
                                padding: "10px 12px",
                                textAlign: "left",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                              }}
                            >
                              <div className="d-flex align-items-center gap-2" style={{ minWidth: 0 }}>
                                <i className={`bi ${isExpanded ? "bi-chevron-down" : "bi-chevron-right"}`}></i>
                                <span style={{ fontWeight: "600", color: "#1e293b" }}>{table.name}</span>
                                <Badge bg="primary">{table.bookings?.length || 0} lượt đặt</Badge>
                              </div>
                              <div style={{ fontSize: "12px", color: "#64748b" }}>
                                {table.capacity ? `${table.capacity} người` : "-"} • {table.location || "-"}
                              </div>
                            </button>

                            {isExpanded && (
                              <div style={{ padding: "10px", backgroundColor: "white", fontSize: "12px" }}>
                                {table.bookings && table.bookings.length > 0 ? (
                                  table.bookings.map((booking, idx) => (
                                    <div
                                      key={booking._id}
                                      style={{
                                        padding: "6px 8px",
                                        backgroundColor: idx % 2 === 0 ? "#f8fafc" : "white",
                                        borderRadius: "4px",
                                        marginBottom: "6px",
                                        border: "1px solid #e2e8f0",
                                      }}
                                    >
                                      <div className="d-flex justify-content-between align-items-center">
                                        <span>
                                          <i className="bi bi-clock me-1"></i>
                                          {new Date(booking.startTime).toLocaleTimeString("vi-VN", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}{" "}
                                          -{" "}
                                          {new Date(booking.endTime).toLocaleTimeString("vi-VN", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </span>
                                        <Badge
                                          bg={getStatusInfo(booking.status).bg}
                                          style={{ fontSize: "10px" }}
                                        >
                                          {getStatusInfo(booking.status).label}
                                        </Badge>
                                      </div>
                                      {booking.user && (
                                        <div style={{ color: "#64748b", marginTop: "2px" }}>
                                          <i className="bi bi-person me-1"></i>
                                          {booking.user.name || booking.user.email}
                                          {booking.user.phone && ` - ${booking.user.phone}`}
                                        </div>
                                      )}
                                      {booking.totalPrice > 0 && (
                                        <div style={{ color: "#16a34a", fontWeight: "500" }}>
                                          <i className="bi bi-cash me-1"></i>
                                          {booking.totalPrice.toLocaleString("vi-VN")}đ
                                        </div>
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  <span style={{ color: "#94a3b8" }}>Không có lượt đặt</span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div
                    className="text-center py-4"
                    style={{ color: "#94a3b8", fontStyle: "italic" }}
                  >
                    <i className="bi bi-inbox" style={{ fontSize: "32px" }}></i>
                    <p className="mb-0 mt-2">
                      {monthlyData[selectedDay]?.bookingCount > 0
                        ? `Có ${monthlyData[selectedDay].bookingCount} lượt đặt nhưng chưa có dữ liệu chi tiết bàn.`
                        : monthlyData[selectedDay]?.isFutureDay
                          ? "Chưa có bàn nào được đặt trước cho ngày này"
                          : "Không có bàn nào được sử dụng trong ngày này"}
                    </p>
                  </div>
                )}

                {/* Bookings without table (table might be deleted) */}
                {monthlyData[selectedDay].bookingsWithoutTable && monthlyData[selectedDay].bookingsWithoutTable.length > 0 && (
                  <div className="mt-4">
                    <h6 className="mb-3" style={{ fontWeight: "600", color: "#dc2626" }}>
                      <i className="bi bi-exclamation-triangle me-2"></i>
                       Lượt đặt không có thông tin bàn ({monthlyData[selectedDay].bookingsWithoutTable.length})
                    </h6>
                    <div
                      className="p-3"
                      style={{
                        backgroundColor: "#fef2f2",
                        borderRadius: "8px",
                        border: "1px solid #fecaca",
                      }}
                    >
                      <p style={{ fontSize: "12px", color: "#991b1b", marginBottom: "12px" }}>
                        Các lượt đặt này có thể do bàn đã bị xóa hoặc dữ liệu không đồng bộ.
                      </p>
                      {monthlyData[selectedDay].bookingsWithoutTable.map((booking) => (
                        <div
                          key={booking._id}
                          style={{
                            padding: "8px 12px",
                            backgroundColor: "white",
                            borderRadius: "6px",
                            marginBottom: "8px",
                            fontSize: "12px",
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            <span>
                              <i className="bi bi-clock me-1"></i>
                              {new Date(booking.startTime).toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              -{" "}
                              {new Date(booking.endTime).toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <Badge bg={getStatusInfo(booking.status).bg} style={{ fontSize: "10px" }}>
                              {getStatusInfo(booking.status).label}
                            </Badge>
                          </div>
                          {booking.user && (
                            <div style={{ color: "#64748b", marginTop: "4px" }}>
                              <i className="bi bi-person me-1"></i>
                              {booking.user.name || booking.user.email}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4" style={{ color: "#94a3b8" }}>
                <i className="bi bi-calendar-x" style={{ fontSize: "32px" }}></i>
                <p className="mb-0 mt-2">Không có dữ liệu cho ngày này</p>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeDayModal}>
              Đóng
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </AdminLayout>
  );
}
