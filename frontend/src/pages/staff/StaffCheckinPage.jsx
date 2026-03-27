import { useEffect, useMemo, useState, useCallback } from "react";
import { Alert, Button, Col, Form, Row } from "react-bootstrap";
import AdminLayout from "../../components/admin/AdminLayout";
import EmptyState from "../../components/common/EmptyState";
import FilterBar from "../../components/common/FilterBar";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import SearchInput from "../../components/common/SearchInput";
import BookingDetailModal from "../../components/staff/BookingDetailModal";
import CheckinConfirmModal from "../../components/staff/CheckinConfirmModal";
import StaffBookingTable from "../../components/staff/StaffBookingTable";
import { getAllBookingsApi } from "../../services/bookingService";
import { staffCheckInBooking } from "../../services/staffDashboardService";
import { getVietnamDateString } from "../../utils/timezone";

// ── Config trạng thái ─────────────────────────────────────────────────────────
const STATUS_LABEL = {
  Confirmed: "Chưa check-in",
  CheckedIn: "Đã check-in",
  Completed: "Đã hoàn thành",
  Cancelled: "Đã hủy",
};

const STATUS_STYLE = {
  Pending: { bg: "#fef9c3", color: "#92400e", icon: "bi-clock" },
  Awaiting_Payment: { bg: "#fef9c3", color: "#92400e", icon: "bi-credit-card" },
  Confirmed: { bg: "#dbeafe", color: "#1d4ed8", icon: "bi-check-circle" },
  CheckedIn: { bg: "#dcfce7", color: "#15803d", icon: "bi-person-check-fill" },
  Completed: { bg: "#e0f2fe", color: "#0369a1", icon: "bi-trophy" },
  Cancelled: { bg: "#fee2e2", color: "#b91c1c", icon: "bi-x-circle" },
};

const STAT_GROUPS = [
  {
    key: "all",
    label: "Tất cả",
    icon: "bi-calendar3",
    bg: "#f1f5f9",
    color: "#475569",
  },
  {
    key: "Confirmed",
    label: "Cần check-in",
    icon: "bi-check-circle",
    bg: "#dbeafe",
    color: "#1d4ed8",
  },
  {
    key: "CheckedIn",
    label: "Đã check-in",
    icon: "bi-person-check-fill",
    bg: "#dcfce7",
    color: "#15803d",
  },
  {
    key: "Completed",
    label: "Hoàn thành",
    icon: "bi-trophy",
    bg: "#e0f2fe",
    color: "#0369a1",
  },
  {
    key: "Cancelled",
    label: "Đã hủy",
    icon: "bi-x-circle",
    bg: "#fee2e2",
    color: "#b91c1c",
  },
];

function fmt(d) {
  if (!d) return "--";
  return new Date(d).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDate(d) {
  if (!d) return "--";
  return new Date(d).toLocaleDateString("vi-VN");
}

function fmtCur(v) {
  return `${new Intl.NumberFormat("vi-VN").format(Number(v || 0))}đ`;
}

// Today date string for default date filter
const todayStr = () => getVietnamDateString();

export default function StaffCheckinPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState(todayStr());
  const [statusFilter, setStatusFilter] = useState("all");

  // Real-time clock for expiry check (updates every 30s)
  const [now, setNow] = useState(() => new Date());

  // Modal check-in xác nhận
  const [pendingBooking, setPendingBooking] = useState(null);
  const [checkingId, setCheckingId] = useState("");

  // Modal xem chi tiết
  const [detailBooking, setDetailBooking] = useState(null);

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadBookings = async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await getAllBookingsApi({ date: dateFilter, search });
      setBookings(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setError(err.message || "Không thể tải danh sách booking.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(loadBookings, 300);
    return () => clearTimeout(t);
  }, [search, dateFilter]);

  // Auto-refresh `now` every 30s for real-time expiry check
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const checkinBookings = useMemo(
    () =>
      bookings.filter((b) =>
        ["Confirmed", "CheckedIn"].includes(String(b.status || "")),
      ),
    [bookings],
  );

  // ── Stats ─────────────────────────────────────────────────────────────────
  const statCounts = useMemo(() => {
    const counts = { all: checkinBookings.length };
    STAT_GROUPS.forEach((g) => {
      if (g.key !== "all") {
        counts[g.key] = checkinBookings.filter((b) => b.status === g.key).length;
      }
    });
    return counts;
  }, [checkinBookings]);

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let rows = checkinBookings;
    if (statusFilter !== "all")
      rows = rows.filter((b) => b.status === statusFilter);
    return rows;
  }, [checkinBookings, statusFilter]);

  // ── Check-in confirm ──────────────────────────────────────────────────────
  const handleConfirmCheckIn = async () => {
    if (!pendingBooking) return;
    setCheckingId(String(pendingBooking.id));
    setError("");
    try {
      await staffCheckInBooking(pendingBooking.id);
      setSuccess(
        `✅ Check-in thành công cho ${pendingBooking.customerName || pendingBooking.bookingCode}!`,
      );
      setPendingBooking(null);
      await loadBookings();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Check-in thất bại.");
    } finally {
      setCheckingId("");
    }
  };

  // ── Render card ───────────────────────────────────────────────────────────
  const renderCard = (booking) => booking;

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <AdminLayout>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold mb-1">Check-in Bàn</h2>
          <p className="text-secondary fw-semibold small mb-0">
            Xác nhận khách hàng đến và check-in vào bàn đã đặt
          </p>
        </div>
        <Button
          variant="outline-secondary"
          className="fw-semibold rounded-3 d-flex align-items-center gap-2"
          style={{ border: "1.5px solid #cbd5e1", padding: "8px 18px" }}
          onClick={loadBookings}
          disabled={loading}
        >
          <i className="bi bi-arrow-clockwise" />
          {loading ? "Đang tải..." : "Làm mới"}
        </Button>
      </div>

      {/* Alerts */}
      {success && (
        <Alert
          className="border-0 rounded-3 mb-3"
          style={{ background: "#dcfce7", color: "#15803d" }}
        >
          {success}
        </Alert>
      )}
      {error && (
        <Alert
          variant="danger"
          className="rounded-3 mb-3"
          dismissible
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}

      {/* Stat chips (clickable filter) */}
      <Row className="g-3 mb-4">
        {STAT_GROUPS.map((g) => {
          const active = statusFilter === g.key;
          return (
            <Col xs={6} sm={4} md={2} key={g.key}>
              <div
                onClick={() => setStatusFilter(g.key)}
                className="rounded-4 p-3 d-flex align-items-center gap-2"
                style={{
                  background: active ? g.bg : "#fff",
                  border: `2px solid ${active ? g.color : "#e2e8f0"}`,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  boxShadow: active
                    ? `0 4px 16px ${g.color}22`
                    : "0 1px 4px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{
                    width: 38,
                    height: 38,
                    background: g.bg,
                    fontSize: 17,
                    color: g.color,
                  }}
                >
                  <i className={`bi ${g.icon}`} />
                </div>
                <div>
                  <div
                    className="fw-bold lh-1"
                    style={{ color: g.color, fontSize: "1.2rem" }}
                  >
                    {statCounts[g.key] ?? 0}
                  </div>
                  <div
                    style={{
                      color: "#64748b",
                      fontSize: "0.7rem",
                      fontWeight: 600,
                    }}
                  >
                    {g.label}
                  </div>
                </div>
                {active && (
                  <i
                    className="bi bi-funnel-fill ms-auto"
                    style={{ color: g.color, fontSize: "0.72rem" }}
                  />
                )}
              </div>
            </Col>
          );
        })}
      </Row>

      {/* Search + Date filter */}
      <FilterBar>
        <Col md={4}>
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm mã booking, tên khách, SĐT..."
          />
        </Col>
        <Col md={3}>
          <Form.Control
            type="date"
            className="staff-filter-control"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </Col>
        <Col md={3}>
          <Form.Select
            className="staff-filter-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="Confirmed">Chưa check-in</option>
            <option value="CheckedIn">Đã check-in</option>
          </Form.Select>
        </Col>
        {(statusFilter !== "all" || search || dateFilter !== todayStr()) && (
          <Col md="auto">
            <Button
              variant="outline-secondary"
              className="rounded-3 fw-semibold"
              onClick={() => {
                setStatusFilter("all");
                setSearch("");
                setDateFilter(todayStr());
              }}
            >
              <i className="bi bi-x-lg me-1" />
              Xóa lọc
            </Button>
          </Col>
        )}
      </FilterBar>

      {/* Content */}
      {loading ? (
        <LoadingSpinner text="Đang tải dữ liệu..." color="#6366f1" />
      ) : filtered.length === 0 ? (
        <div>
          <EmptyState
            icon="📋"
            title={
              bookings.length === 0
                ? "Không có booking nào trong ngày này"
                : "Không có booking check-in phù hợp bộ lọc"
            }
          />
          {bookings.length > 0 && (
            <Button
              variant="outline-secondary"
              size="sm"
              className="rounded-3 fw-semibold"
              onClick={() => {
                setStatusFilter("all");
                setSearch("");
              }}
            >
              Xóa bộ lọc
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="mb-3 text-secondary fw-semibold small">
            Hiển thị {filtered.length} booking
          </div>
          <StaffBookingTable
            data={filtered.map(renderCard)}
            statusStyle={STATUS_STYLE}
            statusLabel={STATUS_LABEL}
            fmtDate={fmtDate}
            fmtTime={fmt}
            fmtCur={fmtCur}
            checkingId={checkingId}
            now={now}
            onCheckin={(booking) => setPendingBooking(booking)}
            onViewDetail={(booking) => setDetailBooking(booking)}
          />
        </>
      )}

      <CheckinConfirmModal
        show={!!pendingBooking}
        booking={pendingBooking}
        onClose={() => setPendingBooking(null)}
        onConfirm={handleConfirmCheckIn}
        loading={!!checkingId}
        fmtTime={fmt}
      />

      <BookingDetailModal
        show={!!detailBooking}
        booking={detailBooking}
        onClose={() => setDetailBooking(null)}
        onCheckinNow={() => {
          setPendingBooking(detailBooking);
          setDetailBooking(null);
        }}
        statusStyle={STATUS_STYLE}
        statusLabel={STATUS_LABEL}
        fmtDate={fmtDate}
        fmtTime={fmt}
        fmtCur={fmtCur}
      />
    </AdminLayout>
  );
}
