import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Modal,
  Row,
  Spinner,
} from "react-bootstrap";
import AdminLayout from "../../components/admin/AdminLayout";
import { getAllBookingsApi } from "../../services/bookingService";
import { staffCheckInBooking } from "../../services/staffDashboardService";

// ── Config trạng thái ─────────────────────────────────────────────────────────
const STATUS_LABEL = {
  Pending: "Chờ thanh toán",
  Awaiting_Payment: "Chờ thanh toán (PayOS)",
  Confirmed: "Đã xác nhận",
  CheckedIn: "Đã check-in",
  Completed: "Đã hoàn thành",
  Cancelled: "Đã hủy",
};

const STATUS_STYLE = {
  Pending:         { bg: "#fef9c3", color: "#92400e", icon: "bi-clock"              },
  Awaiting_Payment:{ bg: "#fef9c3", color: "#92400e", icon: "bi-credit-card"        },
  Confirmed:       { bg: "#dbeafe", color: "#1d4ed8", icon: "bi-check-circle"       },
  CheckedIn:       { bg: "#dcfce7", color: "#15803d", icon: "bi-person-check-fill"  },
  Completed:       { bg: "#e0f2fe", color: "#0369a1", icon: "bi-trophy"             },
  Cancelled:       { bg: "#fee2e2", color: "#b91c1c", icon: "bi-x-circle"           },
};

const STAT_GROUPS = [
  { key: "all",              label: "Tất cả",      icon: "bi-calendar3",          bg: "#f1f5f9", color: "#475569" },
  { key: "Confirmed",        label: "Cần check-in", icon: "bi-check-circle",       bg: "#dbeafe", color: "#1d4ed8" },
  { key: "CheckedIn",        label: "Đã check-in",  icon: "bi-person-check-fill",  bg: "#dcfce7", color: "#15803d" },
  { key: "Completed",        label: "Hoàn thành",   icon: "bi-trophy",             bg: "#e0f2fe", color: "#0369a1" },
  { key: "Cancelled",        label: "Đã hủy",       icon: "bi-x-circle",           bg: "#fee2e2", color: "#b91c1c" },
];

function fmt(d) {
  if (!d) return "--";
  return new Date(d).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(d) {
  if (!d) return "--";
  return new Date(d).toLocaleDateString("vi-VN");
}

function fmtCur(v) {
  return `${new Intl.NumberFormat("vi-VN").format(Number(v || 0))}đ`;
}

// Today date string for default date filter
const todayStr = () => new Date().toISOString().slice(0, 10);

export default function StaffCheckinPage() {
  const [bookings, setBookings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");
  const [search, setSearch]       = useState("");
  const [dateFilter, setDateFilter] = useState(todayStr());
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal check-in xác nhận
  const [pendingBooking, setPendingBooking] = useState(null);
  const [checkingId, setCheckingId]         = useState("");

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

  // ── Stats ─────────────────────────────────────────────────────────────────
  const statCounts = useMemo(() => {
    const counts = { all: bookings.length };
    STAT_GROUPS.forEach((g) => {
      if (g.key !== "all") {
        counts[g.key] = bookings.filter((b) => b.status === g.key).length;
      }
    });
    return counts;
  }, [bookings]);

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let rows = bookings;
    if (statusFilter !== "all") rows = rows.filter((b) => b.status === statusFilter);
    return rows;
  }, [bookings, statusFilter]);

  // ── Check-in confirm ──────────────────────────────────────────────────────
  const handleConfirmCheckIn = async () => {
    if (!pendingBooking) return;
    setCheckingId(String(pendingBooking.id));
    setError("");
    try {
      await staffCheckInBooking(pendingBooking.id);
      setSuccess(`✅ Check-in thành công cho ${pendingBooking.customerName || pendingBooking.bookingCode}!`);
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
  const renderCard = (booking) => {
    const st         = STATUS_STYLE[booking.status] || { bg: "#f1f5f9", color: "#475569", icon: "bi-question" };
    const canCheckIn = ["Confirmed", "Awaiting_Payment"].includes(booking.status);
    const isChecking = checkingId === String(booking.id);

    return (
      <Col lg={4} md={6} key={String(booking.id)}>
        <Card
          className="border-0 shadow-sm h-100"
          style={{
            borderRadius: 16,
            borderLeft: `4px solid ${st.color}`,
            transition: "box-shadow 0.2s",
          }}
        >
          <Card.Body className="p-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <div className="fw-bold fs-6" style={{ color: "#0f172a" }}>
                  {booking.bookingCode}
                </div>
                <div className="fw-semibold" style={{ color: "#475569", fontSize: "0.88rem" }}>
                  {booking.customerName || "Không xác định"}
                </div>
              </div>
              <span
                className="rounded-pill px-3 py-1 fw-bold d-flex align-items-center gap-1"
                style={{ background: st.bg, color: st.color, fontSize: "0.75rem", whiteSpace: "nowrap" }}
              >
                <i className={`bi ${st.icon}`} />
                {STATUS_LABEL[booking.status] || booking.status}
              </span>
            </div>

            {/* Info rows */}
            <div
              className="rounded-3 px-3 py-2 mb-3"
              style={{ background: "#f8fafc", fontSize: "0.84rem" }}
            >
              <div className="d-flex justify-content-between py-1 border-bottom">
                <span style={{ color: "#64748b" }}>🪑 Bàn</span>
                <strong style={{ color: "#0f172a" }}>{booking.spaceName || "--"}</strong>
              </div>
              <div className="d-flex justify-content-between py-1 border-bottom">
                <span style={{ color: "#64748b" }}>📅 Ngày</span>
                <strong style={{ color: "#0f172a" }}>{fmtDate(booking.startTime)}</strong>
              </div>
              <div className="d-flex justify-content-between py-1 border-bottom">
                <span style={{ color: "#64748b" }}>⏰ Giờ</span>
                <strong style={{ color: "#0f172a" }}>
                  {fmt(booking.startTime)} – {fmt(booking.endTime)}
                </strong>
              </div>
              <div className="d-flex justify-content-between py-1 border-bottom">
                <span style={{ color: "#64748b" }}>📞 SĐT</span>
                <strong style={{ color: "#0f172a" }}>{booking.customerPhone || "--"}</strong>
              </div>
              <div className="d-flex justify-content-between py-1">
                <span style={{ color: "#64748b" }}>💰 Đặt cọc</span>
                <strong style={{ color: "#15803d" }}>{fmtCur(booking.depositAmount)}</strong>
              </div>
            </div>

            {/* Actions */}
            <div className="d-flex gap-2">
              <Button
                className="fw-bold rounded-3 flex-grow-1"
                style={{
                  background: canCheckIn ? "#6366f1" : "#e2e8f0",
                  border: "none",
                  color: canCheckIn ? "#fff" : "#94a3b8",
                  fontSize: "0.88rem",
                }}
                disabled={!canCheckIn || isChecking}
                onClick={() => setPendingBooking(booking)}
              >
                <i className="bi bi-person-check-fill me-1" />
                {isChecking ? "Đang xử lý..." : "Check-in"}
              </Button>
              <Button
                variant="outline-secondary"
                className="fw-semibold rounded-3 flex-grow-1"
                style={{ fontSize: "0.88rem" }}
                onClick={() => setDetailBooking(booking)}
              >
                <i className="bi bi-eye me-1" />
                Chi tiết
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Col>
    );
  };

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
        <Alert className="border-0 rounded-3 mb-3" style={{ background: "#dcfce7", color: "#15803d" }}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert variant="danger" className="rounded-3 mb-3" dismissible onClose={() => setError("")}>
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
                  boxShadow: active ? `0 4px 16px ${g.color}22` : "0 1px 4px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: 38, height: 38, background: g.bg, fontSize: 17, color: g.color }}
                >
                  <i className={`bi ${g.icon}`} />
                </div>
                <div>
                  <div className="fw-bold lh-1" style={{ color: g.color, fontSize: "1.2rem" }}>
                    {statCounts[g.key] ?? 0}
                  </div>
                  <div style={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 600 }}>
                    {g.label}
                  </div>
                </div>
                {active && (
                  <i className="bi bi-funnel-fill ms-auto" style={{ color: g.color, fontSize: "0.72rem" }} />
                )}
              </div>
            </Col>
          );
        })}
      </Row>

      {/* Search + Date filter */}
      <Row className="g-3 mb-4 align-items-center">
        <Col md={4}>
          <div className="staff-search-wrap">
            <i className="bi bi-search" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm mã booking, tên khách, SĐT..."
            />
          </div>
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
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Form.Select>
        </Col>
        {(statusFilter !== "all" || search || dateFilter !== todayStr()) && (
          <Col md="auto">
            <Button
              variant="outline-secondary"
              className="rounded-3 fw-semibold"
              onClick={() => { setStatusFilter("all"); setSearch(""); setDateFilter(todayStr()); }}
            >
              <i className="bi bi-x-lg me-1" />Xóa lọc
            </Button>
          </Col>
        )}
      </Row>

      {/* Content */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" style={{ color: "#6366f1" }} />
          <p className="mt-2 text-muted fw-semibold small">Đang tải dữ liệu...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <div style={{ fontSize: 52 }}>📋</div>
          <p className="fw-semibold mt-2">
            {bookings.length === 0 ? "Không có booking nào trong ngày này" : "Không có booking phù hợp bộ lọc"}
          </p>
          {bookings.length > 0 && (
            <Button
              variant="outline-secondary"
              size="sm"
              className="rounded-3 fw-semibold"
              onClick={() => { setStatusFilter("all"); setSearch(""); }}
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
          <Row className="g-3">{filtered.map(renderCard)}</Row>
        </>
      )}

      {/* ── Modal xác nhận Check-in ── */}
      <Modal
        show={!!pendingBooking}
        onHide={() => setPendingBooking(null)}
        centered
        size="sm"
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold fs-6">
            ✅ Xác nhận Check-in
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4 pb-2">
          {pendingBooking && (
            <>
              <p className="text-muted small mb-3">
                Xác nhận khách hàng đã đến và check-in vào bàn?
              </p>
              <div className="rounded-3 p-3 mb-2" style={{ background: "#f8fafc", fontSize: "0.85rem" }}>
                <div className="d-flex justify-content-between mb-1">
                  <span style={{ color: "#64748b" }}>Mã booking</span>
                  <strong>{pendingBooking.bookingCode}</strong>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span style={{ color: "#64748b" }}>Khách hàng</span>
                  <strong>{pendingBooking.customerName || "--"}</strong>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span style={{ color: "#64748b" }}>Bàn</span>
                  <strong>{pendingBooking.spaceName || "--"}</strong>
                </div>
                <div className="d-flex justify-content-between">
                  <span style={{ color: "#64748b" }}>Giờ</span>
                  <strong>{fmt(pendingBooking.startTime)} – {fmt(pendingBooking.endTime)}</strong>
                </div>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 px-4 pb-4 gap-2">
          <Button
            variant="outline-secondary"
            className="fw-semibold rounded-3 flex-grow-1"
            onClick={() => setPendingBooking(null)}
            disabled={!!checkingId}
          >
            Hủy
          </Button>
          <Button
            className="fw-bold rounded-3 flex-grow-1"
            style={{ background: "#6366f1", border: "none" }}
            onClick={handleConfirmCheckIn}
            disabled={!!checkingId}
          >
            {checkingId ? (
              <><Spinner size="sm" className="me-1" />Đang xử lý...</>
            ) : (
              <><i className="bi bi-person-check-fill me-1" />Xác nhận</>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── Modal Chi tiết booking ── */}
      <Modal
        show={!!detailBooking}
        onHide={() => setDetailBooking(null)}
        centered
      >
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold fs-6">
            📋 Chi tiết Booking
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4 pb-2">
          {detailBooking && (
            <>
              {/* Status badge */}
              <div className="mb-4 text-center">
                {(() => {
                  const st = STATUS_STYLE[detailBooking.status] || { bg: "#f1f5f9", color: "#475569", icon: "bi-question" };
                  return (
                    <span
                      className="rounded-pill px-4 py-2 fw-bold d-inline-flex align-items-center gap-2"
                      style={{ background: st.bg, color: st.color, fontSize: "0.9rem" }}
                    >
                      <i className={`bi ${st.icon}`} />
                      {STATUS_LABEL[detailBooking.status] || detailBooking.status}
                    </span>
                  );
                })()}
              </div>

              <div className="rounded-3 p-3" style={{ background: "#f8fafc", fontSize: "0.87rem" }}>
                {[
                  ["📌 Mã booking",   detailBooking.bookingCode],
                  ["👤 Khách hàng",   detailBooking.customerName || "Không xác định"],
                  ["📞 Điện thoại",   detailBooking.customerPhone || "--"],
                  ["🪑 Bàn",          detailBooking.spaceName || "--"],
                  ["📅 Ngày",         fmtDate(detailBooking.startTime)],
                  ["⏰ Giờ bắt đầu",  fmt(detailBooking.startTime)],
                  ["⏰ Giờ kết thúc", fmt(detailBooking.endTime)],
                  ["💰 Đặt cọc",      fmtCur(detailBooking.depositAmount)],
                ].map(([label, value]) => (
                  <div key={label} className="d-flex justify-content-between py-2 border-bottom">
                    <span style={{ color: "#64748b" }}>{label}</span>
                    <strong style={{ color: "#0f172a" }}>{value}</strong>
                  </div>
                ))}
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 px-4 pb-4">
          {detailBooking && ["Confirmed", "Awaiting_Payment"].includes(detailBooking.status) && (
            <Button
              className="fw-bold rounded-3 flex-grow-1"
              style={{ background: "#6366f1", border: "none" }}
              onClick={() => {
                setPendingBooking(detailBooking);
                setDetailBooking(null);
              }}
            >
              <i className="bi bi-person-check-fill me-1" />
              Check-in ngay
            </Button>
          )}
          <Button
            variant="outline-secondary"
            className="fw-semibold rounded-3 flex-grow-1"
            onClick={() => setDetailBooking(null)}
          >
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </AdminLayout>
  );
}
