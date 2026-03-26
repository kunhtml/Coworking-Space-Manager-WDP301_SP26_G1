import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Col,
  Form,
  Row,
  Button,
  Alert,
} from "react-bootstrap";
import AdminLayout from "../../components/admin/AdminLayout";
import EmptyState from "../../components/common/EmptyState";
import FilterBar from "../../components/common/FilterBar";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import SearchInput from "../../components/common/SearchInput";
import SeatStatusModal from "../../components/staff/SeatStatusModal";
import SeatZoneSection from "../../components/staff/SeatZoneSection";
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
  },
};

const STATUS_LEGEND = [
  { status: "Available",   label: "Trống",         dotClass: "staff-dot-green"  },
  { status: "Occupied",    label: "Đang sử dụng",  dotClass: "staff-dot-red"    },
  { status: "Reserved",    label: "Đã đặt trước",  dotClass: "staff-dot-yellow" },
  { status: "Maintenance", label: "Bảo trì",       dotClass: "staff-dot-gray"   },
];

const ALL_STATUSES = Object.keys(STATUS_CONFIG).filter(s => s !== "Cleaning");

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
  const navigate = useNavigate();
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

  useEffect(() => {
    fetchTables();
    // Auto-refresh every 30 seconds for real-time status
    const interval = setInterval(fetchTables, 30_000);
    return () => clearInterval(interval);
  }, [fetchTables]);

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

  // ── Click table → navigate to order form ──────────────────────────────────
  const handleTableClick = (table) => {
    const tableId = table.id || table._id;
    navigate(`/staff-dashboard/counter-pos?tableId=${tableId}`);
  };

  // ── Update status (via long press / context) ──────────────────────────────
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
      await updateStaffTableStatus(selected.id || selected._id, newStatus);
      setSuccessMsg(`Đã cập nhật trạng thái "${selected.name}" thành công!`);
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
              />
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
            />
            <div>
              <div className="fw-bold lh-1" style={{ color: "#1e293b", fontSize: "1.35rem" }}>
                {tables.length}
              </div>
              <div className="small fw-semibold" style={{ color: "#64748b", fontSize: "0.72rem" }}>
                Tổng số bàn
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* ── Filters ── */}
      <FilterBar>
        <Col md={4}>
          <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm tên bàn, loại bàn..." />
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
      </FilterBar>

      {/* ── Loading / Empty ── */}
      {loading ? (
        <LoadingSpinner text="Đang tải dữ liệu..." color="#6366f1" />
      ) : displayed.length === 0 ? (
        <div>
          <EmptyState
            title={tables.length === 0 ? "Chưa có dữ liệu bàn" : "Không tìm thấy bàn phù hợp"}
          />
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
          <SeatZoneSection
            key={zone}
            zone={zone}
            tables={groupedMap[zone]}
            getCfg={getCfg}
            hoveredId={hoveredId}
            setHoveredId={setHoveredId}
            onOpen={handleOpenModal}
            formatTime={formatTime}
            bookingStatusLabel={BOOKING_STATUS_LABEL}
          />
        ))
      )}

      <SeatStatusModal
        show={showModal}
        onClose={() => {
          setShowModal(false);
          setError("");
        }}
        selected={selected}
        activeBooking={selected?.activeBooking}
        upcomingBookings={selected?.upcomingBookings || []}
        error={error}
        statuses={ALL_STATUSES}
        getCfg={getCfg}
        newStatus={newStatus}
        setNewStatus={setNewStatus}
        onSave={handleUpdateStatus}
        updating={updating}
        formatTime={formatTime}
        bookingStatusLabel={BOOKING_STATUS_LABEL}
        onGoToPOS={() => handleTableClick(selected)}
      />
    </AdminLayout>
  );
}
