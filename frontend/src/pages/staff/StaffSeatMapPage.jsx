import { useEffect, useState, useCallback } from "react";
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
import { getTablesApi, updateTableStatusApi } from "../../services/api";

// ── Config trạng thái ──────────────────────────────────────────────────────
const STATUS_CONFIG = {
  available: {
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
  occupied: {
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
  reserved: {
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
  cleaning: {
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
};

const STATUS_LEGEND = [
  { status: "available", label: "Trống",        dotClass: "staff-dot-green"  },
  { status: "occupied",  label: "Đang sử dụng", dotClass: "staff-dot-red"    },
  { status: "reserved",  label: "Đã đặt trước", dotClass: "staff-dot-yellow" },
  { status: "cleaning",  label: "Đang dọn",     dotClass: "staff-dot-blue"   },
];

const ALL_STATUSES = Object.keys(STATUS_CONFIG);

function groupByZone(tables) {
  const map = {};
  tables.forEach((t) => {
    const zone = t.location || "Khu chính";
    if (!map[zone]) map[zone] = [];
    map[zone].push(t);
  });
  return map;
}

// Icon theo loại bàn
function getSeatIcon(type) {
  if (!type) return "bi-shop";
  const t = type.toLowerCase();
  if (t.includes("vip") || t.includes("phòng")) return "bi-door-closed";
  if (t.includes("nhóm") || t.includes("group")) return "bi-people";
  if (t.includes("họp") || t.includes("meeting")) return "bi-camera-video";
  return "bi-person-workspace";
}

export default function StaffSeatMapPage() {
  const [tables, setTables]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [filterZone, setFilterZone] = useState("Tất cả");
  const [hoveredId, setHoveredId]   = useState(null);

  // Modal
  const [showModal, setShowModal]   = useState(false);
  const [selected, setSelected]     = useState(null);
  const [newStatus, setNewStatus]   = useState("");
  const [updating, setUpdating]     = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getTablesApi();
      setTables(Array.isArray(data) ? data : data.tables || []);
    } catch (err) {
      setError(err.message || "Không thể tải danh sách bàn");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTables(); }, [fetchTables]);

  // ── Update ────────────────────────────────────────────────────────────────
  const handleOpenModal = (table) => {
    setSelected(table);
    setNewStatus(table.status);
    setShowModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!selected || !newStatus) return;
    try {
      setUpdating(true);
      await updateTableStatusApi(selected._id, newStatus);
      setSuccessMsg(`✅ Cập nhật bàn ${selected.tableNumber || selected.name} thành công!`);
      setShowModal(false);
      fetchTables();
      setTimeout(() => setSuccessMsg(""), 3000);
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

  const getCfg = (status) => STATUS_CONFIG[status] || STATUS_CONFIG.available;

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
          <i className="bi bi-arrow-clockwise"></i> Làm mới
        </Button>
      </div>

      {/* ── Alerts ── */}
      {successMsg && (
        <Alert variant="success" className="py-2 rounded-3 border-0 mb-3"
          style={{ background: "#dcfce7", color: "#15803d" }}>
          {successMsg}
        </Alert>
      )}
      {error && (
        <Alert variant="danger" className="py-2 rounded-3 border-0 mb-3" dismissible
          onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* ── Stat cards ── */}
      <Row className="g-3 mb-4">
        {stats.map((s) => (
          <Col xs={6} md={3} key={s.status}>
            <div
              className="rounded-4 p-3 d-flex align-items-center gap-3"
              style={{
                background: s.iconBg,
                border: `1.5px solid ${s.borderColor}22`,
                boxShadow: `0 2px 12px ${s.glowColor}`,
                transition: "transform 0.2s",
              }}
            >
              <div
                className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: 44, height: 44,
                  background: s.badgeBg,
                  fontSize: 20,
                }}
              >
                {s.emoji}
              </div>
              <div>
                <div className="fw-bold fs-4 lh-1" style={{ color: s.badgeColor }}>
                  {s.count}
                </div>
                <div className="small fw-semibold" style={{ color: "#64748b" }}>
                  {s.label}
                </div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* ── Legend + Filter ── */}
      <div className="d-flex flex-wrap gap-4 mb-4 align-items-center justify-content-between">
        <div className="d-flex flex-wrap gap-3">
          {STATUS_LEGEND.map((item) => (
            <div
              className="d-flex align-items-center gap-2 fw-semibold text-secondary small"
              key={item.status}
            >
              <span className={`staff-status-dot ${item.dotClass}`}
                style={{ width: 10, height: 10, borderRadius: "50%", display: "inline-block" }}
              />
              {item.label}
            </div>
          ))}
        </div>
        <Form.Select
          className="staff-filter-control"
          style={{ width: 180 }}
          value={filterZone}
          onChange={(e) => setFilterZone(e.target.value)}
        >
          <option value="Tất cả">Tất cả khu vực</option>
          {zoneNames.map((z) => (
            <option key={z} value={z}>{z}</option>
          ))}
        </Form.Select>
      </div>

      {/* ── Loading / Empty ── */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" style={{ color: "#6366f1" }} />
          <p className="mt-2 text-muted small fw-semibold">Đang tải dữ liệu...</p>
        </div>
      ) : tables.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <div style={{ fontSize: 52 }}>🪑</div>
          <p className="fw-semibold mt-2">Chưa có dữ liệu bàn</p>
        </div>
      ) : (
        // ── Zones ──
        Object.entries(displayed).map(([zone, seats]) => (
          <div key={zone} className="mb-5">
            {/* Zone header */}
            <div className="d-flex align-items-center gap-3 mb-3">
              <h5 className="fw-bold text-secondary mb-0">{zone}</h5>
              <span
                className="rounded-pill px-3 py-1 small fw-bold"
                style={{ background: "#f1f5f9", color: "#475569" }}
              >
                {seats.length} bàn
              </span>
              <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
            </div>

            <Row className="g-3">
              {seats.map((table) => {
                const cfg      = getCfg(table.status);
                const isHover  = hoveredId === table._id;
                const iconName = getSeatIcon(table.type);

                return (
                  <Col xl={2} lg={3} md={4} sm={6} key={table._id}>
                    <Card
                      className={`border-2 staff-seat-card ${cfg.cardClass}`}
                      style={{
                        cursor: "pointer",
                        transform: isHover ? "translateY(-6px)" : "translateY(0)",
                        boxShadow: isHover
                          ? `0 12px 28px ${cfg.glowColor}, 0 2px 8px rgba(0,0,0,0.06)`
                          : "0 2px 8px rgba(0,0,0,0.04)",
                        transition: "all 0.22s cubic-bezier(.4,0,.2,1)",
                        borderColor: cfg.borderColor,
                        background: isHover ? cfg.iconBg : "#fff",
                      }}
                      onClick={() => handleOpenModal(table)}
                      onMouseEnter={() => setHoveredId(table._id)}
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
                        <h5 className="fw-bold mb-1" style={{ fontSize: "1rem", lineHeight: 1.3 }}>
                          {table.name || `Bàn ${table.tableNumber}`}
                        </h5>

                        {/* Loại */}
                        <div className="text-secondary fw-semibold mb-1"
                          style={{ fontSize: "0.78rem" }}>
                          {table.type || "Chỗ ngồi"}
                        </div>

                        {/* Capacity + Price */}
                        <div className="fw-semibold mb-2"
                          style={{ fontSize: "0.78rem", color: "#64748b" }}>
                          {table.capacity ? `${table.capacity} chỗ` : ""}
                          {table.capacity && table.pricePerHour ? " • " : ""}
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
                            fontSize: "0.75rem",
                            letterSpacing: "0.02em",
                          }}
                        >
                          {cfg.label}
                        </span>

                        {/* Người dùng hiện tại nếu có */}
                        {table.currentUser && (
                          <div className="small text-secondary fw-semibold text-truncate">
                            👤 {table.currentUser}
                          </div>
                        )}

                        {/* Hint */}
                        <div
                          className="mt-2 small fw-semibold"
                          style={{
                            color: isHover ? cfg.badgeColor : "#94a3b8",
                            transition: "color 0.2s",
                            fontSize: "0.72rem",
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
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="sm">
        <Modal.Header closeButton className="border-0 pb-1">
          <Modal.Title className="fw-bold fs-6">
            ✏️ Cập nhật —{" "}
            <span style={{ color: "#6366f1" }}>
              {selected?.name || `Bàn ${selected?.tableNumber}`}
            </span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-1 pb-3 px-3">
          <p className="text-muted small mb-3">Chọn trạng thái mới:</p>
          <div className="d-flex flex-column gap-2">
            {ALL_STATUSES.map((s) => {
              const cfg      = STATUS_CONFIG[s];
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
                    <i className="bi bi-check-circle-fill ms-auto"
                      style={{ color: cfg.badgeColor }} />
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
            onClick={() => setShowModal(false)}
            disabled={updating}
          >
            Hủy
          </Button>
          <Button
            className="fw-bold rounded-3 flex-grow-1"
            style={{
              background: newStatus && newStatus !== selected?.status ? "#13b67a" : "#94a3b8",
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
