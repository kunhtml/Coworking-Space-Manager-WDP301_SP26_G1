import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Badge,
  Card,
  Col,
  Form,
  Row,
  Modal,
  Button,
  Spinner,
  Alert,
} from "react-bootstrap";
import AdminLayout from "../../components/admin/AdminLayout";
import {
  getStaffTables,
  updateStaffTableStatus,
} from "../../services/staffDashboardService";

// ── Config trạng thái (khớp với backend TitleCase) ──────────────────────────
const STATUS_CONFIG = {
  Available: {
    label: "Trống",
    cardClass: "staff-seat-green",
    dotClass: "staff-dot-green",
    badgeBg: "#dcfce7",
    badgeColor: "#16a34a",
    iconBg: "#f0fdf4",
    borderColor: "#10b981",
    glowColor: "rgba(16,185,129,0.15)",
    emoji: "✅",
  },
  Occupied: {
    label: "Đang sử dụng",
    cardClass: "staff-seat-red",
    dotClass: "staff-dot-red",
    badgeBg: "#fee2e2",
    badgeColor: "#dc2626",
    iconBg: "#fff1f2",
    borderColor: "#ef4444",
    glowColor: "rgba(239,68,68,0.15)",
    emoji: "🔴",
  },
  Reserved: {
    label: "Đã đặt trước",
    cardClass: "staff-seat-yellow",
    dotClass: "staff-dot-yellow",
    badgeBg: "#fef9c3",
    badgeColor: "#ca8a04",
    iconBg: "#fefce8",
    borderColor: "#f59e0b",
    glowColor: "rgba(245,158,11,0.15)",
    emoji: "📌",
  },
  Cleaning: {
    label: "Đang dọn",
    cardClass: "staff-seat-blue",
    dotClass: "staff-dot-blue",
    badgeBg: "#dbeafe",
    badgeColor: "#1d4ed8",
    iconBg: "#eff6ff",
    borderColor: "#3b82f6",
    glowColor: "rgba(59,130,246,0.15)",
    emoji: "🧹",
  },
  Maintenance: {
    label: "Bảo trì",
    cardClass: "staff-seat-gray",
    dotClass: "staff-dot-gray",
    badgeBg: "#f1f5f9",
    badgeColor: "#64748b",
    iconBg: "#f8fafc",
    borderColor: "#94a3b8",
    glowColor: "rgba(100,116,139,0.12)",
    emoji: "🔧",
  },
};

const STATUS_LEGEND = [
  { status: "Available",   label: "Trống",         dotClass: "staff-dot-green"  },
  { status: "Occupied",    label: "Đang sử dụng",  dotClass: "staff-dot-red"    },
  { status: "Reserved",    label: "Đã đặt trước",  dotClass: "staff-dot-yellow" },
  { status: "Cleaning",    label: "Đang dọn",      dotClass: "staff-dot-blue"   },
  { status: "Maintenance", label: "Bảo trì",       dotClass: "staff-dot-gray"   },
];

const ALL_STATUSES = Object.keys(STATUS_CONFIG);

// Booking status badge
const BOOKING_STATUS_LABEL = {
  Pending: "Chờ thanh toán",
  Awaiting_Payment: "Chờ thanh toán",
  Confirmed: "Đã xác nhận",
  CheckedIn: "Đã check-in",
  Completed: "Hoàn thành",
  Cancelled: "Đã hủy",
};

function formatTime(date) {
  if (!date) return "--";
  return new Date(date).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function getSeatIcon(type) {
  if (!type) return "bi-shop";
  const t = type.toLowerCase();
  if (t.includes("vip") || t.includes("phòng") || t.includes("private")) return "bi-door-closed";
  if (t.includes("nhóm") || t.includes("group")) return "bi-people";
  if (t.includes("họp") || t.includes("meeting")) return "bi-camera-video";
  return "bi-person-workspace";
}

function groupByType(tables) {
  const map = {};
  tables.forEach((t) => {
    // group by tableType
    const zone = t.tableType || "Khác";
    if (!map[zone]) map[zone] = [];
    map[zone].push(t);
  });
  return map;
}

function getCfg(status) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.Available;
}

export default function StaffSeatMapPage() {
  const [tables, setTables]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // filters
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch]             = useState("");

  // hover animation
  const [hoveredId, setHoveredId] = useState(null);

  // Modal cập nhật trạng thái
  const [showModal, setShowModal]   = useState(false);
  const [selected, setSelected]     = useState(null);
  const [newStatus, setNewStatus]   = useState("");
  const [updating, setUpdating]     = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getStaffTables();
      setTables(Array.isArray(data) ? data : data.tables || []);
    } catch (err) {
      setError(err.message || "Không thể tải danh sách bàn");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTables(); }, [fetchTables]);

  // ── Filter & Search (client-side) ─────────────────────────────────────────
  const displayed = useMemo(() => {
    let rows = tables;
    if (filterStatus !== "all") {
      rows = rows.filter((t) => t.status === filterStatus);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (t) =>
          (t.name || "").toLowerCase().includes(q) ||
          (t.tableType || "").toLowerCase().includes(q),
      );
    }
    return rows;
  }, [tables, filterStatus, search]);

  // Stats
  const stats = useMemo(
    () =>
      ALL_STATUSES.map((s) => ({
        status: s,
        count: tables.filter((t) => t.status === s).length,
        ...getCfg(s),
      })),
    [tables],
  );

  // ── Grouped by tableType ───────────────────────────────────────────────────
  const groupedMap   = useMemo(() => groupByType(displayed), [displayed]);
  const zoneNames    = Object.keys(groupedMap);

  // ── Update status ─────────────────────────────────────────────────────────
  const handleOpenModal = (table) => {
    setSelected(table);
    setNewStatus(table.status);
    setShowModal(true);
    setError("");
  };

  const handleUpdateStatus = async () => {
    if (!selected || !newStatus) return;
    try {
      setUpdating(true);
      await updateTableStatusApi(selected.id || selected._id, newStatus);
      setSuccessMsg(`✅ Đã cập nhật trạng thái "${selected.name}" thành công!`);
      setShowModal(false);
      setSelected(null);
      fetchTables();
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err) {
      setError(err.message || "Cập nhật thất bại");
    } finally {
      setUpdating(false);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const zoneMap   = groupByZone(tables);
  const zoneNames = Object.keys(zoneMap);
  const displayed = filterZone === "Tất cả"
    ? zoneMap
    : { [filterZone]: zoneMap[filterZone] || [] };

  const getCfg = (status) => STATUS_CONFIG[status] || STATUS_CONFIG.Available;

  // Thống kê
  const stats = ALL_STATUSES.map((s) => ({
    status: s,
    count: tables.filter((t) => t.status === s).length,
    ...getCfg(s),
  }));

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AdminLayout>
      {/* ── Header ── */}
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold mb-1" style={{ letterSpacing: "-0.5px" }}>
            Sơ đồ chỗ ngồi
          </h2>
          <p className="text-secondary fw-semibold small mb-0">
            Trạng thái không gian làm việc theo thời gian thực
          </p>
        </div>
        <Button
          variant="outline-secondary"
          className="fw-semibold rounded-3 d-flex align-items-center gap-2"
          style={{ border: "1.5px solid #cbd5e1", padding: "8px 18px" }}
          onClick={fetchTables}
          disabled={loading}
        >
          <i className="bi bi-arrow-clockwise" />
          {loading ? "Đang tải..." : "Làm mới"}
        </Button>
      </div>

      {/* ── Alerts ── */}
      {successMsg && (
        <Alert
          variant="success"
          className="py-2 rounded-3 border-0 mb-3"
          style={{ background: "#dcfce7", color: "#15803d" }}
        >
          {successMsg}
        </Alert>
      )}
      {error && (
        <Alert
          variant="danger"
          className="py-2 rounded-3 border-0 mb-3"
          dismissible
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}

      {/* ── Stat cards ── */}
      <Row className="g-3 mb-4">
        {stats.map((s) => (
          <Col xs={6} sm={4} md={2} key={s.status}>
            <div
              className="rounded-4 p-3 d-flex align-items-center gap-2"
              style={{
                background: s.iconBg,
                border: `1.5px solid ${s.borderColor}33`,
                boxShadow: `0 2px 12px ${s.glowColor}`,
                cursor: "pointer",
                transition: "transform 0.18s",
              }}
              onClick={() =>
                setFilterStatus(filterStatus === s.status ? "all" : s.status)
              }
            >
              <div
                className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: 40, height: 40, background: s.badgeBg, fontSize: 18 }}
              >
                {s.emoji}
              </div>
              <div>
                <div
                  className="fw-bold lh-1"
                  style={{ color: s.badgeColor, fontSize: "1.35rem" }}
                >
                  {s.count}
                </div>
                <div className="small fw-semibold" style={{ color: "#64748b", fontSize: "0.72rem" }}>
                  {s.label}
                </div>
              </div>
              {filterStatus === s.status && (
                <i
                  className="bi bi-funnel-fill ms-auto"
                  style={{ color: s.badgeColor, fontSize: "0.75rem" }}
                />
              )}
            </div>
          </Col>
        ))}
        {/* Total */}
        <Col xs={6} sm={4} md={2}>
          <div
            className="rounded-4 p-3 d-flex align-items-center gap-2"
            style={{
              background: "#f8fafc",
              border: "1.5px solid #e2e8f033",
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
              cursor: "pointer",
            }}
            onClick={() => setFilterStatus("all")}
          >
            <div
              className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: 40, height: 40, background: "#f1f5f9", fontSize: 18 }}
            >
              🪑
            </div>
            <div>
              <div className="fw-bold lh-1" style={{ color: "#1e293b", fontSize: "1.35rem" }}>
                {tables.length}
              </div>
              <div className="small fw-semibold" style={{ color: "#64748b", fontSize: "0.72rem" }}>
                Tổng số bàn
              </div>
            </div>
            {filterStatus === "all" && (
              <i
                className="bi bi-funnel-fill ms-auto"
                style={{ color: "#6366f1", fontSize: "0.75rem" }}
              />
            )}
          </div>
        </Col>
      </Row>

      {/* ── Filters ── */}
      <Row className="g-3 mb-4 align-items-center">
        <Col md={4}>
          <div className="staff-search-wrap">
            <i className="bi bi-search" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm tên bàn, loại bàn..."
            />
          </div>
        </Col>
        <Col md={3}>
          <Form.Select
            className="staff-filter-control"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {getCfg(s).label}
              </option>
            ))}
          </Form.Select>
        </Col>
        {/* Legend */}
        <Col className="d-none d-md-flex flex-wrap gap-3 align-items-center justify-content-end">
          {STATUS_LEGEND.map((item) => (
            <div
              key={item.status}
              className="d-flex align-items-center gap-1 fw-semibold text-secondary"
              style={{ fontSize: "0.78rem", cursor: "pointer" }}
              onClick={() =>
                setFilterStatus(filterStatus === item.status ? "all" : item.status)
              }
            >
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  display: "inline-block",
                  background: getCfg(item.status).badgeColor,
                }}
              />
              {item.label}
            </div>
          ))}
        </Col>
      </Row>

      {/* ── Loading / Empty ── */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" style={{ color: "#6366f1" }} />
          <p className="mt-2 text-muted small fw-semibold">Đang tải dữ liệu...</p>
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <div style={{ fontSize: 52 }}>🪑</div>
          <p className="fw-semibold mt-2">
            {tables.length === 0 ? "Chưa có dữ liệu bàn" : "Không tìm thấy bàn phù hợp"}
          </p>
          {tables.length > 0 && (
            <Button
              variant="outline-secondary"
              size="sm"
              className="rounded-3 fw-semibold"
              onClick={() => { setFilterStatus("all"); setSearch(""); }}
            >
              Xóa bộ lọc
            </Button>
          )}
        </div>
      ) : (
        // ── Grouped by tableType ──
        zoneNames.map((zone) => (
          <div key={zone} className="mb-5">
            {/* Zone header */}
            <div className="d-flex align-items-center gap-3 mb-3">
              <h5 className="fw-bold text-secondary mb-0">{zone}</h5>
              <span
                className="rounded-pill px-3 py-1 small fw-bold"
                style={{ background: "#f1f5f9", color: "#475569" }}
              >
                {groupedMap[zone].length} bàn
              </span>
              <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
            </div>

            <Row className="g-3">
              {groupedMap[zone].map((table) => {
                const cfg     = getCfg(table.status);
                const isHover = hoveredId === (table.id || table._id);
                const iconName = getSeatIcon(table.tableType);

                return (
                  <Col xl={2} lg={3} md={4} sm={6} key={String(table.id || table._id)}>
                    <Card
                      className="border-2 staff-seat-card"
                      style={{
                        cursor: "pointer",
                        transform: isHover ? "translateY(-6px)" : "translateY(0)",
                        boxShadow: isHover
                          ? `0 12px 28px ${cfg.glowColor}, 0 2px 8px rgba(0,0,0,0.06)`
                          : "0 2px 8px rgba(0,0,0,0.04)",
                        transition: "all 0.22s cubic-bezier(.4,0,.2,1)",
                        borderColor: cfg.borderColor,
                        background: isHover ? cfg.iconBg : "#fff",
                        borderWidth: "2px",
                        borderStyle: "solid",
                      }}
                      onClick={() => handleOpenModal(table)}
                      onMouseEnter={() => setHoveredId(table.id || table._id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      <Card.Body className="text-center px-2 py-3">
                        {/* Icon vòng tròn */}
                        <div
                          className="staff-seat-icon mx-auto mb-3"
                          style={{
                            background: isHover ? cfg.badgeBg : "#f1f5f9",
                            color: isHover ? cfg.badgeColor : "#64748b",
                            transition: "all 0.22s",
                          }}
                        >
                          <i className={`bi ${iconName}`} />
                        </div>

                        {/* Tên bàn */}
                        <h5
                          className="fw-bold mb-1 text-truncate"
                          style={{ fontSize: "0.95rem", lineHeight: 1.3 }}
                          title={table.name}
                        >
                          {table.name}
                        </h5>

                        {/* Loại */}
                        <div
                          className="text-secondary fw-semibold mb-1"
                          style={{ fontSize: "0.76rem" }}
                        >
                          {table.tableType || "Chỗ ngồi"}
                        </div>

                        {/* Capacity + Price */}
                        <div className="fw-semibold mb-2" style={{ fontSize: "0.76rem", color: "#64748b" }}>
                          {table.capacity ? `${table.capacity} chỗ` : ""}
                          {table.capacity && table.pricePerHour ? " · " : ""}
                          {table.pricePerHour
                            ? `${Number(table.pricePerHour).toLocaleString("vi-VN")}đ/h`
                            : ""}
                        </div>

                        {/* Badge trạng thái */}
                        <span
                          className="rounded-pill px-3 py-1 fw-bold d-inline-block mb-2"
                          style={{
                            background: cfg.badgeBg,
                            color: cfg.badgeColor,
                            fontSize: "0.73rem",
                            letterSpacing: "0.02em",
                          }}
                        >
                          {cfg.emoji} {cfg.label}
                        </span>

                        {/* Booking đang hoạt động nếu có */}
                        {table.activeBooking && (
                          <div
                            className="mt-1 rounded-3 px-2 py-1"
                            style={{ background: "#fef9c3", fontSize: "0.7rem" }}
                          >
                            <span className="fw-bold" style={{ color: "#92400e" }}>
                              📋 {table.activeBooking.bookingCode}
                            </span>
                            <div style={{ color: "#78350f" }}>
                              {formatTime(table.activeBooking.startTime)} –{" "}
                              {formatTime(table.activeBooking.endTime)}
                            </div>
                            {table.activeBooking.status && (
                              <Badge
                                bg=""
                                className="rounded-pill mt-1"
                                style={{
                                  background: "#fde68a",
                                  color: "#92400e",
                                  fontSize: "0.63rem",
                                }}
                              >
                                {BOOKING_STATUS_LABEL[table.activeBooking.status] ||
                                  table.activeBooking.status}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Hint */}
                        <div
                          className="mt-2 small fw-semibold"
                          style={{
                            color: isHover ? cfg.badgeColor : "#94a3b8",
                            transition: "color 0.2s",
                            fontSize: "0.7rem",
                          }}
                        >
                          <i className="bi bi-pencil me-1" />
                          {isHover ? "Cập nhật ngay" : "Click để cập nhật"}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </div>
        ))
      )}

      {/* ── Modal cập nhật trạng thái ── */}
      <Modal show={showModal} onHide={() => { setShowModal(false); setError(""); }} centered size="sm">
        <Modal.Header closeButton className="border-0 pb-1">
          <Modal.Title className="fw-bold fs-6">
            ✏️ Cập nhật —{" "}
            <span style={{ color: "#6366f1" }}>{selected?.name}</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-1 pb-3 px-3">
          {/* Thông tin booking đang hoạt động */}
          {selected?.activeBooking && (
            <div
              className="rounded-3 p-2 mb-3 small"
              style={{ background: "#fefce8", border: "1px solid #fde68a" }}
            >
              <div className="fw-bold mb-1" style={{ color: "#92400e" }}>
                📋 Booking đang hoạt động
              </div>
              <div style={{ color: "#78350f" }}>
                <strong>{selected.activeBooking.bookingCode}</strong> ·{" "}
                {formatTime(selected.activeBooking.startTime)} –{" "}
                {formatTime(selected.activeBooking.endTime)}
              </div>
              <div style={{ color: "#78350f" }}>
                Trạng thái:{" "}
                {BOOKING_STATUS_LABEL[selected.activeBooking.status] ||
                  selected.activeBooking.status}
              </div>
            </div>
          )}

          <p className="text-muted small mb-3">Chọn trạng thái mới:</p>
          {error && (
            <Alert variant="danger" className="py-1 px-2 small mb-2">
              {error}
            </Alert>
          )}
          <div className="d-flex flex-column gap-2">
            {ALL_STATUSES.map((s) => {
              const cfg      = getCfg(s);
              const isActive = newStatus === s;
              return (
                <div
                  key={s}
                  onClick={() => setNewStatus(s)}
                  className="rounded-3 px-3 py-2 d-flex align-items-center gap-3"
                  style={{
                    background: isActive ? cfg.badgeBg : "#f8fafc",
                    border: `2px solid ${isActive ? cfg.borderColor : "#e2e8f0"}`,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    transform: isActive ? "scale(1.01)" : "scale(1)",
                  }}
                >
                  <span style={{ fontSize: 18 }}>{cfg.emoji}</span>
                  <span
                    className="fw-semibold"
                    style={{ color: isActive ? cfg.badgeColor : "#475569", fontSize: "0.9rem" }}
                  >
                    {cfg.label}
                  </span>
                  {isActive && (
                    <i
                      className="bi bi-check-circle-fill ms-auto"
                      style={{ color: cfg.badgeColor }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0 px-3 pb-3">
          <Button
            variant="outline-secondary"
            className="fw-semibold rounded-3 flex-grow-1"
            onClick={() => { setShowModal(false); setError(""); }}
            disabled={updating}
          >
            Hủy
          </Button>
          <Button
            className="fw-bold rounded-3 flex-grow-1"
            style={{
              background:
                newStatus && newStatus !== selected?.status ? "#6366f1" : "#94a3b8",
              border: "none",
              color: "#fff",
            }}
            onClick={handleUpdateStatus}
            disabled={updating || newStatus === selected?.status}
          >
            {updating ? (
              <><Spinner size="sm" className="me-1" /> Đang lưu...</>
            ) : (
              "💾 Lưu thay đổi"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </AdminLayout>
  );
}
